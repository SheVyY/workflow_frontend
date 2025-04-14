// Sample Make.com code to insert news items using native database IDs
// This would be a JavaScript code module in your Make.com workflow

// Get the feed ID directly from the webhook payload
const feedId = '{{1.body.subscription.db_feed_id}}';

// If the feed ID is missing, you can look it up by submission ID as a fallback
const submissionDatabaseId = '{{1.body.subscription.db_submission_id}}';

// Supabase credentials from Make.com storage
const supabaseUrl = '{{global.supabaseUrl}}';
const supabaseKey = '{{global.supabaseKey}}';

// Sample news item to insert - this would typically come from another service
const newsItem = {
  title: "Sample news item from Make.com",
  content: "This is a news item created in the Make.com workflow using the native database IDs approach.",
  summary: "A brief summary of the news item",
  source: "make.com",
  source_url: "https://make.com",
  category: "Technology",
  feed_id: feedId // Use the feed ID directly from the webhook
};

// Function to insert the news item
async function insertNewsItem() {
  try {
    // Determine if we should use dev tables
    const isDev = true; // Set based on your environment or pass as parameter
    
    // Choose the appropriate table name
    const newsItemsTable = isDev ? 'dev_news_items' : 'news_items';
    
    // Make a request to Supabase REST API to insert the news item
    const response = await fetch(`${supabaseUrl}/rest/v1/${newsItemsTable}`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(newsItem)
    });
    
    if (!response.ok) {
      throw new Error(`Supabase API error: ${response.status}`);
    }
    
    const insertedItem = await response.json();
    return { success: true, item: insertedItem[0] };
  } catch (error) {
    return { error: error.message };
  }
}

// In Make.com, you would return the result:
return insertNewsItem(); 