// ==UserScript==
// @name         netDoktor Content Extractor for IR
// @namespace    http://tampermonkey.net/
// @version      2.1
// @description  Extract and clean content from netdoktor.de; add TOC labels next to h2 elements; unwrap spans, clean <li>, etc. — only active on article pages; ignores block-link-box and aside elements; extracts full tables from <nd-table> tags and normalizes thead->tbody + th->td while removing hidden columns.
// @match        https://www.netdoktor.de/*
// @downloadURL  https://github.com/Mancomb-Seepgood/tampermonkey_scripts_nd/raw/refs/heads/main/netDoktor%20Content%20Extractor%20for%20IR.user.js
// @updateURL    https://github.com/Mancomb-Seepgood/tampermonkey_scripts_nd/raw/refs/heads/main/netDoktor%20Content%20Extractor%20for%20IR.user.js
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    function addButton() {
        // Only add button for articles
        const headHTML = document.head ? document.head.innerHTML : '';
        if (!headHTML.includes('"pageType": "article"')) {
            console.log('NetDoktor Extractor: Skipping — not an article page.');
            return;
        }

        if (document.getElementById('netdoktor-extract-btn')) return;

        const btn = document.createElement('button');
        btn.id = 'netdoktor-extract-btn';
        btn.textContent = 'Extract Source for IR';
        Object.assign(btn.style, {
            position: 'fixed',
            bottom: '10px',
            left: '10px',
            zIndex: '9999',
            padding: '10px 15px',
            backgroundColor: '#00bef7',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
        });
        btn.onclick = extractContent;
        document.body.appendChild(btn);
    }

    function waitForBodyAndAddButton() {
        if (document.body) {
            addButton();
        } else {
            requestAnimationFrame(waitForBodyAndAddButton);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitForBodyAndAddButton);
    } else {
        waitForBodyAndAddButton();
    }

    function extractContent() {
        const container = document.querySelector('div.flex-sections');
        if (!container) {
            alert('flex-sections container not found!');
            return;
        }

        // Step 1: Build TOC map (id → label)
        const tocMap = new Map();
        const tocItems = document.querySelectorAll('nav.toc#table-of-content li a[href^="#"]');
        tocItems.forEach(a => {
            const id = a.getAttribute('href').substring(1);
            const text = a.textContent.trim();
            if (id && text) tocMap.set(id, text);
        });

        // Ignore .block-link-box and <aside>
        const ignoredElements = new Set();
        container.querySelectorAll('.block-link-box, .block-link-box *, aside, aside *')
            .forEach(el => ignoredElements.add(el));

        const outputElements = [];
        const nodeList = container.querySelectorAll(
            'p, h2, h3, h4, ol, ul, li, div.patient-info-title, div.patient-info-text, nd-table'
        );

        // Exclude elements inside <nd-table>
        // Also exclude elements that are descendants of .patient-info-text (we will handle the .patient-info-text node itself)
        const allElements = Array.from(nodeList).filter(el => {
            const tag = el.tagName.toLowerCase();
            // always keep nd-table itself
            if (tag === 'nd-table') return true;
            // skip anything inside nd-table
            if (el.closest('nd-table')) return false;
            // if element is inside a .patient-info-text but is not that .patient-info-text element, exclude it
            const parentPatient = el.closest('.patient-info-text');
            if (parentPatient && parentPatient !== el) return false;
            return true;
        });

        let lastTitle = null;

        for (let el of allElements) {
            if (ignoredElements.has(el)) continue;
            const tag = el.tagName.toLowerCase();

            // --- Patient info blocks ---
            if (el.classList.contains('patient-info-title')) {
                lastTitle = el.textContent.trim();
                continue;
            }

            if (el.classList.contains('patient-info-text')) {
                // If there's a nested <p data-block-key="..."> use its content only (transformed),
                // and do not emit the nested <p> separately.
                const specialP = el.querySelector('p[data-block-key]');
                let innerHTML;
                if (specialP) {
                    const transformedSpecial = transformInlineTags(specialP);
                    innerHTML = transformedSpecial.innerHTML;
                } else {
                    const transformed = transformInlineTags(el);
                    innerHTML = transformed.innerHTML;
                }

                let className = 'text';
                if (lastTitle?.includes('Hinweis')) className = 'patient-information';
                if (lastTitle?.includes('Achtung')) className = 'patient-warning';
                outputElements.push(wrapAs(className, innerHTML));
                lastTitle = null;
                continue;
            }

            // --- nd-table handling ---
            if (tag === 'nd-table') {
                const innerTable = el.querySelector('table');
                if (innerTable) {
                    const clonedTable = transformInlineTags(innerTable);

                    // Create a unified tbody
                    const newTbody = document.createElement('tbody');

                    // 1) Move rows from <thead>, converting <th> → <td> and removing hidden cells
                    const thead = clonedTable.querySelector('thead');
                    if (thead) {
                        const theadRows = Array.from(thead.querySelectorAll('tr'));
                        theadRows.forEach(row => {
                            // Remove hidden <th> first
                            row.querySelectorAll('th.hidden').forEach(th => th.remove());
                            // Convert remaining <th> → <td>
                            Array.from(row.querySelectorAll('th')).forEach(th => {
                                const td = document.createElement('td');
                                // copy attributes except class="hidden"
                                for (let i = 0; i < th.attributes.length; i++) {
                                    const a = th.attributes[i];
                                    if (a.name === 'class' && a.value.split(/\s+/).includes('hidden')) continue;
                                    td.setAttribute(a.name, a.value);
                                }
                                td.innerHTML = th.innerHTML;
                                th.replaceWith(td);
                            });
                            // Remove hidden <td> (if any)
                            row.querySelectorAll('td.hidden').forEach(td => td.remove());
                            newTbody.appendChild(row);
                        });
                        thead.remove();
                    }

                    // 2) Move rows from existing <tbody>, removing hidden <th>/<td>
                    const existingTbodies = Array.from(clonedTable.querySelectorAll('tbody'));
                    existingTbodies.forEach(tb => {
                        const rows = Array.from(tb.querySelectorAll('tr'));
                        rows.forEach(row => {
                            // remove hidden cells
                            row.querySelectorAll('th.hidden, td.hidden').forEach(cell => cell.remove());
                            newTbody.appendChild(row);
                        });
                        tb.remove();
                    });

                    // 3) Append the single combined tbody to the cloned table
                    clonedTable.appendChild(newTbody);
                    outputElements.push(clonedTable);
                }
                continue;
            }

            // --- Skip <li> handled within lists ---
            if (tag === 'li') {
                const parentTag = el.parentElement?.tagName?.toLowerCase();
                if (parentTag === 'ul' || parentTag === 'ol') {
                    continue;
                }
            }

            // --- Regular elements ---
            const transformed = transformInlineTags(el);

            if (tag === 'p') {
                outputElements.push(wrapAs('text', transformed.innerHTML));
            } else if (tag === 'h2') {
                outputElements.push(wrapAs('headline2', transformed.innerHTML));
                const h2Id = el.getAttribute('id');
                if (h2Id && tocMap.has(h2Id)) {
                    const label = tocMap.get(h2Id);
                    outputElements.push(wrapAs('headline2-index', label));
                }
            } else if (tag === 'h3') {
                outputElements.push(wrapAs('headline3', transformed.innerHTML));
            } else if (tag === 'h4') {
                outputElements.push(wrapAs('headline4', transformed.innerHTML));
            } else if (tag === 'ol' || tag === 'ul') {
                const isOrdered = tag === 'ol';
                const list = document.createElement(isOrdered ? 'ol' : 'ul');
                list.className = 'text';
                Array.from(el.children).forEach(li => {
                    if (li.tagName.toLowerCase() === 'li') {
                        const cleanLi = document.createElement('li');
                        const liClone = transformInlineTags(li);
                        cleanLi.innerHTML = liClone.innerHTML;
                        list.appendChild(cleanLi);
                    }
                });
                outputElements.push(list);
            }
        }

        // --- Output ---
        const resultHTML = outputElements.map(el => el.outerHTML).join('\n');

        const win = window.open('', '_blank');
        win.document.write('<html><head><title>Extracted Content</title></head><body><pre style="white-space: pre-wrap; word-break: break-word;">');
        win.document.write(resultHTML.replace(/</g, '&lt;').replace(/>/g, '&gt;'));
        win.document.write('</pre></body></html>');
        win.document.close();
    }

    function transformInlineTags(node) {
        const clone = node.cloneNode(true);

        // <strong> → <b>
        clone.querySelectorAll('strong').forEach(el => {
            const b = document.createElement('b');
            b.innerHTML = el.innerHTML;
            el.replaceWith(b);
        });

        // <em> → <i>
        clone.querySelectorAll('em').forEach(el => {
            const i = document.createElement('i');
            i.innerHTML = el.innerHTML;
            el.replaceWith(i);
        });

        // Remove <a>, keep only text
        clone.querySelectorAll('a').forEach(el => {
            const span = document.createElement('span');
            span.textContent = el.textContent;
            el.replaceWith(span);
        });

        // Unwrap <span>
        clone.querySelectorAll('span').forEach(el => {
            const fragment = document.createDocumentFragment();
            while (el.firstChild) fragment.appendChild(el.firstChild);
            el.replaceWith(fragment);
        });

        return clone;
    }

    function wrapAs(className, innerHTML) {
        const p = document.createElement('p');
        p.className = className;
        p.innerHTML = innerHTML;
        return p;
    }

})();
