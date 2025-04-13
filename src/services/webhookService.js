/**
 * Webhook Service
 * Handles sending data to external webhook endpoints
 */

// Get webhook URL from environment variables 
const WEBHOOK_URL = import.meta.env.VITE_WEBHOOK_URL || 'http://localhost:3001/webhook';

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
      sourcesCount: formData.sources?.length || 0,
      submissionId: formData.submissionId,
      date: formData.date
    });
    
    // Use the date from formData or calculate yesterday's date as fallback
    let formattedDate = formData.date;
    if (!formattedDate) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      formattedDate = yesterday.toISOString().split('T')[0]; // Gets YYYY-MM-DD format
    }
    
    console.log('Using date in webhook payload:', formattedDate);
    
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
        submission_id: formData.submissionId // Add submission ID for tracking
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