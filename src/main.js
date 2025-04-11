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
    getFeedsBySubmissionId 
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
    
    // Track active subscriptions
    let activeSubscription = null;
    
    // Track current submission ID
    let currentSubmissionId = localStorage.getItem('submissionId') || null;

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

    // Function to format news data from Supabase into the format needed for display
    function formatNewsData(feedData) {
        if (!feedData || !feedData.news_items || !feedData.news_items.length) {
            return [];
        }
        
        return feedData.news_items.map(item => ({
            title: item.title,
            content: item.content,
            url: item.source_url || '#',
            source: item.source
        }));
    }

    // Function to load and display news feeds for the current submission
    async function loadNewsFeeds() {
        try {
            // Show loading state
            toggleEmptyState(emptyState, newsContainer);
            
            // If we have a submission ID, fetch feeds for it
            if (currentSubmissionId) {
                const feeds = await getFeedsBySubmissionId(currentSubmissionId);
                
                if (feeds && feeds.length > 0) {
                    // Clear the container first
                    newsContainer.innerHTML = '';
                    
                    // Sort all feeds by date (newest first) before grouping
                    feeds.sort((a, b) => {
                        const dateA = new Date(a.date || 0);
                        const dateB = new Date(b.date || 0);
                        return dateB - dateA; // Descending order (newest first)
                    });
                    
                    // Group feeds by category after sorting
                    const groupedFeeds = {};
                    
                    feeds.forEach(feed => {
                        const category = feed.category || 'News Summary';
                        if (!groupedFeeds[category]) {
                            groupedFeeds[category] = [];
                        }
                        groupedFeeds[category].push(feed);
                    });
                    
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
                    
                    // Display each category's feeds
                    sortedCategories.forEach(category => {
                        // Add each feed to the container (already sorted within category)
                        groupedFeeds[category].forEach(feed => {
                            const newsItems = formatNewsData(feed);
                            if (newsItems.length > 0) {
                                // Pass the feed ID and category to the generate function
                                const newsItem = generateNewsItem(newsItems, false, feed.id, category);
                                newsContainer.appendChild(newsItem);
                            }
                        });
                    });
                    
                    // Update the UI
                    updateOutputView();
                } else {
                    // No feeds found for this submission ID
                    if (emptyState) {
                        const message = document.querySelector('.empty-state-message');
                        if (message) {
                            message.textContent = 'Your news feed is being prepared. Check back soon for updates or click "Show Preview" to see an example.';
                        }
                    }
                    toggleEmptyState(emptyState, newsContainer);
                }
            } else {
                // No submission ID, show empty state
                toggleEmptyState(emptyState, newsContainer);
            }
        } catch (error) {
            console.error('Error loading news feeds:', error);
            toggleEmptyState(emptyState, newsContainer);
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
            
            // Save current submission ID to localStorage
            localStorage.setItem('submissionId', submissionId);
            currentSubmissionId = submissionId;
            
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
        
        // Subscribe to feed changes
        activeSubscription = subscribeToNewsFeeds(
            // Handle new feed insertion
            (newFeed) => {
                // Reload the feeds to show the latest
                loadNewsFeeds();
            },
            // Handle feed deletion
            (deletedFeed) => {
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
            
            if (categoryFeeds && categoryFeeds.length > 0) {
                // Add class to container for better scrolling UI
                newsContainer.classList.add('has-many-feeds');
                
                // Display each category feed
                categoryFeeds.forEach(feed => {
                    console.log(`Processing ${feed.category} feed with ${feed.news_items?.length || 0} items`);
                    const newsItems = formatNewsData(feed);
                    if (newsItems.length > 0) {
                        // Make sure we mark these as sample data for proper handling
                        const newsItem = generateNewsItem(newsItems, true, feed.id, feed.category);
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
                    category: 'Preview',
                    news_items: [
                        {
                            id: 'fallback-item-1',
                            title: 'Sample News Item',
                            content: 'This is a fallback sample news item. Your actual news will look better than this.',
                            source: 'example.com',
                            source_url: '#'
                        }
                    ]
                };
                
                const newsItems = formatNewsData(fallbackFeed);
                const newsItem = generateNewsItem(newsItems, true, fallbackFeed.id, fallbackFeed.category);
                
                // Clear any existing content
                newsContainer.innerHTML = '';
                newsContainer.appendChild(newsItem);
                
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
        
        // Initial loading of news feeds if submission exists
        if (currentSubmissionId) {
            loadNewsFeeds();
            
            // Setup real-time subscription for updates
            setupRealTimeSubscription();
        } else {
            toggleEmptyState(emptyState, newsContainer, true);
        }
    }
    
    // Start the app
    init();
}); 