// ==UserScript==
// @name         Xymatic: Extract Video Info/Runtime
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Extract video title, duration, and video ID from the page and download as CSV
// @author       Your Name
// @match        https://burda.greensuite.io/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Create a button to trigger the extraction
    const button = document.createElement('button');
    button.textContent = 'Download Video Info as CSV';
    button.style.position = 'fixed';
    button.style.top = '10px';
    button.style.right = '10px';
    button.style.zIndex = '1000';
    button.style.padding = '10px';
    button.style.backgroundColor = '#4CAF50';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '5px';
    button.style.cursor = 'pointer';

    // Append the button to the body
    document.body.appendChild(button);

    // Function to extract video information and download as CSV
    button.addEventListener('click', function() {
        const rows = document.querySelectorAll('.ig-8za_tableRow');
        const csvData = [];

        rows.forEach(row => {
            const titleElement = row.querySelector('.HDKSLq_titleCell .HDKSLq_titleGroup span:first-child');
            const title = titleElement ? titleElement.textContent.trim() : '';

            const durationElement = row.querySelector('.HDKSLq_durationCell');
            const duration = durationElement ? durationElement.textContent.replace('Dauer', '').trim() : '';

            const linkElement = row.querySelector('.ig-8za_cellLink');
            let videoId = '';
            if (linkElement) {
                const href = linkElement.href;
                const idMatch = href.match(/\/videos\/([^?]+)/);
                videoId = idMatch ? idMatch[1] : '';
            }

            csvData.push(`${title};${duration};${videoId}`);
        });

        // Create CSV content
        const csvContent = 'data:text/csv;charset=utf-8,' + csvData.join('\n');

        // Create a download link
        const downloadLink = document.createElement('a');
        downloadLink.href = encodeURI(csvContent);
        downloadLink.download = 'video_info.csv';

        // Trigger the download
        downloadLink.click();
    });
})();