# Development Environment Setup

This document outlines how to set up and use the development environment for the News Feed application.

## Overview

The application supports both production and development environments through separate database tables. This separation allows for:

- Testing without affecting production data
- Development of new features in isolation
- A clear visual indication when using the development environment
- More aggressive testing of data generation and deletion

## Database Structure

The application uses two parallel sets of tables in Supabase:

**Production Tables:**
- `news_feeds` - Stores the main news feeds
- `news_items` - Stores individual news items
- `form_submissions` - Stores user form submissions

**Development Tables:**
- `dev_news_feeds` - Development version of news feeds
- `dev_news_items` - Development version of news items
- `dev_form_submissions` - Development version of form submissions

The application code automatically detects which environment to use based on the `env` URL parameter.

## Setting Up the Development Environment

### 1. Create the Development Tables

You need to create the development tables in your Supabase database:

```bash
npm run setup-dev-db
```

This script will try to create the development tables. If this fails due to permissions, you'll need to run the SQL directly in the Supabase SQL Editor. The script will provide the necessary SQL.

### 2. Generate Development Test Data

Once the tables are created, you can generate test data:

```bash
npm run generate-dev-data
```

This will:
1. Prompt you to clear existing test data (if any)
2. Ask for a submission ID (or generate one automatically)
3. Ask how many feeds to generate
4. Create the test data and provide a direct link to view it

### 3. Accessing the Development Environment

To access the development environment, use the URL with the `env=dev` parameter:

```
http://localhost:5173/?env=dev
```

If you also want to load specific test data, include the submission ID:

```
http://localhost:5173/?id=your-submission-id&env=dev
```

A red banner will appear at the top of the page to indicate you're using the development environment.

## How It Works

### Code Structure

The application dynamically selects which tables to use based on the environment:

1. The URL is checked for the `env` parameter
2. If `env=dev`, table names are prefixed with `dev_`
3. Queries are made to the appropriate tables
4. All data operations (read, write, delete) use the selected tables

### Development Mode Features

When using development mode:
- A red "Development Environment" banner appears at the top of the page
- All operations use the development tables
- Real-time updates work with the development tables
- Form submissions go to development tables

## Recommended Development Workflow

1. Run the development server: `npm run dev`
2. Open the application with the development flag: `http://localhost:5173/?env=dev`
3. Generate new test data as needed: `npm run generate-dev-data`
4. Test features without affecting production data
5. When ready, switch to production by removing the `env` parameter

## Troubleshooting

### Cannot access development tables

Ensure your Supabase account has permissions to create and access tables. You might need to run the SQL directly from the Supabase SQL Editor if the setup script fails.

### Development data not showing

- Verify you're using the correct URL with `env=dev` parameter
- Check the console for any errors
- Run `npm run generate-dev-data` again to create fresh test data

### Switching between environments

- Development: `http://localhost:5173/?env=dev`
- Production: `http://localhost:5173/` (without env parameter)

Both environments can store and use different submission IDs. 