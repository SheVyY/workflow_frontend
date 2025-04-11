-- Create extension for UUID support if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create news feeds table with submission_id to track which form submission it belongs to
CREATE TABLE IF NOT EXISTS news_feeds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id TEXT,
  title TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create news items table
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

-- Create form submissions table to track form inputs
CREATE TABLE IF NOT EXISTS form_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id TEXT UNIQUE NOT NULL,
  sources TEXT[],
  topics TEXT[],
  language TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS news_items_feed_id_idx ON news_items(feed_id);
CREATE INDEX IF NOT EXISTS news_feeds_submission_id_idx ON news_feeds(submission_id);

-- Enable public access for reading data
ALTER TABLE news_feeds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to news feeds" 
  ON news_feeds FOR SELECT 
  USING (true);

-- Allow inserts into news_feeds
CREATE POLICY "Allow public insert access to news feeds" 
  ON news_feeds FOR INSERT 
  WITH CHECK (true);

ALTER TABLE news_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to news items" 
  ON news_items FOR SELECT 
  USING (true);

-- Allow inserts into news_items
CREATE POLICY "Allow public insert access to news items" 
  ON news_items FOR INSERT 
  WITH CHECK (true);

ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to form submissions" 
  ON form_submissions FOR SELECT 
  USING (true);

-- Allow inserts into form_submissions
CREATE POLICY "Allow public insert access to form submissions" 
  ON form_submissions FOR INSERT 
  WITH CHECK (true);

-- Insert sample data
INSERT INTO form_submissions (submission_id, sources, topics, language, email)
VALUES (
  'test-submission-1',
  ARRAY['techcrunch.com', 'reuters.com'],
  ARRAY['technology', 'finance'],
  'english',
  'test@example.com'
);

-- Insert a sample news feed
INSERT INTO news_feeds (submission_id, title, date)
VALUES (
  'test-submission-1',
  'News Summary',
  CURRENT_DATE
);

-- Fetch the created feed ID
DO $$
DECLARE
  feed_id UUID;
BEGIN
  SELECT id INTO feed_id FROM news_feeds WHERE submission_id = 'test-submission-1' LIMIT 1;

  -- Insert sample news items
  INSERT INTO news_items (feed_id, title, content, source, source_url, category)
  VALUES
  (feed_id, 'Honor''s $10B AI Investment', 'Chinese smartphone maker Honor will invest $10B over 5 years to expand AI in its devices.', 'TechCrunch', 'https://techcrunch.com/article/1', 'technology'),
  (feed_id, 'Nvidia''s AI Growth & Stock Dip', 'AI chip sales drove a 78% revenue increase, but stock fell 8.5%. New Blackwell Ultra chip expected soon.', 'Reuters', 'https://reuters.com/article/1', 'finance'),
  (feed_id, 'U.S. Considers AI Chip Export Ban', 'Possible trade restrictions on AI chip sales to China could impact Nvidia''s H20 & B20 processors.', 'Financial Times', 'https://ft.com/article/1', 'business'),
  (feed_id, 'SoftBank''s $16B AI Investment', 'The firm plans to borrow $16B to expand AI initiatives, with another $8B loan possible in 2026.', 'WSJ', 'https://wsj.com/article/1', 'finance'),
  (feed_id, 'Nvidia''s AI Dominance', 'Nvidia''s H100 chip fueled its $3.45T valuation, solidifying its lead in AI, gaming, and robotics.', 'Bloomberg', 'https://bloomberg.com/article/1', 'technology');
END $$; 