/**
 * Webhook Service
 * Handles sending data to external webhook endpoints
 */

// Get webhook URL from environment variables 
const WEBHOOK_URL = import.meta.env.VITE_WEBHOOK_URL || 'http://localhost:3001/webhook';

// Import Supabase client for the workaround solution
import supabase from './supabase.js';

/**
 * Format URL to ensure it has https:// prefix
 * @param {string} url - The URL to format
 * @returns {string} - Formatted URL with https:// prefix
 */
function formatUrl(url) {
  if (!url) return '';
  
  try {
    // Extract the domain - similar to cleaning process in FormHandler.js
    let domain = url.toLowerCase().trim();
    
    // Check if domain already has a protocol
    const hasProtocol = domain.startsWith('http://') || domain.startsWith('https://');
    
    // Remove protocol if it exists
    domain = domain.replace(/^(https?:\/\/)?(www\.)?/, '');
    
    // Extract domain (remove path, query params)
    domain = domain.split('/')[0];
    domain = domain.split('?')[0];
    
    // Some popular sites need special handling for subdomains
    const noWwwSites = ['github.com', 'twitter.com', 'reddit.com', 'medium.com'];
    const needsWww = !noWwwSites.some(site => domain.endsWith(site));
    
    // For logging
    console.log(`URL transformation: "${url}" → "https://${needsWww ? 'www.' : ''}${domain}"`);
    
    // Add https:// prefix with or without www as appropriate
    return `https://${needsWww ? 'www.' : ''}${domain}`;
  } catch (error) {
    console.error('Error formatting URL:', error);
    return url; // Return original URL if there's an error
  }
}

/**
 * Send form data to webhook endpoint
 * @param {Object} formData - The form data to send
 * @returns {Promise<Object|null>} - The webhook response or null if error
 */
export async function sendFormDataToWebhook(formData) {
  try {
    console.log('Preparing webhook payload for data:', {
      email: formData.email, 
      sourcesCount: formData.sources?.length || 0
    });
    
    // Use the date from formData or calculate yesterday's date as fallback
    let formattedDate = formData.date;
    if (!formattedDate) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      formattedDate = yesterday.toISOString().split('T')[0]; // Gets YYYY-MM-DD format
    }
    
    console.log('Using date in webhook payload:', formattedDate);
    
    // =====================================================================
    // IMPROVED APPROACH: Use existing submission ID or create new records
    // =====================================================================
    let submissionDatabaseId = formData.submissionId || null;
    let feedDatabaseId = null;
    
    try {
      // Determine if we're using dev tables
      const isDev = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1' ||
                    (new URLSearchParams(window.location.search).get('env') === 'dev');
      
      const submissionsTable = isDev ? 'dev_form_submissions' : 'form_submissions';
      const feedsTable = isDev ? 'dev_news_feeds' : 'news_feeds';
      
      // If we don't have a submission ID, we need to create one
      if (!submissionDatabaseId) {
        console.log(`No existing submission ID provided. Creating new ${submissionsTable} record`);
        
        const { data: submissionData, error: submissionError } = await supabase
          .from(submissionsTable)
          .insert({
            email: formData.email,
            sources: formData.sources || [],
            topics: formData.topics || [],
            language: formData.language || '',
            date: formattedDate
          })
          .select();
        
        if (submissionError) {
          console.error(`Error creating ${submissionsTable} record:`, submissionError);
          throw submissionError;
        }
        
        // Store the Supabase-generated ID
        submissionDatabaseId = submissionData[0].id;
        console.log(`Created new submission with database ID: ${submissionDatabaseId}`);
      } else {
        console.log(`Using existing submission ID: ${submissionDatabaseId}`);
      }
      
      // Create the feed record using the submission's ID as foreign key
      console.log(`Creating ${feedsTable} record with form_submission_id: ${submissionDatabaseId}`);
      
      const { data: feedData, error: feedError } = await supabase
        .from(feedsTable)
        .insert({
          title: `News Feed for ${formData.email}`,
          date: new Date().toISOString(),
          // Use the submission's native ID
          form_submission_id: submissionDatabaseId
        })
        .select();
      
      if (feedError) {
        console.error(`Error creating ${feedsTable} record:`, feedError);
      } else if (feedData && feedData.length > 0) {
        // Store the feed's Supabase-generated ID for the webhook
        feedDatabaseId = feedData[0].id;
        console.log(`Created feed with database ID: ${feedDatabaseId}`);
      }
    } catch (dbError) {
      console.error('Database operation error:', dbError);
      // Continue with the webhook process even if database operations fail
    }
    // End of improved approach
    // =====================================================================
    
    // Format the data for the webhook payload
    const webhookPayload = {
      subscription: {
        email: formData.email,
        sources: formData.sources.map(source => ({
          url: formatUrl(source),
          method: 'GET'
        })),
        topics: formData.topics,
        language: formData.language,
        schedule: '8AM_UTC', // Default schedule
        date: formattedDate, // Use the provided date
        // Include the native database IDs for direct use in downstream systems
        db_submission_id: submissionDatabaseId,
        db_feed_id: feedDatabaseId
      },
      metadata: {
        timestamp: new Date().toISOString(),
        client: 'web',
        version: '1.0.0'
      }
    };
    
    console.log('Sending webhook payload to:', WEBHOOK_URL);
    
    // Send the data to the webhook endpoint
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(webhookPayload)
    });
    
    // Read the response body once and store it
    let responseBody;
    let responseData = null;
    const contentType = response.headers.get('content-type');
    
    try {
      // Check content type to determine how to parse
      if (contentType && contentType.includes('application/json')) {
        responseBody = await response.json();
      } else {
        responseBody = await response.text();
      }
    } catch (parseError) {
      console.warn('Error parsing response:', parseError);
      responseBody = null;
    }
    
    // Now process the response based on status
    if (!response.ok) {
      console.error(`Webhook responded with status: ${response.status}`, responseBody);
      
      // For error responses, still return something to the caller
      // to indicate that the request was sent but had an error response
      return { 
        error: true, 
        status: response.status,
        message: `Webhook responded with status: ${response.status}`
      };
    }
    
    // For successful responses with JSON data
    if (responseBody && typeof responseBody === 'object') {
      console.log('Webhook response received:', responseBody);
      return responseBody;
    }
    
    // For successful non-JSON responses
    if (responseBody) {
      console.log('Webhook returned non-JSON response:', typeof responseBody === 'string' ? responseBody.substring(0, 100) + '...' : responseBody);
    }
    
    // Default response if we couldn't parse the body
    return { success: true, message: 'Request processed successfully' };
  } catch (error) {
    console.error('Error sending data to webhook:', error);
    return null;
  }
} 