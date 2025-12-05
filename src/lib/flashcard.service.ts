import type { SupabaseClient } from '@/db/supabase.client';
import { supabaseServiceClient } from '@/db/supabase.client';
import type { 
  FlashcardCreateDto, 
  FlashcardDto, 
  FlashcardInsert,
  FlashcardUpdateDto,
  Flashcard
} from '../types';

/**
 * Waliduje czy generation_id istnieje i należy do użytkownika
 */
async function validateGenerationId(
  supabase: SupabaseClient,
  userId: string,
  generationId: number
): Promise<boolean> {
  const { data, error } = await supabase
    .from('generations')
    .select('id')
    .eq('id', generationId)
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return false;
  }

  return true;
}

/**
 * Konwertuje FlashcardCreateDto na FlashcardInsert (format bazy danych)
 */
function mapToInsert(flashcard: FlashcardCreateDto, userId: string): FlashcardInsert {
  return {
    front: flashcard.front,
    back: flashcard.back,
    source: flashcard.source,
    generation_id: flashcard.generation_id,
    user_id: userId
  };
}

/**
 * Konwertuje row z bazy danych na FlashcardDto (format API)
 */
function mapToDto(row: Flashcard): FlashcardDto {
  return {
    id: row.id,
    front: row.front,
    back: row.back,
    source: row.source,
    generation_id: row.generation_id,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

/**
 * Pobiera fiszki użytkownika z paginacją
 */
export async function getFlashcards(
  supabase: SupabaseClient,
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<{ flashcards: FlashcardDto[]; total: number }> {
  console.log('=== getFlashcards START ===');
  console.log('userId:', userId);
  console.log('page:', page, 'limit:', limit);
  
  const dbClient = supabaseServiceClient;
  
  const offset = (page - 1) * limit;
  
  // Pobierz całkowitą liczbę fiszek
  const { count, error: countError } = await dbClient
    .from('flashcards')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
    
  if (countError) {
    console.error('Błąd liczenia fiszek:', countError);
    throw new Error(`Błąd podczas pobierania fiszek: ${countError.message}`);
  }
  
  // Pobierz fiszki z paginacją
  const { data, error } = await dbClient
    .from('flashcards')
    .select('id, front, back, source, generation_id, created_at, updated_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
    
  if (error) {
    console.error('Błąd pobierania fiszek:', error);
    throw new Error(`Błąd podczas pobierania fiszek: ${error.message}`);
  }
  
  console.log('=== getFlashcards SUCCESS ===');
  console.log('Pobrano:', data?.length || 0, 'fiszek z', count || 0, 'łącznie');
  
  return {
    flashcards: (data || []).map(mapToDto),
    total: count || 0
  };
}

/**
 * Główna funkcja serwisu do tworzenia fiszek
 * Implementuje batch insert z walidacją generation_id dla fiszek AI
 */
export async function createFlashcards(
  supabase: SupabaseClient,
  userId: string,
  flashcardsData: FlashcardCreateDto[]
): Promise<FlashcardDto[]> {
  console.log('=== createFlashcards START ===');
  console.log('userId:', userId);
  console.log('flashcards count:', flashcardsData.length);
  
  // Używamy service client dla operacji na bazie danych podczas developmentu
  const dbClient = supabaseServiceClient;
  console.log('Using service client:', !!dbClient);
  
  try {
    // Walidacja generation_id dla fiszek AI (ai-full i ai-edited)
    const uniqueGenerationIds = [...new Set(
      flashcardsData
        .filter(f => f.generation_id !== null)
        .map(f => f.generation_id as number)
    )];
    
    console.log('Unique generation IDs to validate:', uniqueGenerationIds);
    
    if (uniqueGenerationIds.length > 0) {
      console.log('Walidacja generation_id...');
      
      for (const generationId of uniqueGenerationIds) {
        const isValid = await validateGenerationId(dbClient, userId, generationId);
        if (!isValid) {
          throw new Error(`generation_id ${generationId} nie istnieje lub nie należy do użytkownika`);
        }
      }
      
      console.log('Walidacja generation_id przeszła pomyślnie');
    }

    // Przygotowanie danych do batch insert
    const insertData: FlashcardInsert[] = flashcardsData.map(flashcard => 
      mapToInsert(flashcard, userId)
    );
    
    console.log('Prepared insert data:', insertData.length, 'records');
    
    // Batch insert do bazy danych
    console.log('Wykonuję batch insert...');
    const { data, error } = await dbClient
      .from('flashcards')
      .insert(insertData)
      .select('id, front, back, source, generation_id, created_at, updated_at, user_id');

    if (error) {
      console.error('Błąd Supabase podczas batch insert:', error);
      throw new Error(`Błąd podczas zapisywania fiszek: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error('Nie otrzymano danych po zapisaniu fiszek');
    }

    console.log('Batch insert successful, created:', data.length, 'flashcards');
    
    // Konwersja wyników na format DTO
    const result = data.map(mapToDto);
    
    console.log('=== createFlashcards SUCCESS ===');
    return result;
    
  } catch (error) {
    console.error('=== createFlashcards ERROR ===');
    console.error('Błąd:', error);
    
    // Re-throw błędu do endpointu, który obsłuży odpowiednie kody statusu
    throw error;
  }
}

/**
 * Aktualizuje pojedynczą fiszkę
 * Sprawdza czy fiszka należy do użytkownika przed aktualizacją
 */
export async function updateFlashcard(
  supabase: SupabaseClient,
  userId: string,
  flashcardId: number,
  updateData: FlashcardUpdateDto
): Promise<FlashcardDto> {
  console.log('=== updateFlashcard START ===');
  console.log('userId:', userId, 'flashcardId:', flashcardId);
  
  const dbClient = supabaseServiceClient;
  
  // Aktualizuj fiszkę tylko jeśli należy do użytkownika
  const { data, error } = await dbClient
    .from('flashcards')
    .update({
      ...updateData,
      updated_at: new Date().toISOString()
    })
    .eq('id', flashcardId)
    .eq('user_id', userId)
    .select('id, front, back, source, generation_id, created_at, updated_at')
    .single();
    
  if (error) {
    console.error('Błąd aktualizacji fiszki:', error);
    throw new Error(`Błąd podczas aktualizacji fiszki: ${error.message}`);
  }
  
  if (!data) {
    throw new Error('Fiszka nie została znaleziona lub nie masz do niej dostępu');
  }
  
  console.log('=== updateFlashcard SUCCESS ===');
  return mapToDto(data);
}

/**
 * Usuwa pojedynczą fiszkę
 * Sprawdza czy fiszka należy do użytkownika przed usunięciem
 */
export async function deleteFlashcard(
  supabase: SupabaseClient,
  userId: string,
  flashcardId: number
): Promise<void> {
  console.log('=== deleteFlashcard START ===');
  console.log('userId:', userId, 'flashcardId:', flashcardId);
  
  const dbClient = supabaseServiceClient;
  
  // Najpierw sprawdź czy fiszka istnieje i należy do użytkownika
  const { data: existing, error: checkError } = await dbClient
    .from('flashcards')
    .select('id')
    .eq('id', flashcardId)
    .eq('user_id', userId)
    .single();
    
  if (checkError || !existing) {
    throw new Error('Fiszka nie została znaleziona lub nie masz do niej dostępu');
  }
  
  // Usuń fiszkę
  const { error } = await dbClient
    .from('flashcards')
    .delete()
    .eq('id', flashcardId)
    .eq('user_id', userId);
    
  if (error) {
    console.error('Błąd usuwania fiszki:', error);
    throw new Error(`Błąd podczas usuwania fiszki: ${error.message}`);
  }
  
  console.log('=== deleteFlashcard SUCCESS ===');
}
