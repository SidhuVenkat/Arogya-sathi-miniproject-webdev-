// Rural Health Assistant - Main JavaScript Application

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Main application initialization
function initializeApp() {
    // Initialize Feather Icons
    if (typeof feather !== 'undefined') {
        feather.replace();
    }
    
    // Initialize tooltips
    initializeTooltips();
    
    // Setup offline detection
    setupOfflineDetection();
    
    // Setup form validations
    setupFormValidations();
    
    // Setup search functionality
    setupSearchFunctionality();
    
    // Setup auto-save for forms
    setupAutoSave();
    
    // Setup keyboard shortcuts
    setupKeyboardShortcuts();
    
    // Initialize PWA features
    initializePWA();
    
    console.log('Rural Health Assistant initialized successfully');
}

// Initialize Bootstrap tooltips
function initializeTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

// Offline detection and handling
function setupOfflineDetection() {
    const offlineIndicator = createOfflineIndicator();
    
    function updateOnlineStatus() {
        if (navigator.onLine) {
            offlineIndicator.classList.remove('show');
            document.body.classList.remove('offline');
            showToast('Connection restored', 'success');
        } else {
            offlineIndicator.classList.add('show');
            document.body.classList.add('offline');
            showToast('You are currently offline. Data will be saved locally.', 'warning');
        }
    }
    
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    // Initial check
    updateOnlineStatus();
}

// Create offline indicator element
function createOfflineIndicator() {
    let indicator = document.querySelector('.offline-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.className = 'offline-indicator';
        indicator.innerHTML = '<i data-feather="wifi-off"></i> Offline Mode';
        document.body.appendChild(indicator);
        
        // Update feather icons
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }
    return indicator;
}

// Form validation setup
function setupFormValidations() {
    const forms = document.querySelectorAll('form[novalidate]');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(event) {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
                
                // Highlight first invalid field
                const firstInvalid = form.querySelector(':invalid');
                if (firstInvalid) {
                    firstInvalid.focus();
                    showToast('Please fill in all required fields correctly.', 'danger');
                }
            }
            
            form.classList.add('was-validated');
        });
        
        // Real-time validation
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', function() {
                if (input.checkValidity()) {
                    input.classList.remove('is-invalid');
                    input.classList.add('is-valid');
                } else {
                    input.classList.remove('is-valid');
                    input.classList.add('is-invalid');
                }
            });
            
            input.addEventListener('input', function() {
                if (input.classList.contains('is-invalid') && input.checkValidity()) {
                    input.classList.remove('is-invalid');
                    input.classList.add('is-valid');
                }
            });
        });
    });
}

// Search functionality
function setupSearchFunctionality() {
    const searchInputs = document.querySelectorAll('input[type="search"], input[name="search"]');
    
    searchInputs.forEach(input => {
        let searchTimeout;
        
        input.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                // Auto-submit search forms after 500ms of no typing
                const form = input.closest('form');
                if (form && input.value.length > 2) {
                    form.submit();
                }
            }, 500);
        });
        
        // Clear search functionality
        const clearButton = document.createElement('button');
        clearButton.type = 'button';
        clearButton.className = 'btn btn-outline-secondary btn-sm ms-2';
        clearButton.innerHTML = '<i data-feather="x"></i>';
        clearButton.style.display = input.value ? 'inline-block' : 'none';
        
        clearButton.addEventListener('click', function() {
            input.value = '';
            input.focus();
            clearButton.style.display = 'none';
            
            // Submit form to clear search
            const form = input.closest('form');
            if (form) {
                form.submit();
            }
        });
        
        input.addEventListener('input', function() {
            clearButton.style.display = input.value ? 'inline-block' : 'none';
        });
        
        if (input.parentNode.classList.contains('input-group')) {
            input.parentNode.appendChild(clearButton);
        }
    });
}

// Auto-save functionality for forms
function setupAutoSave() {
    const autoSaveForms = document.querySelectorAll('[data-autosave]');
    
    autoSaveForms.forEach(form => {
        const formId = form.id || 'form_' + Date.now();
        const inputs = form.querySelectorAll('input, select, textarea');
        
        // Load saved data
        loadFormData(formId, inputs);
        
        // Save data on input
        inputs.forEach(input => {
            input.addEventListener('input', debounce(function() {
                saveFormData(formId, inputs);
            }, 1000));
        });
        
        // Clear saved data on successful submit
        form.addEventListener('submit', function() {
            clearFormData(formId);
        });
    });
}

// Save form data to localStorage
function saveFormData(formId, inputs) {
    const data = {};
    inputs.forEach(input => {
        if (input.name) {
            data[input.name] = input.value;
        }
    });
    
    try {
        localStorage.setItem('autosave_' + formId, JSON.stringify(data));
        showToast('Form data saved locally', 'info', 1000);
    } catch (error) {
        console.warn('Could not save form data:', error);
    }
}

// Load form data from localStorage
function loadFormData(formId, inputs) {
    try {
        const data = localStorage.getItem('autosave_' + formId);
        if (data) {
            const parsedData = JSON.parse(data);
            inputs.forEach(input => {
                if (input.name && parsedData[input.name]) {
                    input.value = parsedData[input.name];
                }
            });
        }
    } catch (error) {
        console.warn('Could not load form data:', error);
    }
}

// Clear saved form data
function clearFormData(formId) {
    try {
        localStorage.removeItem('autosave_' + formId);
    } catch (error) {
        console.warn('Could not clear form data:', error);
    }
}

// Keyboard shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(event) {
        // Alt + H: Go to home/dashboard
        if (event.altKey && event.key === 'h') {
            event.preventDefault();
            window.location.href = '/';
        }
        
        // Alt + P: Go to patients
        if (event.altKey && event.key === 'p') {
            event.preventDefault();
            window.location.href = '/patients';
        }
        
        // Alt + F: Go to first aid
        if (event.altKey && event.key === 'f') {
            event.preventDefault();
            window.location.href = '/first-aid';
        }
        
        // Alt + E: Go to emergency contacts
        if (event.altKey && event.key === 'e') {
            event.preventDefault();
            window.location.href = '/emergency-contacts';
        }
        
        // Alt + A: Go to appointments
        if (event.altKey && event.key === 'a') {
            event.preventDefault();
            window.location.href = '/appointments';
        }
        
        // Ctrl + / or Cmd + /: Focus search
        if ((event.ctrlKey || event.metaKey) && event.key === '/') {
            event.preventDefault();
            const searchInput = document.querySelector('input[name="search"], input[type="search"]');
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        }
        
        // Escape: Close modals
        if (event.key === 'Escape') {
            const openModal = document.querySelector('.modal.show');
            if (openModal) {
                const modal = bootstrap.Modal.getInstance(openModal);
                if (modal) {
                    modal.hide();
                }
            }
        }
    });
}

// PWA (Progressive Web App) initialization
function initializePWA() {
    // Register service worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
            navigator.serviceWorker.register('/static/js/sw.js')
                .then(function(registration) {
                    console.log('ServiceWorker registration successful');
                })
                .catch(function(error) {
                    console.log('ServiceWorker registration failed');
                });
        });
    }
    
    // Install prompt
    let deferredPrompt;
    
    window.addEventListener('beforeinstallprompt', function(event) {
        event.preventDefault();
        deferredPrompt = event;
        
        // Show install button
        showInstallPrompt();
    });
    
    // Handle app installation
    window.addEventListener('appinstalled', function(event) {
        console.log('App installed successfully');
        showToast('App installed successfully!', 'success');
        deferredPrompt = null;
    });
}

// Show PWA install prompt
function showInstallPrompt() {
    const installBanner = document.createElement('div');
    installBanner.className = 'alert alert-info alert-dismissible fade show';
    installBanner.innerHTML = `
        <div class="d-flex align-items-center">
            <i data-feather="download" class="me-2"></i>
            <div class="flex-grow-1">
                <strong>Install App</strong><br>
                <small>Install this app on your device for better offline access.</small>
            </div>
            <button type="button" class="btn btn-sm btn-primary me-2" onclick="installApp()">
                Install
            </button>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    document.querySelector('.main-content').prepend(installBanner);
    
    if (typeof feather !== 'undefined') {
        feather.replace();
    }
}

// Install PWA
function installApp() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        
        deferredPrompt.userChoice.then(function(choiceResult) {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the install prompt');
            } else {
                console.log('User dismissed the install prompt');
            }
            deferredPrompt = null;
        });
    }
}

// Utility functions

// Debounce function
function debounce(func, wait, immediate) {
    let timeout;
    return function executedFunction() {
        const context = this;
        const args = arguments;
        
        const later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        
        if (callNow) func.apply(context, args);
    };
}

// Show toast notifications
function showToast(message, type = 'info', duration = 3000) {
    const toastContainer = getOrCreateToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} border-0`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    const bsToast = new bootstrap.Toast(toast, {
        autohide: true,
        delay: duration
    });
    
    bsToast.show();
    
    // Remove toast element after it's hidden
    toast.addEventListener('hidden.bs.toast', function() {
        toast.remove();
    });
}

// Get or create toast container
function getOrCreateToastContainer() {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        container.style.zIndex = '1055';
        document.body.appendChild(container);
    }
    return container;
}

// Format phone numbers for calling
function formatPhoneNumber(phone) {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Add country code if not present
    if (cleaned.length === 10) {
        return '+91' + cleaned;
    }
    
    return '+' + cleaned;
}

// Confirm phone call
function confirmCall(phone, name = '') {
    const formattedPhone = formatPhoneNumber(phone);
    const message = name ? 
        `Call ${name} at ${phone}?` : 
        `Call ${phone}?`;
    
    if (confirm(message)) {
        window.location.href = `tel:${formattedPhone}`;
    }
}

// Print current page with optimizations
function printPage() {
    // Hide non-printable elements
    const hideElements = document.querySelectorAll('.btn, .navbar, .modal, .toast-container');
    hideElements.forEach(el => {
        el.style.display = 'none';
    });
    
    // Print
    window.print();
    
    // Restore elements
    hideElements.forEach(el => {
        el.style.display = '';
    });
}

// Copy text to clipboard
function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(function() {
            showToast('Copied to clipboard', 'success', 1000);
        }, function() {
            fallbackCopyTextToClipboard(text);
        });
    } else {
        fallbackCopyTextToClipboard(text);
    }
}

// Fallback copy function
function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showToast('Copied to clipboard', 'success', 1000);
        } else {
            showToast('Could not copy to clipboard', 'warning');
        }
    } catch (err) {
        showToast('Could not copy to clipboard', 'warning');
    }
    
    document.body.removeChild(textArea);
}

// Validate form inputs
function validateInput(input) {
    const value = input.value.trim();
    const type = input.type;
    
    switch (type) {
        case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(value);
            
        case 'tel':
            const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
            return phoneRegex.test(value);
            
        case 'number':
            const num = parseFloat(value);
            const min = parseFloat(input.min);
            const max = parseFloat(input.max);
            
            if (isNaN(num)) return false;
            if (!isNaN(min) && num < min) return false;
            if (!isNaN(max) && num > max) return false;
            
            return true;
            
        default:
            return value.length > 0;
    }
}

// Handle network status changes
function handleNetworkChange() {
    if (navigator.onLine) {
        // Try to sync any offline data
        syncOfflineData();
    }
}

// Sync offline data (placeholder for future implementation)
function syncOfflineData() {
    console.log('Syncing offline data...');
    // This would sync any data stored locally while offline
}

// Initialize keyboard navigation for tables
function initializeTableNavigation() {
    const tables = document.querySelectorAll('.table');
    
    tables.forEach(table => {
        const rows = table.querySelectorAll('tbody tr');
        let currentRow = 0;
        
        table.addEventListener('keydown', function(event) {
            switch (event.key) {
                case 'ArrowUp':
                    event.preventDefault();
                    currentRow = Math.max(0, currentRow - 1);
                    highlightRow(rows, currentRow);
                    break;
                    
                case 'ArrowDown':
                    event.preventDefault();
                    currentRow = Math.min(rows.length - 1, currentRow + 1);
                    highlightRow(rows, currentRow);
                    break;
                    
                case 'Enter':
                    event.preventDefault();
                    const link = rows[currentRow].querySelector('a');
                    if (link) {
                        link.click();
                    }
                    break;
            }
        });
    });
}

// Highlight table row
function highlightRow(rows, index) {
    rows.forEach((row, i) => {
        if (i === index) {
            row.classList.add('table-active');
            row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
            row.classList.remove('table-active');
        }
    });
}

// Export functionality for data
function exportData(data, filename, format = 'csv') {
    if (format === 'csv') {
        exportToCSV(data, filename);
    } else if (format === 'json') {
        exportToJSON(data, filename);
    }
}

// Export to CSV
function exportToCSV(data, filename) {
    if (!data || data.length === 0) {
        showToast('No data to export', 'warning');
        return;
    }
    
    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => 
            headers.map(header => 
                JSON.stringify(row[header] || '')
            ).join(',')
        )
    ].join('\n');
    
    downloadFile(csvContent, filename + '.csv', 'text/csv');
}

// Export to JSON
function exportToJSON(data, filename) {
    const jsonContent = JSON.stringify(data, null, 2);
    downloadFile(jsonContent, filename + '.json', 'application/json');
}

// Download file
function downloadFile(content, filename, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(url);
    showToast('File downloaded successfully', 'success');
}

// Make functions globally available
window.installApp = installApp;
window.confirmCall = confirmCall;
window.printPage = printPage;
window.copyToClipboard = copyToClipboard;
window.exportData = exportData;
window.showToast = showToast;
