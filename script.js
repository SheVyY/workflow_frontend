document.addEventListener('DOMContentLoaded', () => {
    const sourceInput = document.getElementById('source-input');
    const topicInput = document.getElementById('topic-input');
    const emailInput = document.getElementById('email-input');
    const sourcesContainer = document.getElementById('sources-container');
    const topicsContainer = document.getElementById('topics-container');
    const startButton = document.getElementById('start-btn');
    const languageSelect = document.getElementById('language-select');
    
    // Webhook URL
    const webhookUrl = 'https://eoj7hczhcudxukm.m.pipedream.net';
    
    // Limits
    const MAX_SOURCES = 3;
    const MAX_TOPICS = 3;

    // Detect if device is mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Add focus/blur handlers for better mobile UX
    if (isMobile) {
        // Add small delay to handle virtual keyboard
        const focusInputs = document.querySelectorAll('input, select');
        focusInputs.forEach(input => {
            input.addEventListener('focus', function() {
                setTimeout(() => {
                    window.scrollTo(0, window.scrollY);
                }, 300);
            });
        });
    }

    // Validate email format
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Simple URL validation - ensures domain format without requiring protocol
    function isValidDomain(domain) {
        // Basic domain validation regex
        const domainRegex = /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
        return domainRegex.test(domain);
    }
    
    // Count current tags in a container
    function countTags(container) {
        return container.querySelectorAll('.tag').length;
    }

    // Clean and normalize a topic
    function cleanTopicText(text) {
        // Convert to lowercase
        let cleanText = text.toLowerCase().trim();
        
        // Remove any trailing commas, periods, or other common punctuation
        cleanText = cleanText.replace(/[,;:.!?&@#$%^*(){}[\]|\\/<>]+$/, '');
        
        // Remove any leading punctuation
        cleanText = cleanText.replace(/^[,;:.!?&@#$%^*(){}[\]|\\/<>]+/, '');
        
        // Replace multiple spaces with a single space
        cleanText = cleanText.replace(/\s+/g, ' ');
        
        return cleanText;
    }

    // Handle adding multiple topics from a comma-separated string
    function processTopicInput(inputValue) {
        if (!inputValue.trim()) return;
        
        // Check if the input contains commas
        if (inputValue.includes(',')) {
            // Split by comma and process each topic
            const topics = inputValue.split(',');
            
            for (const topic of topics) {
                const cleanTopic = cleanTopicText(topic);
                if (cleanTopic) {
                    createTag(cleanTopic, topicsContainer, topicInput, false);
                }
            }
        } else {
            // Single topic
            const cleanTopic = cleanTopicText(inputValue);
            if (cleanTopic) {
                createTag(cleanTopic, topicsContainer, topicInput, false);
            }
        }
    }

    // Function to show error for a specific field
    function showFieldError(element, message) {
        const section = element.closest('.section');
        if (section) {
            section.classList.add('error');
            
            // For select elements, add error class to the wrapper
            if (element.tagName === 'SELECT') {
                element.closest('.select-wrapper').classList.add('error');
            } else {
                element.classList.add('error');
            }
            
            // Find existing error message or create new one
            let errorMessage = section.querySelector('.error-message');
            if (!errorMessage) {
                errorMessage = document.createElement('div');
                errorMessage.className = 'error-message';
                
                // Insert after the input container
                const container = element.tagName === 'SELECT' 
                    ? element.closest('.select-wrapper')
                    : (element.classList.contains('tag-input') ? element.closest('.tags') : element);
                    
                container.insertAdjacentElement('afterend', errorMessage);
            }
            errorMessage.textContent = message;
            errorMessage.style.display = 'block';
            
            // For screen readers
            announceForScreenReader(message);
        }
    }

    // Function to clear error for a specific field
    function clearFieldError(element) {
        const section = element.closest('.section');
        if (section) {
            section.classList.remove('error');
            
            // For select elements, remove error class from the wrapper
            if (element.tagName === 'SELECT') {
                element.closest('.select-wrapper').classList.remove('error');
            } else {
                element.classList.remove('error');
            }
            
            const errorMessage = section.querySelector('.error-message');
            if (errorMessage) {
                errorMessage.remove();
            }
        }
    }

    // Update createTag function to use inline errors
    function createTag(value, container, input, isSource = false) {
        let cleanValue = value.trim();
        
        if (isSource) {
            cleanValue = value.toLowerCase();
            cleanValue = cleanValue.replace(/^(https?:\/\/)?(www\.)?/, '');
            cleanValue = cleanValue.split('/')[0]; 
            cleanValue = cleanValue.split('?')[0];
            
            if (!isValidDomain(cleanValue)) {
                showFieldError(container, 'Please enter a valid website domain');
                return false;
            }
        }
        
        const maxItems = isSource ? MAX_SOURCES : MAX_TOPICS;
        if (countTags(container) >= maxItems) {
            showFieldError(container, `Maximum ${maxItems} ${isSource ? 'sources' : 'topics'} allowed`);
            return false;
        }
        
        // Check for duplicates
        const existingTags = container.querySelectorAll('.tag');
        for (const tag of existingTags) {
            const existingValue = tag.textContent.trim().replace('×', '').trim();
            if (existingValue.toLowerCase() === cleanValue.toLowerCase()) {
                showFieldError(container, `This ${isSource ? 'source' : 'topic'} is already added`);
                return false;
            }
        }

        // If we get here, clear any existing errors
        clearFieldError(container);
        
        // Create and add the tag
        const newTag = document.createElement('div');
        newTag.className = 'tag';
        newTag.setAttribute('role', 'listitem');
        newTag.innerHTML = `
            ${cleanValue}
            <button class="remove-btn" aria-label="Remove ${cleanValue}" tabindex="0">×</button>
        `;
        
        // Add remove functionality
        const removeBtn = newTag.querySelector('.remove-btn');
        removeBtn.addEventListener('click', function() {
            this.parentElement.remove();
            if (countTags(container) < maxItems) {
                input.style.display = '';
                clearFieldError(container);
            }
        });
        
        container.insertBefore(newTag, input);
        input.value = '';
        
        if (countTags(container) >= maxItems) {
            input.style.display = 'none';
        }
        
        return true;
    }

    // Create an accessible live region for screen reader announcements
    function setupAccessibilityAnnouncements() {
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

    // Setup accessibility as soon as the DOM is loaded
    setupAccessibilityAnnouncements();
    
    // Announce to screen readers
    function announceForScreenReader(message) {
        const announcer = document.getElementById('a11y-announcer');
        if (announcer) {
            announcer.textContent = message;
            // Clear after 5 seconds to prepare for next announcement
            setTimeout(() => {
                announcer.textContent = '';
            }, 5000);
        }
    }
    
    // Get or create toast container
    function getToastContainer() {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        return container;
    }

    // Show toast notification
    function showToast(message, type = 'success') {
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

    // Track form submission status
    let isSubmitting = false;

    // Add event listeners for source input
    sourceInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const value = sourceInput.value.trim();
            if (value) {
                // Split by comma and process each source
                const sources = value.split(',');
                for (const source of sources) {
                    const cleanSource = source.trim();
                    if (cleanSource) {
                        createTag(cleanSource, sourcesContainer, sourceInput, true);
                    }
                }
                sourceInput.value = '';
            }
        }
    });

    // Add event listeners for topic input
    topicInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            processTopicInput(topicInput.value);
            topicInput.value = '';
        }
    });

    // Email validation on blur
    emailInput.addEventListener('blur', function() {
        if (this.value.trim() !== '' && !isValidEmail(this.value.trim())) {
            showFieldError(this, 'Please enter a valid email address');
        } else {
            clearFieldError(this);
        }
    });

    // Add keyboard navigation for tags
    function setupTagKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            if (e.target.closest('.tag')) {
                const tag = e.target.closest('.tag');
                const removeBtn = tag.querySelector('.remove-btn');
                
                if (e.key === 'Delete' || e.key === 'Backspace') {
                    e.preventDefault();
                    removeBtn.click();
                }
            }
        });
    }

    // Real-time email validation
    emailInput.addEventListener('input', debounce(function() {
        const email = this.value.trim();
        if (email && !isValidEmail(email)) {
            showFieldError(this, 'Please enter a valid email address');
        } else {
            clearFieldError(this);
        }
    }, 500));

    // Debounce function for performance
    function debounce(func, wait) {
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

    // Show loading state for inputs
    function showLoadingState(element) {
        element.classList.add('loading');
    }

    function hideLoadingState(element) {
        element.classList.remove('loading');
    }

    // Update form submission with loading states and submission tracking
    startButton.addEventListener('click', async () => {
        // Prevent multiple submissions
        if (isSubmitting) {
            return;
        }

        const sources = Array.from(sourcesContainer.querySelectorAll('.tag'))
            .map(tag => tag.textContent.trim().replace('×', '').trim())
            .filter(source => source !== '');

        const topics = Array.from(topicsContainer.querySelectorAll('.tag'))
            .map(tag => tag.textContent.trim().replace('×', '').trim())
            .filter(topic => topic !== '');

        const language = languageSelect.value;
        const email = emailInput.value.trim();
        let isValid = true;

        // Clear all existing errors first
        document.querySelectorAll('.error-message').forEach(el => el.remove());
        document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));

        // Validate each field
        if (sources.length === 0) {
            isValid = false;
            showFieldError(sourcesContainer, 'Please add at least one media source');
        }

        if (topics.length === 0) {
            isValid = false;
            showFieldError(topicsContainer, 'Please add at least one topic');
        }

        if (!language) {
            isValid = false;
            showFieldError(languageSelect, 'Please select a language');
        }

        if (!email) {
            isValid = false;
            showFieldError(emailInput, 'Please enter your email address');
        } else if (!isValidEmail(email)) {
            isValid = false;
            showFieldError(emailInput, 'Please enter a valid email address');
        }

        if (!isValid) {
            return;
        }

        // Set submitting state
        isSubmitting = true;

        // Show loading states
        startButton.disabled = true;
        startButton.textContent = 'Setting up...';
        showLoadingState(sourcesContainer);
        showLoadingState(topicsContainer);
        showLoadingState(emailInput);

        try {
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sources: sources.map(source => source.startsWith('http') ? source : `https://${source}`),
                    topics,
                    language,
                    email
                })
            });

            if (response.ok) {
                showToast('Your news summary has been set up successfully!', 'success');
                // Reset form
                sourcesContainer.querySelectorAll('.tag').forEach(tag => tag.remove());
                topicsContainer.querySelectorAll('.tag').forEach(tag => tag.remove());
                languageSelect.value = '';
                emailInput.value = '';
                
                // Disable the start button permanently after successful submission
                startButton.disabled = true;
                startButton.textContent = 'Submitted';
                startButton.classList.add('submitted');
            } else {
                throw new Error('Failed to set up news summary');
            }
        } catch (error) {
            showToast('Something went wrong. Please try again.', 'error');
            // Reset submitting state on error so user can try again
            isSubmitting = false;
            startButton.disabled = false;
            startButton.textContent = 'Start';
        } finally {
            // Hide loading states
            hideLoadingState(sourcesContainer);
            hideLoadingState(topicsContainer);
            hideLoadingState(emailInput);
        }
    });

    // Initialize keyboard navigation
    setupTagKeyboardNavigation();
}); 