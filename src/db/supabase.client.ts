import { createClient } from '@supabase/supabase-js';

import type { Database } from '../db/database.types.ts';
export type SupabaseClient = ReturnType<typeof createClient<Database>>;

// Stałe ID użytkownika używane podczas developmentu
export const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000000';

const supabaseUrl = import.meta.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey = import.meta.env.SUPABASE_KEY || 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';

console.log('Supabase URL:', supabaseUrl);
console.log('Anon key:', supabaseAnonKey);
console.log('Service key:', supabaseServiceKey);

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Service role client dla operacji administratorskich (bypasses RLS)
export const supabaseServiceClient = createClient<Database>(
  supabaseUrl, 
  supabaseServiceKey
);