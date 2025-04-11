/**
 * FormHandler Component
 * Manages form inputs, tag creation, validation, and submission
 */

// Constants
const MAX_SOURCES = 3;
const MAX_TOPICS = 3;

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - Whether the email is valid
 */
export function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate domain format
 * @param {string} domain - Domain to validate
 * @returns {boolean} - Whether the domain is valid
 */
export function isValidDomain(domain) {
    // Basic domain validation regex
    const domainRegex = /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    return domainRegex.test(domain);
}

/**
 * Check if a source is English-only
 * @param {string} domain - Domain to check
 * @returns {boolean} - Whether the domain is for an English source
 */
export function isEnglishSource(domain) {
    // Only allow English sources
    const englishTLDs = ['.com', '.org', '.net', '.io', '.co', '.uk', '.us', '.ca', '.au', '.nz'];
    return englishTLDs.some(tld => domain.toLowerCase().endsWith(tld));
}

/**
 * Clean a topic string
 * @param {string} text - Topic text to clean
 * @returns {string} - Cleaned topic
 */
export function cleanTopicText(text) {
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

/**
 * Show error for a specific field
 * @param {HTMLElement} element - The element to show error for
 * @param {string} message - Error message
 */
export function showFieldError(element, message) {
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

/**
 * Clear error for a specific field
 * @param {HTMLElement} element - The element to clear error for
 */
export function clearFieldError(element) {
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

/**
 * Create a tag element and add it to the appropriate container
 * @param {string} value - Tag value
 * @param {string} type - Tag type ('source' or 'topic')
 * @param {HTMLElement} sourcesContainer - Container for source tags
 * @param {HTMLElement} topicsContainer - Container for topic tags
 * @returns {boolean} - Whether the tag was created successfully
 */
export function createTag(value, type, sourcesContainer, topicsContainer) {
    if (type === 'source') {
        let cleanValue = value.toLowerCase();
        cleanValue = cleanValue.replace(/^(https?:\/\/)?(www\.)?/, '');
        cleanValue = cleanValue.split('/')[0]; 
        cleanValue = cleanValue.split('?')[0];
        
        if (!isValidDomain(cleanValue)) {
            showFieldError(sourcesContainer, 'Please enter a valid website domain');
            return false;
        }

        if (!isEnglishSource(cleanValue)) {
            showFieldError(sourcesContainer, 'Only English sources are allowed. Please use sources with .com, .org, .net, .io, .co, .uk, .us, .ca, .au, or .nz domains.');
            return false;
        }

        if (document.querySelectorAll('.tag[data-type="source"]').length >= MAX_SOURCES) {
            showFieldError(sourcesContainer, `Maximum ${MAX_SOURCES} sources allowed`);
            return false;
        }

        value = cleanValue; // Use the cleaned domain value
    } else if (type === 'topic') {
        // Always respect the checkbox state
        const checkbox = document.querySelector(`.topic-checkbox input[value="${value}"]`);
        if (!checkbox || !checkbox.checked) {
            return false;
        }

        if (document.querySelectorAll('.tag[data-type="topic"]').length >= MAX_TOPICS) {
            checkbox.checked = false;
            return false;
        }
    }

    // Check for duplicates
    const existingTags = document.querySelectorAll(`.tag[data-type="${type}"]`);
    for (const tag of existingTags) {
        if (tag.textContent.trim().replace('×', '').trim() === value) {
            if (type === 'source') {
                showFieldError(sourcesContainer, 'This source is already added');
            }
            return false;
        }
    }
    
    // Clear any existing errors for sources
    if (type === 'source') {
        clearFieldError(sourcesContainer);
    }
    
    // Create and add the tag
    const tag = document.createElement('div');
    tag.className = 'tag';
    tag.setAttribute('data-type', type);
    tag.setAttribute('data-value', value);
    tag.innerHTML = `
        <span>${value}</span>
        <button class="remove-tag" aria-label="Remove ${type}">×</button>
    `;
    
    // Add remove functionality
    const removeBtn = tag.querySelector('.remove-tag');
    removeBtn.addEventListener('click', () => {
        tag.remove();
        if (type === 'topic') {
            // Uncheck the corresponding checkbox
            const checkbox = document.querySelector(`.topic-checkbox input[value="${value}"]`);
            if (checkbox) {
                checkbox.checked = false;
            }
            // Update disabled state for all checkboxes
            window.dispatchEvent(new CustomEvent('update-checkboxes'));
        }
    });
    
    const container = type === 'topic' ? topicsContainer : sourcesContainer;
    container.appendChild(tag);
    
    // Dispatch event to update checkbox states after adding a topic tag
    if (type === 'topic') {
        window.dispatchEvent(new CustomEvent('update-checkboxes'));
    }
    
    return true;
}

/**
 * Collect form data from the UI
 * @param {HTMLElement} sourcesContainer - Container for source tags
 * @param {HTMLElement} topicsContainer - Container for topic tags
 * @param {HTMLSelectElement} languageSelect - Language select element
 * @param {HTMLInputElement} emailInput - Email input element
 * @returns {Object} - Form data object
 */
export function collectFormData(sourcesContainer, topicsContainer, languageSelect, emailInput) {
    // Get sources from tags
    const sources = Array.from(sourcesContainer.querySelectorAll('.tag'))
        .map(tag => tag.querySelector('span').textContent.trim());
    
    // Get topics from tags
    const topics = Array.from(topicsContainer.querySelectorAll('.tag'))
        .map(tag => tag.querySelector('span').textContent.trim());
    
    // Get language
    const language = languageSelect.value;
    
    // Get email
    const email = emailInput.value.trim();
    
    return {
        sources,
        topics,
        language,
        email
    };
}

/**
 * Validate form data
 * @param {Object} formData - Form data to validate
 * @returns {Array} - Array of error messages (empty if valid)
 */
export function validateFormData(formData) {
    const errors = [];
    
    if (formData.sources.length === 0) {
        errors.push('Please add at least one news source');
    }
    
    if (formData.topics.length === 0) {
        errors.push('Please select at least one topic');
    }
    
    if (!formData.language) {
        errors.push('Please select a language');
    }
    
    if (!formData.email) {
        errors.push('Please enter your email address');
    } else if (!isValidEmail(formData.email)) {
        errors.push('Please enter a valid email address');
    }
    
    return errors;
}

/**
 * Announce message for screen readers
 * @param {string} message - Message to announce
 */
export function announceForScreenReader(message) {
    const announcer = document.getElementById('a11y-announcer');
    if (announcer) {
        announcer.textContent = message;
        // Clear after 5 seconds to prepare for next announcement
        setTimeout(() => {
            announcer.textContent = '';
        }, 5000);
    }
} 