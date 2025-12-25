/// <reference types="astro/client" />

import type { SupabaseServerClient } from './db/supabase.client';

// User type for authenticated sessions
export interface User {
  id: string;
  email: string;
}

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseServerClient;
      user: User | null;
    }
  }
}

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly SUPABASE_SERVICE_ROLE_KEY: string;
  readonly OPENAI_API_KEY: string;
  readonly PROD: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
