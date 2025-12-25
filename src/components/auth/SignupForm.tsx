import { useState, useCallback } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function SignupForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {};

    if (!email.trim()) {
      errors.email = 'Adres email jest wymagany';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Nieprawidłowy adres email';
    }

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
  }, [email, password, confirmPassword]);

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
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password, confirmPassword }),
        });

        const data = await response.json();

        if (response.ok) {
          if (data.needsEmailConfirmation) {
            setSuccess('Konto utworzone! Sprawdź swoją skrzynkę email, aby potwierdzić rejestrację.');
          } else {
            // Auto-confirmed - redirect to generate page (US-001)
            window.location.href = '/generate';
          }
        } else {
          throw new Error(data.message || 'Rejestracja nie powiodła się');
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
    [email, password, confirmPassword, validateForm]
  );

  // If registration successful and needs email confirmation, show success view
  if (success) {
    return (
      <div className="space-y-6 text-center">
        <Alert>
          <AlertDescription className="text-green-600">{success}</AlertDescription>
        </Alert>
        <a
          href="/auth/login"
          className="inline-block font-medium text-blue-600 hover:text-blue-500"
        >
          Wróć do logowania
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Adres Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="jan@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (fieldErrors.email) {
              setFieldErrors((prev) => ({ ...prev, email: '' }));
            }
          }}
          disabled={isLoading}
          aria-invalid={!!fieldErrors.email}
          aria-describedby={fieldErrors.email ? 'email-error' : undefined}
        />
        {fieldErrors.email && (
          <p id="email-error" className="text-sm text-red-500">
            {fieldErrors.email}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Hasło</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="Minimum 8 znaków"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (fieldErrors.password) {
              setFieldErrors((prev) => ({ ...prev, password: '' }));
            }
          }}
          disabled={isLoading}
          aria-invalid={!!fieldErrors.password}
          aria-describedby={fieldErrors.password ? 'password-error' : undefined}
        />
        {fieldErrors.password && (
          <p id="password-error" className="text-sm text-red-500">
            {fieldErrors.password}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Potwierdź hasło</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="Powtórz hasło"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (fieldErrors.confirmPassword) {
              setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
            }
          }}
          disabled={isLoading}
          aria-invalid={!!fieldErrors.confirmPassword}
          aria-describedby={fieldErrors.confirmPassword ? 'confirm-password-error' : undefined}
        />
        {fieldErrors.confirmPassword && (
          <p id="confirm-password-error" className="text-sm text-red-500">
            {fieldErrors.confirmPassword}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Rejestracja...' : 'Zarejestruj się'}
      </Button>

      <div className="text-center text-sm text-gray-600">
        Masz już konto?{' '}
        <a href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
          Zaloguj się
        </a>
      </div>
    </form>
  );
}

