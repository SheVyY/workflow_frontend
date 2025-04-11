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

/**
 * Save form submission to Supabase
 * @param {Object} formData - Form data from the form
 * @param {string} submissionId - Unique ID for this submission
 * @returns {Promise<Object|null>} - The created submission or null
 */
export async function saveFormSubmission(formData, submissionId) {
  try {
    const { sources, topics, language, email } = formData;
    
    const { data, error } = await supabase
      .from('form_submissions')
      .insert({
        submission_id: submissionId,
        sources: sources,
        topics: topics,
        language: language,
        email: email
      })
      .select()
      .single();
      
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
      .from('news_feeds')
      .select(`
        id,
        submission_id,
        title,
        date,
        news_items (
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
    return data || [];
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
      .from('form_submissions')
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