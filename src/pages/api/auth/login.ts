import type { APIRoute } from 'astro';

import { LoginSchema, formatZodErrors } from '../../../lib/schemas/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input with Zod
    const result = LoginSchema.safeParse(body);

    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: 'VALIDATION_ERROR',
          message: 'Nieprawidłowe dane logowania',
          details: formatZodErrors(result.error),
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { email, password } = result.data;

    // Sign in with Supabase Auth
    const { data, error } = await locals.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('[Auth] Login error:', error.message);

      // Map Supabase errors to user-friendly messages
      let message = 'Nieprawidłowy email lub hasło';
      let status = 401;

      if (error.message.includes('Invalid login credentials')) {
        message = 'Nieprawidłowy email lub hasło';
      } else if (error.message.includes('Email not confirmed')) {
        message = 'Adres email nie został potwierdzony';
      } else if (error.message.includes('Too many requests')) {
        message = 'Zbyt wiele prób logowania. Spróbuj ponownie później';
        status = 429;
      }

      return new Response(
        JSON.stringify({
          error: 'AUTH_ERROR',
          message,
        }),
        {
          status,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Success - session is automatically set via cookies by Supabase SSR
    console.log('[Auth] User logged in:', data.user?.email);

    return new Response(
      JSON.stringify({
        user: {
          id: data.user?.id,
          email: data.user?.email,
        },
        message: 'Zalogowano pomyślnie',
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

