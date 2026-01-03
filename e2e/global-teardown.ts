import { createClient } from '@supabase/supabase-js';
import type { FullConfig } from '@playwright/test';

/**
 * Global Teardown for E2E Tests
 * 
 * Cleans up test data after all E2E tests have completed.
 * 
 * Strategy:
 * 1. Login as E2E test user to respect Row-Level Security (RLS)
 * 2. Delete data from tables in correct order (respecting foreign keys)
 * 3. Sign out
 * 
 * Tables cleaned (in order):
 * - flashcards (has FK to generations)
 * - generations
 * - generation_error_logs
 * 
 * Note: This approach works when single developer runs tests.
 * For parallel multi-developer scenarios, consider isolated test databases.
 */
async function globalTeardown(_config: FullConfig) {
  console.warn('\n🧹 Starting E2E teardown - cleaning test data...\n');

  // Get environment variables
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_PUBLIC_KEY;
  const e2eUsername = process.env.E2E_USERNAME;
  const e2ePassword = process.env.E2E_PASSWORD;

  // Validate required environment variables
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_KEY environment variables');
    console.warn('Skipping teardown - no database connection available');
    return;
  }

  if (!e2eUsername || !e2ePassword) {
    console.error('❌ Missing E2E_USERNAME or E2E_PASSWORD environment variables');
    console.warn('Skipping teardown - cannot authenticate');
    return;
  }

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Step 1: Sign in as E2E test user to respect RLS
    console.warn('🔐 Signing in as E2E test user...');
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: e2eUsername,
      password: e2ePassword,
    });

    if (signInError) {
      console.error('❌ Error signing in:', signInError.message);
      throw signInError;
    }
    console.warn('✅ Signed in successfully');

    // Step 2: Clean tables in correct order (respect FK constraints)
    
    // 2a. Delete flashcards first (has FK to generations)
    console.warn('🗑️  Deleting flashcards...');
    const { error: flashcardsError } = await supabase
      .from('flashcards')
      .delete()
      .gte('id', 0); // Match all rows for the authenticated user (RLS handles filtering)

    if (flashcardsError) {
      console.error('❌ Error deleting flashcards:', flashcardsError.message);
    } else {
      console.warn('✅ Deleted flashcards');
    }

    // 2b. Delete generations
    console.warn('🗑️  Deleting generations...');
    const { error: generationsError } = await supabase
      .from('generations')
      .delete()
      .gte('id', 0);

    if (generationsError) {
      console.error('❌ Error deleting generations:', generationsError.message);
    } else {
      console.warn('✅ Deleted generations');
    }

    // 2c. Delete generation error logs
    console.warn('🗑️  Deleting generation_error_logs...');
    const { error: errorLogsError } = await supabase
      .from('generation_error_logs')
      .delete()
      .gte('id', 0);

    if (errorLogsError) {
      console.error('❌ Error deleting generation_error_logs:', errorLogsError.message);
    } else {
      console.warn('✅ Deleted generation_error_logs');
    }

    // Step 3: Sign out
    console.warn('🚪 Signing out...');
    await supabase.auth.signOut();
    console.warn('✅ Signed out');

    console.warn('\n✨ E2E teardown completed successfully!\n');

  } catch (error) {
    console.error('\n❌ E2E teardown failed:', error);
    // Don't throw - teardown failure shouldn't fail the test run
  }
}

export default globalTeardown;

