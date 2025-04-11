/**
 * UI Helpers
 * Utility functions for UI operations
 */

/**
 * Set up accessibility announcements
 * Creates screen reader live regions and toast container
 */
export function setupAccessibilityAnnouncements() {
    // Create a live region if it doesn't exist
    if (!document.getElementById('a11y-announcer')) {
        const announcer = document.createElement('div');
        announcer.id = 'a11y-announcer';
        announcer.className = 'sr-only';
        announcer.setAttribute('aria-live', 'polite');
        announcer.setAttribute('aria-atomic', 'true');
        document.body.appendChild(announcer);
        
        // Add the necessary CSS
        const style = document.createElement('style');
        style.textContent = `
            .sr-only {
                position: absolute;
                width: 1px;
                height: 1px;
                padding: 0;
                margin: -1px;
                overflow: hidden;
                clip: rect(0, 0, 0, 0);
                white-space: nowrap;
                border: 0;
            }
            
            .toast-container {
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 1000;
                width: 90%;
                max-width: 400px;
            }
            
            .toast {
                padding: 12px 16px;
                border-radius: 4px;
                margin-bottom: 8px;
                font-size: 14px;
                animation: fadeInUp 0.3s ease-out, fadeOut 0.5s ease-in 2.5s forwards;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            
            .toast-error {
                background-color: #fff2f0;
                border-left: 4px solid #ff4d4f;
                color: #cf1322;
            }
            
            .toast-success {
                background-color: #f6ffed;
                border-left: 4px solid #52c41a;
                color: #389e0d;
            }
            
            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            @keyframes fadeOut {
                from {
                    opacity: 1;
                }
                to {
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
        
        // Create a toast container for mobile-friendly feedback
        const toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        toastContainer.id = 'toast-container';
        document.body.appendChild(toastContainer);
    }
}

/**
 * Get or create toast container
 * @returns {HTMLElement} - Toast container element
 */
function getToastContainer() {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    return container;
}

/**
 * Show toast notification
 * @param {string} message - Toast message content
 * @param {string} type - Toast type ('success' or 'error')
 */
export function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span class="toast-message">${message}</span>
        <button class="toast-close" aria-label="Close notification">×</button>
    `;

    const container = getToastContainer();
    container.appendChild(toast);

    // Close button handler
    const closeButton = toast.querySelector('.toast-close');
    closeButton.addEventListener('click', () => {
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 300);
    });

    // Auto remove after 8 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.classList.add('toast-exit');
            setTimeout(() => toast.remove(), 300);
        }
    }, 8000);
}

/**
 * Show loading state for an element
 * @param {HTMLElement} element - Element to show loading state on
 */
export function showLoadingState(element) {
    element.classList.add('loading');
}

/**
 * Hide loading state for an element
 * @param {HTMLElement} element - Element to hide loading state from
 */
export function hideLoadingState(element) {
    element.classList.remove('loading');
}

/**
 * Debounce function to limit execution rate
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Toggle empty state visibility based on content presence
 * @param {HTMLElement} emptyState - Empty state container
 * @param {HTMLElement} newsContainer - News container
 */
export function toggleEmptyState(emptyState, newsContainer) {
    const hasNewsItems = newsContainer.children.length > 0;
    
    if (hasNewsItems) {
        emptyState.style.display = 'none';
        newsContainer.style.display = 'block';
    } else {
        emptyState.style.display = 'flex';
        newsContainer.style.display = 'none';
    }
}

/**
 * Set up keyboard navigation for tags
 */
export function setupTagKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
        if (e.target.closest('.tag')) {
            const tag = e.target.closest('.tag');
            const removeBtn = tag.querySelector('.remove-tag');
            
            if (e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault();
                removeBtn.click();
            }
        }
    });
} 