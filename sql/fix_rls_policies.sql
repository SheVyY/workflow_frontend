-- Fix RLS Policies for the tables
-- Run this in the SQL Editor in Supabase Dashboard

-- Add policy for form_submissions
DROP POLICY IF EXISTS "Allow public insert access to form_submissions" ON form_submissions;
CREATE POLICY "Allow public insert access to form_submissions" 
  ON form_submissions FOR INSERT 
  WITH CHECK (true);

-- Add policy for news_feeds
DROP POLICY IF EXISTS "Allow public insert access to news feeds" ON news_feeds;
CREATE POLICY "Allow public insert access to news feeds" 
  ON news_feeds FOR INSERT 
  WITH CHECK (true);

-- Add policy for news_items
DROP POLICY IF EXISTS "Allow public insert access to news items" ON news_items;
CREATE POLICY "Allow public insert access to news items" 
  ON news_items FOR INSERT 
  WITH CHECK (true);

-- Verify policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM
  pg_policies
WHERE
  tablename IN ('form_submissions', 'news_feeds', 'news_items')
ORDER BY
  tablename,
  policyname; 