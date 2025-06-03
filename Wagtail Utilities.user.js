// ==UserScript==
// @name         Wagtail Utilities
// @namespace    http://tampermonkey.net/
// @version      1.7
// @description  Adds utility buttons for Wagtail
// @author       Ben
// @match        https://www.netdoktor.de/*
// @match        https://www.netdoktor.at/*
// @match        https://www.netdoktor.ch/*
// @match        https://rezepte.netdoktor.at/*
// @downloadURL  https://github.com/Mancomb-Seepgood/tampermonkey_scripts_nd/raw/refs/heads/main/Wagtail%20Utilities.user.js
// @updateURL    https://github.com/Mancomb-Seepgood/tampermonkey_scripts_nd/raw/refs/heads/main/Wagtail%20Utilities.user.js
// @grant        none
// ==/UserScript==

(function() {
'use strict';

// Function to extract PAGEID using RegEx from the head
function extractPageId() {
    const headContent = document.head.innerHTML;
    const pageIdMatch = headContent.match(/"pageId":\s*"(\d*?)"/);
    return pageIdMatch ? pageIdMatch[1] : null;
}

// Track whether the mouse is over any of the buttons
let isHovering = {
    parent: false,
    edit: false,
    pagetree: false
};

function updateHoverState() {
    if (!isHovering.parent && !isHovering.edit && !isHovering.pagetree) {
        childContainer.style.maxHeight = '0';
    }
}

// Create the parent button
const parentButton = document.createElement('button');
parentButton.textContent = 'Wagtail Utilities';
parentButton.style.position = 'fixed';
parentButton.style.bottom = '10px';
parentButton.style.right = '10px';
parentButton.style.zIndex = '1000';
parentButton.style.backgroundColor = '#00bef7';
parentButton.style.border = 'none';
parentButton.style.borderRadius = '6px';
parentButton.style.color = 'white';
parentButton.style.opacity = '0.7';
parentButton.style.padding = '8px 16px';
parentButton.style.textAlign = 'center';
parentButton.style.textDecoration = 'none';
parentButton.style.display = 'inline-block';
parentButton.style.fontSize = '21px';
parentButton.style.fontWeight = 'bold';
parentButton.style.margin = '4px 2px';
parentButton.style.cursor = 'pointer';
parentButton.style.transitionDuration = '0.4s';
parentButton.style.webkitTransitionDuration = '0.4s'; // For Safari

// Create the child buttons container
const childContainer = document.createElement('div');
childContainer.style.position = 'fixed';
childContainer.style.bottom = '60px';
childContainer.style.right = '10px';
childContainer.style.zIndex = '1000';
childContainer.style.display = 'flex';
childContainer.style.flexDirection = 'column';
childContainer.style.transition = 'max-height 0.4s ease-out';
childContainer.style.overflow = 'hidden';
childContainer.style.maxHeight = '0';

// Create the "Edit in Wagtail" button
const editButton = document.createElement('button');
editButton.textContent = 'Edit in Wagtail';
editButton.style.backgroundColor = '#00bef7';
editButton.style.border = 'none';
editButton.style.borderRadius = '6px';
editButton.style.color = 'white';
editButton.style.opacity = '0.7';
editButton.style.padding = '8px 16px';
editButton.style.textAlign = 'center';
editButton.style.textDecoration = 'none';
editButton.style.display = 'inline-block';
editButton.style.fontSize = '17px';
editButton.style.fontWeight = 'bold';
editButton.style.margin = '4px 2px';
editButton.style.cursor = 'pointer';
editButton.style.transitionDuration = '0.4s';
editButton.style.webkitTransitionDuration = '0.4s';

// Create the "Open Page Tree" button
const pagetreeButton = document.createElement('button');
pagetreeButton.textContent = 'Open Page Tree';
pagetreeButton.style.backgroundColor = '#00bef7';
pagetreeButton.style.border = 'none';
pagetreeButton.style.borderRadius = '6px';
pagetreeButton.style.color = 'white';
pagetreeButton.style.opacity = '0.7';
pagetreeButton.style.padding = '8px 16px';
pagetreeButton.style.textAlign = 'center';
pagetreeButton.style.textDecoration = 'none';
pagetreeButton.style.display = 'inline-block';
pagetreeButton.style.fontSize = '17px';
pagetreeButton.style.fontWeight = 'bold';
pagetreeButton.style.margin = '4px 2px';
pagetreeButton.style.cursor = 'pointer';
pagetreeButton.style.transitionDuration = '0.4s';
pagetreeButton.style.webkitTransitionDuration = '0.4s';

// Add hover effect to buttons
[parentButton, editButton, pagetreeButton].forEach(button => {
    button.addEventListener('mouseover', function() {
        button.style.boxShadow = '0 12px 16px 0 rgba(0,0,0,0.24), 0 17px 50px 0 rgba(0,0,0,0.19)';
        button.style.opacity = '1.0';
    });

    button.addEventListener('mouseout', function() {
        button.style.boxShadow = 'none';
        button.style.opacity = '0.7';
    });
});

// Hover handling for visibility control
parentButton.addEventListener('mouseenter', () => {
    isHovering.parent = true;
    childContainer.style.maxHeight = '100px';
});
parentButton.addEventListener('mouseleave', () => {
    isHovering.parent = false;
    setTimeout(updateHoverState, 1000);
});

editButton.addEventListener('mouseenter', () => {
    isHovering.edit = true;
});
editButton.addEventListener('mouseleave', () => {
    isHovering.edit = false;
    setTimeout(updateHoverState, 1000);
});

pagetreeButton.addEventListener('mouseenter', () => {
    isHovering.pagetree = true;
});
pagetreeButton.addEventListener('mouseleave', () => {
    isHovering.pagetree = false;
    setTimeout(updateHoverState, 1000);
});

// Append child buttons to the container
childContainer.appendChild(editButton);
childContainer.appendChild(pagetreeButton);

// Append the parent button and child container to the body
document.body.appendChild(parentButton);
document.body.appendChild(childContainer);

// Add click event to the "Edit in Wagtail" button
editButton.addEventListener('click', function() {
    const pageId = extractPageId();
    if (pageId) {
        const editUrl = `https://admin.netdoktor.de/admin/pages/${pageId}/edit/`;
        window.open(editUrl, '_blank');
    } else {
        alert('PageID not found!');
    }
});

// Add click event to the "Open in pagetree" button
pagetreeButton.addEventListener('click', function() {
    const pageId = extractPageId();
    if (pageId) {
        const pageUrl = `https://admin.netdoktor.de/admin/pages/${pageId}/`;
        window.open(pageUrl, '_blank');
    } else {
        alert('PageID not found!');
    }
});
})();
