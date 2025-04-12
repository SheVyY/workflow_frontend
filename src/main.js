// Import the unified data service
import { 
    fetchNewsFeeds, 
    deleteNewsFeed, 
    subscribeToNewsFeeds, 
    getLatestNewsFeed, 
    fetchSampleNewsData,
    fetchMultipleCategories,
    generateSubmissionId, 
    saveFormSubmission, 
    getFeedsBySubmissionId,
    fetchAllDevFeeds,
    fetchLatestFeeds,
    testDatabaseConnection
} from './services/dataService.js';

import { sendFormDataToWebhook } from './services/webhookService.js';
import { generateNewsItem, closeAllDropdowns } from './components/NewsItem.js';
import { createTag, collectFormData, validateFormData, isValidEmail, showFieldError, clearFieldError } from './components/FormHandler.js';
import { setupAccessibilityAnnouncements, setupTagKeyboardNavigation, showToast, showLoadingState, hideLoadingState, toggleEmptyState, debounce } from './utils/UIHelpers.js';

// Import CSS directly - this ensures Vite processes it correctly in production
import './styles/styles.css';

/**
 * Main application initialization
 */

// Check if we're in development mode
const isDevelopmentMode = 
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1';

console.log('=== APP INITIALIZATION ===');
console.log('Development mode:', isDevelopmentMode);
console.log('Current URL:', window.location.href);
console.log('Hostname:', window.location.hostname);
console.log('=========================');

document.addEventListener('DOMContentLoaded', () => {
    // Debug environment information
    console.log('======= ENVIRONMENT DEBUG INFO =======');
    console.log('Vite Environment Variables:');
    console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
    console.log('VITE_SUPABASE_ANON_KEY exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
    console.log('Current URL:', window.location.href);
    console.log('Environment Parameter:', new URLSearchParams(window.location.search).get('env'));
    console.log('ID Parameter:', new URLSearchParams(window.location.search).get('id'));
    console.log('======================================');
    
    // Test database connection on page load
    (async function() {
        console.log('Testing database connection...');
        try {
            const result = await testDatabaseConnection();
            console.log('Database connection test result:', result);
        } catch (err) {
            console.error('Error testing database connection:', err);
        }
    })();
    
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
    
    // Track active subscriptions
    let activeSubscription = null;
    
    // Track current submission ID - get from URL param only, no localStorage
    const urlParams = new URLSearchParams(window.location.search);
    let currentSubmissionId = urlParams.get('id') || null;

    console.log('DEBUG - URL Parameters:', {
        id: urlParams.get('id'),
        env: urlParams.get('env'),
        allParams: Object.fromEntries(urlParams.entries()),
        currentSubmissionId,
        isDevelopmentMode
    });
    
    // Show dev mode banner if needed
    if (isDevelopmentMode) {
        const devBanner = document.createElement('div');
        devBanner.className = 'dev-mode-banner';
        devBanner.textContent = 'Development Environment';
        document.body.insertBefore(devBanner, document.body.firstChild);
        
        // Add some CSS for the banner
        const style = document.createElement('style');
        style.textContent = `
            .dev-mode-banner {
                background-color: #ff5722;
                color: white;
                text-align: center;
                padding: 5px;
                font-weight: bold;
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                z-index: 1000;
            }
            body {
                margin-top: 30px;
            }
        `;
        document.head.appendChild(style);
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

    // Process multiple topics from a comma-separated string
    function processTopicInput(inputValue) {
        if (!inputValue.trim()) return;
        
        // Check if the input contains commas
        if (inputValue.includes(',')) {
            // Split by comma and process each topic
            const topics = inputValue.split(',');
            
            for (const topic of topics) {
                const cleanTopic = cleanTopicText(topic);
                if (cleanTopic) {
                    createTag(cleanTopic, 'topic', sourcesContainer, topicsContainer);
                }
            }
        } else {
            // Single topic
            const cleanTopic = cleanTopicText(inputValue);
            if (cleanTopic) {
                createTag(cleanTopic, 'topic', sourcesContainer, topicsContainer);
            }
        }
    }

    // Update checkbox states based on selected topics
    function updateCheckboxStates() {
        const checkboxes = document.querySelectorAll('.topic-checkbox input');
        
        // If we have max topics selected, disable all unchecked checkboxes
        const selectedTopics = document.querySelectorAll('.tag[data-type="topic"]').length;
        const isMaxTopics = selectedTopics >= 3;
        
        checkboxes.forEach(checkbox => {
            if (!checkbox.checked) {
                checkbox.disabled = isMaxTopics;
            }
        });
    }

    // Initialize checkboxes for topics
    function initializeCheckboxes() {
        const checkboxes = document.querySelectorAll('.topic-checkbox input');
        
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                if (this.checked) {
                    // Add tag for checked topic
                    createTag(this.value, 'topic', sourcesContainer, topicsContainer);
                } else {
                    // Remove tag for unchecked topic
                    const topicTag = topicsContainer.querySelector(`.tag[data-value="${this.value}"]`);
                    if (topicTag) {
                        topicTag.remove();
                    }
                }
                
                // Update disabled state
                updateCheckboxStates();
            });
        });
        
        // Initial update of checkbox states
        updateCheckboxStates();
    }

    // Function to update the output view with news content
    function updateOutputView() {
        // Check if empty state should be shown
        toggleEmptyState(emptyState, newsContainer);
        
        // For mobile view, scroll to the output section
        if (window.innerWidth <= 768) {
            outputSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    // Function to format news data structure
    function formatNewsData(feed) {
        console.log('DEBUG: formatNewsData - Processing feed:', {
            id: feed.id,
            title: feed.title,
            hasNewsItems: Array.isArray(feed.news_items),
            newsItemsCount: Array.isArray(feed.news_items) ? feed.news_items.length : 0
        });
        
        // Ensure news_items is an array
        const newsItems = Array.isArray(feed.news_items) ? feed.news_items : [];
        
        if (newsItems.length === 0) {
            console.log('DEBUG: formatNewsData - No news items found in feed');
            return [];
        }
        
        // Format each news item with consistent property names
        const formattedItems = newsItems.map(item => {
            return {
                title: item.title || 'No Title',
                content: item.content || 'No content available',
                source: item.source || 'Unknown Source',
                // Fix for source_url handling - avoid duplicate keys
                url: item.source_url || '#',
                sourceUrl: item.source_url || '#',
                category: item.category || 'Uncategorized'
            };
        });
        
        console.log(`DEBUG: formatNewsData - Formatted ${formattedItems.length} news items`);
        return formattedItems;
    }

    // Function to load and display news feeds
    async function loadNewsFeeds() {
        try {
            console.log('DEBUG: loadNewsFeeds - Starting feed loading process');
            
            // Show loading state
            toggleEmptyState(emptyState, newsContainer, true);
            
            // Clear any existing sample data before loading real data
            clearAllSampleFeeds();
            
            // If we have a URL parameter with a specific ID, fetch those feeds
            if (currentSubmissionId) {
                console.log(`DEBUG: loadNewsFeeds - Fetching feeds for submission ID: ${currentSubmissionId}`);
                const feeds = await getFeedsBySubmissionId(currentSubmissionId);
                
                console.log(`DEBUG: loadNewsFeeds - Feeds for submission ${currentSubmissionId} received: ${feeds?.length || 0}`);
                
                if (feeds && feeds.length > 0) {
                    console.log(`DEBUG: loadNewsFeeds - Processing ${feeds.length} feeds for submission ${currentSubmissionId}`);
                    processAndDisplayFeeds(feeds);
                    return;
                } else {
                    // No feeds found for this submission ID
                    console.log(`DEBUG: loadNewsFeeds - No feeds found for submission ${currentSubmissionId}`);
                    updateEmptyStateMessage('Your news feed is being prepared. Check back soon for updates or click "Show Preview" to see an example.');
                    toggleEmptyState(emptyState, newsContainer, true);
                    return;
                }
            }
            
            // No specific ID requested, fetch the latest feeds based on environment
            if (isDevelopmentMode) {
                // In development mode, fetch from dev tables
                console.log('DEBUG: loadNewsFeeds - Development mode: loading all development feeds');
                const feeds = await fetchAllDevFeeds();
                
                console.log(`DEBUG: loadNewsFeeds - Dev feeds received: ${feeds?.length || 0}`);
                
                if (feeds && feeds.length > 0) {
                    console.log(`DEBUG: loadNewsFeeds - Processing ${feeds.length} development feeds`);
                    processAndDisplayFeeds(feeds);
                    return;
                } else {
                    console.log('DEBUG: loadNewsFeeds - No development feeds found');
                    updateEmptyStateMessage('No development feeds found. Run "npm run generate-dev-data" to create test data.');
                    toggleEmptyState(emptyState, newsContainer, true);
                    return;
                }
            } else {
                // In production mode, fetch the latest feeds
                console.log('DEBUG: loadNewsFeeds - Production mode: loading latest feeds');
                const latestFeeds = await fetchLatestFeeds(10);
                
                console.log(`DEBUG: loadNewsFeeds - Latest feeds received: ${latestFeeds?.length || 0}`);
                
                if (latestFeeds && latestFeeds.length > 0) {
                    console.log(`DEBUG: loadNewsFeeds - Processing ${latestFeeds.length} latest feeds`);
                    processAndDisplayFeeds(latestFeeds);
                    return;
                } else {
                    // No latest feeds found, show empty state
                    console.log('DEBUG: loadNewsFeeds - No latest feeds found, showing empty state');
                    updateEmptyStateMessage('No news feeds available at the moment. Please check back later or click "Show Preview" to see an example.');
                    toggleEmptyState(emptyState, newsContainer, true);
                    return;
                }
            }
        } catch (error) {
            console.error('DEBUG: loadNewsFeeds - Error loading news feeds:', error);
            updateEmptyStateMessage('Error loading news feeds. Please try again later or click "Show Preview" to see an example.');
            toggleEmptyState(emptyState, newsContainer, true);
        }
    }

    // Function to process and display feeds in the UI
    function processAndDisplayFeeds(feeds) {
        console.log('DEBUG: processAndDisplayFeeds - Starting to process feeds');
        
        // If we have real feeds (not sample data), clear any sample data first
        if (feeds && feeds.length > 0 && !feeds[0].id.toString().startsWith('sample-')) {
            clearAllSampleFeeds();
            
            // Disable preview button when we have real data
            if (emptyPreviewButton) {
                emptyPreviewButton.disabled = true;
                emptyPreviewButton.classList.add('disabled');
            }
        }
        
        // Clear the container first
        newsContainer.innerHTML = '';
        
        console.log(`DEBUG: processAndDisplayFeeds - Container cleared, processing ${feeds.length} feeds`);
        
        // Sort all feeds by date (newest first) before grouping
        feeds.sort((a, b) => {
            const dateA = new Date(a.date || 0);
            const dateB = new Date(b.date || 0);
            return dateB - dateA; // Descending order (newest first)
        });
        
        // Group feeds by their primary category (derived from news items)
        const groupedFeeds = {};
        
        feeds.forEach(feed => {
            // Process items to determine the primary category for this feed
            const newsItems = Array.isArray(feed.news_items) ? feed.news_items : [];
            
            // Default category if no items or no categories
            let primaryCategory = 'News Summary';
            
            // Get categories from items
            if (newsItems.length > 0) {
                // Count category occurrences
                const categoryCounts = {};
                newsItems.forEach(item => {
                    if (item.category) {
                        categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
                    }
                });
                
                // Find the most frequent category
                let maxCount = 0;
                for (const [category, count] of Object.entries(categoryCounts)) {
                    if (count > maxCount) {
                        maxCount = count;
                        primaryCategory = category;
                    }
                }
            }
            
            // Add to the appropriate category group
            if (!groupedFeeds[primaryCategory]) {
                groupedFeeds[primaryCategory] = [];
            }
            groupedFeeds[primaryCategory].push(feed);
        });
        
        console.log('DEBUG: processAndDisplayFeeds - Feeds grouped by category:', Object.keys(groupedFeeds));
        
        // Apply scrollbar class if we have enough feeds
        if (feeds.length >= 3) {
            newsContainer.classList.add('has-many-feeds');
        } else {
            newsContainer.classList.remove('has-many-feeds');
        }
        
        // Get all categories sorted by the newest feed in each category
        const sortedCategories = Object.keys(groupedFeeds).sort((catA, catB) => {
            const latestFeedA = groupedFeeds[catA][0];
            const latestFeedB = groupedFeeds[catB][0];
            
            const dateA = latestFeedA ? new Date(latestFeedA.date || 0) : new Date(0);
            const dateB = latestFeedB ? new Date(latestFeedB.date || 0) : new Date(0);
            
            return dateB - dateA; // Newest first
        });
        
        console.log('DEBUG: processAndDisplayFeeds - Sorted categories:', sortedCategories);
        
        // Display each category's feeds
        let totalNewsItemsDisplayed = 0;
        
        sortedCategories.forEach(category => {
            // Add each feed to the container (already sorted within category)
            groupedFeeds[category].forEach(feed => {
                const newsItems = formatNewsData(feed);
                console.log(`DEBUG: processAndDisplayFeeds - Feed ${feed.id} has ${newsItems.length} formatted items`);
                
                if (newsItems.length > 0) {
                    // Pass the feed ID and category to the generate function
                    const newsItem = generateNewsItem(newsItems, false, feed.id, category, null, feed.title);
                    newsContainer.appendChild(newsItem);
                    totalNewsItemsDisplayed++;
                }
            });
        });
        
        console.log(`DEBUG: processAndDisplayFeeds - Total news items displayed: ${totalNewsItemsDisplayed}`);
        
        // Update the UI
        updateOutputView();
        
        // Ensure empty state is hidden since we have content
        if (totalNewsItemsDisplayed > 0) {
            console.log('DEBUG: processAndDisplayFeeds - News items displayed, hiding empty state');
            toggleEmptyState(emptyState, newsContainer, false);
        } else {
            console.log('DEBUG: processAndDisplayFeeds - No news items displayed, showing empty state');
            updateEmptyStateMessage('No news items available to display.');
            toggleEmptyState(emptyState, newsContainer, true);
        }
    }

    // Function to handle deleting a news feed
    async function handleDeleteFeed(feedId) {
        try {
            console.log('Handling delete for feed ID:', feedId);
            // Find the feed element before attempting to delete
            const newsItem = document.querySelector(`.news-item[data-feed-id="${feedId}"]`);
            
            // Remove from UI immediately for responsive feel
            if (newsItem && newsItem.parentNode) {
                console.log('Removing feed from UI');
                newsItem.parentNode.removeChild(newsItem);
            }
            
            // Check if this is a sample feed (IDs starting with 'sample-')
            const isSampleFeed = feedId && feedId.toString().startsWith('sample-');
            
            if (!isSampleFeed) {
                // Only delete from database if it's not a sample feed
                const success = await deleteNewsFeed(feedId);
                
                if (success) {
                    console.log('Successfully deleted feed from database');
                    showToast('News feed deleted successfully', 'success');
                } else {
                    console.error('Database deletion failed but UI was updated');
                    showToast('The feed was removed from view but there was an error deleting it from the database', 'error');
                }
            } else {
                console.log('Skipping database deletion for sample feed:', feedId);
                showToast('Sample feed removed', 'success');
            }
            
            // Check if we need to show empty state
            toggleEmptyState(emptyState, newsContainer);
        } catch (error) {
            console.error('Error deleting feed:', error);
            showToast('Failed to delete the news feed. Please try again.', 'error');
        }
    }

    // Function to show loading animation in the news container
    function showLoadingPlaceholder() {
        // Clear any existing content
        newsContainer.innerHTML = '';
        
        // Create loading placeholder
        const loadingPlaceholder = document.createElement('div');
        loadingPlaceholder.className = 'loading-placeholder';
        
        // Add animation and message
        loadingPlaceholder.innerHTML = `
            <div class="loading-animation">
                <div class="loading-circle"></div>
                <div class="loading-circle"></div>
                <div class="loading-circle"></div>
            </div>
            <h3>Preparing Your Feeds</h3>
            <p>We're setting up your personalized news feeds. This may take a few minutes.</p>
        `;
        
        // Add to news container
        newsContainer.appendChild(loadingPlaceholder);
        
        // Show news container and hide empty state
        if (emptyState) {
            emptyState.style.display = 'none';
        }
        newsContainer.style.display = 'flex';
    }

    // Function to process form submission
    async function processFormSubmission() {
        // Collect form data
        const formData = collectFormData(sourcesContainer, topicsContainer, languageSelect, emailInput);
        
        // Validate form data
        const errors = validateFormData(formData);
        
        if (errors.length > 0) {
            // Show errors
            errors.forEach(error => {
                showToast(error, 'error');
            });
            return;
        }
        
        // Show loading state
        showLoadingState(startButton);
        
        try {
            // Generate a new submission ID
            const submissionId = generateSubmissionId();
            
            // Update the URL with the submission ID instead of using localStorage
            currentSubmissionId = submissionId;
            const newUrl = new URL(window.location);
            newUrl.searchParams.set('id', submissionId);
            window.history.pushState({}, '', newUrl);
            
            // Disable preview button while waiting for real data
            if (emptyPreviewButton) {
                emptyPreviewButton.disabled = true;
                emptyPreviewButton.classList.add('disabled');
            }
            
            // Show loading placeholder while waiting for feeds
            showLoadingPlaceholder();
            
            // 1. Save form submission to Supabase
            const submission = await saveFormSubmission(formData, submissionId);
            
            if (!submission) {
                throw new Error('Failed to save form submission to database');
            }
            
            // 2. Send data to webhook
            const webhookResponse = await sendFormDataToWebhook(formData);
            
            if (!webhookResponse) {
                console.warn('Warning: Could not send data to webhook, but database submission was successful');
            }
            
            // Success - show confirmation
            showToast('Your subscription has been created! Check your email for updates.', 'success');
            
            // Scroll to output section and show empty state with explanation
            toggleEmptyState(emptyState, newsContainer);
            outputSection.scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            console.error('Error processing form submission:', error);
            showToast('There was an error creating your subscription. Please try again.', 'error');
        } finally {
            // Hide loading state
            hideLoadingState(startButton);
        }
    }

    // Subscribe to real-time updates
    function setupRealTimeSubscription() {
        // Unsubscribe if we already have a subscription
        if (activeSubscription) {
            activeSubscription.unsubscribe();
        }
        
        console.log('DEBUG: setupRealTimeSubscription - Setting up Realtime subscription');
        
        // Always reload feeds when changes occur, regardless of environment
        activeSubscription = subscribeToNewsFeeds(
            // Handle new feed insertion
            (newFeed) => {
                console.log('DEBUG: Realtime - New feed inserted:', newFeed);
                
                // If we have a specific ID in the URL, only reload if it matches
                if (currentSubmissionId) {
                    if (newFeed.submission_id === currentSubmissionId) {
                        console.log('DEBUG: Realtime - Reloading feeds for matching submission ID');
                        loadNewsFeeds();
                    }
                } else {
                    // No specific ID, always reload feeds
                    console.log('DEBUG: Realtime - Reloading all feeds');
                    loadNewsFeeds();
                }
            },
            // Handle feed deletion
            (deletedFeed) => {
                console.log('DEBUG: Realtime - Feed deleted:', deletedFeed);
                // Find and remove the deleted feed from UI
                const newsItem = document.querySelector(`.news-item[data-feed-id="${deletedFeed.id}"]`);
                if (newsItem && newsItem.parentNode) {
                    newsItem.parentNode.removeChild(newsItem);
                    toggleEmptyState(emptyState, newsContainer);
                }
            }
        );
    }

    // Function to toggle all news feeds (expand/collapse)
    function toggleAllFeeds(expand = false) {
        const newsItems = document.querySelectorAll('.news-item');
        newsItems.forEach(item => {
            const collapseBtn = item.querySelector('.collapse-btn');
            
            if (expand) {
                // Expand all
                item.classList.remove('collapsed');
                if (collapseBtn) {
                    collapseBtn.classList.remove('rotated');
                    collapseBtn.setAttribute('aria-expanded', 'true');
                }
            } else {
                // Collapse all
                item.classList.add('collapsed');
                if (collapseBtn) {
                    collapseBtn.classList.add('rotated');
                    collapseBtn.setAttribute('aria-expanded', 'false');
                }
            }
        });
    }

    // Add event listeners

    // Add event listeners for source input
    sourceInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const value = sourceInput.value.trim();
            
            if (value) {
                createTag(value, 'source', sourcesContainer, topicsContainer);
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
                        createTag(cleanSource, 'source', sourcesContainer, topicsContainer);
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

    // Real-time email validation
    emailInput.addEventListener('input', debounce(function() {
        const email = this.value.trim();
        if (email && !isValidEmail(email)) {
            showFieldError(this, 'Please enter a valid email address');
        } else {
            clearFieldError(this);
        }
    }, 500));

    // Add click handler to close dropdowns when clicking outside
    document.addEventListener('click', function() {
        closeAllDropdowns();
    });

    // Listen for delete feed events
    window.addEventListener('delete-feed', function(e) {
        console.log('Delete feed event received:', e.detail);
        if (e.detail && e.detail.feedId) {
            if (e.detail.isSample) {
                console.log('Skipping handleDeleteFeed for sample data');
                // Already removed from DOM in the component
            } else {
                handleDeleteFeed(e.detail.feedId);
            }
        } else {
            console.error('Delete feed event missing feedId:', e.detail);
        }
    });

    // Handle check empty state event
    window.addEventListener('check-empty-state', function() {
        toggleEmptyState(emptyState, newsContainer);
    });

    // Handle update checkboxes event
    window.addEventListener('update-checkboxes', function() {
        updateCheckboxStates();
    });

    // Handle form submission
    startButton.addEventListener('click', processFormSubmission);

    // Handle preview button click
    emptyPreviewButton.addEventListener('click', async function() {
        // Show loading state on the button
        showLoadingState(emptyPreviewButton);
        emptyPreviewButton.textContent = 'Loading...';
        
        try {
            console.log('Fetching sample categories for preview...');
            // Fetch multiple categories of sample data
            const categoryFeeds = await fetchMultipleCategories();
            console.log('Preview data fetched:', categoryFeeds?.length || 0, 'categories');
            
            // Clear any existing content
            newsContainer.innerHTML = '';
            
            // Always create sample controls container but hide it initially
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'sample-controls';
            buttonContainer.style.display = 'none'; // Hidden by default
            
            // Add clear samples button
            const clearSamplesBtn = document.createElement('button');
            clearSamplesBtn.className = 'clear-samples-btn';
            clearSamplesBtn.textContent = 'Clear All Samples';
            clearSamplesBtn.addEventListener('click', function() {
                clearAllSampleFeeds();
            });
            
            // Add the button to the container
            buttonContainer.appendChild(clearSamplesBtn);
            newsContainer.appendChild(buttonContainer);
            
            if (categoryFeeds && categoryFeeds.length > 0) {
                // Add class to container for better scrolling UI
                newsContainer.classList.add('has-many-feeds');
                
                // Display each category feed
                categoryFeeds.forEach(feed => {
                    console.log(`Processing feed with ${feed.news_items?.length || 0} items`);
                    const newsItems = formatNewsData(feed);
                    if (newsItems.length > 0) {
                        // Determine primary category from items
                        let primaryCategory = 'News Summary';
                        if (newsItems.length > 0) {
                            // Get the first item's category or default
                            primaryCategory = newsItems[0].category || primaryCategory;
                        }
                        
                        // Make sure we mark these as sample data for proper handling
                        const newsItem = generateNewsItem(newsItems, true, feed.id, primaryCategory, feed.date, feed.title);
                        newsContainer.appendChild(newsItem);
                    }
                });
                
                // Randomly select one feed to collapse for demonstration
                const allFeeds = newsContainer.querySelectorAll('.news-item');
                if (allFeeds.length > 0) {
                    const randomIndex = Math.floor(Math.random() * allFeeds.length);
                    const randomFeed = allFeeds[randomIndex];
                    const collapseBtn = randomFeed.querySelector('.collapse-btn');
                    
                    if (collapseBtn) {
                        // Trigger a click on the collapse button to collapse it
                        setTimeout(() => {
                            collapseBtn.click();
                        }, 100);
                    }
                }
                
                // Check if we have sample feeds and show controls if needed
                updateSampleControlsVisibility();
                
                // Hide empty state
                if (emptyState) {
                    emptyState.style.display = 'none';
                }
                
                // Show news container and scrollbar
                newsContainer.style.display = 'flex';
                
                // Show a toast indicating this is sample data
                showToast('Showing sample news feeds. Scroll to see all feeds.', 'success');
            } else {
                // No sample data available
                console.warn('No sample data available for preview');
                showToast('No sample data available. Using fallback preview data.', 'warning');
                
                // Create a single fallback feed if we have no data
                const fallbackFeed = {
                    id: 'fallback-1',
                    date: new Date().toISOString(), // current time
                    news_items: [
                        {
                            id: 'fallback-item-1',
                            title: 'Sample News Item',
                            content: 'This is a fallback sample news item. Your actual news will look better than this.',
                            source: 'example.com',
                            source_url: '#',
                            category: 'Preview'
                        }
                    ]
                };
                
                const newsItems = formatNewsData(fallbackFeed);
                const newsItem = generateNewsItem(newsItems, true, fallbackFeed.id, 'Preview', fallbackFeed.date, fallbackFeed.title);
                
                // Add the fallback item to the container
                newsContainer.appendChild(newsItem);
                
                // Check if we have sample feeds and show controls if needed
                updateSampleControlsVisibility();
                
                // Hide empty state and show news container
                if (emptyState) {
                    emptyState.style.display = 'none';
                }
                newsContainer.style.display = 'flex';
            }
        } catch (error) {
            console.error('Error loading preview:', error);
            showToast('Error loading preview data. Please try again later.', 'error');
            toggleEmptyState(emptyState, newsContainer, true);
        } finally {
            // Reset button state
            hideLoadingState(emptyPreviewButton);
            emptyPreviewButton.textContent = 'Show Preview';
        }
    });

    // Function to check if there are sample feeds on the page
    function hasSampleFeeds() {
        // Look for any news items with sample data
        const sampleItems = document.querySelectorAll('.news-item[data-is-sample="true"]');
        return sampleItems.length > 0;
    }

    // Function to update sample controls visibility
    function updateSampleControlsVisibility() {
        const sampleControls = document.querySelector('.sample-controls');
        
        if (sampleControls) {
            if (hasSampleFeeds()) {
                sampleControls.style.display = 'flex';
            } else {
                sampleControls.style.display = 'none';
            }
        }
    }

    // Function to clear all sample feeds
    function clearAllSampleFeeds() {
        // Find all sample news items
        const sampleItems = document.querySelectorAll('.news-item[data-is-sample="true"]');
        let count = 0;
        
        // Remove each sample item
        sampleItems.forEach(item => {
            if (item.parentNode) {
                item.parentNode.removeChild(item);
                count++;
            }
        });
        
        // Clear the sample controls from the DOM
        const sampleControls = document.querySelector('.sample-controls');
        if (sampleControls && sampleControls.parentNode) {
            sampleControls.parentNode.removeChild(sampleControls);
        }
        
        // Explicitly show the empty state if there's no real data
        if (count > 0 && !document.querySelector('.news-item:not([data-is-sample="true"])')) {
            // Reset displays to show empty state properly
            if (newsContainer) {
                newsContainer.innerHTML = '';
                newsContainer.style.display = 'none';
            }
            
            if (emptyState) {
                emptyState.style.display = 'flex';
            }
            
            // Show success message only if called directly (not as part of loading real data)
            if (count > 0 && arguments.callee.caller !== loadNewsFeeds) {
                showToast(`Cleared ${count} sample feeds`, 'success');
            }
        } else {
            // Only show toast if called directly and there were samples to clear
            if (count > 0 && arguments.callee.caller !== loadNewsFeeds) {
                showToast(`Cleared ${count} sample feeds`, 'success');
            }
        }
    }

    // Function to update empty state message based on context
    function updateEmptyStateMessage(message) {
        if (emptyState) {
            const messageElement = document.querySelector('.empty-state-message');
            if (messageElement) {
                if (message) {
                    // Use provided message if available
                    messageElement.textContent = message;
                } else if (currentSubmissionId) {
                    // Default message for when submission ID exists
                    messageElement.textContent = 'Your news feed is being prepared. Check back soon for updates.';
                    
                    // Disable preview button when waiting for real data with a submission ID
                    if (emptyPreviewButton) {
                        emptyPreviewButton.disabled = true;
                        emptyPreviewButton.classList.add('disabled');
                    }
                } else {
                    // Default message for root URL with no submission ID
                    messageElement.textContent = 'No news feeds available at the moment. Please check back later or click "Show Preview" to see an example.';
                    
                    // Enable preview button when no submission ID exists
                    if (emptyPreviewButton) {
                        emptyPreviewButton.disabled = false;
                        emptyPreviewButton.classList.remove('disabled');
                    }
                }
            }
        }
    }

    // Initialize the app
    function init() {
        setupAccessibilityAnnouncements();
        setupTagKeyboardNavigation();
        initializeCheckboxes();
        
        // Add global click listener to close all dropdowns when clicking outside
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.news-menu-btn')) {
                closeAllDropdowns();
            }
        });
        
        // Listen for delete feed events
        window.addEventListener('delete-feed', function(e) {
            console.log('Delete feed event received:', e.detail);
            if (e.detail && e.detail.feedId) {
                if (e.detail.isSample) {
                    console.log('Skipping handleDeleteFeed for sample data');
                    // Already removed from DOM in the component
                } else {
                    handleDeleteFeed(e.detail.feedId);
                }
            } else {
                console.error('Delete feed event missing feedId:', e.detail);
            }
        });
        
        // Listen for empty state check events
        window.addEventListener('check-empty-state', function() {
            toggleEmptyState(emptyState, newsContainer);
        });
        
        // Listen for checkbox update events
        window.addEventListener('update-checkboxes', function() {
            updateCheckboxStates();
        });
        
        // Add expand/collapse all button to output header
        const outputHeader = document.querySelector('.output-container .header');
        if (outputHeader) {
            const actionButtons = document.createElement('div');
            actionButtons.className = 'feed-actions';
            
            // Expand all button
            const expandAllBtn = document.createElement('button');
            expandAllBtn.className = 'feed-action-btn';
            expandAllBtn.textContent = 'Expand All';
            expandAllBtn.addEventListener('click', () => toggleAllFeeds(true));
            
            // Collapse all button
            const collapseAllBtn = document.createElement('button');
            collapseAllBtn.className = 'feed-action-btn';
            collapseAllBtn.textContent = 'Collapse All';
            collapseAllBtn.addEventListener('click', () => toggleAllFeeds(false));
            
            actionButtons.appendChild(expandAllBtn);
            actionButtons.appendChild(collapseAllBtn);
            outputHeader.appendChild(actionButtons);
        }
        
        // Setup source input
        if (sourceInput) {
            // Add enter key listener to create tags
            sourceInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.keyCode === 13) {
                    e.preventDefault();
                    
                    const value = this.value.trim();
                    if (value) {
                        createTag(value, 'source', sourcesContainer, topicsContainer);
                        this.value = '';
                    }
                }
            });
        }
        
        // Initial loading of news feeds
        console.log('DEBUG: init - Loading initial feeds');
        loadNewsFeeds();

        // Setup real-time subscription for updates regardless of submission ID
        console.log('DEBUG: init - Setting up real-time subscription');
        setupRealTimeSubscription();
    }
    
    // Start the app
    init();
}); 