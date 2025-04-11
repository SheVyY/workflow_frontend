import { createClient } from '@supabase/supabase-js';

// Get Supabase URL and anon key from environment variables
// These need to be available in the browser environment through Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate that credentials are available
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.');
}

// Log which URL we're connecting to (but don't expose the key)
console.log(`Connecting to Supabase at: ${supabaseUrl}`);

// Create a single supabase client for the entire application
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase; 