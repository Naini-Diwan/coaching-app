import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 1. The main client for normal app usage (this is what state.ts is looking for)
export const supabase = createClient(supabaseUrl, supabaseKey);

// 2. The silent client for admin registration only
export const registrationClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});