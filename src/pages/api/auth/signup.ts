import type { APIRoute } from 'astro';

import { SignupSchema, formatZodErrors } from '../../../lib/schemas/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input with Zod
    const result = SignupSchema.safeParse(body);

    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: 'VALIDATION_ERROR',
          message: 'Nieprawidłowe dane rejestracji',
          details: formatZodErrors(result.error),
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { email, password } = result.data;

    // Sign up with Supabase Auth
    const { data, error } = await locals.supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error('[Auth] Signup error:', error.message);

      // Map Supabase errors to user-friendly messages
      let message = 'Rejestracja nie powiodła się';
      let status = 400;

      if (error.message.includes('User already registered')) {
        message = 'Konto z tym adresem email już istnieje';
      } else if (error.message.includes('Password should be at least')) {
        message = 'Hasło musi zawierać co najmniej 8 znaków';
      } else if (error.message.includes('Unable to validate email')) {
        message = 'Nieprawidłowy adres email';
      } else if (error.message.includes('Signups not allowed')) {
        message = 'Rejestracja jest obecnie wyłączona';
        status = 403;
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

    // Check if email confirmation is required
    const needsEmailConfirmation = data.user && !data.session;

    console.log('[Auth] User registered:', data.user?.email, 
      needsEmailConfirmation ? '(needs email confirmation)' : '(auto-confirmed)');

    return new Response(
      JSON.stringify({
        user: {
          id: data.user?.id,
          email: data.user?.email,
        },
        needsEmailConfirmation,
        message: needsEmailConfirmation 
          ? 'Konto utworzone. Sprawdź email, aby potwierdzić rejestrację.'
          : 'Konto utworzone pomyślnie',
      }),
      {
        status: 201,
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

