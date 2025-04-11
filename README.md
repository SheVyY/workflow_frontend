# News Summary Application

A web application that allows users to enter their news preferences, submit the form, and view personalized news summaries that update in real-time as new content is added to Supabase.

## Features

- Side-by-side layout with form and news output
- Real-time news updates via Supabase
- Responsive design
- Form validation and submission tracking
- News feed management with deletion capability
- Sample data for preview mode from the database

## Project Structure

The project follows a modular organization to improve maintainability:

```
project/
├── index.html            # Main HTML file
├── src/
│   ├── components/       # UI components
│   │   ├── FormHandler.js  # Form input handling and validation
│   │   └── NewsItem.js     # News display component
│   ├── services/         # API services
│   │   ├── dataService.js  # Unified data service (main entry point)
│   │   ├── formService.js  # Form submission service
│   │   ├── mockDataService.js # Offline/mock data provider
│   │   ├── newsService.js  # News feed fetching and management
│   │   └── supabase.js     # Supabase client configuration
│   ├── styles/           # CSS styles
│   │   └── styles.css      # Main stylesheet
│   ├── utils/            # Utility functions
│   │   ├── SampleData.js   # Sample news data for testing
│   │   └── UIHelpers.js    # UI helper functions
│   └── main.js           # Application entry point
├── scripts/              # Utility scripts
│   └── createTables.js   # Script to create database tables in Supabase
└── sql/                  # Database setup
    └── setup.sql         # Database schema and sample data
```

## Code Organization

### Components

- **FormHandler.js**: Manages form inputs, tag creation, validation, and submission
- **NewsItem.js**: Handles rendering and interaction with news items

### Services

- **dataService.js**: Unified service that connects to Supabase database
- **formService.js**: Handles form submissions and connects them to news feeds
- **newsService.js**: Manages news feed fetching, deletion, and real-time updates
- **supabase.js**: Configures the Supabase client for database operations

### Utils

- **UIHelpers.js**: Provides UI utility functions like toasts, loading states, etc.

### Main Application

The `main.js` file serves as the entry point, initializing the application and connecting all components.

## Database Integration

The application connects to a Supabase project for database storage and real-time updates. 
Supabase provides a PostgreSQL database with real-time capabilities, making it ideal for 
this application's needs.

## Database Schema

The application uses the following schema:

1. **news_feeds**: Stores information about each news feed
   - Linked to a specific form submission through submission_id

2. **news_items**: Stores individual news stories
   - Linked to a news feed through feed_id

3. **form_submissions**: Tracks user form inputs
   - Stores submission_id for linking to corresponding news feeds

## Getting Started

1. Clone the repository
2. Install dependencies with `npm install`
3. Copy `.env.template` to `.env.local` and fill in your Supabase credentials
4. Run the SQL in `sql/create_tables.sql` on your Supabase project
5. Run the SQL in `sql/fix_rls_policies.sql` to set up proper permissions
6. Start the development server with `npm run dev`

## Database Schema

The application uses the following Supabase tables:

1. **news_feeds**: Stores information about each news feed
   - Linked to a specific form submission through submission_id

2. **news_items**: Stores individual news stories
   - Linked to a news feed through feed_id

3. **form_submissions**: Tracks user form inputs
   - Stores submission_id for linking to corresponding news feeds

## Webhook Integration

The app sends subscription data to a webhook endpoint with the following payload structure:

```json
{
  "subscription": {
    "email": "user@example.com",
    "sources": [
      {
        "url": "https://example.com",
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

### Webhook Handler

The application includes a webhook handler script that can receive incoming webhook data:

```bash
node scripts/webhookHandler.js
```

This will start a server that listens for webhook requests on port 3001. Incoming data will be processed and stored in your Supabase database.

## Environment Configuration

The application uses environment variables for configuration. Create a `.env.local` file with:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_DATABASE_NAME=your-database-name

# Webhook Configuration
VITE_WEBHOOK_URL=your-webhook-url
```

## Running the Application

The application connects to Supabase by default. Make sure you have:
1. Set up your Supabase project
2. Created the required tables
3. Added your Supabase credentials to `.env.local`
4. Run `npm run dev` to start the development server

## Development

This project is set up with a modular structure to make it easier to maintain and extend. When adding new features:

1. Create new components in the `components/` directory
2. Add services for API interactions in the `services/` directory
3. Place helper utilities in the `utils/` directory
4. Update the main application file as needed

## License

MIT

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
-- Create news feeds table
CREATE TABLE IF NOT EXISTS news_feeds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
CREATE INDEX IF NOT EXISTS news_items_feed_id_idx ON news_items(feed_id);
```

### 3. Set Public Access

Since we're not using authentication for this testing phase, we'll set tables to be publicly readable:

```sql
-- Enable public access for reading data
CREATE POLICY "Allow public read access to news feeds" 
  ON news_feeds FOR SELECT 
  USING (true);

CREATE POLICY "Allow public read access to news items" 
  ON news_items FOR SELECT 
  USING (true);

-- Enable RLS
ALTER TABLE news_feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_items ENABLE ROW LEVEL SECURITY;
```

### 4. Sample Data Insertion

You can use this SQL to insert sample data for testing:

```sql
-- Insert a sample news feed
INSERT INTO news_feeds (id, title, date)
VALUES (
  'feed-123',
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

## Final Implementation Summary

This project implements a news summary application with the following features:

1. **User Interface**:
   - Side-by-side layout with form on the left and news output on the right
   - Input validation for email, domains, and required fields
   - Interactive tags for sources and topics
   - Form submission with loading state

2. **Data Storage**:
   - Supabase integration for database storage
   - Support for form submissions, news feeds, and news items
   - Real-time updates using Supabase's real-time capabilities
   - Row-Level Security policies for data protection

3. **Webhook Integration**:
   - Form submissions are sent to an external webhook endpoint
   - Data from webhook can be processed and stored in the database
   - Preview functionality pulls sample data from the database

4. **Development Tools**:
   - Scripts for setting up database tables and RLS policies
   - SQL files for database schema and permissions
   - Environment variable templates for easy configuration

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
