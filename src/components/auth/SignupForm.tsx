import { useState, useCallback } from 'react';
import { Mail, Lock, User } from 'lucide-react';

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
            setSuccess('Account created! Please check your email for a verification link.');
          } else {
            window.location.href = '/generate';
          }
        } else {
          throw new Error(data.message || 'Rejestracja nie powiodła się');
        }
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Wystąpił błąd');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [email, password, confirmPassword, validateForm]
  );

  if (success) {
    return (
      <div className="space-y-6 text-center pt-2">
        <Alert className="bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800 py-6">
          <AlertDescription className="text-emerald-700 dark:text-emerald-300 font-medium">
            {success}
          </AlertDescription>
        </Alert>
        <div className="pt-2">
          <a
            href="/auth/login"
            className="font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            Return to login
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive" className="py-3">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-semibold text-foreground">Email address</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="Enter your email"
            className="pl-10 h-11 border-input focus:border-foreground focus:ring-0 focus-visible:ring-0 transition-all"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
            }}
            disabled={isLoading}
          />
        </div>
        {fieldErrors.email && <p className="text-xs text-destructive mt-1">{fieldErrors.email}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-semibold text-foreground">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="Minimum 8 characters"
            className="pl-10 h-11 border-input focus:border-foreground focus:ring-0 focus-visible:ring-0 transition-all"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }));
            }}
            disabled={isLoading}
          />
        </div>
        {fieldErrors.password && <p className="text-xs text-destructive mt-1">{fieldErrors.password}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-sm font-semibold text-foreground">Confirm Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Repeat your password"
            className="pl-10 h-11 border-input focus:border-foreground focus:ring-0 focus-visible:ring-0 transition-all"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (fieldErrors.confirmPassword) setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
            }}
            disabled={isLoading}
          />
        </div>
        {fieldErrors.confirmPassword && <p className="text-xs text-destructive mt-1">{fieldErrors.confirmPassword}</p>}
      </div>

      <Button 
        type="submit" 
        className="w-full h-11 font-semibold rounded-md transition-all" 
        disabled={isLoading}
      >
        {isLoading ? 'Creating account...' : 'Create account'}
      </Button>

      <div className="text-center text-sm text-muted-foreground pt-2">
        Already have an account?{' '}
        <a href="/auth/login" className="font-semibold text-foreground hover:underline">
          Sign in
        </a>
      </div>
    </form>
  );
}
