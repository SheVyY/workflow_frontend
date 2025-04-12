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
  // Check for environment query parameter
  const urlParams = new URLSearchParams(window.location.search);
  const env = urlParams.get('env');
  
  // If dev environment, use dev_ prefix
  return env === 'dev' ? `dev_${baseTable}` : baseTable;
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
    const { data, error } = await supabase
      .from(getTableName('news_feeds'))
      .select(`
        id,
        submission_id,
        title,
        date,
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
      .eq('submission_id', submissionId)
      .order('date', { ascending: false });
    
    if (error) throw error;
    
    // Group feeds by category if needed
    const feedsWithCategory = data.map(feed => {
      return {
        ...feed,
        // Fix for dev tables - rename the nested items property to news_items
        news_items: feed[getTableName('news_items')] || [],
        category: feed.category || 'News Summary' // Default category if not specified
      };
    });
    
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