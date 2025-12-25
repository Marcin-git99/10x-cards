import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ locals }) => {
  try {
    const { error } = await locals.supabase.auth.signOut();

    if (error) {
      console.error('[Auth] Logout error:', error.message);

      return new Response(
        JSON.stringify({
          error: 'AUTH_ERROR',
          message: 'Wylogowanie nie powiodło się',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[Auth] User logged out');

    return new Response(
      JSON.stringify({
        message: 'Wylogowano pomyślnie',
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
        message: 'Wystąpił błąd serwera',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

