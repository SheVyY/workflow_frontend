/**
 * NewsItem Component
 * Renders a single news item with all its stories
 */

// Function to get formatted date for display (e.g., "April 11, 8AM")
function getFormattedDate() {
    const now = new Date();
    const options = { month: 'long', day: 'numeric' };
    const dateString = now.toLocaleDateString('en-US', options);
    return `${dateString}, 8AM`;
}

// Function to create a dropdown menu for the three dots
function createDropdownMenu(feedId) {
    const dropdown = document.createElement('div');
    dropdown.className = 'news-menu-dropdown';
    
    const menu = document.createElement('ul');
    
    const deleteItem = document.createElement('li');
    deleteItem.className = 'delete';
    deleteItem.textContent = 'Delete news feed';
    deleteItem.addEventListener('click', function(e) {
        e.stopPropagation();
        const newsItem = this.closest('.news-item');
        
        if (newsItem) {
            // If we have a feed ID stored, use the API to delete it
            if (newsItem.dataset.feedId) {
                window.dispatchEvent(new CustomEvent('delete-feed', { 
                    detail: { feedId: newsItem.dataset.feedId } 
                }));
            } else {
                // For sample data just remove from DOM
                if (newsItem.parentNode) {
                    newsItem.parentNode.removeChild(newsItem);
                }
            }
            
            closeAllDropdowns(); // Close dropdown after action
            
            // Dispatch event to check empty state
            window.dispatchEvent(new CustomEvent('check-empty-state'));
        }
    });
    
    menu.appendChild(deleteItem);
    dropdown.appendChild(menu);
    
    return dropdown;
}

// Function to close all open dropdown menus
export function closeAllDropdowns() {
    const dropdowns = document.querySelectorAll('.news-menu-dropdown.show');
    dropdowns.forEach(dropdown => {
        dropdown.classList.remove('show');
    });
}

// Function to generate news item with dynamic data
export function generateNewsItem(newsData, isSampleData = true, feedId = null) {
    // Create news item container
    const newsItem = document.createElement('div');
    newsItem.className = 'news-item';
    
    // If we have a feed ID, store it for deletion
    if (feedId) {
        newsItem.dataset.feedId = feedId;
    }
    
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
    const dropdown = createDropdownMenu(feedId);
    
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