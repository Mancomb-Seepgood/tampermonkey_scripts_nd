// ==UserScript==
// @name         Wagtail Editor Helper Functions
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Various helper functions for the page editor in Wagtail.
// @author       Ben
// @match        https://admin.netdoktor.de/admin/pages/*/edit/*
// @downloadURL  https://github.com/Mancomb-Seepgood/tampermonkey_scripts_nd/raw/refs/heads/main/Wagtail%20Editor%20Helper%20Functions.user.js
// @updateURL    https://github.com/Mancomb-Seepgood/tampermonkey_scripts_nd/raw/refs/heads/main/Wagtail%20Editor%20Helper%20Functions.user.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Show toast message for 15 seconds if article has pending changes
    function showToast(message) {
        const toast = document.createElement('div');
        toast.textContent = message;
        Object.assign(toast.style, {
            position: 'fixed',
            bottom: '15px',
            right: '30px',
            backgroundColor: '#ff9800',
            color: 'white',
            padding: '15px 20px',
            borderRadius: '5px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
            fontSize: '16px',
            fontWeight: 'bold',
            zIndex: 9999,
            opacity: 0,
            transition: 'opacity 0.5s ease'
        });
        document.body.appendChild(toast);
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
        });

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                toast.remove();
            }, 500);
        }, 15000);
    }

    function checkForPendingChanges() {
        const aside = document.querySelector('aside.form-side.form-side--open.form-side--status');
        if (aside) {
            const draft = aside.querySelector('#status-sidebar-entwurf');
            const published = aside.querySelector('#status-sidebar-veroffentlicht');
            if (draft && published) {
                showToast('Achtung: Unveröffentlichte Änderungen vorhanden!');
            }
        }
    }

    // Wait for DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkForPendingChanges);
    } else {
        checkForPendingChanges();
    }
})();
