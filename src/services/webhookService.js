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
    domain = domain.replace(/^(https?:\/\/)?(www\.)?/, '');
    domain = domain.split('/')[0];
    domain = domain.split('?')[0];
    
    // For logging
    console.log(`URL transformation: "${url}" → "https://www.${domain}"`);
    
    // Add https:// prefix
    return `https://www.${domain}`;
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
      submissionId: formData.submissionId
    });
    
    // Calculate yesterday's date in YYYY-MM-DD format
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const formattedDate = yesterday.toISOString().split('T')[0]; // Gets YYYY-MM-DD format
    
    console.log('Adding date to webhook payload:', formattedDate, '(yesterday)');
    
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
        date: formattedDate, // Add yesterday's date
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
    
    if (!response.ok) {
      // Try to get response content
      let responseContent;
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          responseContent = await response.json();
        } else {
          responseContent = await response.text();
          console.warn('Webhook returned non-JSON response:', responseContent);
        }
      } catch (parseError) {
        responseContent = `Failed to parse response: ${parseError.message}`;
      }
      
      console.error(`Webhook responded with status: ${response.status}`, responseContent);
      throw new Error(`Webhook responded with status: ${response.status}`);
    }
    
    let responseData;
    try {
      responseData = await response.json();
      console.log('Webhook response received:', responseData);
    } catch (error) {
      // Handle non-JSON responses
      const text = await response.text();
      console.warn('Webhook returned non-JSON response:', text);
      responseData = { success: true, message: 'Request processed but response was not JSON' };
    }
    
    return responseData;
  } catch (error) {
    console.error('Error sending data to webhook:', error);
    return null;
  }
} 