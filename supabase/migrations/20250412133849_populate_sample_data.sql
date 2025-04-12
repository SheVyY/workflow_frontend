-- Populate sample tables with data for preview functionality

-- First, clear any existing data
DELETE FROM sample_news_items WHERE TRUE;
DELETE FROM sample_news_feeds WHERE TRUE;

-- Technology category feed
WITH tech_feed AS (
  INSERT INTO sample_news_feeds (title, date)
  VALUES ('News Summary', NOW())
  RETURNING id
)
INSERT INTO sample_news_items (feed_id, title, content, source, source_url, category)
SELECT 
  tech_feed.id, 
  title, 
  content, 
  source, 
  source_url, 
  category
FROM tech_feed,
(VALUES
  ('AI Revolution Continues', 'Latest AI models demonstrate unprecedented capabilities in reasoning and code generation.', 'techdaily.com', '#', 'Technology'),
  ('New Chip Architecture', 'Semiconductor companies unveil next-gen chip designs with 30% better energy efficiency.', 'chipweekly.com', '#', 'Technology')
) AS data(title, content, source, source_url, category);

-- Business category feed
WITH business_feed AS (
  INSERT INTO sample_news_feeds (title, date)
  VALUES ('News Summary', NOW())
  RETURNING id
)
INSERT INTO sample_news_items (feed_id, title, content, source, source_url, category)
SELECT 
  business_feed.id, 
  title, 
  content, 
  source, 
  source_url, 
  category
FROM business_feed,
(VALUES
  ('Tech Company Reports Record Earnings', 'Major tech firm announces 25% growth in Q3 earnings, exceeding market expectations.', 'businesstoday.com', '#', 'Business'),
  ('Startup Raises $100M in Funding', 'AI-focused startup secures major funding round to expand operations globally.', 'venturebeat.com', '#', 'Business')
) AS data(title, content, source, source_url, category);

-- Finance category feed
WITH finance_feed AS (
  INSERT INTO sample_news_feeds (title, date)
  VALUES ('News Summary', NOW())
  RETURNING id
)
INSERT INTO sample_news_items (feed_id, title, content, source, source_url, category)
SELECT 
  finance_feed.id, 
  title, 
  content, 
  source, 
  source_url, 
  category
FROM finance_feed,
(VALUES
  ('Markets React to Federal Reserve Decision', 'Stock markets show volatility following the latest interest rate announcement.', 'marketwatch.com', '#', 'Finance'),
  ('Cryptocurrency Markets Surge', 'Major cryptocurrencies see significant gains as institutional adoption increases.', 'coindesk.com', '#', 'Finance')
) AS data(title, content, source, source_url, category);

-- World News category feed
WITH world_feed AS (
  INSERT INTO sample_news_feeds (title, date)
  VALUES ('News Summary', NOW())
  RETURNING id
)
INSERT INTO sample_news_items (feed_id, title, content, source, source_url, category)
SELECT 
  world_feed.id, 
  title, 
  content, 
  source, 
  source_url, 
  category
FROM world_feed,
(VALUES
  ('Global Leaders Meet at Climate Summit', 'Representatives from 150 countries gather to discuss emissions reduction targets.', 'globalpost.com', '#', 'World News'),
  ('New Trade Agreement Announced', 'Major economic powers sign landmark trade deal after years of negotiations.', 'worldeconomy.com', '#', 'World News')
) AS data(title, content, source, source_url, category);

-- Health category feed
WITH health_feed AS (
  INSERT INTO sample_news_feeds (title, date)
  VALUES ('News Summary', NOW())
  RETURNING id
)
INSERT INTO sample_news_items (feed_id, title, content, source, source_url, category)
SELECT 
  health_feed.id, 
  title, 
  content, 
  source, 
  source_url, 
  category
FROM health_feed,
(VALUES
  ('Medical Breakthrough in Cancer Research', 'Scientists announce promising results from novel treatment approach for advanced cancers.', 'healthnews.com', '#', 'Health'),
  ('New Guidelines for Preventive Care', 'Health organizations update recommendations for routine screenings and checkups.', 'medicaldaily.com', '#', 'Health')
) AS data(title, content, source, source_url, category);
