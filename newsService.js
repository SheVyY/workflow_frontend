import supabase from './supabase';

/**
 * News Feed Service
 * Handles all interactions with the news_feeds and news_items tables in Supabase
 */

/**
 * Fetch all news feeds for a specific user
 * @param {string} userId - The user's ID
 * @returns {Promise<Array>} - Array of news feeds
 */
export async function fetchNewsFeeds(userId) {
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
      .eq('user_id', userId)
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
 * Subscribe to real-time changes for a user's news feeds
 * @param {string} userId - The user's ID
 * @param {Function} onInsert - Callback when a new feed is inserted
 * @param {Function} onDelete - Callback when a feed is deleted
 * @returns {Object} - Subscription object with unsubscribe method
 */
export function subscribeToNewsFeeds(userId, onInsert, onDelete) {
  const subscription = supabase
    .channel('public:news_feeds')
    .on('INSERT', payload => {
      if (payload.new.user_id === userId) {
        onInsert(payload.new);
      }
    })
    .on('DELETE', payload => {
      if (payload.old.user_id === userId) {
        onDelete(payload.old);
      }
    })
    .subscribe();
  
  return subscription;
}

/**
 * Get the latest news feed for a user
 * @param {string} userId - The user's ID
 * @returns {Promise<Object|null>} - The latest news feed or null
 */
export async function getLatestNewsFeed(userId) {
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
      .eq('user_id', userId)
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