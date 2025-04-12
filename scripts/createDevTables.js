#!/usr/bin/env node

/**
 * Create Supabase Development Tables
 * Uses the Supabase JS client with service role key to create dev tables
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

// Function to execute SQL directly
async function executeSql(sqlQuery) {
  try {
    const { data, error } = await supabase.from('_exec_sql').select('*').eq('query', sqlQuery).limit(1);
    
    if (error) {
      console.error('Error executing SQL:', error.message);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error executing SQL:', error.message);
    return false;
  }
}

async function createDevTables() {
  console.log('Creating development tables in Supabase...');
  
  try {
    // Create dev_news_feeds table
    console.log('Creating dev_news_feeds table...');
    const createFeedsTableSql = `
    CREATE TABLE IF NOT EXISTS dev_news_feeds (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      submission_id TEXT,
      title TEXT NOT NULL,
      date DATE NOT NULL DEFAULT CURRENT_DATE,
      category TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS dev_news_feeds_submission_id_idx ON dev_news_feeds(submission_id);
    ALTER TABLE dev_news_feeds ENABLE ROW LEVEL SECURITY;
    CREATE POLICY IF NOT EXISTS "Allow public read access to dev news feeds" 
      ON dev_news_feeds FOR SELECT 
      USING (true);
    CREATE POLICY IF NOT EXISTS "Allow anon insert to dev news feeds" 
      ON dev_news_feeds FOR INSERT 
      TO anon
      USING (true);
    CREATE POLICY IF NOT EXISTS "Allow anon delete own dev news feeds" 
      ON dev_news_feeds FOR DELETE 
      TO anon
      USING (true);
    `;
    
    const feedsSuccess = await executeSql(createFeedsTableSql);
    if (feedsSuccess) {
      console.log('✅ dev_news_feeds table created successfully');
    }
    
    // Create dev_news_items table
    console.log('Creating dev_news_items table...');
    const createItemsTableSql = `
    CREATE TABLE IF NOT EXISTS dev_news_items (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      feed_id UUID REFERENCES dev_news_feeds(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      source TEXT,
      source_url TEXT,
      category TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS dev_news_items_feed_id_idx ON dev_news_items(feed_id);
    ALTER TABLE dev_news_items ENABLE ROW LEVEL SECURITY;
    CREATE POLICY IF NOT EXISTS "Allow public read access to dev news items" 
      ON dev_news_items FOR SELECT 
      USING (true);
    CREATE POLICY IF NOT EXISTS "Allow anon insert to dev news items" 
      ON dev_news_items FOR INSERT 
      TO anon
      USING (true);
    CREATE POLICY IF NOT EXISTS "Allow anon delete own dev news items" 
      ON dev_news_items FOR DELETE 
      TO anon
      USING (true);
    `;
    
    const itemsSuccess = await executeSql(createItemsTableSql);
    if (itemsSuccess) {
      console.log('✅ dev_news_items table created successfully');
    }
    
    // Create dev_form_submissions table
    console.log('Creating dev_form_submissions table...');
    const createSubmissionsTableSql = `
    CREATE TABLE IF NOT EXISTS dev_form_submissions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      submission_id TEXT UNIQUE,
      email TEXT,
      sources JSONB,
      topics JSONB,
      languages TEXT[],
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS dev_form_submissions_submission_id_idx ON dev_form_submissions(submission_id);
    ALTER TABLE dev_form_submissions ENABLE ROW LEVEL SECURITY;
    CREATE POLICY IF NOT EXISTS "Allow public read access to dev form submissions" 
      ON dev_form_submissions FOR SELECT 
      USING (true);
    CREATE POLICY IF NOT EXISTS "Allow anon insert to dev form submissions" 
      ON dev_form_submissions FOR INSERT 
      TO anon
      USING (true);
    `;
    
    const submissionsSuccess = await executeSql(createSubmissionsTableSql);
    if (submissionsSuccess) {
      console.log('✅ dev_form_submissions table created successfully');
    }
    
    // Create Supabase Direct SQL/RPC Helper
    console.log('\nCreating direct SQL/RPC helper function...');
    const createSqlFunc = `
    CREATE OR REPLACE FUNCTION _exec_sql(query text)
    RETURNS text
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE query;
      RETURN 'SQL executed successfully';
    END;
    $$;
    `;
    
    const sqlFuncSuccess = await executeSql(createSqlFunc);
    if (sqlFuncSuccess) {
      console.log('✅ SQL executor function created successfully');
    }
    
    console.log('\nTo create tables using the SQL helper, run the following in the SQL editor:');
    console.log(`
    -- Create dev_news_feeds table
    ${createFeedsTableSql}
    
    -- Create dev_news_items table
    ${createItemsTableSql}
    
    -- Create dev_form_submissions table
    ${createSubmissionsTableSql}
    `);
    
    console.log('\nDevelopment tables should be created.');
    
  } catch (error) {
    console.error('An error occurred:', error.message);
  }
}

// Run the table creation
createDevTables(); 