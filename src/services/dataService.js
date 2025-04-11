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
  // Create sample data with multiple categories
  const categories = [
    {
      id: 'sample-1',
      category: 'Technology News',
      news_items: [
        {
          id: 'item-1',
          title: 'AI Revolution Continues',
          content: 'Latest AI models demonstrate unprecedented capabilities in reasoning and code generation.',
          source: 'TechDaily',
          source_url: '#'
        },
        {
          id: 'item-2',
          title: 'New Chip Architecture',
          content: 'Semiconductor companies unveil next-gen chip designs with 30% better energy efficiency.',
          source: 'ChipWeekly',
          source_url: '#'
        }
      ]
    },
    {
      id: 'sample-2',
      category: 'Financial Markets',
      news_items: [
        {
          id: 'item-3',
          title: 'Fed Signals Rate Changes',
          content: 'Federal Reserve hints at potential rate adjustments in response to cooling inflation data.',
          source: 'MarketWatch',
          source_url: '#'
        },
        {
          id: 'item-4',
          title: 'Tech Stock Rebound',
          content: 'Technology sector shows signs of recovery after months of volatility.',
          source: 'Investors Today',
          source_url: '#'
        }
      ]
    },
    {
      id: 'sample-3',
      category: 'Global Industry Insights', 
      news_items: [
        {
          id: 'item-5',
          title: 'Renewable Energy Expansion',
          content: 'Global investment in renewable energy reached record levels last quarter, with solar leading growth.',
          source: 'Energy Monitor',
          source_url: '#'
        },
        {
          id: 'item-6',
          title: 'Supply Chain Resilience',
          content: 'New logistics technologies help businesses overcome persistent supply chain challenges.',
          source: 'Supply Chain Review',
          source_url: '#'
        },
        {
          id: 'item-7',
          title: 'Manufacturing Automation Trends',
          content: 'Factory automation adoption accelerates as labor markets remain tight across developed economies.',
          source: 'Manufacturing Weekly',
          source_url: '#'
        },
        {
          id: 'item-8',
          title: 'Electric Vehicle Market Shifts',
          content: 'Price competition intensifies in EV market as new entrants challenge established manufacturers.',
          source: 'Auto Intelligence',
          source_url: '#'
        },
        {
          id: 'item-9',
          title: 'Global Trade Agreement Impact',
          content: 'Recent trade agreements between APAC nations expected to boost regional commerce by 15%.',
          source: 'Trade Monitor',
          source_url: '#'
        },
        {
          id: 'item-10',
          title: 'Pharmaceutical Innovation Pipeline',
          content: 'Major pharma companies report promising results in late-stage clinical trials for breakthrough treatments.',
          source: 'Health Industries',
          source_url: '#'
        }
      ]
    },
    {
      id: 'sample-4',
      category: 'Market Analysis',
      news_items: [
        {
          id: 'item-11',
          title: 'Commodity Price Forecast',
          content: 'Analysts predict stabilization in commodity markets following months of heightened volatility.',
          source: 'Commodity Insight',
          source_url: '#'
        },
        {
          id: 'item-12',
          title: 'Emerging Market Opportunities',
          content: 'Institutional investors increasing allocations to select emerging markets despite global uncertainties.',
          source: 'Global Markets',
          source_url: '#'
        }
      ]
    },
    {
      id: 'sample-5',
      category: 'Startup Ecosystem',
      news_items: [
        {
          id: 'item-13',
          title: 'Venture Funding Trends',
          content: 'Early-stage funding shows signs of recovery with focus on AI, climate tech, and healthcare startups.',
          source: 'Venture Beat',
          source_url: '#'
        },
        {
          id: 'item-14',
          title: 'Unicorn Valuations Adjust',
          content: 'Later-stage startups adapt to new market realities with focus on profitability over growth.',
          source: 'Startup Insider',
          source_url: '#'
        }
      ]
    }
  ];
  
  return categories;
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