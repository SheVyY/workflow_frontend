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
 * Fetch sample data for multiple categories to demonstrate the UI
 * @returns {Promise<Array>} - Array of feed objects with different categories
 */
export async function fetchMultipleCategories() {
  try {
    // First try to get sample data from Supabase
    const supabaseData = await supabaseService.fetchSampleCategories();
    
    // If we have data from Supabase, use it
    if (supabaseData && supabaseData.length > 0) {
      console.log('Using sample data from Supabase');
      return supabaseData;
    }
    
    // Fall back to local data if Supabase didn't return anything
    console.log('Supabase sample data not available, using local sample data');
    
    // Get current date to generate sample dates
    const now = new Date();
    
    // Create sample data with multiple categories that match the checkbox options exactly
    const categories = [
      {
        id: 'sample-1',
        category: 'Technology',
        date: new Date(now.getTime() - 10 * 60000).toISOString(), // 10 minutes ago
        news_items: [
          {
            id: 'item-1',
            title: 'AI Revolution Continues',
            content: 'Latest AI models demonstrate unprecedented capabilities in reasoning and code generation.',
            source: 'techdaily.com',
            source_url: '#'
          },
          {
            id: 'item-2',
            title: 'New Chip Architecture',
            content: 'Semiconductor companies unveil next-gen chip designs with 30% better energy efficiency.',
            source: 'chipweekly.com',
            source_url: '#'
          }
        ]
      },
      {
        id: 'sample-2',
        category: 'Finance',
        date: new Date(now.getTime() - 35 * 60000).toISOString(), // 35 minutes ago
        news_items: [
          {
            id: 'item-3',
            title: 'Fed Signals Rate Changes',
            content: 'Federal Reserve hints at potential rate adjustments in response to cooling inflation data.',
            source: 'marketwatch.com',
            source_url: '#'
          },
          {
            id: 'item-4',
            title: 'Tech Stock Rebound',
            content: 'Technology sector shows signs of recovery after months of volatility.',
            source: 'investors.com',
            source_url: '#'
          }
        ]
      },
      {
        id: 'sample-3',
        category: 'Business', 
        date: new Date(now.getTime() - 2 * 3600000).toISOString(), // 2 hours ago
        news_items: [
          {
            id: 'item-5',
            title: 'Renewable Energy Expansion',
            content: 'Global investment in renewable energy reached record levels last quarter, with solar leading growth.',
            source: 'energymonitor.com',
            source_url: '#'
          },
          {
            id: 'item-6',
            title: 'Supply Chain Resilience',
            content: 'New logistics technologies help businesses overcome persistent supply chain challenges.',
            source: 'supplychainreview.com',
            source_url: '#'
          },
          {
            id: 'item-7',
            title: 'Manufacturing Automation Trends',
            content: 'Factory automation adoption accelerates as labor markets remain tight across developed economies.',
            source: 'manufacturing.com',
            source_url: '#'
          },
          {
            id: 'item-8',
            title: 'Electric Vehicle Market Shifts',
            content: 'Price competition intensifies in EV market as new entrants challenge established manufacturers.',
            source: 'autointelligence.com',
            source_url: '#'
          },
          {
            id: 'item-9',
            title: 'Global Trade Agreement Impact',
            content: 'Recent trade agreements between APAC nations expected to boost regional commerce by 15%.',
            source: 'trademonitor.org',
            source_url: '#'
          },
          {
            id: 'item-10',
            title: 'Pharmaceutical Innovation Pipeline',
            content: 'Major pharma companies report promising results in late-stage clinical trials for breakthrough treatments.',
            source: 'healthindustries.com',
            source_url: '#'
          }
        ]
      },
      {
        id: 'sample-4',
        category: 'World News',
        date: new Date(now.getTime() - 4 * 3600000).toISOString(), // 4 hours ago
        news_items: [
          {
            id: 'item-11',
            title: 'Diplomatic Relations Improve',
            content: 'Key nations announce new diplomatic framework to address regional security concerns.',
            source: 'globaltimes.com',
            source_url: '#'
          },
          {
            id: 'item-12',
            title: 'Climate Agreement Progress',
            content: 'International climate accord gains momentum as additional countries pledge support.',
            source: 'worldnews.com',
            source_url: '#'
          }
        ]
      },
      {
        id: 'sample-5',
        category: 'Environment',
        date: new Date(now.getTime() - 12 * 3600000).toISOString(), // 12 hours ago
        news_items: [
          {
            id: 'item-13',
            title: 'Ocean Conservation Breakthrough',
            content: 'New marine protection areas established across critical habitats in the Pacific.',
            source: 'ecowatch.org',
            source_url: '#'
          },
          {
            id: 'item-14',
            title: 'Sustainable Energy Milestone',
            content: 'Renewable energy sources account for over 40% of electricity generation in key markets.',
            source: 'greenmonitor.com',
            source_url: '#'
          }
        ]
      }
    ];
    
    return categories;
  } catch (error) {
    console.error('Error fetching multiple categories:', error);
    // Return empty array on error
    return [];
  }
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
  // If using mock mode and we don't have actual data yet, return sample data
  const useMock = import.meta.env.VITE_USE_MOCK === 'true';
  
  if (useMock) {
    try {
      // Try getting real data first
      const realData = await formSupabaseService.getFeedsBySubmissionId(submissionId);
      if (realData && realData.length > 0) {
        return realData;
      }
      
      // If no real data, return mock data with multiple categories
      return await fetchMultipleCategories();
    } catch (error) {
      console.log('Falling back to mock data due to error:', error);
      return await fetchMultipleCategories();
    }
  }
  
  // Otherwise use real data from Supabase
  return formSupabaseService.getFeedsBySubmissionId(submissionId);
} 