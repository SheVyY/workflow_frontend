document.addEventListener('DOMContentLoaded', () => {
    const sourceInput = document.getElementById('source-input');
    const emailInput = document.getElementById('email-input');
    const sourcesContainer = document.getElementById('sources-container');
    const topicsContainer = document.getElementById('topics-container');
    const startButton = document.getElementById('start-btn');
    const languageSelect = document.getElementById('language-select');
    
    // New elements for output section
    const outputSection = document.getElementById('output-section');
    const newsContainer = document.getElementById('news-container');
    const emptyState = document.getElementById('empty-state');
    const emptyPreviewButton = document.getElementById('empty-preview-btn');
    
    // Webhook URL
    const webhookUrl = 'https://eoj7hczhcudxukm.m.pipedream.net';
    
    // Limits
    const MAX_SOURCES = 3;
    const MAX_TOPICS = 3;

    // Function to get yesterday's date in YYYY-MM-DD format
    function getYesterdayUTC() {
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setUTCDate(yesterday.getUTCDate() - 1);
        
        // Format date as YYYY-MM-DD
        const year = yesterday.getUTCFullYear();
        const month = String(yesterday.getUTCMonth() + 1).padStart(2, '0');
        const day = String(yesterday.getUTCDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    }

    // Function to get formatted date for display (e.g., "April 11, 8AM")
    function getFormattedDate() {
        const now = new Date();
        const options = { month: 'long', day: 'numeric' };
        const dateString = now.toLocaleDateString('en-US', options);
        return `${dateString}, 8AM`;
    }

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

    // Validate if source is English-only
    function isEnglishSource(domain) {
        // Only allow English sources
        const englishTLDs = ['.com', '.org', '.net', '.io', '.co', '.uk', '.us', '.ca', '.au', '.nz'];
        return englishTLDs.some(tld => domain.toLowerCase().endsWith(tld));
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
                    createTag(cleanTopic, 'topic');
                }
            }
        } else {
            // Single topic
            const cleanTopic = cleanTopicText(inputValue);
            if (cleanTopic) {
                createTag(cleanTopic, 'topic');
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
    function createTag(value, type) {
        if (type === 'source') {
            let cleanValue = value.toLowerCase();
            cleanValue = cleanValue.replace(/^(https?:\/\/)?(www\.)?/, '');
            cleanValue = cleanValue.split('/')[0]; 
            cleanValue = cleanValue.split('?')[0];
            
            if (!isValidDomain(cleanValue)) {
                showFieldError(sourcesContainer, 'Please enter a valid website domain');
                return;
            }

            if (!isEnglishSource(cleanValue)) {
                showFieldError(sourcesContainer, 'Only English sources are allowed. Please use sources with .com, .org, .net, .io, .co, .uk, .us, .ca, .au, or .nz domains.');
                return;
            }

            if (document.querySelectorAll('.tag[data-type="source"]').length >= MAX_SOURCES) {
                showFieldError(sourcesContainer, `Maximum ${MAX_SOURCES} sources allowed`);
                return;
            }

            value = cleanValue; // Use the cleaned domain value
        } else if (type === 'topic') {
            // Always respect the checkbox state
            const checkbox = document.querySelector(`.topic-checkbox input[value="${value}"]`);
            if (!checkbox || !checkbox.checked) {
                return;
            }

            if (document.querySelectorAll('.tag[data-type="topic"]').length >= MAX_TOPICS) {
                checkbox.checked = false;
                return;
            }
        }

        // Check for duplicates
        const existingTags = document.querySelectorAll(`.tag[data-type="${type}"]`);
        for (const tag of existingTags) {
            if (tag.textContent.trim().replace('×', '').trim() === value) {
                if (type === 'source') {
                    showFieldError(sourcesContainer, 'This source is already added');
                }
                return;
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
                updateCheckboxStates();
            }
        });
        
        const container = type === 'topic' ? topicsContainer : sourcesContainer;
        container.appendChild(tag);
        
        // Always update checkbox states after adding a topic tag
        if (type === 'topic') {
            updateCheckboxStates();
        }
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
                createTag(value, 'source');
                sourceInput.value = '';
            }
        }
    });

    // Handle pasted content for sources
    sourceInput.addEventListener('paste', (e) => {
        e.preventDefault();
        const paste = (e.clipboardData || window.clipboardData).getData('text');
        
        if (paste) {
            const sources = paste.split(/[,\n]/).map(s => s.trim()).filter(Boolean);
            
            if (sources.length) {
                for (const source of sources) {
                    const cleanSource = source.trim();
                    if (cleanSource) {
                        createTag(cleanSource, 'source');
                    }
                }
                sourceInput.value = '';
            }
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
                const removeBtn = tag.querySelector('.remove-tag');
                
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

    // Form submission handler
    startButton.addEventListener('click', async (e) => {
        e.preventDefault();
        console.log('Form submission started');

        // Prevent multiple submissions
        if (isSubmitting) {
            console.log('Already submitting, preventing duplicate submission');
            return;
        }

        // Get form values
        const sources = Array.from(sourcesContainer.querySelectorAll('.tag')).map(tag => 
            tag.querySelector('span').textContent.trim()
        );
        console.log('Sources:', sources);

        const topics = Array.from(document.querySelectorAll('.topic-checkbox input:checked')).map(checkbox => 
            checkbox.value
        );
        console.log('Topics:', topics);

        const language = languageSelect.value;
        console.log('Language:', language);

        const email = emailInput.value.trim();
        console.log('Email:', email);

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
            console.log('Form validation failed');
            return;
        }

        console.log('Form validation passed, preparing to submit');

        // Set submitting state
        isSubmitting = true;

        // Show loading states
        startButton.disabled = true;
        startButton.textContent = 'Setting up...';
        showLoadingState(sourcesContainer);
        showLoadingState(topicsContainer);
        showLoadingState(emailInput);

        try {
            console.log('Sending request to webhook:', webhookUrl);
            const requestBody = {
                sources: sources.map(source => ({
                    url: source.startsWith('http') ? source : `https://${source}`,
                    method: "GET"
                })),
                topics,
                language,
                email,
                date: getYesterdayUTC()
            };
            console.log('Request body:', requestBody);

            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            console.log('Response status:', response.status);
            const responseData = await response.text();
            console.log('Response data:', responseData);

            if (response.ok) {
                console.log('Submission successful');
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
                throw new Error(`Failed to set up news summary: ${response.status} ${responseData}`);
            }
        } catch (error) {
            console.error('Submission error:', error);
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
            console.log('Form submission completed');
        }
    });

    // Initialize keyboard navigation
    setupTagKeyboardNavigation();
    
    // Topic checkbox handlers
    const topicCheckboxes = document.querySelectorAll('.topic-checkbox input[type="checkbox"]');
    
    // Add event listener at document level to catch clicks before they happen
    document.addEventListener('click', function(event) {
        // Only handle clicks on unchecked topic checkboxes
        if (event.target.matches('.topic-checkbox input[type="checkbox"]:not(:checked)')) {
            // If already at max topics, prevent checking and show message
            const checkedCount = document.querySelectorAll('.topic-checkbox input[type="checkbox"]:checked').length;
            if (checkedCount >= MAX_TOPICS) {
                event.preventDefault();
                event.stopPropagation();
                showToast(`You can select maximum ${MAX_TOPICS} topics`, 'error');
                return false;
            }
        }
    }, true); // true = capture phase, runs before the default action
    
    // Handle changes in checkboxes
    topicCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const value = this.value;
            
            if (this.checked) {
                // Create tag for the selected topic
                createTag(value, 'topic');
            } else {
                // Remove the corresponding tag
                const tagToRemove = document.querySelector(`.tag[data-value="${value}"]`);
                if (tagToRemove) {
                    tagToRemove.remove();
                }
            }
            
            // Update disabled states after change
            updateCheckboxStates();
        });
    });
    
    // Function to update checkbox states
    function updateCheckboxStates() {
        const checkedCount = document.querySelectorAll('.topic-checkbox input[type="checkbox"]:checked').length;
        
        // If we have the maximum number of topics selected, disable all unchecked boxes
        topicCheckboxes.forEach(checkbox => {
            if (!checkbox.checked) {
                checkbox.disabled = checkedCount >= MAX_TOPICS;
            }
        });
    }
    
    // Initialize checkbox states on page load
    function initializeCheckboxes() {
        // Check for pre-checked boxes and create tags
        document.querySelectorAll('.topic-checkbox input[type="checkbox"]:checked').forEach(checkbox => {
            createTag(checkbox.value, 'topic');
        });
        
        // Set initial disabled states
        updateCheckboxStates();
    }
    
    // Function to toggle empty state visibility based on news items
    function toggleEmptyState() {
        const hasNewsItems = newsContainer.children.length > 0;
        
        if (hasNewsItems) {
            emptyState.style.display = 'none';
            newsContainer.style.display = 'block';
        } else {
            emptyState.style.display = 'flex';
            newsContainer.style.display = 'none';
        }
    }
    
    // Function to update the output view with news content
    function updateOutputView() {
        // Update the date display
        const newsDate = document.querySelector('.news-date');
        if (newsDate) {
            newsDate.textContent = getFormattedDate();
        }
        
        // Check if empty state should be shown
        toggleEmptyState();
        
        // For mobile view, scroll to the output section
        if (window.innerWidth <= 768) {
            outputSection.scrollIntoView({ behavior: 'smooth' });
        }
    }
    
    // Sample news data for testing
    const sampleNewsData = [
        {
            title: "Honor's $10B AI Investment",
            content: "Chinese smartphone maker Honor will invest $10B over 5 years to expand AI in its devices.",
            url: "#"
        },
        {
            title: "Nvidia's AI Growth & Stock Dip",
            content: "AI chip sales drove a 78% revenue increase, but stock fell 8.5%. New Blackwell Ultra chip expected soon.",
            url: "#"
        },
        {
            title: "U.S. Considers AI Chip Export Ban",
            content: "Possible trade restrictions on AI chip sales to China could impact Nvidia's H20 & B20 processors.",
            url: "#"
        },
        {
            title: "SoftBank's $16B AI Investment",
            content: "The firm plans to borrow $16B to expand AI initiatives, with another $8B loan possible in 2026.",
            url: "#"
        },
        {
            title: "Nvidia's AI Dominance",
            content: "Nvidia's H100 chip fueled its $3.45T valuation, solidifying its lead in AI, gaming, and robotics.",
            url: "#"
        }
    ];
    
    // Function to create a dropdown menu for the three dots
    function createDropdownMenu() {
        const dropdown = document.createElement('div');
        dropdown.className = 'news-menu-dropdown';
        
        const menu = document.createElement('ul');
        
        const deleteItem = document.createElement('li');
        deleteItem.className = 'delete';
        deleteItem.textContent = 'Delete news feed';
        deleteItem.addEventListener('click', function(e) {
            e.stopPropagation();
            const newsItem = this.closest('.news-item');
            if (newsItem && newsItem.parentNode) {
                newsItem.parentNode.removeChild(newsItem);
                closeAllDropdowns(); // Close dropdown after action
                toggleEmptyState(); // Check if we need to show empty state
            }
        });
        
        menu.appendChild(deleteItem);
        dropdown.appendChild(menu);
        
        return dropdown;
    }
    
    // Function to close all open dropdown menus
    function closeAllDropdowns() {
        const dropdowns = document.querySelectorAll('.news-menu-dropdown.show');
        dropdowns.forEach(dropdown => {
            dropdown.classList.remove('show');
        });
    }
    
    // Add click handler to close dropdowns when clicking outside
    document.addEventListener('click', function() {
        closeAllDropdowns();
    });
    
    // Function to generate news item with dynamic data
    function generateNewsItem(newsData, isSampleData = true) {
        // Create news item container
        const newsItem = document.createElement('div');
        newsItem.className = 'news-item';
        
        // Create header
        const header = document.createElement('div');
        header.className = 'news-header';
        
        // Create icon
        const icon = document.createElement('div');
        icon.className = 'news-icon';
        icon.innerHTML = `
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="40" height="40" rx="10" fill="url(#paint0_linear)" />
                <path d="M14 15h12v1.5H14z" fill="#fff" />
                <path d="M14 19h12v1.5H14z" fill="#fff" />
                <path d="M14 23h12v1.5H14z" fill="#fff" />
                <path d="M14 27h8v1.5H14z" fill="#fff" />
                <defs>
                    <linearGradient id="paint0_linear" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                        <stop stop-color="#4ee1a0" />
                        <stop offset="1" stop-color="#00ffbb" />
                    </linearGradient>
                </defs>
            </svg>
        `;
        
        // Create title
        const titleDiv = document.createElement('div');
        titleDiv.className = 'news-title';
        
        const title = document.createElement('h2');
        title.textContent = 'News Summary';
        
        const date = document.createElement('span');
        date.className = 'news-date';
        date.textContent = getFormattedDate();
        
        titleDiv.appendChild(title);
        titleDiv.appendChild(date);
        
        // Create menu button
        const menuBtn = document.createElement('button');
        menuBtn.className = 'news-menu-btn';
        menuBtn.setAttribute('aria-label', 'More options');
        menuBtn.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="6" r="2" fill="#333" />
                <circle cx="12" cy="12" r="2" fill="#333" />
                <circle cx="12" cy="18" r="2" fill="#333" />
            </svg>
        `;
        
        // Create dropdown menu
        const dropdown = createDropdownMenu();
        
        // Add event listener to toggle dropdown
        menuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            
            // Close all other dropdowns first
            closeAllDropdowns();
            
            // Toggle this dropdown
            dropdown.classList.toggle('show');
        });
        
        // Assemble header
        header.appendChild(icon);
        header.appendChild(titleDiv);
        header.appendChild(menuBtn);
        header.appendChild(dropdown);
        
        // Create content
        const content = document.createElement('div');
        content.className = 'news-content';
        
        // Add news stories
        newsData.forEach(item => {
            const story = document.createElement('div');
            story.className = 'news-story';
            
            const diamond = document.createElement('span');
            diamond.className = 'news-diamond';
            diamond.textContent = '◆';
            
            const storyTitle = document.createElement('h3');
            storyTitle.textContent = item.title;
            
            const storyContent = document.createElement('p');
            storyContent.textContent = item.content;
            
            const readMore = document.createElement('a');
            readMore.href = item.url;
            readMore.className = 'read-more';
            readMore.textContent = 'Read more';
            
            story.appendChild(diamond);
            story.appendChild(storyTitle);
            story.appendChild(storyContent);
            story.appendChild(readMore);
            
            content.appendChild(story);
        });
        
        // Add sample data indicator if it's a preview
        if (isSampleData) {
            const sampleIndicator = document.createElement('div');
            sampleIndicator.className = 'sample-data-indicator';
            sampleIndicator.innerHTML = `
                <div class="sample-data-badge">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 1.5C4.41 1.5 1.5 4.41 1.5 8C1.5 11.59 4.41 14.5 8 14.5C11.59 14.5 14.5 11.59 14.5 8C14.5 4.41 11.59 1.5 8 1.5ZM8.75 11H7.25V9.5H8.75V11ZM8.75 8.75H7.25V5H8.75V8.75Z" fill="currentColor"/>
                    </svg>
                    <span>Sample data</span>
                </div>
            `;
            content.appendChild(sampleIndicator);
        }
        
        // Assemble news item
        newsItem.appendChild(header);
        newsItem.appendChild(content);
        
        return newsItem;
    }
    
    // Function to update news container with data
    function updateNewsContainer(newsData, isSampleData = true) {
        // Add news item
        const newsItem = generateNewsItem(newsData, isSampleData);
        newsContainer.appendChild(newsItem);
        
        // Update the output view
        updateOutputView();
    }
    
    // Function to clear news container and show empty state
    function clearNewsContainer() {
        newsContainer.innerHTML = '';
        toggleEmptyState();
    }
    
    // Event listeners for UI navigation
    // Event listener for empty state preview button
    emptyPreviewButton.addEventListener('click', () => {
        updateNewsContainer(sampleNewsData);
    });

    // Initialize
    function init() {
        setupAccessibilityAnnouncements();
        setupTagKeyboardNavigation();
        initializeCheckboxes();
        
        // Set initial empty state
        clearNewsContainer();
    }
    
    init();
}); 