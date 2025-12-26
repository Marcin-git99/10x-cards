import { useState, useCallback, useEffect } from 'react';
import { Lock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SetNewPasswordFormProps {
  accessToken: string;
  refreshToken?: string;
}

export default function SetNewPasswordForm({ accessToken, refreshToken }: SetNewPasswordFormProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {};

    if (!password) {
      errors.password = 'Hasło jest wymagane';
    } else if (password.length < 8) {
      errors.password = 'Hasło musi zawierać co najmniej 8 znaków';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Potwierdzenie hasła jest wymagane';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Hasła nie są zgodne';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [password, confirmPassword]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setSuccess(null);

      if (!validateForm()) {
        return;
      }

      setIsLoading(true);

      try {
        const response = await fetch('/api/auth/update-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            password,
            accessToken,
            refreshToken 
          }),
        });

        const data = await response.json();

        if (response.ok) {
          setSuccess('Hasło zostało zmienione pomyślnie! Za chwilę zostaniesz przekierowany do logowania...');
          setPassword('');
          setConfirmPassword('');
          
          // Redirect to login after 2 seconds
          setTimeout(() => {
            window.location.href = '/auth/login';
          }, 2000);
        } else {
          throw new Error(data.message || 'Wystąpił błąd podczas zmiany hasła');
        }
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Wystąpił nieoczekiwany błąd');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [password, confirmPassword, accessToken, refreshToken, validateForm]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive" className="py-3">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-200 py-3">
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
          Nowe hasło
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="Minimum 8 znaków"
            className="pl-10 h-11 border-gray-200 focus:border-black focus:ring-0 focus-visible:ring-0 transition-all"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }));
            }}
            disabled={isLoading || !!success}
          />
        </div>
        {fieldErrors.password && (
          <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">
          Potwierdź nowe hasło
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Powtórz hasło"
            className="pl-10 h-11 border-gray-200 focus:border-black focus:ring-0 focus-visible:ring-0 transition-all"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (fieldErrors.confirmPassword) setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
            }}
            disabled={isLoading || !!success}
          />
        </div>
        {fieldErrors.confirmPassword && (
          <p className="text-xs text-red-500 mt-1">{fieldErrors.confirmPassword}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full h-11 bg-gray-900 hover:bg-black text-white font-semibold rounded-md transition-all"
        disabled={isLoading || !!success}
      >
        {isLoading ? 'Zapisywanie...' : 'Ustaw nowe hasło'}
      </Button>

      <div className="text-center text-sm text-gray-500 pt-2">
        <a href="/auth/login" className="font-semibold text-gray-900 hover:underline">
          Powrót do logowania
        </a>
      </div>
    </form>
  );
}

