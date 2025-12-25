import type { AstroCookies } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { createServerClient, type CookieOptionsWithName } from '@supabase/ssr';

import type { Database } from './database.types';

// Type exports
export type SupabaseClient = ReturnType<typeof createClient<Database>>;
export type SupabaseServerClient = ReturnType<typeof createServerClient<Database>>;

// Stałe ID użytkownika używane podczas developmentu (do usunięcia po pełnej integracji auth)
export const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000000';

// Environment variables
const supabaseUrl = import.meta.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey =
  import.meta.env.SUPABASE_KEY || 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';
const supabaseServiceKey =
  import.meta.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';

// Cookie options for auth tokens
export const cookieOptions: CookieOptionsWithName = {
  path: '/',
  secure: import.meta.env.PROD,
  httpOnly: true,
  sameSite: 'lax',
};

/**
 * Parse Cookie header string into array of { name, value } objects
 */
function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  if (!cookieHeader) return [];
  return cookieHeader.split(';').map((cookie) => {
    const [name, ...rest] = cookie.trim().split('=');
    return { name, value: rest.join('=') };
  });
}

/**
 * Create Supabase server client with proper cookie handling for SSR
 * Use this in middleware and API routes
 */
export const createSupabaseServerInstance = (context: {
  headers: Headers;
  cookies: AstroCookies;
}) => {
  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookieOptions,
    cookies: {
      getAll() {
        return parseCookieHeader(context.headers.get('Cookie') ?? '');
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          context.cookies.set(name, value, options)
        );
      },
    },
  });
};

// Legacy client for backwards compatibility (use createSupabaseServerInstance in new code)
export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Service role client for admin operations (bypasses RLS)
export const supabaseServiceClient = createClient<Database>(supabaseUrl, supabaseServiceKey);
