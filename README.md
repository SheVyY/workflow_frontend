# News Feed Application

A real-time news aggregation application that provides summaries of news articles from various sources grouped by category.

## Features

- Real-time updates of news feeds
- Categorized news summaries
- Source and topic filtering
- Mobile responsive design
- Collapsible feed sections
- Source domain and topic badges for each article

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm
- Supabase account

### Installation

1. Clone the repository
   ```
   git clone <repository-url>
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Create a `.env.local` file with your Supabase credentials
   ```
   SUPABASE_URL=your-supabase-url
   SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_KEY=your-supabase-service-key
   
   # For Vite
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. Run the development server
   ```
   npm run dev
   ```

5. Open the application in your browser
   ```
   http://localhost:5173
   ```

## Project Structure

- `src/` - Source code
  - `components/` - UI components
  - `services/` - Data services
  - `utils/` - Utility functions
  - `styles/` - CSS styles
- `scripts/` - Helper scripts
- `public/` - Static assets

## Development Environment

This project supports separate development and production environments using isolated database tables.

For development:
1. Set up the development tables: `npm run setup-dev-db`
2. Generate test data: `npm run generate-dev-data`
3. Access the dev environment: `http://localhost:5173/?env=dev`

For more details, see [DEVELOPMENT.md](DEVELOPMENT.md).

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run setup-db` - Set up the production database tables
- `npm run setup-dev-db` - Set up the development database tables
- `npm run generate-test-data` - Generate test data for production
- `npm run generate-dev-data` - Generate test data for development

## License

This project is licensed under the MIT License.
