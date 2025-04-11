import { createClient } from '@supabase/supabase-js';

// These values should be stored in environment variables in production
const supabaseUrl = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

// Create a single supabase client for the entire application
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase; 