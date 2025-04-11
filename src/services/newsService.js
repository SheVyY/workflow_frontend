import supabase from './supabase.js';

/**
 * News Feed Service
 * Handles all interactions with the news_feeds and news_items tables in Supabase
 */

/**
 * Fetch all news feeds
 * @returns {Promise<Array>} - Array of news feeds
 */
export async function fetchNewsFeeds() {
  try {
    const { data, error } = await supabase
      .from('news_feeds')
      .select(`
        id,
        date,
        title,
        news_items (
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
    return data || [];
  } catch (error) {
    console.error('Error fetching news feeds:', error);
    return [];
  }
}

/**
 * Delete a news feed and all its items
 * @param {string} feedId - The feed ID to delete
 * @returns {Promise<boolean>} - Success status
 */
export async function deleteNewsFeed(feedId) {
  try {
    // First delete the related news items
    const { error: itemsError } = await supabase
      .from('news_items')
      .delete()
      .eq('feed_id', feedId);
    
    if (itemsError) throw itemsError;
    
    // Then delete the feed itself
    const { error: feedError } = await supabase
      .from('news_feeds')
      .delete()
      .eq('id', feedId);
    
    if (feedError) throw feedError;
    
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
  const subscription = supabase
    .channel('public:news_feeds')
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
      .from('news_feeds')
      .select(`
        id,
        date,
        title,
        news_items (
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
      .from('news_feeds')
      .select(`
        id,
        news_items (
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
    if (data && data.news_items && data.news_items.length > 0) {
      return data.news_items.map(item => ({
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