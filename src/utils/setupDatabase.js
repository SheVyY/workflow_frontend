import supabase from '../services/supabase.js';

/**
 * Setup Database Utility
 * Provides functions to work with database data
 */

/**
 * Run the setup SQL script against Supabase
 * @returns {Promise<boolean>} - Success status
 */
export async function setupDatabase() {
  try {
    // Read the SQL file
    const sqlPath = path.resolve('./sql/setup.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = sql
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    // Execute each statement
    for (const statement of statements) {
      const { error } = await supabase.rpc('exec_sql', { 
        sql_query: statement + ';' 
      });
      
      if (error) {
        console.error('Error executing SQL statement:', error);
        console.error('Statement:', statement);
        // Continue with other statements despite errors
      }
    }
    
    console.log('Database setup completed successfully');
    return true;
  } catch (error) {
    console.error('Failed to set up database:', error);
    return false;
  }
}

/**
 * Clean up database (for testing)
 */
export async function cleanupDatabase() {
  try {
    // Delete all data but keep the tables
    const tables = ['news_items', 'news_feeds', 'form_submissions'];
    
    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows
        
      if (error) {
        console.error(`Error cleaning up ${table}:`, error);
      }
    }
    
    console.log('Database cleaned up successfully');
    return true;
  } catch (error) {
    console.error('Failed to clean up database:', error);
    return false;
  }
}

/**
 * Check if sample data exists
 * @returns {Promise<boolean>} - Whether sample data exists
 */
export async function checkSampleDataExists() {
  try {
    const { data, error } = await supabase
      .from('news_feeds')
      .select('id')
      .eq('submission_id', 'test-submission-1')
      .limit(1);
    
    if (error) throw error;
    
    return data && data.length > 0;
  } catch (error) {
    console.error('Error checking for sample data:', error);
    return false;
  }
}

/**
 * Insert sample data
 * @returns {Promise<boolean>} - Success status
 */
export async function insertSampleData() {
  try {
    // Check if sample data already exists
    const exists = await checkSampleDataExists();
    if (exists) {
      console.log('Sample data already exists, skipping insertion');
      return true;
    }
    
    // Insert sample submission
    const { data: submission, error: submissionError } = await supabase
      .from('form_submissions')
      .insert({
        submission_id: 'test-submission-1',
        sources: ['techcrunch.com', 'reuters.com'],
        topics: ['technology', 'finance'],
        language: 'english',
        email: 'test@example.com'
      })
      .select()
      .single();
    
    if (submissionError) throw submissionError;
    
    // Insert sample news feed
    const { data: feed, error: feedError } = await supabase
      .from('news_feeds')
      .insert({
        submission_id: 'test-submission-1',
        title: 'News Summary',
        date: new Date().toISOString().split('T')[0]
      })
      .select()
      .single();
    
    if (feedError) throw feedError;
    
    // Insert sample news items
    const sampleItems = [
      {
        feed_id: feed.id,
        title: "Honor's $10B AI Investment",
        content: "Chinese smartphone maker Honor will invest $10B over 5 years to expand AI in its devices.",
        source: "TechCrunch",
        source_url: "https://techcrunch.com/article/1",
        category: "technology"
      },
      {
        feed_id: feed.id,
        title: "Nvidia's AI Growth & Stock Dip",
        content: "AI chip sales drove a 78% revenue increase, but stock fell 8.5%. New Blackwell Ultra chip expected soon.",
        source: "Reuters",
        source_url: "https://reuters.com/article/1",
        category: "finance"
      },
      {
        feed_id: feed.id,
        title: "U.S. Considers AI Chip Export Ban",
        content: "Possible trade restrictions on AI chip sales to China could impact Nvidia's H20 & B20 processors.",
        source: "Financial Times",
        source_url: "https://ft.com/article/1", 
        category: "business"
      },
      {
        feed_id: feed.id,
        title: "SoftBank's $16B AI Investment",
        content: "The firm plans to borrow $16B to expand AI initiatives, with another $8B loan possible in 2026.",
        source: "WSJ",
        source_url: "https://wsj.com/article/1",
        category: "finance"
      },
      {
        feed_id: feed.id,
        title: "Nvidia's AI Dominance",
        content: "Nvidia's H100 chip fueled its $3.45T valuation, solidifying its lead in AI, gaming, and robotics.",
        source: "Bloomberg",
        source_url: "https://bloomberg.com/article/1",
        category: "technology"
      }
    ];
    
    const { error: itemsError } = await supabase
      .from('news_items')
      .insert(sampleItems);
    
    if (itemsError) throw itemsError;
    
    console.log('Sample data inserted successfully');
    return true;
  } catch (error) {
    console.error('Failed to insert sample data:', error);
    return false;
  }
} 