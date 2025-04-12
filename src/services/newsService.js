import supabase from './supabase.js';

/**
 * News Feed Service
 * Handles all interactions with the news_feeds and news_items tables in Supabase
 */

// Helper function to get correct table name based on environment
function getTableName(baseTable) {
  // Check for environment query parameter
  const urlParams = new URLSearchParams(window.location.search);
  const env = urlParams.get('env');
  
  // If dev environment, use dev_ prefix
  return env === 'dev' ? `dev_${baseTable}` : baseTable;
}

/**
 * Fetch all news feeds
 * @returns {Promise<Array>} - Array of news feeds
 */
export async function fetchNewsFeeds() {
  try {
    const { data, error } = await supabase
      .from(getTableName('news_feeds'))
      .select(`
        id,
        date,
        title,
        ${getTableName('news_items')} (
          id,
          title,
          content,
          source,
          source_url,
          category
        )
      `)
      .order('date', { ascending: false });
    
    if (error) throw error;
    
    // Fix for dev table names - ensure consistent news_items property
    const formattedData = data.map(feed => {
      return {
        ...feed,
        news_items: feed[getTableName('news_items')] || []
      };
    });
    
    return formattedData || [];
  } catch (error) {
    console.error('Error fetching news feeds:', error);
    return [];
  }
}

/**
 * Delete a news feed
 * @param {string} feedId - ID of the feed to delete
 * @returns {Promise<boolean>} - Success status
 */
export async function deleteNewsFeed(feedId) {
  try {
    const { error } = await supabase
      .from(getTableName('news_feeds'))
      .delete()
      .eq('id', feedId);
    
    if (error) throw error;
    
    // If we've reached this point, the deletion was successful
    return true;
  } catch (error) {
    console.error('Error deleting news feed:', error);
    return false;
  }
}

/**
 * Subscribe to real-time changes for news feeds
 * @param {Function} onInsert - Callback when a new feed is inserted
 * @param {Function} onDelete - Callback when a feed is deleted
 * @returns {Object} - Subscription object with unsubscribe method
 */
export function subscribeToNewsFeeds(onInsert, onDelete) {
  const tableName = getTableName('news_feeds');
  
  const subscription = supabase
    .channel(`public:${tableName}`)
    .on('INSERT', payload => {
      onInsert(payload.new);
    })
    .on('DELETE', payload => {
      onDelete(payload.old);
    })
    .subscribe();
  
  return subscription;
}

/**
 * Get the latest news feed
 * @returns {Promise<Object|null>} - The latest news feed or null
 */
export async function getLatestNewsFeed() {
  try {
    const { data, error } = await supabase
      .from(getTableName('news_feeds'))
      .select(`
        id,
        date,
        title,
        ${getTableName('news_items')} (
          id,
          title,
          content,
          source,
          source_url,
          category
        )
      `)
      .order('date', { ascending: false })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "No rows returned" error
    
    // Fix for dev table names
    if (data) {
      const itemsKey = getTableName('news_items');
      data.news_items = data[itemsKey] || [];
    }
    
    return data || null;
  } catch (error) {
    console.error('Error fetching latest news feed:', error);
    return null;
  }
}

/**
 * Fetch sample news data for preview
 * @returns {Promise<Array>} - Array of formatted news items
 */
export async function fetchSampleNewsData() {
  try {
    // Try to get the sample news feed from Supabase (using a known test submission ID)
    const { data, error } = await supabase
      .from(getTableName('news_feeds'))
      .select(`
        id,
        ${getTableName('news_items')} (
          id,
          title,
          content,
          source,
          source_url
        )
      `)
      .eq('submission_id', 'test-submission-1')
      .limit(1)
      .single();
    
    if (error) {
      console.warn('Could not fetch sample data from Supabase:', error);
      return [];
    }
    
    // Format the data for display
    const itemsKey = getTableName('news_items');
    if (data && data[itemsKey] && data[itemsKey].length > 0) {
      return data[itemsKey].map(item => ({
        title: item.title,
        content: item.content,
        url: item.source_url || '#',
        source: item.source
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching sample news data:', error);
    return [];
  }
}

/**
 * Fetch sample category data for preview from Supabase
 * @returns {Promise<Array>} - Array of categories with news items for preview
 */
export async function fetchSampleCategories() {
  try {
    // Check if we have a sample_categories table in Supabase
    const { data, error } = await supabase
      .from(getTableName('sample_categories'))
      .select(`
        id,
        category,
        ${getTableName('news_items')} (
          id,
          title,
          content,
          source,
          source_url,
          category
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.warn('Could not fetch sample categories from Supabase:', error);
      // Try the sample_news_feeds table as an alternative
      const { data: feedsData, error: feedsError } = await supabase
        .from(getTableName('sample_news_feeds'))
        .select(`
          id,
          category,
          ${getTableName('news_items')} (
            id,
            title,
            content,
            source,
            source_url,
            category
          )
        `)
        .order('created_at', { ascending: false });
      
      if (feedsError) {
        console.warn('Could not fetch sample_news_feeds either:', feedsError);
        return [];
      }
      
      // Fix for dev table names
      const itemsKey = getTableName('news_items');
      const formattedData = feedsData.map(feed => {
        return {
          ...feed,
          news_items: feed[itemsKey] || []
        };
      });
      
      return formattedData || [];
    }
    
    // Fix for dev table names
    const itemsKey = getTableName('news_items');
    const formattedData = data.map(category => {
      return {
        ...category,
        news_items: category[itemsKey] || []
      };
    });
    
    return formattedData || [];
  } catch (error) {
    console.error('Error fetching sample categories:', error);
    return [];
  }
} 