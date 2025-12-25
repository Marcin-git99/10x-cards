import type { APIRoute } from 'astro';

import { supabaseServiceClient } from '../../../db/supabase.client';

export const prerender = false;

export const DELETE: APIRoute = async ({ locals }) => {
  try {
    // Check if user is authenticated
    if (!locals.user) {
      return new Response(
        JSON.stringify({
          error: 'UNAUTHORIZED',
          message: 'Musisz być zalogowany, aby usunąć konto',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const userId = locals.user.id;

    console.log('[Auth] Deleting account for user:', locals.user.email);

    // Delete user's flashcards first (cascade should handle this, but being explicit)
    const { error: flashcardsError } = await supabaseServiceClient
      .from('flashcards')
      .delete()
      .eq('user_id', userId);

    if (flashcardsError) {
      console.error('[Auth] Error deleting flashcards:', flashcardsError.message);
      // Continue with account deletion even if flashcards deletion fails
    }

    // Delete user's generations
    const { error: generationsError } = await supabaseServiceClient
      .from('generations')
      .delete()
      .eq('user_id', userId);

    if (generationsError) {
      console.error('[Auth] Error deleting generations:', generationsError.message);
      // Continue with account deletion
    }

    // Delete the user account using admin API
    const { error: deleteError } = await supabaseServiceClient.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('[Auth] Error deleting user:', deleteError.message);

      return new Response(
        JSON.stringify({
          error: 'DELETE_ERROR',
          message: 'Nie udało się usunąć konta. Spróbuj ponownie później.',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Sign out the user
    await locals.supabase.auth.signOut();

    console.log('[Auth] Account deleted successfully for user:', userId);

    return new Response(
      JSON.stringify({
        message: 'Konto zostało usunięte pomyślnie',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    console.error('[Auth] Unexpected error:', err);

    return new Response(
      JSON.stringify({
        error: 'SERVER_ERROR',
        message: 'Wystąpił błąd serwera. Spróbuj ponownie później',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

