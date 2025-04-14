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
  return uuidv4();
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
    console.log('Saving form submission with data:', {
      email: formData.email,
      sources_count: formData.sources?.length || 0,
      topics_count: formData.topics?.length || 0,
      language: formData.language,
      date: formData.date
    });
    
    const tableName = getTableName('form_submissions');
    console.log('Using table:', tableName);
    
    // Set up payload with all required fields
    const payload = {
      email: formData.email,
      sources: formData.sources || [],
      topics: formData.topics || [],
      language: formData.language || '',
      date: formData.date || new Date().toISOString().split('T')[0] // Fallback to today if not provided
    };
    
    console.log('Insert payload:', payload);
    
    const { data, error } = await supabase
      .from(tableName)
      .insert(payload)
      .select();
    
    if (error) {
      console.error('Supabase error saving form submission:', error);
      throw error;
    }
    
    console.log('Form submission saved successfully:', data);
    return data;
  } catch (error) {
    console.error('Error saving form submission:', error);
    return null;
  }
}

/**
 * Get feeds by form submission ID
 * @param {string} formSubmissionId - The form submission database ID to fetch feeds for
 * @returns {Promise<Array>} - Array of feeds matching the form submission ID
 */
export async function getFeedsBySubmissionId(formSubmissionId) {
  try {
    console.log('Fetching feeds for form submission ID:', formSubmissionId);
    
    // Handle legacy format IDs (with sub- prefix)
    if (formSubmissionId && formSubmissionId.startsWith('sub-')) {
      console.warn('Legacy submission ID format detected. Please update your code to use UUID format.');
      
      // Query by submission_id for backward compatibility
      console.log('Falling back to legacy query by submission_id');
      
      const { data: legacyData, error: legacyError } = await supabase
        .from(getTableName('news_feeds'))
        .select(`
          id,
          form_submission_id,
          title,
          date,
          ${getTableName('news_items')} (
            id,
            title,
            content,
            source,
            source_url,
            category,
            summary
          )
        `)
        .eq('submission_id', formSubmissionId)
        .order('date', { ascending: false });
      
      if (legacyError) {
        console.error('Error fetching feeds with legacy ID:', legacyError);
      } else if (legacyData && legacyData.length > 0) {
        console.log('Successfully retrieved feeds using legacy submission_id');
        
        // Process and return the data
        const feedsWithCategory = legacyData.map(feed => {
          const itemsKey = getTableName('news_items');
          const newsItems = feed[itemsKey] || [];
          let primaryCategory = 'News Summary';
          
          if (newsItems.length > 0) {
            primaryCategory = newsItems[0].category || primaryCategory;
          }
          
          return {
            ...feed,
            news_items: newsItems,
            category: primaryCategory
          };
        });
        
        return feedsWithCategory;
      }
      
      // If we reach here, either there was an error or no feeds found with legacy ID
      console.log('No feeds found with legacy ID format, will try UUID format');
    }
    
    console.log('Using table:', getTableName('news_feeds'));
    
    // Standard query using form_submission_id (UUID format)
    const { data, error } = await supabase
      .from(getTableName('news_feeds'))
      .select(`
        id,
        form_submission_id,
        title,
        date,
        ${getTableName('news_items')} (
          id,
          title,
          content,
          source,
          source_url,
          category,
          summary
        )
      `)
      .eq('form_submission_id', formSubmissionId)
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
 * @param {string} id - The database ID to fetch
 * @returns {Promise<Object|null>} - The submission or null
 */
export async function getFormSubmission(id) {
  try {
    const { data, error } = await supabase
      .from(getTableName('form_submissions'))
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "No rows returned" error
    return data || null;
  } catch (error) {
    console.error('Error fetching form submission:', error);
    return null;
  }
} 