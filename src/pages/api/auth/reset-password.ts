import type { APIRoute } from 'astro';

import { ResetPasswordSchema, formatZodErrors } from '../../../lib/schemas/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input with Zod
    const result = ResetPasswordSchema.safeParse(body);

    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: 'VALIDATION_ERROR',
          message: 'Nieprawidłowe dane',
          details: formatZodErrors(result.error),
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { email } = result.data;

    // Request password reset from Supabase
    const { error } = await locals.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${new URL(request.url).origin}/auth/reset-password`,
    });

    if (error) {
      console.error('[Auth] Reset password error:', error.message);

      // Don't reveal if email exists or not for security
      // Always return success message
    }

    // Always return success to prevent email enumeration
    console.log('[Auth] Password reset requested for:', email);

    return new Response(
      JSON.stringify({
        message: 'Jeśli konto istnieje, wysłaliśmy link do resetowania hasła na podany adres email.',
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

