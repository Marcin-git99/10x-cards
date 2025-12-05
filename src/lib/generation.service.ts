import { createHash } from 'node:crypto';
import type { SupabaseClient } from '@/db/supabase.client';
import { supabaseServiceClient } from '@/db/supabase.client';
import type { FlashcardProposalDto, GenerationCreateResponseDto } from '../types';
import { generateFlashcardsWithOpenAI } from './openai.service';

/**
 * Generuje hash tekstu źródłowego do identyfikacji duplikatów używając algorytmu MD5
 */
export function createSourceTextHash(sourceText: string): string {
  return createHash('md5').update(sourceText).digest('hex');
}

/**
 * Konfiguracja modelu AI używanego do generowania fiszek
 * gpt-4o-mini jest szybszy i tańszy, gpt-4o dla lepszej jakości
 */
const AI_MODEL = 'gpt-4o-mini';

/**
 * Interfejs dla danych potrzebnych do zapisania generacji
 */
interface GenerationData {
  user_id: string;
  model: string;
  source_text_length: number;
  source_text_hash: string;
  generated_count: number;
  generation_duration: number;
}

/**
 * Interfejs dla danych błędu generacji
 */
interface GenerationErrorData {
  user_id: string;
  error_code: string;
  error_message: string;
  model: string;
  source_text_hash: string;
  source_text_length: number;
}

/**
 * Zapisuje metadane generacji w bazie danych
 */
async function saveGenerationMetadata(
  supabase: SupabaseClient,
  generationData: GenerationData
): Promise<number> {
  console.log('=== saveGenerationMetadata START ===');
  console.log('generationData:', generationData);
  
  const insertData = {
    user_id: generationData.user_id,
    model: generationData.model,
    source_text_length: generationData.source_text_length,
    source_text_hash: generationData.source_text_hash,
    generated_count: generationData.generated_count,
    generation_duration: generationData.generation_duration,
  };
  
  console.log('insertData:', insertData);
  
  const { data, error } = await supabase
    .from('generations')
    .insert(insertData)
    .select('id')
    .single();

  console.log('Supabase response - data:', data);
  console.log('Supabase response - error:', error);

  if (error) {
    console.error('Błąd Supabase:', error);
    throw new Error(`Błąd podczas zapisywania metadanych generacji: ${error.message}`);
  }

  console.log('=== saveGenerationMetadata SUCCESS ===');
  return data.id;
}

/**
 * Zapisuje informacje o błędzie generacji w bazie danych
 */
async function logGenerationError(
  supabase: SupabaseClient,
  errorData: GenerationErrorData
): Promise<void> {
  const { error } = await supabase
    .from('generation_error_logs')
    .insert({
      user_id: errorData.user_id,
      error_code: errorData.error_code,
      error_message: errorData.error_message,
      model: errorData.model,
      source_text_hash: errorData.source_text_hash,
      source_text_length: errorData.source_text_length,
    });

  if (error) {
    console.error('Błąd podczas zapisywania logu błędu generacji:', error);
  }
}

/**
 * Funkcja do generowania propozycji fiszek za pomocą AI (OpenAI)
 */
async function generateFlashcardProposals(sourceText: string): Promise<FlashcardProposalDto[]> {
  return generateFlashcardsWithOpenAI(sourceText, AI_MODEL);
}

/**
 * Główna funkcja serwisu do generowania fiszek
 */
export async function generateFlashcards(
  supabase: SupabaseClient,
  userId: string,
  sourceText: string
): Promise<GenerationCreateResponseDto> {
  console.log('=== generateFlashcards START ===');
  console.log('userId:', userId);
  console.log('sourceText length:', sourceText.length);
  
  const startTime = Date.now();
  const sourceTextHash = createSourceTextHash(sourceText);
  const sourceTextLength = sourceText.length;
  
  console.log('sourceTextHash:', sourceTextHash);
  console.log('sourceTextLength:', sourceTextLength);
  
  // Używamy service client dla operacji na bazie danych podczas developmentu
  const dbClient = supabaseServiceClient;
  console.log('Using service client:', !!dbClient);
  
  try {
    console.log('Rozpoczynam generowanie propozycji fiszek...');
    // Generowanie propozycji fiszek
    const flashcardProposals = await generateFlashcardProposals(sourceText);
    console.log('Wygenerowano propozycje:', flashcardProposals.length);
    
    const endTime = Date.now();
    
    console.log('Zapisuję metadane generacji...');
    // Zapisanie metadanych generacji
    const generationId = await saveGenerationMetadata(dbClient, {
      user_id: userId,
      model: AI_MODEL,
      source_text_length: sourceTextLength,
      source_text_hash: sourceTextHash,
      generated_count: flashcardProposals.length,
      generation_duration: endTime - startTime,
    });
    
    console.log('Zapisano generację z ID:', generationId);
    
    // Przygotowanie odpowiedzi
    const result = {
      generation_id: generationId,
      flashcards_proposals: flashcardProposals,
      generated_count: flashcardProposals.length,
    };
    
    console.log('=== generateFlashcards SUCCESS ===');
    return result;
  } catch (error) {
    console.error('=== generateFlashcards ERROR ===');
    console.error('Błąd:', error);
    
    // Logowanie błędu
    const errorMessage = error instanceof Error ? error.message : 'Nieznany błąd';
    console.log('Zapisuję błąd do bazy...');
    
    try {
      await logGenerationError(dbClient, {
        user_id: userId,
        error_code: 'GENERATION_FAILED',
        error_message: errorMessage,
        model: AI_MODEL,
        source_text_hash: sourceTextHash,
        source_text_length: sourceTextLength,
      });
      console.log('Błąd zapisany do bazy');
    } catch (logError) {
      console.error('Błąd podczas zapisywania błędu:', logError);
    }
    
    throw error;
  }
}
