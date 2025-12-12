import { createClient } from '@supabase/supabase-js';

// Supabase configuration for HOC Internal Dashboard
const SUPABASE_URL = 'https://kyhhuejvxvrfddmckzsb.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ospU2ilvrGhg7VEyxcz29Q_m80IeRtI';

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

