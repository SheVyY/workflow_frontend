-- Fix the dev_news_feeds table by removing the category column
ALTER TABLE dev_news_feeds DROP COLUMN IF EXISTS category;

-- Update all titles in news_feeds to 'News Summary'
UPDATE news_feeds SET title = 'News Summary';

-- Update all titles in dev_news_feeds to 'News Summary'
UPDATE dev_news_feeds SET title = 'News Summary';

-- Set NOT NULL constraint to ensure titles always have a value
ALTER TABLE news_feeds ALTER COLUMN title SET NOT NULL;
ALTER TABLE dev_news_feeds ALTER COLUMN title SET NOT NULL;

-- Add a default value for title
ALTER TABLE news_feeds ALTER COLUMN title SET DEFAULT 'News Summary';
ALTER TABLE dev_news_feeds ALTER COLUMN title SET DEFAULT 'News Summary'; 