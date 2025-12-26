import { useState, useEffect } from 'react';
import ResetPasswordForm from './ResetPasswordForm';
import SetNewPasswordForm from './SetNewPasswordForm';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * Wrapper component that detects if user came from password reset email
 * and shows appropriate form:
 * - SetNewPasswordForm if access_token is present in URL hash
 * - ResetPasswordForm otherwise (to request reset email)
 */
export default function ResetPasswordWrapper() {
  const [mode, setMode] = useState<'loading' | 'request' | 'set'>('loading');
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Check for error in query params (e.g., expired token)
    const queryParams = new URLSearchParams(window.location.search);
    const error = queryParams.get('error');
    const errorCode = queryParams.get('error_code');
    const errorDescription = queryParams.get('error_description');

    if (error || errorCode) {
      if (errorCode === 'otp_expired') {
        setErrorMessage('Link do resetowania hasła wygasł. Wyślij nowy email z linkiem.');
      } else if (errorDescription) {
        setErrorMessage(decodeURIComponent(errorDescription.replace(/\+/g, ' ')));
      } else {
        setErrorMessage('Wystąpił błąd. Spróbuj wysłać nowy link do resetowania hasła.');
      }
      setMode('request');
      
      // Clean up URL
      window.history.replaceState(null, '', window.location.pathname);
      return;
    }

    // Check URL hash for tokens (Supabase puts them in fragment)
    const hash = window.location.hash.substring(1);
    const hashParams = new URLSearchParams(hash);
    
    const token = hashParams.get('access_token');
    const refresh = hashParams.get('refresh_token');
    const type = hashParams.get('type');

    if (token && type === 'recovery') {
      setAccessToken(token);
      setRefreshToken(refresh);
      setMode('set');
      
      // Clean up URL (remove hash)
      window.history.replaceState(null, '', window.location.pathname);
    } else {
      setMode('request');
    }
  }, []);

  if (mode === 'loading') {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (mode === 'set' && accessToken) {
    return (
      <SetNewPasswordForm 
        accessToken={accessToken} 
        refreshToken={refreshToken || undefined} 
      />
    );
  }

  return (
    <div className="space-y-4">
      {errorMessage && (
        <Alert variant="destructive" className="py-3">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      <ResetPasswordForm />
    </div>
  );
}

