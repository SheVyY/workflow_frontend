# News Summary App

A web application that displays daily summaries of top articles from selected news sources.

## Setup

1. Install dependencies:
```
npm install
```

2. Run the development server:
```
npm run dev
```

## Supabase Setup

### 1. Create a Supabase Project

1. Go to [Supabase](https://supabase.com/) and sign up or log in
2. Create a new project and note your project URL and anon key
3. Update the `.env.local` file with your credentials

### 2. Create Database Tables

Run the following SQL in the Supabase SQL Editor:

```sql
-- Create users table (if not using Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create news feeds table
CREATE TABLE IF NOT EXISTS news_feeds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date DATE NOT NULL,
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS news_feeds_user_id_idx ON news_feeds(user_id);
CREATE INDEX IF NOT EXISTS news_items_feed_id_idx ON news_items(feed_id);
```

### 3. Enable Row-Level Security (RLS)

Enable RLS on all tables and create policies:

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can only access their own user data" 
  ON users FOR ALL 
  USING (id = auth.uid());

CREATE POLICY "Users can only access their own feeds" 
  ON news_feeds FOR ALL 
  USING (user_id = auth.uid());

CREATE POLICY "Users can access items from their feeds" 
  ON news_items FOR ALL 
  USING (feed_id IN (
    SELECT id FROM news_feeds WHERE user_id = auth.uid()
  ));
```

### 4. Sample Data Insertion

You can use this SQL to insert sample data for testing:

```sql
-- Insert a test user
INSERT INTO users (id, email)
VALUES ('user-123', 'test@example.com');

-- Insert a sample news feed
INSERT INTO news_feeds (id, user_id, title, date)
VALUES (
  'feed-123',
  'user-123',
  'News Summary',
  CURRENT_DATE
);

-- Insert sample news items
INSERT INTO news_items (feed_id, title, content, source, source_url, category)
VALUES
('feed-123', 'Honor''s $10B AI Investment', 'Chinese smartphone maker Honor will invest $10B over 5 years to expand AI in its devices.', 'TechCrunch', 'https://techcrunch.com/article/1', 'technology'),
('feed-123', 'Nvidia''s AI Growth & Stock Dip', 'AI chip sales drove a 78% revenue increase, but stock fell 8.5%. New Blackwell Ultra chip expected soon.', 'Reuters', 'https://reuters.com/article/1', 'finance'),
('feed-123', 'U.S. Considers AI Chip Export Ban', 'Possible trade restrictions on AI chip sales to China could impact Nvidia''s H20 & B20 processors.', 'Financial Times', 'https://ft.com/article/1', 'business'),
('feed-123', 'SoftBank''s $16B AI Investment', 'The firm plans to borrow $16B to expand AI initiatives, with another $8B loan possible in 2026.', 'WSJ', 'https://wsj.com/article/1', 'finance'),
('feed-123', 'Nvidia''s AI Dominance', 'Nvidia''s H100 chip fueled its $3.45T valuation, solidifying its lead in AI, gaming, and robotics.', 'Bloomberg', 'https://bloomberg.com/article/1', 'technology');
```

## Features

- Daily news summaries from selected sources
- Topic-based filtering
- Clean, responsive UI
- Real-time updates with Supabase

## Usage

1. **Media Sources**: Enter up to 3 English-language website domains (e.g., bbc.com, reuters.com). Note: Only English-language sources are supported as our scraper is optimized for English content.
2. **Topics**: Add up to 3 topics of interest (e.g., AI, Politics, Technology)
3. **Language**: Select your preferred language for receiving the summaries
4. **Email**: Enter your email address to receive the summaries
5. **Start**: Click the Start button to create your subscription

## Button Flow

The Start button changes state during submission:
- **Start**: Initial state, ready to submit
- **Sending...**: During the API request
- **Success!**: When subscription is created successfully
- Returns to **Start** after completion

## Logo Usage

This application uses the Doflo logo (doflo_logo.png). Make sure this file is placed in the root directory of the project for proper display.

## Setup

### Local Development
1. Place the `doflo_logo.png` file in the root directory
2. Run `npm install` to install dependencies
3. Run the application using `npx serve`
4. Access the app at http://localhost:3000

### Vercel Deployment
1. Ensure your repository includes all necessary files (including doflo_logo.png)
2. Install Vercel CLI: `npm install -g vercel`
3. Deploy to Vercel: `vercel`
4. For production deployment: `vercel --prod`

## vercel.json Configuration

The application includes a `vercel.json` file with the following configuration:
```json
{
  "version": 2,
  "builds": [
    { "src": "index.html", "use": "@vercel/static" },
    { "src": "*.{js,css,png,svg,jpg,jpeg,gif}", "use": "@vercel/static" }
  ],
  "routes": [
    { "src": "/(.*)", "dest": "/$1" }
  ]
}
```

This configuration ensures that all static files, including images, are correctly served by Vercel.

## Webhook Integration

The app sends subscription data to a webhook endpoint (https://eoeyekcgqu06mpf.m.pipedream.net) with the following payload structure:

```json
{
  "subscription": {
    "email": "user@example.com",
    "sources": [
      {
        "url": "https://example.com",
        "method": "GET"
      },
      {
        "url": "https://news.com",
        "method": "GET"
      }
    ],
    "topics": ["technology", "business"],
    "language": "english",
    "schedule": "8AM_UTC"
  },
  "metadata": {
    "timestamp": "2025-03-24T18:30:00.000Z",
    "client": "web",
    "version": "1.0.0"
  }
}
```

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- Vercel Hosting

# Webhook Tester

Simple scripts to send random JSON payloads to a webhook URL.

## JavaScript Version

To run the JavaScript version:

```bash
node webhook-sender.js
```

Requirements: Node.js installed on your system.

## Python Version

To run the Python version:

```bash
python webhook-sender.py
```

Requirements: Python installed with the `requests` library.
If you don't have the requests library, install it with:

```bash
pip install requests
```

## What these scripts do

Both scripts:
1. Generate a random JSON payload
2. Send it to the webhook URL (https://eoeyekcgqu06mpf.m.pipedream.net)
3. Display the response from the server # workflow_frontend
