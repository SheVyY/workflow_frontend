-- Create sample tables for preview functionality

-- First create the sample_news_feeds table
CREATE TABLE IF NOT EXISTS sample_news_feeds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL DEFAULT 'News Summary',
  date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS but allow all operations
ALTER TABLE sample_news_feeds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on sample_news_feeds"
  ON sample_news_feeds FOR ALL
  USING (true)
  WITH CHECK (true);

-- Next create the sample_news_items table
CREATE TABLE IF NOT EXISTS sample_news_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feed_id UUID REFERENCES sample_news_feeds(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  source TEXT,
  source_url TEXT,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS sample_news_items_feed_id_idx 
  ON sample_news_items(feed_id);

-- Enable RLS but allow all operations
ALTER TABLE sample_news_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on sample_news_items"
  ON sample_news_items FOR ALL
  USING (true)
  WITH CHECK (true);
