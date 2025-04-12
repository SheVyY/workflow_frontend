/**
 * Test Supabase Realtime Functionality
 * This script tests the Realtime subscription to database changes
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Get Supabase connection info from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

// Validate credentials
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env.local file.');
  process.exit(1);
}

console.log('🔌 Connecting to Supabase:', supabaseUrl);

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Function to determine table name based on environment
function getTableName(baseTable) {
  return `dev_${baseTable}`;
}

// Test Realtime subscription to database changes
async function testRealtimeSubscription() {
  console.log('🔄 Setting up Realtime subscription...');
  
  const tableName = getTableName('news_feeds');
  console.log(`📋 Listening to changes on table: ${tableName}`);
  
  // Subscribe to changes
  const subscription = supabase
    .channel(`public:${tableName}`)
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: tableName 
    }, (payload) => {
      console.log('🔔 Change detected!', payload);
    })
    .subscribe((status) => {
      console.log(`🔌 Realtime subscription status:`, status);
      
      if (status === 'SUBSCRIBED') {
        console.log('✅ Successfully subscribed to Realtime changes!');
        console.log(`\n🧪 Now let's test it by inserting a record...\n`);
        
        // Wait a moment and then insert a test record
        setTimeout(insertTestRecord, 2000);
      }
    });
    
  // Keep the script running for a while
  console.log('⏳ Listening for changes for 30 seconds...');
  setTimeout(() => {
    console.log('🛑 Unsubscribing...');
    subscription.unsubscribe();
    console.log('👋 Test completed.');
    process.exit(0);
  }, 30000);
}

// Insert a test record to trigger the subscription
async function insertTestRecord() {
  try {
    const { data, error } = await supabase
      .from(getTableName('news_feeds'))
      .insert({
        submission_id: `test-realtime-${Date.now()}`,
        title: 'Realtime Test Feed',
        date: new Date().toISOString()
      })
      .select('id');
      
    if (error) {
      console.error('❌ Error inserting test record:', error);
      return;
    }
    
    console.log('✅ Test record inserted:', data);
    
    // Insert a news item for this feed
    if (data && data[0] && data[0].id) {
      const feedId = data[0].id;
      
      const { data: itemData, error: itemError } = await supabase
        .from(getTableName('news_items'))
        .insert({
          feed_id: feedId,
          title: 'Realtime Test News Item',
          content: 'This is a test of Supabase Realtime functionality.',
          source: 'Realtime Test',
          source_url: 'https://example.com',
          category: 'Technology'
        });
        
      if (itemError) {
        console.error('❌ Error inserting test news item:', itemError);
      } else {
        console.log('✅ Test news item inserted');
      }
    }
    
  } catch (error) {
    console.error('❌ Error in test:', error);
  }
}

// Run the test
testRealtimeSubscription(); 