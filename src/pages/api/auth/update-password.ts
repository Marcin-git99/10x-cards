import type { APIRoute } from 'astro';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

export const prerender = false;

// Schema walidacji
const UpdatePasswordSchema = z.object({
  password: z.string().min(8, 'Hasło musi zawierać co najmniej 8 znaków'),
  accessToken: z.string().min(1, 'Token dostępu jest wymagany'),
  refreshToken: z.string().optional(),
});

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    // Walidacja danych wejściowych
    const result = UpdatePasswordSchema.safeParse(body);

    if (!result.success) {
      const errorMessages = result.error.issues.map(issue => issue.message);
      return new Response(
        JSON.stringify({
          error: 'VALIDATION_ERROR',
          message: errorMessages.join(', '),
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { password, accessToken, refreshToken } = result.data;

    // Utworzenie klienta Supabase z tokenem użytkownika
    const supabaseUrl = import.meta.env.SUPABASE_URL || 'http://127.0.0.1:54321';
    const supabaseAnonKey = import.meta.env.SUPABASE_KEY || 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Ustaw sesję z tokenem recovery
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken || '',
    });

    if (sessionError) {
      console.error('[Auth] Session error:', sessionError.message);
      return new Response(
        JSON.stringify({
          error: 'SESSION_ERROR',
          message: 'Link do resetowania hasła wygasł lub jest nieprawidłowy. Spróbuj ponownie.',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Aktualizacja hasła
    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    });

    if (updateError) {
      console.error('[Auth] Update password error:', updateError.message);
      
      let message = 'Nie udało się zmienić hasła. Spróbuj ponownie.';
      
      if (updateError.message.includes('same password')) {
        message = 'Nowe hasło musi być różne od poprzedniego';
      } else if (updateError.message.includes('weak')) {
        message = 'Hasło jest zbyt słabe. Użyj silniejszego hasła.';
      }

      return new Response(
        JSON.stringify({
          error: 'UPDATE_ERROR',
          message,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Wyloguj użytkownika po zmianie hasła (musi się zalogować ponownie)
    await supabase.auth.signOut();

    console.log('[Auth] Password updated successfully');

    return new Response(
      JSON.stringify({
        message: 'Hasło zostało zmienione pomyślnie',
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

