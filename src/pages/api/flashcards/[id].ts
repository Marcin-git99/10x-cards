import type { APIRoute } from 'astro';
import { z } from 'zod';
import { updateFlashcard, deleteFlashcard } from '../../../lib/flashcard.service';

// Schema walidacji dla aktualizacji fiszki (zgodnie z PRD: max 200/500 znaków)
const FlashcardUpdateSchema = z.object({
  front: z.string()
    .min(1, 'Przód fiszki nie może być pusty')
    .max(200, 'Przód fiszki nie może przekraczać 200 znaków')
    .optional(),
  back: z.string()
    .min(1, 'Tył fiszki nie może być pusty')
    .max(500, 'Tył fiszki nie może przekraczać 500 znaków')
    .optional(),
  source: z.enum(['ai-full', 'ai-edited', 'manual']).optional()
});

/**
 * Endpoint PUT /api/flashcards/[id]
 * Aktualizuje pojedynczą fiszkę
 */
export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    const flashcardId = parseInt(params.id || '', 10);
    
    if (isNaN(flashcardId) || flashcardId <= 0) {
      return new Response(
        JSON.stringify({ error: 'Bad Request', message: 'Nieprawidłowy ID fiszki' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Pobierz ID zalogowanego użytkownika
    const userId = locals.user?.id;
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', message: 'Musisz być zalogowany, aby edytować fiszki' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    let requestBody;
    try {
      requestBody = await request.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Bad Request', message: 'Nieprawidłowy format JSON' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const validationResult = FlashcardUpdateSchema.safeParse(requestBody);
    if (!validationResult.success) {
      const errorMessages = validationResult.error.issues.map(issue => 
        `${issue.path.join('.')}: ${issue.message}`
      );
      return new Response(
        JSON.stringify({ error: 'Bad Request', message: errorMessages.join(', ') }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Jeśli edytowano treść, zmień source na 'ai-edited' (jeśli było 'ai-full')
    const updateData = { ...validationResult.data };
    if ((updateData.front || updateData.back) && !updateData.source) {
      updateData.source = 'ai-edited';
    }
    
    const result = await updateFlashcard(locals.supabase, userId, flashcardId, updateData);
    
    return new Response(
      JSON.stringify({ flashcard: result }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Błąd podczas aktualizacji fiszki:', error);
    
    if (error instanceof Error && error.message.includes('nie została znaleziona')) {
      return new Response(
        JSON.stringify({ error: 'Not Found', message: error.message }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: 'Wystąpił błąd podczas aktualizacji fiszki' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

/**
 * Endpoint DELETE /api/flashcards/[id]
 * Usuwa pojedynczą fiszkę
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    const flashcardId = parseInt(params.id || '', 10);
    
    if (isNaN(flashcardId) || flashcardId <= 0) {
      return new Response(
        JSON.stringify({ error: 'Bad Request', message: 'Nieprawidłowy ID fiszki' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Pobierz ID zalogowanego użytkownika
    const userId = locals.user?.id;
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', message: 'Musisz być zalogowany, aby usuwać fiszki' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    await deleteFlashcard(locals.supabase, userId, flashcardId);
    
    return new Response(
      JSON.stringify({ success: true, message: 'Fiszka została usunięta' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Błąd podczas usuwania fiszki:', error);
    
    if (error instanceof Error && error.message.includes('nie została znaleziona')) {
      return new Response(
        JSON.stringify({ error: 'Not Found', message: error.message }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: 'Wystąpił błąd podczas usuwania fiszki' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

