import type {
  GenerateFlashcardsCommand,
  GenerationCreateResponseDto,
  FlashcardsCreateCommand,
  FlashcardDto,
} from '../../types';

// Podstawowa konfiguracja dla API calls
const API_BASE_URL = '/api';
const DEFAULT_TIMEOUT = 30000; // 30 sekund

// Typy błędów API
export interface ApiError {
  error: string;
  message: string;
  details?: string;
}

// Custom error class dla błędów API
export class FlashcardsApiError extends Error {
  public readonly status: number;
  public readonly apiError: ApiError;

  constructor(status: number, apiError: ApiError) {
    super(apiError.message);
    this.name = 'FlashcardsApiError';
    this.status = status;
    this.apiError = apiError;
  }
}

// Helper function do obsługi odpowiedzi API
async function handleApiResponse<T>(response: Response): Promise<T> {
  const data = await response.json();

  if (!response.ok) {
    throw new FlashcardsApiError(response.status, data as ApiError);
  }

  return data;
}

// Helper function dla API calls z timeout
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);
    return handleApiResponse<T>(response);
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new FlashcardsApiError(408, {
        error: 'Request Timeout',
        message: 'Przekroczono limit czasu oczekiwania na odpowiedź (30s)',
      });
    }
    
    throw error;
  }
}

/**
 * Client service function do generowania fiszek przez AI
 */
export async function generateFlashcardsApi(
  sourceText: string
): Promise<GenerationCreateResponseDto> {
  console.log('Calling generateFlashcardsApi with text length:', sourceText.length);

  const command: GenerateFlashcardsCommand = {
    source_text: sourceText,
  };

  try {
    const result = await apiCall<GenerationCreateResponseDto>('/generations', {
      method: 'POST',
      body: JSON.stringify(command),
    });

    console.log('generateFlashcardsApi success:', result);
    return result;
  } catch (error) {
    console.error('generateFlashcardsApi error:', error);
    throw error;
  }
}

/**
 * Client service function do zapisywania fiszek
 */
export async function saveFlashcardsApi(
  flashcards: FlashcardsCreateCommand
): Promise<{ flashcards: FlashcardDto[] }> {
  console.log('Calling saveFlashcardsApi with flashcards count:', flashcards.flashcards.length);

  try {
    const result = await apiCall<{ flashcards: FlashcardDto[] }>('/flashcards', {
      method: 'POST',
      body: JSON.stringify(flashcards),
    });

    console.log('saveFlashcardsApi success:', result.flashcards.length, 'flashcards saved');
    return result;
  } catch (error) {
    console.error('saveFlashcardsApi error:', error);
    throw error;
  }
}

/**
 * Helper function do mapowania błędów API na user-friendly messages
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof FlashcardsApiError) {
    switch (error.status) {
      case 400:
        return error.apiError.message || 'Nieprawidłowe dane wejściowe';
      case 408:
        return 'Przekroczono limit czasu oczekiwania. Spróbuj ponownie.';
      case 500:
        return 'Wystąpił błąd serwera. Spróbuj ponownie za chwilę.';
      default:
        return error.apiError.message || 'Wystąpił nieoczekiwany błąd';
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Wystąpił nieznany błąd';
}

/**
 * Helper function do sprawdzania czy błąd jest ponawiany
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof FlashcardsApiError) {
    // Retry dla timeout'ów i błędów serwera, ale nie dla błędów walidacji
    return error.status === 408 || error.status >= 500;
  }

  // Retry dla network errors
  return error instanceof Error && error.name === 'TypeError';
}
