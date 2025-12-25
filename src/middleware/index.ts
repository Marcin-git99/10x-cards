import { defineMiddleware } from 'astro:middleware';

import { createSupabaseServerInstance } from '../db/supabase.client';

// Public paths that don't require authentication
const PUBLIC_PATHS = [
  // Auth pages
  '/auth/login',
  '/auth/signup',
  '/auth/reset-password',
  // Auth API endpoints
  '/api/auth/login',
  '/api/auth/signup',
  '/api/auth/logout',
  '/api/auth/reset-password',
  // Public pages
  '/',
  '/login', // Legacy login page (redirect)
  // Public API endpoints
  '/api/ping',
  '/api/test',
];

// Paths that require authentication
const PROTECTED_PATHS = [
  '/generate',
  '/flashcards',
  '/study',
  '/api/generations',
  '/api/flashcards',
  '/api/collections',
];

export const onRequest = defineMiddleware(async ({ locals, cookies, url, request, redirect }, next) => {
  const pathname = url.pathname;

  // Create Supabase server instance with cookie handling
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  // Attach supabase client to locals (available in all routes)
  locals.supabase = supabase;

  // Initialize user as null
  locals.user = null;

  // Get user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Set user in locals if authenticated
  if (user) {
    locals.user = {
      id: user.id,
      email: user.email ?? '',
    };
  }

  // Skip protection for public paths
  const isPublicPath = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + '/')
  );

  if (isPublicPath) {
    // Log for debugging
    console.log(`[Middleware] ${request.method} ${pathname} (public)`);
    return next();
  }

  // Check if path requires authentication
  const isProtectedPath = PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + '/')
  );

  if (isProtectedPath && !locals.user) {
    console.log(`[Middleware] ${request.method} ${pathname} (protected, unauthorized)`);

    // For API routes, return 401
    if (pathname.startsWith('/api/')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // For pages, redirect to login
    return redirect('/auth/login');
  }

  // Log for debugging
  console.log(
    `[Middleware] ${request.method} ${pathname} (user: ${locals.user?.email ?? 'anonymous'})`
  );

  return next();
});
