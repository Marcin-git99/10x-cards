import type { APIRoute } from 'astro';
import { z } from 'zod';
import { generateFlashcards } from '../../lib/generation.service';
import type { GenerateFlashcardsCommand, GenerationCreateResponseDto } from '../../types';

// Schema walidacji dla zapytania
const GenerateFlashcardsSchema = z.object({
  source_text: z.string()
    .min(1000, 'Tekst źródłowy musi mieć co najmniej 1000 znaków')
    .max(10000, 'Tekst źródłowy nie może przekraczać 10000 znaków')
});

/**
 * Endpoint POST /generations
 * 
 * Inicjuje proces generowania propozycji fiszek przez AI na podstawie tekstu dostarczonego przez użytkownika.
 * 
 * @param context - Kontekst zapytania Astro
 * @returns Odpowiedź z wygenerowanymi propozycjami fiszek
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    console.log('POST /api/generations - Otrzymano żądanie');
    
    // Pobierz ID zalogowanego użytkownika
    const userId = locals.user?.id;
    
    if (!userId) {
      return new Response(
        JSON.stringify({ 
          error: 'Unauthorized', 
          message: 'Musisz być zalogowany, aby generować fiszki' 
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

    const parsedData: GenerateFlashcardsCommand = requestBody;
      
      // Walidacja danych wejściowych
      console.log('Długość tekstu źródłowego:', parsedData.source_text?.length);
      const validationResult = GenerateFlashcardsSchema.safeParse(parsedData);
      if (!validationResult.success) {
        const errorMessages = validationResult.error.issues.map(issue => issue.message);
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
        // Wywołanie serwisu do generowania fiszek
        const result = await generateFlashcards(
          locals.supabase,
          userId,
          validationResult.data.source_text
        );
        
        console.log('Serwis zwrócił wynik:', result);
        return new Response(
          JSON.stringify(result),
          {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      } catch (serviceError) {
        console.error('Szczegółowy błąd serwisu:', serviceError);
        console.error('Stack trace:', serviceError instanceof Error ? serviceError.stack : 'Brak stack trace');
        
        // Zwracamy szczegółowy błąd do debugowania
        return new Response(
          JSON.stringify({ 
            error: 'Service Error', 
            message: serviceError instanceof Error ? serviceError.message : 'Nieznany błąd serwisu',
            details: serviceError instanceof Error ? serviceError.stack : String(serviceError)
          }),
          { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    // Usunięto blok catch, ponieważ teraz używamy danych testowych

  } catch (error) {
    console.error('Błąd podczas generowania fiszek:', error);
    
    // Zwracamy ogólny błąd serwera, szczegóły są logowane wewnętrznie
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