/**
 * Data Service Provider
 * Provides a unified interface for data operations using Supabase
 */

import * as supabaseService from './newsService.js';
import * as formSupabaseService from './formService.js';

console.log('Initializing Supabase data service');

/**
 * Fetch all news feeds
 * @returns {Promise<Array>} - Array of news feeds
 */
export async function fetchNewsFeeds() {
  return supabaseService.fetchNewsFeeds();
}

/**
 * Delete a news feed and all its items
 * @param {string} feedId - The feed ID to delete
 * @returns {Promise<boolean>} - Success status
 */
export async function deleteNewsFeed(feedId) {
  return supabaseService.deleteNewsFeed(feedId);
}

/**
 * Subscribe to real-time changes for news feeds
 * @param {Function} onInsert - Callback when a new feed is inserted
 * @param {Function} onDelete - Callback when a feed is deleted
 * @returns {Object} - Subscription object with unsubscribe method
 */
export function subscribeToNewsFeeds(onInsert, onDelete) {
  return supabaseService.subscribeToNewsFeeds(onInsert, onDelete);
}

/**
 * Get the latest news feed
 * @returns {Promise<Object|null>} - The latest news feed or null
 */
export async function getLatestNewsFeed() {
  return supabaseService.getLatestNewsFeed();
}

/**
 * Fetch sample news data for preview
 * @returns {Promise<Array>} - Array of formatted news items
 */
export async function fetchSampleNewsData() {
  return supabaseService.fetchSampleNewsData();
}

/**
 * Generate a submission ID for tracking
 * @returns {string} - Unique submission ID
 */
export function generateSubmissionId() {
  return formSupabaseService.generateSubmissionId();
}

/**
 * Save form submission to database
 * @param {Object} formData - Form data from the form
 * @param {string} submissionId - Unique ID for this submission
 * @returns {Promise<Object|null>} - The created submission or null
 */
export async function saveFormSubmission(formData, submissionId) {
  return formSupabaseService.saveFormSubmission(formData, submissionId);
}

/**
 * Get feeds by submission ID
 * @param {string} submissionId - The submission ID to fetch feeds for
 * @returns {Promise<Array>} - Array of feeds matching the submission ID
 */
export async function getFeedsBySubmissionId(submissionId) {
  return formSupabaseService.getFeedsBySubmissionId(submissionId);
} 