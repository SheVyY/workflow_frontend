// Sample Make.com code to look up feed ID using form_submission_id
// This would be a JavaScript code module in your Make.com workflow

// Assume you have the following from the webhook:
const submissionDatabaseId = '{{1.body.subscription.db_submission_id}}'; // From webhook payload

// Supabase credentials from Make.com storage
const supabaseUrl = '{{global.supabaseUrl}}';
const supabaseKey = '{{global.supabaseKey}}'; 

// This is a simplified version for Make.com's JavaScript module
async function lookupFeedId() {
  try {
    // Determine if we should use dev tables
    const isDev = true; // Set based on your environment or pass as parameter
    
    // Choose the appropriate table name
    const feedsTable = isDev ? 'dev_news_feeds' : 'news_feeds';
    
    // Make a request to Supabase REST API to find the feed
    const response = await fetch(`${supabaseUrl}/rest/v1/${feedsTable}?form_submission_id=eq.${submissionDatabaseId}&select=id`, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Supabase API error: ${response.status}`);
    }
    
    const feeds = await response.json();
    
    if (feeds && feeds.length > 0) {
      // Return the feed ID to use in subsequent Make.com modules
      return { feedId: feeds[0].id };
    } else {
      throw new Error(`No feed found for form_submission_id: ${submissionDatabaseId}`);
    }
  } catch (error) {
    return { error: error.message };
  }
}

// In Make.com, you would return the result:
return lookupFeedId(); 