/**
 * Webhook Service
 * Handles sending data to external webhook endpoints
 */

// Get webhook URL from environment variables 
const WEBHOOK_URL = import.meta.env.VITE_WEBHOOK_URL || 'http://localhost:3001/webhook';

/**
 * Send form data to webhook endpoint
 * @param {Object} formData - The form data to send
 * @returns {Promise<Object|null>} - The webhook response or null if error
 */
export async function sendFormDataToWebhook(formData) {
  try {
    // Format the data for the webhook payload
    const webhookPayload = {
      subscription: {
        email: formData.email,
        sources: formData.sources.map(source => ({
          url: source,
          method: 'GET'
        })),
        topics: formData.topics,
        language: formData.language,
        schedule: '8AM_UTC' // Default schedule
      },
      metadata: {
        timestamp: new Date().toISOString(),
        client: 'web',
        version: '1.0.0'
      }
    };
    
    // Send the data to the webhook endpoint
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(webhookPayload)
    });
    
    if (!response.ok) {
      throw new Error(`Webhook responded with status: ${response.status}`);
    }
    
    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error('Error sending data to webhook:', error);
    return null;
  }
} 