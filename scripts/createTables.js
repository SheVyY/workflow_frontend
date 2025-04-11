#!/usr/bin/env node

/**
 * Create Supabase Tables
 * Uses the Supabase JS client with service role key to create tables
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_KEY');
  process.exit(1);
}

// Initialize Supabase client with service role key for admin privileges
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTables() {
  console.log('Creating tables in Supabase...');
  
  try {
    // Create news_feeds table
    console.log('Creating news_feeds table...');
    const { error: feedsError } = await supabase.rpc('create_news_feeds_table');
    
    if (feedsError) {
      console.error('Error creating news_feeds table:', feedsError.message);
    } else {
      console.log('✅ news_feeds table created successfully');
    }
    
    // Create news_items table
    console.log('Creating news_items table...');
    const { error: itemsError } = await supabase.rpc('create_news_items_table');
    
    if (itemsError) {
      console.error('Error creating news_items table:', itemsError.message);
    } else {
      console.log('✅ news_items table created successfully');
    }
    
    // Create form_submissions table
    console.log('Creating form_submissions table...');
    const { error: submissionsError } = await supabase.rpc('create_form_submissions_table');
    
    if (submissionsError) {
      console.error('Error creating form_submissions table:', submissionsError.message);
    } else {
      console.log('✅ form_submissions table created successfully');
    }
    
    console.log('Table creation complete');
    
  } catch (error) {
    console.error('An error occurred:', error.message);
  }
}

// First create the SQL functions in Supabase
async function createSqlFunctions() {
  console.log('Creating SQL functions...');
  
  // Create function for news_feeds table
  const createNewsFeedsFunc = `
  CREATE OR REPLACE FUNCTION create_news_feeds_table()
  RETURNS void AS $$
  BEGIN
    CREATE TABLE IF NOT EXISTS news_feeds (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      submission_id TEXT,
      title TEXT NOT NULL,
      date DATE NOT NULL DEFAULT CURRENT_DATE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Create index for performance
    CREATE INDEX IF NOT EXISTS news_feeds_submission_id_idx ON news_feeds(submission_id);
    
    -- Enable public access for reading data
    ALTER TABLE news_feeds ENABLE ROW LEVEL SECURITY;
    CREATE POLICY IF NOT EXISTS "Allow public read access to news feeds" 
      ON news_feeds FOR SELECT 
      USING (true);
  END;
  $$ LANGUAGE plpgsql;
  `;
  
  // Create function for news_items table
  const createNewsItemsFunc = `
  CREATE OR REPLACE FUNCTION create_news_items_table()
  RETURNS void AS $$
  BEGIN
    CREATE TABLE IF NOT EXISTS news_items (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      feed_id UUID REFERENCES news_feeds(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      source TEXT,
      source_url TEXT,
      category TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Create index for performance
    CREATE INDEX IF NOT EXISTS news_items_feed_id_idx ON news_items(feed_id);
    
    -- Enable public access for reading data
    ALTER TABLE news_items ENABLE ROW LEVEL SECURITY;
    CREATE POLICY IF NOT EXISTS "Allow public read access to news items" 
      ON news_items FOR SELECT 
      USING (true);
  END;
  $$ LANGUAGE plpgsql;
  `;
  
  // Create function for form_submissions table
  const createFormSubmissionsFunc = `
  CREATE OR REPLACE FUNCTION create_form_submissions_table()
  RETURNS void AS $$
  BEGIN
    CREATE TABLE IF NOT EXISTS form_submissions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      submission_id TEXT UNIQUE NOT NULL,
      sources TEXT[],
      topics TEXT[],
      language TEXT,
      email TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Enable public access for reading data
    ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;
    CREATE POLICY IF NOT EXISTS "Allow public read access to form submissions" 
      ON form_submissions FOR SELECT 
      USING (true);
  END;
  $$ LANGUAGE plpgsql;
  `;
  
  try {
    // Create the SQL functions
    console.log('Creating SQL functions...');
    
    const { error: feedsFuncError } = await supabase.rpc('exec_sql', { 
      sql_string: createNewsFeedsFunc 
    });
    
    if (feedsFuncError) {
      console.error('Error creating news_feeds function:', feedsFuncError.message);
    } else {
      console.log('✅ news_feeds function created');
    }
    
    const { error: itemsFuncError } = await supabase.rpc('exec_sql', { 
      sql_string: createNewsItemsFunc 
    });
    
    if (itemsFuncError) {
      console.error('Error creating news_items function:', itemsFuncError.message);
    } else {
      console.log('✅ news_items function created');
    }
    
    const { error: submissionsFuncError } = await supabase.rpc('exec_sql', { 
      sql_string: createFormSubmissionsFunc 
    });
    
    if (submissionsFuncError) {
      console.error('Error creating form_submissions function:', submissionsFuncError.message);
    } else {
      console.log('✅ form_submissions function created');
    }
    
  } catch (error) {
    console.error('An error occurred creating SQL functions:', error.message);
  }
}

// Execute SQL via Supabase stored procedure
async function executeSql(sqlStatement) {
  console.log('Creating exec_sql function if not exists...');
  
  const createExecSqlFunc = `
  CREATE OR REPLACE FUNCTION exec_sql(sql_string text)
  RETURNS text AS $$
  BEGIN
    EXECUTE sql_string;
    RETURN 'SQL executed successfully';
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;
  
  try {
    // First create the exec_sql function if it doesn't exist
    const { error: execSqlError, data } = await supabase
      .from('_rpc')
      .select('*')
      .eq('name', 'exec_sql')
      .single();
    
    if (execSqlError) {
      // Function likely doesn't exist, so create it
      const { error } = await supabase.rpc('exec_sql', { 
        sql_string: createExecSqlFunc 
      });
      
      if (error && error.code !== '42883') { // 42883 is function not found
        if (error.message && error.message.includes('relation "_rpc" does not exist')) {
          // Direct SQL execution through Supabase REST API is limited
          console.log('Creating exec_sql function directly...');
          
          // For simplicity create directly using rpc extension
          const { error: directError } = await supabase
            .rpc('exec_sql', { sql_string: createExecSqlFunc });
          
          if (directError && directError.code !== '42883') {
            throw directError;
          }
        } else {
          throw error;
        }
      }
    }
    
    // Then execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql_string: sqlStatement });
    
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    if (error.code === '42883') { // Function not found
      console.error('exec_sql function not found and could not be created.');
      console.error('Please create this function manually in the Supabase dashboard SQL editor:');
      console.error(createExecSqlFunc);
    } else {
      console.error('Error executing SQL:', error.message);
    }
    return false;
  }
}

// Create sample data
async function createSampleData() {
  console.log('Creating sample data...');
  
  try {
    // Insert sample form submission
    const { error: submissionError, data: submission } = await supabase
      .from('form_submissions')
      .insert([
        {
          submission_id: 'test-submission-1',
          sources: ['techcrunch.com', 'reuters.com'],
          topics: ['technology', 'finance'],
          language: 'english',
          email: 'test@example.com'
        }
      ])
      .select()
      .single();
    
    if (submissionError) {
      console.error('Error creating sample submission:', submissionError.message);
      return;
    }
    
    console.log('✅ Sample form submission created');
    
    // Insert sample news feed
    const { error: feedError, data: feed } = await supabase
      .from('news_feeds')
      .insert([
        {
          submission_id: 'test-submission-1',
          title: 'News Summary',
          date: new Date()
        }
      ])
      .select()
      .single();
    
    if (feedError) {
      console.error('Error creating sample feed:', feedError.message);
      return;
    }
    
    console.log('✅ Sample news feed created');
    
    // Insert sample news items
    const feedId = feed.id;
    const sampleItems = [
      {
        feed_id: feedId,
        title: 'Honor\'s $10B AI Investment',
        content: 'Chinese smartphone maker Honor will invest $10B over 5 years to expand AI in its devices.',
        source: 'TechCrunch',
        source_url: 'https://techcrunch.com/article/1',
        category: 'technology'
      },
      {
        feed_id: feedId,
        title: 'Nvidia\'s AI Growth & Stock Dip',
        content: 'AI chip sales drove a 78% revenue increase, but stock fell 8.5%. New Blackwell Ultra chip expected soon.',
        source: 'Reuters',
        source_url: 'https://reuters.com/article/1',
        category: 'finance'
      },
      {
        feed_id: feedId,
        title: 'U.S. Considers AI Chip Export Ban',
        content: 'Possible trade restrictions on AI chip sales to China could impact Nvidia\'s H20 & B20 processors.',
        source: 'Financial Times',
        source_url: 'https://ft.com/article/1',
        category: 'business'
      }
    ];
    
    const { error: itemsError } = await supabase
      .from('news_items')
      .insert(sampleItems);
    
    if (itemsError) {
      console.error('Error creating sample news items:', itemsError.message);
      return;
    }
    
    console.log('✅ Sample news items created');
    
  } catch (error) {
    console.error('Error creating sample data:', error.message);
  }
}

async function main() {
  try {
    // First try to execute SQL commands using exec_sql function
    const execFunctionCreated = await executeSql(`SELECT 1`);
    
    if (execFunctionCreated) {
      await createSqlFunctions();
      await createTables();
      await createSampleData();
    } else {
      console.error('Could not create SQL execution function. Cannot continue.');
    }
    
    console.log('Done!');
  } catch (error) {
    console.error('Fatal error:', error);
  }
}

main(); 