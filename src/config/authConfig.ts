import { createClient } from '@supabase/supabase-js';

// ============================================================
// SUPABASE CONFIGURATION
// ============================================================
// Get these from your Supabase project settings:
// 1. Go to https://supabase.com/dashboard
// 2. Select your project
// 3. Go to Settings → API
// 4. Copy the URL and anon/public key
// ============================================================

// REPLACE THESE WITH YOUR SUPABASE VALUES
const SUPABASE_URL = 'YOUR_SUPABASE_URL';           // e.g., https://xxxxx.supabase.co
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // The "anon" / "public" key

// Allowed email domains (only these can sign up/login)
export const ALLOWED_EMAIL_DOMAINS = ['houseofclarence.com'];

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  return SUPABASE_URL !== 'YOUR_SUPABASE_URL' && 
         SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY';
};

// Validate email domain
export const isAllowedEmail = (email: string): boolean => {
  const domain = email.split('@')[1]?.toLowerCase();
  return ALLOWED_EMAIL_DOMAINS.some(allowed => domain === allowed.toLowerCase());
};
