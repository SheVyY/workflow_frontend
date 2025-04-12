/**
 * Development Data Generator
 * This script generates test data for development environment tables (dev_news_feeds, dev_news_items)
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import readline from 'readline';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Get Supabase connection info from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

// Validate credentials
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env.local file.');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Available categories
const CATEGORIES = [
  'Technology', 
  'Business', 
  'Finance', 
  'World News', 
  'Politics', 
  'Science', 
  'Health', 
  'Sports', 
  'Entertainment',
  'Culture'
];

// News sources with domains
const NEWS_SOURCES = [
  { name: 'Tech Crunch', domain: 'techcrunch.com' },
  { name: 'The Verge', domain: 'theverge.com' },
  { name: 'Wall Street Journal', domain: 'wsj.com' },
  { name: 'CNBC', domain: 'cnbc.com' },
  { name: 'Bloomberg', domain: 'bloomberg.com' },
  { name: 'Reuters', domain: 'reuters.com' },
  { name: 'BBC News', domain: 'bbc.com' },
  { name: 'CNN', domain: 'cnn.com' },
  { name: 'The Guardian', domain: 'theguardian.com' },
  { name: 'New York Times', domain: 'nytimes.com' }
];

// Article title templates by category
const TITLE_TEMPLATES = {
  'Technology': [
    'New [TECH] Breakthrough Could Revolutionize [INDUSTRY]',
    '[COMPANY] Announces Next-Gen [PRODUCT] with [FEATURE]',
    'Study Shows [PERCENTAGE]% of [USERS] Now Use [TECH] Daily',
    'The Future of [TECH]: What to Expect in [YEAR]',
    '[TECH] Security Concerns Rise After Recent [EVENT]'
  ],
  'Business': [
    '[COMPANY] Reports [PERCENTAGE]% [GROWTH] in Q[QUARTER] Earnings',
    'New Study Reveals [INDUSTRY] Trends for [YEAR]',
    '[COMPANY] Acquires [TARGET] for $[AMOUNT] Billion',
    '[CEO] Steps Down as [COMPANY] Chief After [NUMBER] Years',
    '[INDUSTRY] Leaders Gather for Annual [EVENT] Conference'
  ],
  'Finance': [
    '[CURRENCY] Reaches [VALUE] as [COUNTRY] [POLICY] Takes Effect',
    '[BANK] Announces New [SERVICE] for [CUSTOMER_TYPE] Clients',
    'Investors React to [EVENT], [MARKET] [MOVEMENT] by [PERCENTAGE]%',
    '[ANALYST] Predicts [TREND] Will Continue Through [TIMEFRAME]',
    'New [REGULATION] Could Impact [SECTOR] Markets'
  ],
  'World News': [
    '[COUNTRY] and [COUNTRY] Sign Historic [AGREEMENT] After [TIMEFRAME] of Talks',
    '[COUNTRY] Faces [CHALLENGE] as [EVENT] Continues',
    'Leaders Gather for [SUMMIT] to Discuss [ISSUE]',
    '[ORG] Report Shows [ISSUE] Affecting [NUMBER] Million People Worldwide',
    'New [POLICY] in [COUNTRY] Sparks [REACTION] from International Community'
  ],
  'Politics': [
    '[OFFICIAL] Announces [POLICY] Plan to Address [ISSUE]',
    '[PARTY] Gains Support After Recent [EVENT]',
    'Poll Shows [PERCENTAGE]% Approval Rating for [POLICY]',
    '[OFFICIAL] and [OFFICIAL] Clash Over [ISSUE] During [EVENT]',
    'New [LEGISLATION] Passes with [VOTE_COUNT] Vote in [BODY]'
  ]
};

// Fill in templates with appropriate values
function fillTemplate(template, category) {
  const replacements = {
    '[TECH]': ['AI', 'Blockchain', 'Quantum Computing', '5G', 'VR', 'IoT', 'Robotics'],
    '[INDUSTRY]': ['Healthcare', 'Manufacturing', 'Finance', 'Entertainment', 'Education', 'Agriculture'],
    '[COMPANY]': ['Google', 'Apple', 'Microsoft', 'Amazon', 'Meta', 'Tesla', 'Samsung', 'IBM'],
    '[PRODUCT]': ['Smartphone', 'Processor', 'Software Platform', 'Service', 'AI Assistant', 'Cloud Solution'],
    '[FEATURE]': ['Enhanced Privacy', 'AI Integration', 'Faster Performance', 'New Interface', 'Extended Battery Life'],
    '[PERCENTAGE]': ['12', '25', '37', '48', '53', '67', '75', '82', '91'],
    '[USERS]': ['Americans', 'Consumers', 'Businesses', 'Developers', 'Professionals', 'Households'],
    '[YEAR]': ['2023', '2024', '2025', '2030'],
    '[EVENT]': ['Breach', 'Conference', 'Update', 'Announcement', 'Regulatory Change', 'Election', 'Market Shift'],
    '[GROWTH]': ['Growth', 'Increase', 'Decline', 'Drop'],
    '[QUARTER]': ['1', '2', '3', '4'],
    '[TARGET]': ['Startup', 'Competitor', 'Tech Firm', 'Platform', 'Service Provider'],
    '[AMOUNT]': ['1.2', '2.5', '4.8', '7.3', '10', '15.6', '22.4'],
    '[CEO]': ['CEO', 'Founder', 'President', 'Executive'],
    '[NUMBER]': ['5', '7', '10', '12', '15', '20'],
    '[CURRENCY]': ['Bitcoin', 'Ethereum', 'Dollar', 'Euro', 'Yen', 'Yuan'],
    '[VALUE]': ['All-time High', 'New Low', 'Stable Value', 'Predicted Value'],
    '[COUNTRY]': ['US', 'China', 'India', 'Germany', 'Brazil', 'UK', 'Japan', 'Australia'],
    '[POLICY]': ['Monetary Policy', 'Economic Policy', 'Fiscal Stimulus', 'Regulation', 'Trade Policy'],
    '[BANK]': ['JPMorgan', 'Bank of America', 'Wells Fargo', 'Citigroup', 'Goldman Sachs'],
    '[SERVICE]': ['Investment Platform', 'Advisory Service', 'Digital Banking', 'Trading Tool'],
    '[CUSTOMER_TYPE]': ['Retail', 'Institutional', 'High-Net-Worth', 'Small Business'],
    '[MARKET]': ['Stock Market', 'Crypto Market', 'Housing Market', 'Bond Market'],
    '[MOVEMENT]': ['Rises', 'Falls', 'Fluctuates', 'Stabilizes'],
    '[ANALYST]': ['Analysts', 'Experts', 'Economists', 'Strategists'],
    '[TREND]': ['Inflation', 'Growth', 'Volatility', 'Recovery', 'Downturn'],
    '[TIMEFRAME]': ['Q3', 'Q4', 'H1', 'H2', 'the Year', 'Next Quarter'],
    '[REGULATION]': ['Regulation', 'Framework', 'Oversight', 'Compliance Requirements'],
    '[SECTOR]': ['Tech', 'Energy', 'Healthcare', 'Financial', 'Consumer'],
    '[AGREEMENT]': ['Trade Deal', 'Peace Agreement', 'Treaty', 'Climate Accord'],
    '[CHALLENGE]': ['Economic Crisis', 'Political Instability', 'Natural Disaster', 'Social Unrest'],
    '[SUMMIT]': ['G20 Summit', 'UN Assembly', 'Climate Conference', 'Economic Forum'],
    '[ISSUE]': ['Climate Change', 'Trade Tensions', 'Refugee Crisis', 'Economic Inequality', 'Healthcare Access'],
    '[ORG]': ['UN', 'WHO', 'World Bank', 'IMF', 'UNICEF'],
    '[REACTION]': ['Concern', 'Support', 'Criticism', 'Debate', 'Protests'],
    '[OFFICIAL]': ['President', 'Prime Minister', 'Senator', 'Minister', 'Governor'],
    '[PARTY]': ['Democratic Party', 'Republican Party', 'Conservative Party', 'Liberal Party', 'Green Party'],
    '[LEGISLATION]': ['Bill', 'Act', 'Law', 'Amendment', 'Resolution'],
    '[VOTE_COUNT]': ['Unanimous', 'Majority', 'Narrow', 'Bipartisan', 'Split'],
    '[BODY]': ['Senate', 'House', 'Parliament', 'Congress', 'Assembly']
  };

  let result = template;
  
  for (const [placeholder, options] of Object.entries(replacements)) {
    if (result.includes(placeholder)) {
      const replacement = options[Math.floor(Math.random() * options.length)];
      result = result.replace(placeholder, replacement);
    }
  }
  
  return result;
}

// Generate a random article content based on the title
function generateContent(title, category) {
  const paragraphs = 2 + Math.floor(Math.random() * 2); // 2-3 paragraphs
  let content = '';
  
  // Take words from title to incorporate into content for coherence
  const titleWords = title.split(' ').filter(word => word.length > 4);
  
  for (let i = 0; i < paragraphs; i++) {
    const sentences = 2 + Math.floor(Math.random() * 3); // 2-4 sentences per paragraph
    let paragraph = '';
    
    for (let j = 0; j < sentences; j++) {
      // Sometimes incorporate a word from the title
      let sentence = '';
      if (titleWords.length > 0 && Math.random() > 0.5) {
        const keyword = titleWords[Math.floor(Math.random() * titleWords.length)];
        const templates = [
          `Further details about ${keyword} have emerged.`,
          `Experts are discussing the implications of ${keyword} for the industry.`,
          `The development of ${keyword} has been in progress for several years.`,
          `Market analysts predict significant impact from ${keyword} in coming months.`,
          `Several companies are investing heavily in ${keyword} technologies.`
        ];
        sentence = templates[Math.floor(Math.random() * templates.length)];
      } else {
        // Generic sentence related to the category
        const templates = [
          `This represents a significant development in the ${category} sector.`,
          `Analysts have been monitoring this situation closely.`,
          `The implications could be far-reaching for stakeholders.`,
          `Industry experts have expressed varying opinions on this matter.`,
          `Several factors contributed to this outcome.`,
          `Future developments will likely depend on market conditions.`,
          `The timing of this announcement has raised some questions.`,
          `Related initiatives are expected to follow in the coming months.`
        ];
        sentence = templates[Math.floor(Math.random() * templates.length)];
      }
      
      paragraph += sentence + ' ';
    }
    
    content += paragraph.trim() + '\n\n';
  }
  
  return content.trim();
}

// Generate a news feed with multiple items
function generateNewsFeed(submissionId, category = null) {
  // Randomly select category if not provided
  const feedCategory = category || CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
  
  // Create 3-5 news items per feed
  const itemCount = 3 + Math.floor(Math.random() * 3);
  const newsItems = [];
  
  for (let i = 0; i < itemCount; i++) {
    // Get random title template for this category or use general template
    const titleTemplates = TITLE_TEMPLATES[feedCategory] || 
      TITLE_TEMPLATES['Technology']; // Fallback to technology templates
    
    const titleTemplate = titleTemplates[Math.floor(Math.random() * titleTemplates.length)];
    const title = fillTemplate(titleTemplate, feedCategory);
    
    // Get random source
    const source = NEWS_SOURCES[Math.floor(Math.random() * NEWS_SOURCES.length)];
    
    newsItems.push({
      title,
      content: generateContent(title, feedCategory),
      source: source.name,
      source_url: `https://${source.domain}/article-${Math.floor(Math.random() * 10000)}`,
      category: feedCategory
    });
  }
  
  return {
    submission_id: submissionId,
    category: feedCategory,
    title: `${feedCategory} Summary`,
    date: new Date().toISOString(),
    news_items: newsItems
  };
}

// Check if tables exist before proceeding
async function checkDevTables() {
  try {
    // Check if dev_news_feeds table exists
    const { data, error } = await supabase
      .from('dev_news_feeds')
      .select('id')
      .limit(1);
    
    if (error) {
      if (error.code === '42P01') { // Table doesn't exist error
        console.error('❌ Dev tables not found. Please run the SQL setup script first.');
        console.error('Run: npm run setup-dev-db');
        console.error('\nOr run the SQL directly in the Supabase SQL editor. The SQL can be found in the setup script output.');
        return false;
      }
      
      // Other errors
      console.error('Error checking dev tables:', error);
      return false;
    }
    
    // Table exists
    console.log('✅ Dev tables found and accessible');
    return true;
  } catch (error) {
    console.error('Error checking dev tables:', error);
    return false;
  }
}

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Main function to insert dev test data
async function insertDevTestData() {
  console.log('🔌 Connected to Supabase (DEV MODE):', supabaseUrl);
  
  // Check if dev tables exist
  const tablesExist = await checkDevTables();
  if (!tablesExist) {
    rl.close();
    return;
  }
  
  // Clear existing data prompt
  rl.question('Clear existing dev data first? (y/n): ', async (answer) => {
    if (answer.toLowerCase() === 'y') {
      try {
        console.log('Clearing existing dev data...');
        
        // Delete all existing data from dev_news_feeds (cascades to dev_news_items)
        const { error } = await supabase
          .from('dev_news_feeds')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows
        
        if (error) {
          console.error('Error clearing dev data:', error);
        } else {
          console.log('✅ Existing dev data cleared successfully');
        }
      } catch (error) {
        console.error('Error clearing dev data:', error);
      }
    }
    
    rl.question('Enter a submission ID (or leave blank to generate one): ', async (submissionId) => {
      // Generate a random submission ID if not provided
      const feedSubmissionId = submissionId || `dev-${Date.now().toString(36)}`;
      console.log(`Using submission ID: ${feedSubmissionId}`);
      
      rl.question('How many feeds do you want to generate? (default: 3): ', async (feedCountInput) => {
        const feedCount = parseInt(feedCountInput) || 3;
        console.log(`Generating ${feedCount} feeds...`);
        
        let insertedFeeds = 0;
        
        // Generate feeds
        for (let i = 0; i < feedCount; i++) {
          const categoryIndex = i % CATEGORIES.length;
          const feed = generateNewsFeed(feedSubmissionId, CATEGORIES[categoryIndex]);
          
          // Insert the feed to dev_news_feeds table
          const { data: feedData, error: feedError } = await supabase
            .from('dev_news_feeds')
            .insert({
              submission_id: feed.submission_id,
              title: feed.title,
              category: feed.category,
              date: feed.date
            })
            .select('id');
            
          if (feedError) {
            console.error(`Error inserting feed ${i+1}:`, feedError);
            continue;
          }
          
          console.log(`✅ Inserted feed ${i+1} (${feed.category})`);
          insertedFeeds++;
          
          // Get the feed ID
          const feedId = feedData[0].id;
          
          let insertedItems = 0;
          
          // Insert news items for this feed to dev_news_items table
          for (const item of feed.news_items) {
            const { error: itemError } = await supabase
              .from('dev_news_items')
              .insert({
                feed_id: feedId,
                title: item.title,
                content: item.content,
                source: item.source,
                source_url: item.source_url,
                category: feed.category
              });
              
            if (itemError) {
              console.error(`Error inserting news item:`, itemError);
            } else {
              insertedItems++;
            }
          }
          
          console.log(`  └─ Added ${insertedItems} news items`);
        }
        
        if (insertedFeeds > 0) {
          console.log('\n🎉 DEV test data generation complete!');
          console.log(`Inserted ${insertedFeeds}/${feedCount} feeds with a total of ${insertedFeeds * 4} news items (approx)`);
          console.log(`To view the feeds, use submission ID: ${feedSubmissionId}`);
          console.log('\nYou can now open your development application and see the test feeds.');
          console.log(`\nOpen this link to automatically load the test data:`);
          console.log(`http://localhost:5173/?id=${feedSubmissionId}&env=dev`);
        } else {
          console.log('\n❌ Failed to insert any feeds. Please check the errors above.');
        }
        
        rl.close();
      });
    });
  });
}

// Run the script
insertDevTestData(); 