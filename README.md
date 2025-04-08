# News Summary App

A simple app that provides daily summaries of top articles from selected news sources on topics of interest.

## Features

- Select multiple news sources (up to 3)
- Specify topics of interest (up to 3)
- Choose your preferred language (English or Czech) for receiving summaries
- Receive daily summaries to your email at 8:00 AM UTC

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
