#!/usr/bin/env node

/**
 * Webhook Handler
 * Receives webhook data and stores it in Supabase
 * 
 * To use:
 * 1. Run this script on a server that can receive HTTP requests
 * 2. Point your webhook configuration to this endpoint
 * 3. Incoming data will be processed and stored in Supabase
 */

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import http from 'http';
import { v4 as uuidv4 } from 'uuid';

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Use service key for admin operations

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env.local');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Create HTTP server to receive webhooks
const server = http.createServer(async (req, res) => {
  // Only handle POST requests to /webhook endpoint
  if (req.method === 'POST' && req.url === '/webhook') {
    let body = '';
    
    // Collect request body
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    // Process the complete request
    req.on('end', async () => {
      try {
        // Parse the JSON payload
        const payload = JSON.parse(body);
        console.log('Received webhook payload:', payload);
        
        // Handle the data
        const result = await processWebhookData(payload);
        
        // Send response
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Data processed successfully', result }));
      } catch (error) {
        console.error('Error processing webhook:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });
  } else {
    // Handle other requests
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: 'Not found' }));
  }
});

/**
 * Process webhook data and store in Supabase
 * @param {Object} data - The webhook payload
 * @returns {Object} - Processing result
 */
async function processWebhookData(data) {
  // Expected format from the webhook:
  // {
  //   subscription: {
  //     email: "user@example.com",
  //     sources: [...],
  //     topics: [...],
  //     language: "english",
  //     schedule: "8AM_UTC"
  //   },
  //   metadata: {...}
  // }
  
  try {
    const { subscription, metadata } = data;
    
    if (!subscription) {
      throw new Error('Invalid webhook data: missing subscription object');
    }
    
    // Generate a unique submission ID
    const submissionId = `webhook-${uuidv4()}`;
    
    // 1. Store form submission
    const { error: submissionError, data: submissionData } = await supabase
      .from('form_submissions')
      .insert([
        {
          submission_id: submissionId,
          sources: subscription.sources?.map(source => source.url) || [],
          topics: subscription.topics || [],
          language: subscription.language || 'english',
          email: subscription.email,
        }
      ])
      .select()
      .single();
    
    if (submissionError) {
      throw new Error(`Error storing form submission: ${submissionError.message}`);
    }
    
    console.log('Form submission stored successfully:', submissionData);
    
    // 2. Create a news feed for this submission
    const { error: feedError, data: feedData } = await supabase
      .from('news_feeds')
      .insert([
        {
          submission_id: submissionId,
          title: `News Summary for ${subscription.email}`,
          date: new Date()
        }
      ])
      .select()
      .single();
    
    if (feedError) {
      throw new Error(`Error creating news feed: ${feedError.message}`);
    }
    
    console.log('News feed created successfully:', feedData);
    
    // 3. In a real application, you would trigger a process to generate news items
    // for this feed, but for now we'll just return the created data
    
    return {
      submissionId,
      formSubmission: submissionData,
      newsFeed: feedData
    };
  } catch (error) {
    console.error('Error processing webhook data:', error);
    throw error;
  }
}

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Webhook handler running on port ${PORT}`);
  console.log(`Endpoint: http://localhost:${PORT}/webhook`);
}); 