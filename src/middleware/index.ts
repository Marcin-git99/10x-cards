import { defineMiddleware } from 'astro:middleware';

import { supabaseClient } from '../db/supabase.client.ts';

// Rozszerzony middleware, debugowanie
export const onRequest = defineMiddleware(async (context, next) => {
  // Dodajemy supabase do kontekstu
  context.locals.supabase = supabaseClient;
  
  // Logujemy informacje o żądaniu
  console.log(`[Middleware] ${context.request.method} ${context.request.url}`);
  
  // Kontynuujemy przetwarzanie żądania
  return next();
});
