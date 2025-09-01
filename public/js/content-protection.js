// Content Protection Script
// Prevents copying, right-click, and keyboard shortcuts

(function() {
    'use strict';
    
    // Disable right-click context menu
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        return false;
    });
    
    // Disable text selection with mouse
    document.addEventListener('selectstart', function(e) {
        e.preventDefault();
        return false;
    });
    
    // Disable drag and drop
    document.addEventListener('dragstart', function(e) {
        e.preventDefault();
        return false;
    });
    
    // Disable keyboard shortcuts for copying
    document.addEventListener('keydown', function(e) {
        // Disable Ctrl+A (Select All)
        if (e.ctrlKey && e.key === 'a') {
            e.preventDefault();
            return false;
        }
        
        // Disable Ctrl+C (Copy)
        if (e.ctrlKey && e.key === 'c') {
            e.preventDefault();
            return false;
        }
        
        // Disable Ctrl+V (Paste)
        if (e.ctrlKey && e.key === 'v') {
            e.preventDefault();
            return false;
        }
        
        // Disable Ctrl+X (Cut)
        if (e.ctrlKey && e.key === 'x') {
            e.preventDefault();
            return false;
        }
        
        // Disable Ctrl+S (Save)
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            return false;
        }
        
        // Disable Ctrl+U (View Source)
        if (e.ctrlKey && e.key === 'u') {
            e.preventDefault();
            return false;
        }
        
        // Disable Ctrl+Shift+I (Developer Tools)
        if (e.ctrlKey && e.shiftKey && e.key === 'I') {
            e.preventDefault();
            return false;
        }
        
        // Disable F12 (Developer Tools)
        if (e.key === 'F12') {
            e.preventDefault();
            return false;
        }
        
        // Disable Ctrl+Shift+J (Console)
        if (e.ctrlKey && e.shiftKey && e.key === 'J') {
            e.preventDefault();
            return false;
        }
        
        // Disable Ctrl+Shift+C (Inspect Element)
        if (e.ctrlKey && e.shiftKey && e.key === 'C') {
            e.preventDefault();
            return false;
        }
    });
    
    // Disable print screen (doesn't work on all browsers but adds a layer)
    document.addEventListener('keyup', function(e) {
        if (e.key === 'PrintScreen') {
            navigator.clipboard.writeText('');
        }
    });
    
    // Clear clipboard periodically (additional protection)
    setInterval(function() {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText('');
        }
    }, 1000);
    
    // Disable image saving
    document.addEventListener('DOMContentLoaded', function() {
        const images = document.querySelectorAll('img');
        images.forEach(function(img) {
            img.addEventListener('dragstart', function(e) {
                e.preventDefault();
                return false;
            });
            img.style.pointerEvents = 'none';
        });
    });
    
    // Console warning message
    console.log('%c⚠️ WARNING: Content is protected!', 'color: red; font-size: 20px; font-weight: bold;');
    console.log('%cUnauthorized copying or distribution of this content is prohibited.', 'color: orange; font-size: 14px;');
    
})();
