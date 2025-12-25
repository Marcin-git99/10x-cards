import { useEffect } from 'react';
import { LogIn, LogOut, User as UserIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useAuthStore, type User } from '@/lib/stores/authStore';

interface TopbarProps {
  user: User | null;
}

export default function Topbar({ user }: TopbarProps) {
  const { setUser, logout, isLoading, isAuthenticated, user: storeUser } = useAuthStore();

  // Initialize store with server-side user data
  useEffect(() => {
    setUser(user);
  }, [user, setUser]);

  const currentUser = storeUser ?? user;
  const isLoggedIn = isAuthenticated || !!user;

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and title */}
          <div className="flex items-center gap-4">
            <a href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold text-gray-900">10x Cards</span>
            </a>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <a
              href="/generate"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Generuj fiszki
            </a>
            <a
              href="/flashcards"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Moje fiszki
            </a>
          </nav>

          {/* Auth buttons */}
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <>
                <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
                  <UserIcon className="h-4 w-4" />
                  <span>{currentUser?.email}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {isLoading ? 'Wylogowywanie...' : 'Wyloguj'}
                  </span>
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <a href="/auth/login" className="flex items-center gap-2">
                    <LogIn className="h-4 w-4" />
                    <span>Zaloguj się</span>
                  </a>
                </Button>
                <Button size="sm" asChild>
                  <a href="/auth/signup">Zarejestruj się</a>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

