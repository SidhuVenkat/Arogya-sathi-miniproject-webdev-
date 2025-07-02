// Rural Health Assistant - Main JavaScript Application

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Main initialization function
function initializeApp() {
    // Initialize Feather Icons
    if (typeof feather !== 'undefined') {
        feather.replace();
    }
    
    // Initialize tooltips
    initializeTooltips();
    
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
    } catch (e) {
        console.warn('Could not save form data:', e);
    }
}

// Load form data from localStorage
function loadFormData(formId, inputs) {
    try {
        const saved = localStorage.getItem('autosave_' + formId);
        if (saved) {
            const data = JSON.parse(saved);
            inputs.forEach(input => {
                if (data[input.name]) {
                    input.value = data[input.name];
                }
            });
        }
    } catch (e) {
        console.warn('Could not load form data:', e);
    }
}

// Clear saved form data
function clearFormData(formId) {
    try {
        localStorage.removeItem('autosave_' + formId);
    } catch (e) {
        console.warn('Could not clear form data:', e);
    }
}

// Keyboard shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + S to save (for forms)
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            const activeForm = document.querySelector('form:focus-within');
            if (activeForm) {
                activeForm.dispatchEvent(new Event('submit'));
            }
        }
        
        // Ctrl/Cmd + F to focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            const searchInput = document.querySelector('input[type="search"], input[name="search"]');
            if (searchInput) {
                searchInput.focus();
            }
        }
        
        // Escape to close modals
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal.show');
            if (openModal) {
                const closeButton = openModal.querySelector('[data-bs-dismiss="modal"]');
                if (closeButton) {
                    closeButton.click();
                }
            }
        }
        
        // Ctrl/Cmd + P to print
        if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
            e.preventDefault();
            printPage();
        }
    });
}

// PWA (Progressive Web App) features
function initializePWA() {
    // Check if the app can be installed
    let deferredPrompt;
    
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        
        // Show install prompt after a delay
        setTimeout(() => {
            showInstallPrompt();
        }, 3000);
    });
    
    // Handle successful installation
    window.addEventListener('appinstalled', () => {
        showToast('App installed successfully!', 'success');
        deferredPrompt = null;
    });
}

// Show install prompt
function showInstallPrompt() {
    const installPrompt = document.createElement('div');
    installPrompt.className = 'alert alert-info alert-dismissible fade show position-fixed';
    installPrompt.style.cssText = 'top: 80px; left: 1rem; right: 1rem; z-index: 1050;';
    installPrompt.innerHTML = `
        <div class="d-flex align-items-center">
            <i data-feather="download" class="me-2"></i>
            <div class="flex-grow-1">
                <strong>Install Rural Health Assistant</strong><br>
                <small>Install this app on your device for better offline access.</small>
            </div>
            <button type="button" class="btn btn-primary btn-sm me-2" onclick="installApp()">
                Install
            </button>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    document.body.appendChild(installPrompt);
    
    // Update feather icons
    if (typeof feather !== 'undefined') {
        feather.replace();
    }
    
    // Auto-dismiss after 10 seconds
    setTimeout(() => {
        if (installPrompt.parentNode) {
            installPrompt.remove();
        }
    }, 10000);
}

// Install app function
function installApp() {
    if (window.deferredPrompt) {
        window.deferredPrompt.prompt();
        window.deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                showToast('App installation started!', 'success');
            }
            window.deferredPrompt = null;
        });
    }
}

// Utility function for debouncing
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
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        container.style.zIndex = '1060';
        document.body.appendChild(container);
    }
    return container;
}

// Format phone number for display
function formatPhoneNumber(phone) {
    if (!phone) return '';
    
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Format based on length
    if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
        return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
        return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
    }
    
    return phone; // Return original if no pattern matches
}

// Confirm call action
function confirmCall(phone, name = '') {
    const message = name ? `Call ${name} at ${phone}?` : `Call ${phone}?`;
    if (confirm(message)) {
        window.location.href = `tel:${phone}`;
    }
}

// Print current page
function printPage() {
    // Show print-friendly version
    const printWindow = window.open('', '_blank');
    const currentPage = document.documentElement.outerHTML;
    
    printWindow.document.write(`
        <html>
            <head>
                <title>Print - Rural Health Assistant</title>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
                <style>
                    @media print {
                        .no-print { display: none !important; }
                        body { font-size: 12pt; }
                    }
                </style>
            </head>
            <body>
                ${currentPage}
            </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
}

// Copy text to clipboard
function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Copied to clipboard!', 'success');
        }).catch(() => {
            fallbackCopyTextToClipboard(text);
        });
    } else {
        fallbackCopyTextToClipboard(text);
    }
}

// Fallback copy method
function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.position = 'fixed';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        showToast('Copied to clipboard!', 'success');
    } catch (err) {
        showToast('Failed to copy to clipboard', 'error');
    }
    
    document.body.removeChild(textArea);
}

// Input validation
function validateInput(input) {
    const value = input.value.trim();
    const type = input.type;
    const required = input.hasAttribute('required');
    
    if (required && !value) {
        return 'This field is required';
    }
    
    if (value) {
        switch (type) {
            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    return 'Please enter a valid email address';
                }
                break;
            case 'tel':
                const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
                if (!phoneRegex.test(value.replace(/\D/g, ''))) {
                    return 'Please enter a valid phone number';
                }
                break;
            case 'number':
                if (isNaN(value) || value < 0) {
                    return 'Please enter a valid number';
                }
                break;
        }
    }
    
    return '';
}

// Network change handling
function handleNetworkChange() {
    if (navigator.onLine) {
        showToast('Connection restored', 'success');
    } else {
        showToast('You are currently offline', 'warning');
    }
}

// Sync offline data (placeholder for future implementation)
function syncOfflineData() {
    console.log('Syncing offline data...');
    // This would sync any data stored locally while offline
}

// Initialize table navigation
function initializeTableNavigation() {
    const tables = document.querySelectorAll('.table');
    
    tables.forEach(table => {
        const rows = table.querySelectorAll('tbody tr');
        let currentIndex = -1;
        
        table.addEventListener('keydown', function(e) {
            if (rows.length === 0) return;
            
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    currentIndex = Math.min(currentIndex + 1, rows.length - 1);
                    highlightRow(rows, currentIndex);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    currentIndex = Math.max(currentIndex - 1, 0);
                    highlightRow(rows, currentIndex);
                    break;
                case 'Enter':
                    if (currentIndex >= 0) {
                        const link = rows[currentIndex].querySelector('a');
                        if (link) {
                            link.click();
                        }
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

// Export data functionality
function exportData(data, filename, format = 'csv') {
    switch (format) {
        case 'csv':
            exportToCSV(data, filename);
            break;
        case 'json':
            exportToJSON(data, filename);
            break;
        default:
            console.warn('Unsupported export format:', format);
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
        ...data.map(row => headers.map(header => {
            const value = row[header] || '';
            return `"${value.toString().replace(/"/g, '""')}"`;
        }).join(','))
    ].join('\n');
    
    downloadFile(csvContent, filename + '.csv', 'text/csv');
}

// Export to JSON
function exportToJSON(data, filename) {
    const jsonContent = JSON.stringify(data, null, 2);
    downloadFile(jsonContent, filename + '.json', 'application/json');
}

// Download file utility
function downloadFile(content, filename, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showToast(`Exported ${filename} successfully`, 'success');
}

// Make functions globally available
window.installApp = installApp;
window.confirmCall = confirmCall;
window.printPage = printPage;
window.copyToClipboard = copyToClipboard;
window.exportData = exportData;
window.showToast = showToast;
