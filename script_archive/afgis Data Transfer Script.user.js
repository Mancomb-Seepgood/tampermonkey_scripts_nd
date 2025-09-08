// ==UserScript==
// @name         afgis Data Transfer Script
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Extract data from one page and populate it on another
// @match        https://logo.afgis.de/*afgisQModul_view
// @match        https://logo.afgis.de/*afgisQModul_editForm
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Function to extract data from the source website
    function extractData() {
        const data = {
            textInputs: [],
            checkboxes: []
        };

        // Extract text inputs
        const textDivs = document.querySelectorAll('div[style*="font-size:80%"][style*="width:80%"][style*="padding:0.5em"][style*="border-style:solid"]');
        textDivs.forEach(div => {
            data.textInputs.push(div.innerText.trim());
        });

        // Extract checkbox/radio button states
        const imgElements = document.querySelectorAll('img[src="kasten.gif"], img[src="kastenx.gif"]');
        imgElements.forEach(img => {
            const isChecked = img.src.includes('kastenx.gif');
            data.checkboxes.push(isChecked);
        });

        // Store data in local storage
        localStorage.setItem('extractedData', JSON.stringify(data));
        alert('Data extracted and stored!');
    }

    // Function to populate the target form
    function populateForm() {
        const data = JSON.parse(localStorage.getItem('extractedData'));
        if (!data) {
            alert('No data found. Please extract data first.');
            return;
        }

        const textInputs = document.querySelectorAll('input[type="text"], textarea');
        const checkboxes = document.querySelectorAll('input[type="checkbox"], input[type="radio"]');
        let textIndex = 0;
        let checkboxIndex = 0;

        // Populate text inputs
        textInputs.forEach(input => {
            if (textIndex < data.textInputs.length) {
                input.value = data.textInputs[textIndex];
                textIndex++;
            }
        });

        // Populate checkboxes/radio buttons
        checkboxes.forEach(input => {
            if (checkboxIndex < data.checkboxes.length) {
                input.checked = data.checkboxes[checkboxIndex];
                checkboxIndex++;
            }
        });

        alert('Form populated with extracted data!');
    }

    // Add buttons to the page to trigger the functions
    const extractButton = document.createElement('button');
    extractButton.innerText = 'Extract Data';
    extractButton.style.position = 'fixed';
    extractButton.style.top = '10px';
    extractButton.style.right = '10px';
    extractButton.style.zIndex = 1000;
    extractButton.onclick = extractData;
    document.body.appendChild(extractButton);

    const populateButton = document.createElement('button');
    populateButton.innerText = 'Populate Form';
    populateButton.style.position = 'fixed';
    populateButton.style.top = '40px';
    populateButton.style.right = '10px';
    populateButton.style.zIndex = 1000;
    populateButton.onclick = populateForm;
    document.body.appendChild(populateButton);
})();