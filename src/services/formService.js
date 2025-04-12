import supabase from './supabase.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Form Service
 * Handles form submissions and connects them to news feeds
 */

/**
 * Generate a submission ID for tracking
 * @returns {string} - Unique submission ID
 */
export function generateSubmissionId() {
  return `sub-${uuidv4()}`;
}

// Helper function to get correct table name based on environment
function getTableName(baseTable) {
  // Check if running on localhost
  const isLocalhost = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1';
  
  // Check for environment query parameter
  const urlParams = new URLSearchParams(window.location.search);
  const env = urlParams.get('env');
  
  // Determine which table to use
  const useDevTable = (env === 'dev' || isLocalhost);
  const tableName = useDevTable ? `dev_${baseTable}` : baseTable;
  
  // Log table selection (only in development for debugging)
  if (isLocalhost) {
    console.log(`Table selection: ${baseTable} → ${tableName}`, {
      isLocalhost,
      hostname: window.location.hostname,
      envParam: env,
      useDevTable
    });
  }
  
  return tableName;
}

/**
 * Save form submission
 * @param {Object} formData - Form data to save
 * @returns {Promise<Object|null>} - Saved form submission or null
 */
export async function saveFormSubmission(formData) {
  try {
    const { data, error } = await supabase
      .from(getTableName('form_submissions'))
      .insert({
        submission_id: formData.submissionId,
        email: formData.email,
        sources: formData.sources || [],
        topics: formData.topics || [],
        languages: formData.languages || []
      })
      .select();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving form submission:', error);
    return null;
  }
}

/**
 * Get feeds by submission ID
 * @param {string} submissionId - The submission ID to fetch feeds for
 * @returns {Promise<Array>} - Array of feeds matching the submission ID
 */
export async function getFeedsBySubmissionId(submissionId) {
  try {
    console.log('Fetching feeds for submission ID:', submissionId);
    console.log('Using table:', getTableName('news_feeds'));
    
    const { data, error } = await supabase
      .from(getTableName('news_feeds'))
      .select(`
        id,
        submission_id,
        title,
        date,
        ${getTableName('news_items')} (
          id,
          title,
          content,
          source,
          source_url,
          category
        )
      `)
      .eq('submission_id', submissionId)
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Error fetching feeds:', error);
      throw error;
    }
    
    console.log('Feeds data received:', data);
    
    // Group feeds by category if needed
    const feedsWithCategory = data.map(feed => {
      const itemsKey = getTableName('news_items');
      console.log('Item Key:', itemsKey, 'Feed contains keys:', Object.keys(feed));
      
      // Get news items
      const newsItems = feed[itemsKey] || [];
      
      // Determine primary category from items
      let primaryCategory = 'News Summary';
      
      if (newsItems.length > 0) {
        // Use the first item's category if available
        primaryCategory = newsItems[0].category || primaryCategory;
      }
      
      return {
        ...feed,
        // Fix for dev tables - rename the nested items property to news_items
        news_items: newsItems,
        // Derive category from news items
        category: primaryCategory
      };
    });
    
    console.log('Processed feeds:', feedsWithCategory);
    return feedsWithCategory || [];
  } catch (error) {
    console.error('Error fetching feeds by submission ID:', error);
    return [];
  }
}

/**
 * Get form submission by ID
 * @param {string} submissionId - The submission ID to fetch
 * @returns {Promise<Object|null>} - The submission or null
 */
export async function getFormSubmission(submissionId) {
  try {
    const { data, error } = await supabase
      .from(getTableName('form_submissions'))
      .select('*')
      .eq('submission_id', submissionId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "No rows returned" error
    return data || null;
  } catch (error) {
    console.error('Error fetching form submission:', error);
    return null;
  }
} 