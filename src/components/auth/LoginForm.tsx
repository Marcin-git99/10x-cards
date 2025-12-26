import { useState, useCallback } from 'react';
import { Mail, Lock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [email, password]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      if (!validateForm()) {
        return;
      }

      setIsLoading(true);

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        if (response.ok) {
          // Redirect to generate page on successful login (US-002)
          window.location.href = '/generate';
        } else {
          const data = await response.json();
          throw new Error(data.message || 'Logowanie nie powiodło się');
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
    [email, password, validateForm]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive" className="py-3">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email address</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="Enter your email"
            className="pl-10 h-11 border-gray-200 focus:border-black focus:ring-0 focus-visible:ring-0 transition-all"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
            }}
            disabled={isLoading}
          />
        </div>
        {fieldErrors.email && <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-semibold text-gray-700">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            className="pl-10 h-11 border-gray-200 focus:border-black focus:ring-0 focus-visible:ring-0 transition-all"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }));
            }}
            disabled={isLoading}
          />
        </div>
        {fieldErrors.password && <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>}
      </div>

      <div className="flex items-center">
        <a
          href="/auth/reset-password"
          className="text-sm font-semibold text-gray-900 hover:underline"
        >
          Forgot your password?
        </a>
      </div>

      <Button 
        type="submit" 
        className="w-full h-11 bg-gray-900 hover:bg-black text-white font-semibold rounded-md transition-all" 
        disabled={isLoading}
      >
        {isLoading ? 'Signing in...' : 'Sign in'}
      </Button>

      <div className="text-center text-sm text-gray-500 pt-2">
        Don't have an account?{' '}
        <a href="/auth/signup" className="font-semibold text-gray-900 hover:underline">
          Sign up
        </a>
      </div>
    </form>
  );
}
