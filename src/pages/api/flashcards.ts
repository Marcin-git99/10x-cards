import type { APIRoute } from 'astro';
import { z } from 'zod';
import { createFlashcards, getFlashcards } from '../../lib/flashcard.service';
import type { FlashcardsCreateCommand, FlashcardDto } from '../../types';

/**
 * Endpoint GET /api/flashcards
 * 
 * Pobiera fiszki użytkownika z opcjonalną paginacją
 * Query params: page (default: 1), limit (default: 20)
 */
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    console.log('GET /api/flashcards - Otrzymano żądanie');
    
    // Pobierz ID zalogowanego użytkownika
    const userId = locals.user?.id;
    
    if (!userId) {
      return new Response(
        JSON.stringify({ 
          error: 'Unauthorized', 
          message: 'Musisz być zalogowany, aby pobierać fiszki' 
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    
    // Walidacja parametrów
    if (page < 1 || limit < 1 || limit > 100) {
      return new Response(
        JSON.stringify({ 
          error: 'Bad Request', 
          message: 'Nieprawidłowe parametry paginacji' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const result = await getFlashcards(locals.supabase, userId, page, limit);
    
    return new Response(
      JSON.stringify({
        data: result.flashcards,
        pagination: {
          page,
          limit,
          total: result.total
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Błąd podczas pobierania fiszek:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal Server Error', 
        message: 'Wystąpił błąd podczas pobierania fiszek' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// Schema walidacji dla pojedynczej fiszki
const FlashcardCreateSchema = z.object({
  front: z.string()
    .min(1, 'Przód fiszki nie może być pusty')
    .max(200, 'Przód fiszki nie może przekraczać 200 znaków'),
  back: z.string()
    .min(1, 'Tył fiszki nie może być pusty')
    .max(500, 'Tył fiszki nie może przekraczać 500 znaków'),
  source: z.enum(['ai-full', 'ai-edited', 'manual'], {
    errorMap: () => ({ message: 'Źródło musi być jednym z: ai-full, ai-edited, manual' })
  }),
  generation_id: z.number().nullable()
}).refine((data) => {
  // Walidacja zgodności generation_id z source
  if (data.source === 'manual') {
    return data.generation_id === null;
  }
  if (data.source === 'ai-full' || data.source === 'ai-edited') {
    return data.generation_id !== null && data.generation_id > 0;
  }
  return false;
}, {
  message: 'generation_id musi być null dla source="manual" lub liczbą > 0 dla source="ai-full"/"ai-edited"',
  path: ['generation_id']
});

// Schema walidacji dla całego żądania
const FlashcardsCreateSchema = z.object({
  flashcards: z.array(FlashcardCreateSchema)
    .min(1, 'Musi być podana co najmniej jedna fiszka')
    .max(50, 'Nie można utworzyć więcej niż 50 fiszek jednocześnie')
});

/**
 * Endpoint POST /flashcards
 * 
 * Tworzy jedną lub więcej fiszek na podstawie danych dostarczonych przez użytkownika.
 * Obsługuje fiszki tworzone ręcznie oraz generowane przez AI.
 * 
 * @param context - Kontekst zapytania Astro
 * @returns Odpowiedź z utworzonymi fiszkami
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    console.log('POST /api/flashcards - Otrzymano żądanie');
    
    // Pobierz ID zalogowanego użytkownika
    const userId = locals.user?.id;
    
    if (!userId) {
      return new Response(
        JSON.stringify({ 
          error: 'Unauthorized', 
          message: 'Musisz być zalogowany, aby tworzyć fiszki' 
        }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Parsowanie ciała żądania JSON
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (parseError) {
      console.error('Błąd parsowania JSON:', parseError);
      return new Response(
        JSON.stringify({ 
          error: 'Bad Request', 
          message: 'Nieprawidłowy format JSON' 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const parsedData: FlashcardsCreateCommand = requestBody;
      
    // Walidacja danych wejściowych
    console.log('Liczba fiszek do utworzenia:', parsedData.flashcards?.length);
    const validationResult = FlashcardsCreateSchema.safeParse(parsedData);
    if (!validationResult.success) {
      const errorMessages = validationResult.error.issues.map(issue => 
        `${issue.path.join('.')}: ${issue.message}`
      );
      console.log('Błąd walidacji:', errorMessages);
      return new Response(
        JSON.stringify({ 
          error: 'Bad Request', 
          message: errorMessages.join(', ') 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Walidacja przeszła pomyślnie, wywołuję serwis...');
    console.log('Supabase client:', !!locals.supabase);
    
    try {
      // Wywołanie serwisu do tworzenia fiszek
      const result = await createFlashcards(
        locals.supabase,
        userId,
        validationResult.data.flashcards
      );
      
      console.log('Serwis zwrócił wynik:', result.length, 'fiszek');
      return new Response(
        JSON.stringify({ flashcards: result }),
        {
          status: 201,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (serviceError) {
      console.error('Szczegółowy błąd serwisu:', serviceError);
      console.error('Stack trace:', serviceError instanceof Error ? serviceError.stack : 'Brak stack trace');
      
      // Sprawdzamy typ błędu i zwracamy odpowiedni kod statusu
      if (serviceError instanceof Error && serviceError.message.includes('generation_id')) {
        return new Response(
          JSON.stringify({ 
            error: 'Bad Request', 
            message: serviceError.message
          }),
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'Internal Server Error', 
          message: 'Wystąpił błąd podczas tworzenia fiszek'
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (error) {
    console.error('Błąd podczas tworzenia fiszek:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal Server Error', 
        message: 'Wystąpił błąd podczas przetwarzania żądania' 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
