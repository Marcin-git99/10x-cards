/**
 * MSW Request Handlers
 * 
 * Define mock handlers for API requests.
 * These handlers are used during testing to simulate backend responses.
 * 
 * Guidelines:
 * - Group handlers by feature/domain
 * - Use realistic response shapes matching actual API
 * - Export individual handlers for test-specific overrides
 */

import { http, HttpResponse, delay } from 'msw';

// ============================================================================
// Auth Handlers
// ============================================================================

export const authHandlers = [
  // Login
  http.post('*/api/auth/login', async ({ request }) => {
    const body = await request.json() as { email: string; password: string };
    
    if (body.email === 'test@example.com' && body.password === 'password123') {
      return HttpResponse.json({
        user: {
          id: 'user-123',
          email: 'test@example.com',
        },
        message: 'Zalogowano pomyślnie',
      });
    }
    
    return HttpResponse.json(
      { error: 'AUTH_ERROR', message: 'Nieprawidłowy email lub hasło' },
      { status: 401 }
    );
  }),

  // Signup
  http.post('*/api/auth/signup', async ({ request }) => {
    const body = await request.json() as { email: string; password: string };
    
    if (body.email === 'existing@example.com') {
      return HttpResponse.json(
        { error: 'AUTH_ERROR', message: 'Email już zarejestrowany' },
        { status: 400 }
      );
    }
    
    return HttpResponse.json({
      user: {
        id: 'new-user-123',
        email: body.email,
      },
      message: 'Konto utworzone pomyślnie',
    });
  }),

  // Logout
  http.post('*/api/auth/logout', () => {
    return HttpResponse.json({ message: 'Wylogowano pomyślnie' });
  }),
];

// ============================================================================
// Generations Handlers
// ============================================================================

export const generationsHandlers = [
  // Generate flashcards
  http.post('*/api/generations', async ({ request }) => {
    const body = await request.json() as { source_text: string };
    
    // Validate text length
    if (!body.source_text || body.source_text.length < 1000) {
      return HttpResponse.json(
        { error: 'Bad Request', message: 'Tekst źródłowy musi mieć co najmniej 1000 znaków' },
        { status: 400 }
      );
    }
    
    if (body.source_text.length > 10000) {
      return HttpResponse.json(
        { error: 'Bad Request', message: 'Tekst źródłowy nie może przekraczać 10000 znaków' },
        { status: 400 }
      );
    }
    
    // Simulate AI processing time
    await delay(100);
    
    return HttpResponse.json({
      generation_id: 1,
      flashcards_proposals: [
        { front: 'Co to jest TypeScript?', back: 'Typowany nadzbiór JavaScript', source: 'ai-full' as const },
        { front: 'Co to jest React?', back: 'Biblioteka do budowania UI', source: 'ai-full' as const },
        { front: 'Co to jest Astro?', back: 'Framework do budowania szybkich stron', source: 'ai-full' as const },
      ],
      generated_count: 3,
    });
  }),
];

// ============================================================================
// Flashcards Handlers
// ============================================================================

const mockFlashcards = [
  { id: 1, front: 'Pytanie 1', back: 'Odpowiedź 1', source: 'manual', generation_id: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 2, front: 'Pytanie 2', back: 'Odpowiedź 2', source: 'ai-full', generation_id: 1, created_at: '2024-01-02T00:00:00Z', updated_at: '2024-01-02T00:00:00Z' },
  { id: 3, front: 'Pytanie 3', back: 'Odpowiedź 3', source: 'ai-edited', generation_id: 1, created_at: '2024-01-03T00:00:00Z', updated_at: '2024-01-03T00:00:00Z' },
];

export const flashcardsHandlers = [
  // Get flashcards
  http.get('*/api/flashcards', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedFlashcards = mockFlashcards.slice(start, end);
    
    return HttpResponse.json({
      data: paginatedFlashcards,
      pagination: {
        page,
        limit,
        total: mockFlashcards.length,
      },
    });
  }),

  // Create flashcards
  http.post('*/api/flashcards', async ({ request }) => {
    const body = await request.json() as { flashcards: Array<{ front: string; back: string; source: string; generation_id: number | null }> };
    
    const createdFlashcards = body.flashcards.map((fc, index) => ({
      id: 100 + index,
      ...fc,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
    
    return HttpResponse.json(
      { flashcards: createdFlashcards },
      { status: 201 }
    );
  }),

  // Update flashcard
  http.put('*/api/flashcards/:id', async ({ params, request }) => {
    const id = parseInt(params.id as string, 10);
    const body = await request.json() as { front?: string; back?: string };
    
    const flashcard = mockFlashcards.find(f => f.id === id);
    if (!flashcard) {
      return HttpResponse.json(
        { error: 'Not Found', message: 'Fiszka nie została znaleziona' },
        { status: 404 }
      );
    }
    
    return HttpResponse.json({
      flashcard: {
        ...flashcard,
        ...body,
        updated_at: new Date().toISOString(),
      },
    });
  }),

  // Delete flashcard
  http.delete('*/api/flashcards/:id', ({ params }) => {
    const id = parseInt(params.id as string, 10);
    
    const flashcard = mockFlashcards.find(f => f.id === id);
    if (!flashcard) {
      return HttpResponse.json(
        { error: 'Not Found', message: 'Fiszka nie została znaleziona' },
        { status: 404 }
      );
    }
    
    return HttpResponse.json({ success: true, message: 'Fiszka została usunięta' });
  }),
];

// ============================================================================
// Openrouter API Handlers (for integration tests)
// ============================================================================

export const openrouterHandlers = [
  http.post('https://openrouter.ai/api/v1/chat/completions', async () => {
    await delay(50);
    
    return HttpResponse.json({
      id: 'gen-test-123',
      choices: [{
        message: {
          content: JSON.stringify({
            flashcards: [
              { front: 'Test Question 1', back: 'Test Answer 1' },
              { front: 'Test Question 2', back: 'Test Answer 2' },
            ]
          })
        }
      }]
    });
  }),
];

// ============================================================================
// Combined Handlers
// ============================================================================

export const handlers = [
  ...authHandlers,
  ...generationsHandlers,
  ...flashcardsHandlers,
  ...openrouterHandlers,
];

