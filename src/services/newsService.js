import supabase from './supabase.js';

/**
 * News Feed Service
 * Handles all interactions with the news_feeds and news_items tables in Supabase
 */

// Helper function to get correct table name based on environment
function getTableName(baseTable) {
  // Check if running on localhost
  const isLocalhost = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1';
  
  // Check for environment query parameter
  const urlParams = new URLSearchParams(window.location.search);
  const env = urlParams.get('env');
  
  // Determine which table to use
  const useDevTable = (env === 'dev' || isLocalhost);
  const tableName = useDevTable ? `dev_${baseTable}` : baseTable;
  
  // Log table selection (only in development for debugging)
  console.log(`DEBUG: getTableName: ${baseTable} → ${tableName}`, {
    isLocalhost,
    hostname: window.location.hostname,
    envParam: env,
    useDevTable
  });
  
  return tableName;
}

/**
 * Fetch all news feeds
 * @returns {Promise<Array>} - Array of news feeds
 */
export async function fetchNewsFeeds() {
  try {
    const { data, error } = await supabase
      .from(getTableName('news_feeds'))
      .select(`
        id,
        date,
        title,
        ${getTableName('news_items')} (
          id,
          title,
          content,
          source,
          source_url,
          category
        )
      `)
      .order('date', { ascending: false });
    
    if (error) throw error;
    
    // Fix for dev table names - ensure consistent news_items property
    const formattedData = data.map(feed => {
      return {
        ...feed,
        news_items: feed[getTableName('news_items')] || []
      };
    });
    
    return formattedData || [];
  } catch (error) {
    console.error('Error fetching news feeds:', error);
    return [];
  }
}

/**
 * Delete a news feed
 * @param {string} feedId - ID of the feed to delete
 * @returns {Promise<boolean>} - Success status
 */
export async function deleteNewsFeed(feedId) {
  try {
    const { error } = await supabase
      .from(getTableName('news_feeds'))
      .delete()
      .eq('id', feedId);
    
    if (error) throw error;
    
    // If we've reached this point, the deletion was successful
    return true;
  } catch (error) {
    console.error('Error deleting news feed:', error);
    return false;
  }
}

/**
 * Subscribe to real-time changes for news feeds
 * @param {Function} onInsert - Callback when a new feed is inserted
 * @param {Function} onDelete - Callback when a feed is deleted
 * @returns {Object} - Subscription object with unsubscribe method
 */
export function subscribeToNewsFeeds(onInsert, onDelete) {
  const tableName = getTableName('news_feeds');
  
  console.log(`Setting up Realtime subscription for table: ${tableName}`);
  
  const subscription = supabase
    .channel(`public:${tableName}`)
    .on('postgres_changes', { 
      event: 'INSERT', 
      schema: 'public', 
      table: tableName 
    }, (payload) => {
      console.log('Realtime: New feed inserted', payload.new);
      onInsert(payload.new);
    })
    .on('postgres_changes', { 
      event: 'DELETE', 
      schema: 'public', 
      table: tableName 
    }, (payload) => {
      console.log('Realtime: Feed deleted', payload.old);
      onDelete(payload.old);
    })
    .subscribe((status) => {
      console.log(`Realtime subscription status: ${status}`);
    });
  
  return subscription;
}

/**
 * Get the latest news feed
 * @returns {Promise<Object|null>} - The latest news feed or null
 */
export async function getLatestNewsFeed() {
  try {
    const { data, error } = await supabase
      .from(getTableName('news_feeds'))
      .select(`
        id,
        date,
        title,
        ${getTableName('news_items')} (
          id,
          title,
          content,
          source,
          source_url,
          category
        )
      `)
      .order('date', { ascending: false })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "No rows returned" error
    
    // Fix for dev table names
    if (data) {
      const itemsKey = getTableName('news_items');
      data.news_items = data[itemsKey] || [];
    }
    
    return data || null;
  } catch (error) {
    console.error('Error fetching latest news feed:', error);
    return null;
  }
}

/**
 * Fetch sample news data for preview
 * @returns {Promise<Array>} - Array of formatted news items
 */
export async function fetchSampleNewsData() {
  try {
    // Try to get the sample news feed from Supabase (using a known test name)
    const { data, error } = await supabase
      .from(getTableName('news_feeds'))
      .select(`
        id,
        ${getTableName('news_items')} (
          id,
          title,
          content,
          source,
          source_url
        )
      `)
      .eq('title', 'News Summary')
      .limit(1)
      .single();
    
    if (error) {
      console.warn('Could not fetch sample data from Supabase:', error);
      return [];
    }
    
    // Format the data for display
    const itemsKey = getTableName('news_items');
    if (data && data[itemsKey] && data[itemsKey].length > 0) {
      return data[itemsKey].map(item => ({
        title: item.title,
        content: item.content,
        url: item.source_url || '#',
        source: item.source
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching sample news data:', error);
    return [];
  }
}

/**
 * Fetch sample category data for preview
 * @returns {Promise<Array>} - Array of categories with news items for preview
 */
export async function fetchSampleCategories() {
  try {
    console.log('Fetching sample data from database for preview');
    
    // Try to get sample feeds with their items
    const { data, error } = await supabase
      .from('sample_news_feeds')
      .select(`
        id, 
        title,
        date,
        sample_news_items (
          id,
          title,
          content,
          source,
          source_url,
          category
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.warn('Error fetching sample data:', error);
      return createFallbackSampleData();
    }
    
    if (!data || data.length === 0) {
      console.warn('No sample data found in database');
      return createFallbackSampleData();
    }
    
    // Format the data to match our expected structure
    const formattedData = data.map(feed => {
      return {
        ...feed,
        news_items: feed.sample_news_items || []
      };
    });
    
    return formattedData;
  } catch (error) {
    console.error('Error fetching sample categories:', error);
    return createFallbackSampleData();
  }
}

/**
 * Creates fallback sample data in case the database tables don't exist or are empty
 * @returns {Array} Array of sample feeds with news items
 */
function createFallbackSampleData() {
  console.log('Using fallback sample data');
  
  return [{
    id: 'sample-fallback-1',
    title: 'News Summary',
    date: new Date().toISOString(),
    news_items: [{
      id: 'sample-fallback-item-1',
      title: 'Sample Preview News',
      content: 'This is a sample news item for preview purposes. Your actual content will be displayed here when available.',
      source: 'example.com',
      source_url: '#',
      category: 'General'
    }]
  }];
}

/**
 * Fetch all development feeds regardless of submission ID
 * This is used in development mode to show all available test data
 * @returns {Promise<Array>} - Array of all feeds in the development table
 */
export async function fetchAllDevFeeds() {
  try {
    // Automatically use dev feeds on localhost
    const isLocalDevelopment = window.location.hostname === 'localhost' || 
                              window.location.hostname === '127.0.0.1';
    
    console.log('DEBUG: fetchAllDevFeeds - Hostname check:', {
      hostname: window.location.hostname,
      isLocalDevelopment: isLocalDevelopment
    });
    
    if (!isLocalDevelopment) {
      console.log('Not in development environment, skipping fetchAllDevFeeds');
      return [];
    }
    
    console.log('DEBUG: fetchAllDevFeeds - Fetching all development feeds');
    
    // First check if the table exists by running a simpler query
    const { data: checkData, error: checkError } = await supabase
      .from('dev_news_feeds')
      .select('id')
      .limit(1);
      
    if (checkError) {
      console.error('DEBUG: fetchAllDevFeeds - Error checking dev_news_feeds table existence:', checkError);
      return [];
    }
    
    console.log('DEBUG: fetchAllDevFeeds - dev_news_feeds table exists and is accessible');
    
    // Now run the full query
    const { data, error } = await supabase
      .from('dev_news_feeds')
      .select(`
        id,
        title,
        date,
        dev_news_items (
          id,
          title,
          content,
          source,
          source_url,
          category
        )
      `)
      .order('date', { ascending: false });
    
    if (error) {
      console.error('DEBUG: fetchAllDevFeeds - Error fetching dev feeds:', error);
      return [];
    }
    
    console.log('DEBUG: fetchAllDevFeeds - Raw data received:', data);
    console.log('DEBUG: fetchAllDevFeeds - Number of feeds:', data?.length || 0);
    
    if (!data || data.length === 0) {
      console.log('DEBUG: fetchAllDevFeeds - No dev feeds found in database');
      return [];
    }
    
    // Format the data properly
    const formattedData = data.map(feed => {
      console.log(`DEBUG: fetchAllDevFeeds - Processing feed ${feed.id}, keys:`, Object.keys(feed));
      console.log(`DEBUG: fetchAllDevFeeds - Feed ${feed.id} dev_news_items:`, feed.dev_news_items);
      
      return {
        ...feed,
        news_items: feed.dev_news_items || []
      };
    });
    
    console.log('DEBUG: fetchAllDevFeeds - Returning formatted data with', formattedData.length, 'feeds');
    console.log('DEBUG: First formatted feed:', formattedData.length > 0 ? formattedData[0] : 'No feeds');
    
    return formattedData || [];
  } catch (error) {
    console.error('Error fetching all development feeds:', error);
    return [];
  }
}

/**
 * Fetch latest 10 news feeds regardless of submission ID
 * This is used to show feeds on the root URL without requiring any parameters
 * @returns {Promise<Array>} - Array of latest feeds from the database
 */
export async function fetchLatestFeeds(limit = 10) {
  try {
    console.log('DEBUG: fetchLatestFeeds - Starting fetch operation');
    const tableName = getTableName('news_feeds');
    const itemsTableName = getTableName('news_items');
    
    console.log('DEBUG: fetchLatestFeeds - Using tables:', { feedsTable: tableName, itemsTable: itemsTableName });
    
    // First check if the table exists
    console.log(`DEBUG: fetchLatestFeeds - Checking if ${tableName} exists`);
    const { data: checkData, error: checkError } = await supabase
      .from(tableName)
      .select('id')
      .limit(1);
      
    if (checkError) {
      console.error(`DEBUG: fetchLatestFeeds - Error checking ${tableName} existence:`, checkError);
      return [];
    }
    
    console.log(`DEBUG: fetchLatestFeeds - ${tableName} exists and is accessible`);
    
    // Now run the full query
    const { data, error } = await supabase
      .from(tableName)
      .select(`
        id,
        title,
        date,
        ${itemsTableName} (
          id,
          title,
          content,
          source,
          source_url,
          category
        )
      `)
      .order('date', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching latest feeds:', error);
      return [];
    }
    
    console.log('DEBUG: fetchLatestFeeds - Raw data structure:', data ? Object.keys(data[0] || {}) : 'No data');
    console.log('DEBUG: fetchLatestFeeds - Raw data first item:', data ? data[0] : 'No data');
    console.log('DEBUG: fetchLatestFeeds - Number of feeds received:', data?.length || 0);
    
    if (!data || data.length === 0) {
      console.log('DEBUG: fetchLatestFeeds - No feeds found in the database');
      return [];
    }
    
    // Format the data properly
    const formattedData = data.map(feed => {
      // Log each feed's items count for debugging
      console.log(`DEBUG: fetchLatestFeeds - Feed ${feed.id} keys:`, Object.keys(feed));
      
      // Check for existence of the items table key
      if (!feed[itemsTableName]) {
        console.warn(`DEBUG: fetchLatestFeeds - Feed ${feed.id} has no ${itemsTableName} property`);
      }
      
      return {
        ...feed,
        news_items: feed[itemsTableName] || []
      };
    });
    
    console.log('DEBUG: fetchLatestFeeds - First formatted feed:', formattedData.length > 0 ? {
      id: formattedData[0].id,
      title: formattedData[0].title,
      news_items_count: formattedData[0].news_items.length
    } : 'No feeds');
    
    return formattedData || [];
  } catch (error) {
    console.error('Error fetching latest feeds:', error);
    return [];
  }
}

/**
 * Diagnostic function to test database connectivity
 * Can be called from the browser console
 */
export async function testDatabaseConnection() {
  try {
    console.log('TEST: Beginning database connection test');
    console.log('TEST: Using Supabase URL:', supabase.supabaseUrl);
    
    // Test 1: Basic connectivity - check if we can connect to Supabase
    console.log('TEST 1: Testing basic connectivity');
    // Use a simple GET request instead of a HEAD request with count
    const { data: pingData, error: pingError } = await supabase
      .from('news_feeds')
      .select('id')
      .limit(1);
    
    if (pingError) {
      console.error('TEST 1: Failed - Connection error:', pingError);
    } else {
      console.log('TEST 1: Success - Connection established');
    }
    
    // Test 2: Check tables - test both regular and dev tables
    console.log('TEST 2: Testing table access');
    const tables = ['news_feeds', 'dev_news_feeds'];
    
    for (const table of tables) {
      console.log(`TEST 2: Checking table ${table}`);
      const { data, error } = await supabase
        .from(table)
        .select('id, title')
        .limit(1);
      
      if (error) {
        console.error(`TEST 2: Failed for ${table}:`, error);
      } else {
        console.log(`TEST 2: Success for ${table}:`, data);
      }
    }
    
    // Test 3: Check if we can read news items from both regular and dev tables
    console.log('TEST 3: Testing reading news items');
    
    // Try dev news feeds first
    const { data: devData, error: devError } = await supabase
      .from('dev_news_feeds')
      .select(`
        id,
        title,
        dev_news_items (
          id,
          title,
          content
        )
      `)
      .limit(1);
    
    if (devError) {
      console.error('TEST 3: Failed for dev tables:', devError);
    } else {
      console.log('TEST 3: Success for dev tables:', devData);
    }
    
    // Try regular news feeds
    const { data: prodData, error: prodError } = await supabase
      .from('news_feeds')
      .select(`
        id,
        title,
        news_items (
          id,
          title,
          content
        )
      `)
      .limit(1);
    
    if (prodError) {
      console.error('TEST 3: Failed for production tables:', prodError);
    } else {
      console.log('TEST 3: Success for production tables:', prodData);
    }
    
    console.log('TEST: Database connection test complete');
    return {
      success: true,
      devData,
      prodData
    };
  } catch (error) {
    console.error('TEST: Unhandled error during database test:', error);
    return {
      success: false,
      error
    };
  }
}

/**
 * Get a specific news feed by ID
 * @param {string} feedId - The ID of the feed to retrieve
 * @returns {Promise<Object|null>} - The news feed or null if not found
 */
export async function getFeedById(feedId) {
  try {
    console.log(`Fetching feed with ID: ${feedId}`);
    
    const { data, error } = await supabase
      .from(getTableName('news_feeds'))
      .select(`
        id,
        title,
        date,
        ${getTableName('news_items')} (
          id,
          title,
          content,
          source,
          source_url,
          category
        )
      `)
      .eq('id', feedId)
      .single();
    
    if (error) {
      console.error('Error fetching feed by ID:', error);
      return null;
    }
    
    // Fix for dev table names
    if (data) {
      const itemsKey = getTableName('news_items');
      data.news_items = data[itemsKey] || [];
    }
    
    return data;
  } catch (error) {
    console.error(`Error fetching feed with ID ${feedId}:`, error);
    return null;
  }
} 