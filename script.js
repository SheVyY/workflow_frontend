document.addEventListener('DOMContentLoaded', () => {
    const sourceInput = document.getElementById('source-input');
    const topicInput = document.getElementById('topic-input');
    const emailInput = document.getElementById('email-input');
    const sourcesContainer = document.getElementById('sources-container');
    const topicsContainer = document.getElementById('topics-container');
    const startButton = document.getElementById('start-btn');
    const languageSelect = document.getElementById('language-select');
    
    // Webhook URL
    const webhookUrl = 'https://eoeyekcgqu06mpf.m.pipedream.net';
    
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

    // Function to create and add a tag
    function createTag(value, container, input, isSource = false) {
        // If this is a source, clean and validate domain
        let cleanValue = value.trim();
        
        if (isSource) {
            cleanValue = value.toLowerCase();
            // Remove any protocol (http://, https://)
            cleanValue = cleanValue.replace(/^(https?:\/\/)?(www\.)?/, '');
            // Remove any path or query parameters
            cleanValue = cleanValue.split('/')[0]; 
            cleanValue = cleanValue.split('?')[0];
            
            if (!isValidDomain(cleanValue)) {
                showFeedback('Please enter a valid website domain (e.g., forbes.cz)', 'error');
                return false;
            }
        }
        
        // Check limit
        const maxItems = isSource ? MAX_SOURCES : MAX_TOPICS;
        if (countTags(container) >= maxItems) {
            showFeedback(`You can only add up to ${maxItems} ${isSource ? 'sources' : 'topics'}`, 'error');
            return false;
        }
        
        // Check if this value already exists
        const existingTags = container.querySelectorAll('.tag');
        for (const tag of existingTags) {
            const existingValue = tag.textContent.trim().replace('×', '').trim();
            if (existingValue.toLowerCase() === cleanValue.toLowerCase()) {
                // Only show alert if this is not part of a batch operation
                if (!isSource && value.includes(',')) {
                    console.log(`Duplicate topic skipped: ${cleanValue}`);
                } else {
                    showFeedback(`This ${isSource ? 'website' : 'topic'} is already added`, 'error');
                }
                return false;
            }
        }
        
        // Create the tag
        const newTag = document.createElement('div');
        newTag.className = 'tag';
        newTag.setAttribute('role', 'listitem');
        newTag.innerHTML = `
            ${cleanValue}
            <button class="remove-btn" aria-label="Remove ${cleanValue}" tabindex="0">×</button>
        `;
        
        // Add remove functionality
        const removeBtn = newTag.querySelector('.remove-btn');
        
        // Add keyboard support
        removeBtn.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
        
        removeBtn.addEventListener('click', function() {
            this.parentElement.remove();
            // Check if we need to show input again (if it was hidden due to max limit)
            if (countTags(container) < maxItems) {
                input.style.display = '';
            }
            // Remove error state if present
            container.classList.remove('error');
            // Announce removal for screen readers
            announceForScreenReader(`Removed ${cleanValue}`);
        });
        
        // Insert before the input
        container.insertBefore(newTag, input);
        input.value = '';
        
        // Hide input if we reached the limit
        if (countTags(container) >= maxItems) {
            input.style.display = 'none';
        }
        
        // Remove error state if present
        container.classList.remove('error');
        
        // Announce for screen readers
        announceForScreenReader(`Added ${cleanValue}`);
        
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
    
    // Show mobile-friendly feedback
    function showFeedback(message, type = 'error') {
        // Continue to use alert for desktop or fallback
        if (!isMobile) {
            alert(message);
            return;
        }
        
        // Use toast notification on mobile
        const toastContainer = document.getElementById('toast-container');
        if (toastContainer) {
            const toast = document.createElement('div');
            toast.className = `toast toast-${type}`;
            toast.textContent = message;
            toastContainer.appendChild(toast);
            
            // Remove after animation completes
            setTimeout(() => {
                toast.remove();
            }, 3000);
            
            // Also announce for screen readers
            announceForScreenReader(message);
        } else {
            // Fallback to alert if toast container doesn't exist
            alert(message);
        }
    }

    // Add new source tag when Enter is pressed
    sourceInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && this.value.trim() !== '') {
            createTag(this.value, sourcesContainer, this, true);
        }
    });
    
    // Add new topic tag when Enter is pressed
    topicInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && this.value.trim() !== '') {
            processTopicInput(this.value);
        }
    });

    // Add input blur event to catch paste actions
    topicInput.addEventListener('blur', function() {
        if (this.value.trim() !== '') {
            processTopicInput(this.value);
        }
    });

    // Email validation on blur
    emailInput.addEventListener('blur', function() {
        if (this.value.trim() !== '' && !isValidEmail(this.value.trim())) {
            this.classList.add('error');
            showFeedback('Please enter a valid email address', 'error');
        } else {
            this.classList.remove('error');
        }
    });

    // Handle start button click - send data to webhook
    startButton.addEventListener('click', async () => {
        // Collect all sources
        const sourceTags = sourcesContainer.querySelectorAll('.tag');
        const sources = Array.from(sourceTags)
            .map(tag => {
                // Get the clean domain name
                const domain = tag.textContent.trim().replace('×', '').trim();
                // Ensure it has https:// prefix for the backend
                return domain.startsWith('http') ? domain : `https://${domain}`;
            })
            .filter(source => source !== '');

        // Get topics
        const topicTags = topicsContainer.querySelectorAll('.tag');
        const topics = Array.from(topicTags)
            .map(tag => tag.textContent.trim().replace('×', '').trim())
            .filter(topic => topic !== '');

        // Get language
        const language = languageSelect.value;

        // Get email
        const email = emailInput.value.trim();

        // Validate form
        let isValid = true;
        let errorMessage = '';

        if (sources.length === 0) {
            isValid = false;
            errorMessage += 'Please add at least one media source.\n';
            sourcesContainer.classList.add('error');
        } else {
            sourcesContainer.classList.remove('error');
        }

        if (topics.length === 0) {
            isValid = false;
            errorMessage += 'Please add at least one topic.\n';
            topicsContainer.classList.add('error');
        } else {
            topicsContainer.classList.remove('error');
        }

        if (!language) {
            isValid = false;
            errorMessage += 'Please select a language.\n';
            languageSelect.classList.add('error');
        } else {
            languageSelect.classList.remove('error');
        }

        if (!email) {
            isValid = false;
            errorMessage += 'Please enter your email address.\n';
            emailInput.classList.add('error');
        } else if (!isValidEmail(email)) {
            isValid = false;
            errorMessage += 'Please enter a valid email address.\n';
            emailInput.classList.add('error');
        } else {
            emailInput.classList.remove('error');
        }

        if (!isValid) {
            showFeedback(errorMessage, 'error');
            return;
        }

        // Proceed with submission
        startButton.disabled = true;
        startButton.textContent = 'Sending...';
        announceForScreenReader('Sending your subscription request. Please wait.');
        
        try {
            // Create well-formatted payload
            const payload = {
                subscription: {
                    email: email,
                    sources: sources,
                    topics: topics,
                    language: language,
                    schedule: "8AM_UTC"
                },
                metadata: {
                    timestamp: new Date().toISOString(),
                    client: "web",
                    version: "1.0.0"
                }
            };

            console.log('Sending data to webhook:', JSON.stringify(payload, null, 2));

            // Send to webhook
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const responseData = await response.text();
            console.log('Response:', response.status, responseData);

            if (response.ok) {
                showFeedback('Your news summary subscription has been created! You will receive daily updates at 8:00 AM UTC.', 'success');
                announceForScreenReader('Success! Your news summary subscription has been created.');
                startButton.textContent = 'Success!';
                setTimeout(() => {
                    startButton.textContent = 'Start';
                    startButton.disabled = false;
                }, 2000);
            } else {
                throw new Error(`Server responded with status: ${response.status}`);
            }
        } catch (error) {
            console.error('Error:', error);
            showFeedback('Error creating subscription. Please try again.', 'error');
            announceForScreenReader('Error creating subscription. Please try again.');
            startButton.textContent = 'Start';
            startButton.disabled = false;
        }
    });
}); 