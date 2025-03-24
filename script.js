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
                alert('Please enter a valid website domain (e.g., forbes.cz)');
                return false;
            }
        }
        
        // Check limit
        const maxItems = isSource ? MAX_SOURCES : MAX_TOPICS;
        if (countTags(container) >= maxItems) {
            alert(`You can only add up to ${maxItems} ${isSource ? 'sources' : 'topics'}`);
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
                    alert(`This ${isSource ? 'website' : 'topic'} is already added`);
                }
                return false;
            }
        }
        
        // Create the tag
        const newTag = document.createElement('div');
        newTag.className = 'tag';
        newTag.innerHTML = `
            ${cleanValue}
            <button class="remove-btn">×</button>
        `;
        
        // Add remove functionality
        const removeBtn = newTag.querySelector('.remove-btn');
        removeBtn.addEventListener('click', function() {
            this.parentElement.remove();
            // Check if we need to show input again (if it was hidden due to max limit)
            if (countTags(container) < maxItems) {
                input.style.display = '';
            }
            // Remove error state if present
            container.classList.remove('error');
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
        return true;
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
            alert(errorMessage);
            return;
        }

        // Proceed with submission
        startButton.disabled = true;
        startButton.textContent = 'Sending...';
        
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
                alert('Your news summary subscription has been created! You will receive daily updates at 8:00 AM UTC.');
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
            alert('Error creating subscription. Please try again.');
            startButton.textContent = 'Start';
            startButton.disabled = false;
        }
    });
}); 