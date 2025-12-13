import { z } from 'zod';
import type { FlashcardProposalDto } from '../types';
import type {
  ModelParameters,
  RequestPayload,
  ApiResponse,
  OpenRouterConfig,
  JSONSchema,
  ChatMessage,
} from './openrouter.types';
import {
  OpenRouterError,
  AuthenticationError,
  RateLimitError,
  NetworkError,
  ValidationError,
  configSchema,
  requestPayloadSchema,
  apiResponseSchema,
} from './openrouter.types';
import { Logger } from './logger';

// Re-export types and errors for external use
export type { ModelParameters, JSONSchema, OpenRouterConfig } from './openrouter.types';
export {
  OpenRouterError,
  AuthenticationError,
  RateLimitError,
  NetworkError,
  ValidationError,
} from './openrouter.types';

// ================================================================================================
// KLASA OPENROUTER SERVICE
// ================================================================================================

/**
 * Usługa do komunikacji z API OpenRouter
 * Umożliwia wysyłanie wiadomości do modeli LLM z konfigurowalnymi parametrami
 */
export class OpenRouterService {
  // Publiczne pola konfiguracyjne (readonly)
  public readonly apiUrl: string;
  public readonly apiKey: string;

  // Prywatne pola przechowujące bieżącą konfigurację
  private currentSystemMessage: string = '';
  private currentUserMessage: string = '';
  private currentResponseFormat: JSONSchema | null = null;
  private currentModelName: string;
  private currentModelParameters: ModelParameters;

  // Konfiguracja retry
  private readonly maxRetries: number;
  private readonly timeout: number;

  // Logger
  private readonly logger: Logger;

  // Domyślne wartości
  private static readonly DEFAULT_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
  private static readonly DEFAULT_MODEL = 'openai/gpt-4o-mini';
  private static readonly DEFAULT_TIMEOUT = 30000; // 30 sekund
  private static readonly DEFAULT_MAX_RETRIES = 3;
  private static readonly DEFAULT_MODEL_PARAMETERS: ModelParameters = {
    temperature: 0.7,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    max_tokens: 2000,
  };

  /**
   * Konstruktor usługi OpenRouter
   * @param config - Opcjonalna konfiguracja usługi
   */
  constructor(config: OpenRouterConfig = {}) {
    this.logger = new Logger('OpenRouterService');

    // Inicjalizacja klucza API
    const apiKey = config.apiKey ?? import.meta.env.OPENROUTER_API_KEY;

    // Walidacja konfiguracji za pomocą Zod
    try {
      const validatedConfig = configSchema.parse({
        apiKey,
        apiUrl: config.apiUrl,
        timeout: config.timeout,
        maxRetries: config.maxRetries,
        defaultModel: config.defaultModel,
        defaultModelParameters: config.defaultModelParameters,
      });

      this.apiKey = validatedConfig.apiKey;
      this.apiUrl = validatedConfig.apiUrl ?? OpenRouterService.DEFAULT_API_URL;
      this.timeout = validatedConfig.timeout ?? OpenRouterService.DEFAULT_TIMEOUT;
      this.maxRetries = validatedConfig.maxRetries ?? OpenRouterService.DEFAULT_MAX_RETRIES;
      this.currentModelName = validatedConfig.defaultModel ?? OpenRouterService.DEFAULT_MODEL;
      this.currentModelParameters = {
        ...OpenRouterService.DEFAULT_MODEL_PARAMETERS,
        ...validatedConfig.defaultModelParameters,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const message = error.errors[0]?.message || 'Nieprawidłowa konfiguracja';
        this.logger.error(new Error(message), {
          validationErrors: error.errors,
          config: { ...config, apiKey: '[REDACTED]' },
        });
        throw new AuthenticationError(
          'Brak klucza API OpenRouter. Ustaw zmienną OPENROUTER_API_KEY w pliku .env'
        );
      }
      throw error;
    }
  }

  // ==============================================================================================
  // PUBLICZNE METODY
  // ==============================================================================================

  /**
   * Wysyła komunikat użytkownika do API i zwraca odpowiedź
   * @param userMessage - Komunikat użytkownika do wysłania
   * @returns Odpowiedź z API w postaci stringa
   */
  async sendMessage(userMessage: string): Promise<string> {
    try {
      if (!userMessage.trim()) {
        throw new ValidationError('Komunikat użytkownika nie może być pusty');
      }

      this.currentUserMessage = userMessage;
      const payload = this.buildRequestPayload();

      // Walidacja payload przed wysłaniem
      try {
        requestPayloadSchema.parse(payload);
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          this.logger.error(new Error('Validation failed'), {
            validationErrors: validationError.errors,
            payload: {
              model: payload.model,
              messagesCount: payload.messages.length,
            },
          });
          throw new ValidationError(`Błąd walidacji żądania: ${validationError.errors[0]?.message}`);
        }
        throw validationError;
      }

      const response = await this.executeRequest(payload);

      // Walidacja odpowiedzi
      try {
        apiResponseSchema.parse(response);
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          this.logger.error(new Error('Response validation failed'), {
            validationErrors: validationError.errors,
          });
          throw new ValidationError('Nieprawidłowa struktura odpowiedzi z API');
        }
        throw validationError;
      }

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new ValidationError('Pusta odpowiedź z API OpenRouter');
      }

      return content;
    } catch (error) {
      if (error instanceof OpenRouterError) {
        throw error;
      }

      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.logger.error(errorObj, {
        modelName: this.currentModelName,
        hasSystemMessage: Boolean(this.currentSystemMessage),
        userMessageLength: this.currentUserMessage.length,
      });

      throw new OpenRouterError('Nieoczekiwany błąd podczas komunikacji z API', 'UNEXPECTED_ERROR');
    }
  }

  /**
   * Ustawia komunikat systemowy
   * @param message - Komunikat systemowy definiujący zachowanie modelu
   */
  setSystemMessage(message: string): void {
    if (!message.trim()) {
      throw new ValidationError('Komunikat systemowy nie może być pusty');
    }
    this.currentSystemMessage = message;
  }

  /**
   * Ustawia komunikat użytkownika
   * @param message - Komunikat użytkownika
   */
  setUserMessage(message: string): void {
    if (!message.trim()) {
      throw new ValidationError('Komunikat użytkownika nie może być pusty');
    }
    this.currentUserMessage = message;
  }

  /**
   * Konfiguruje schemat JSON dla strukturalnych odpowiedzi
   * @param schema - Schemat JSON określający format odpowiedzi
   */
  setResponseFormat(schema: JSONSchema): void {
    this.currentResponseFormat = schema;
  }

  /**
   * Ustawia model i jego parametry
   * @param name - Nazwa modelu (np. 'openai/gpt-4o-mini')
   * @param parameters - Opcjonalne parametry modelu
   */
  setModel(name: string, parameters?: ModelParameters): void {
    if (!name.trim()) {
      throw new ValidationError('Nazwa modelu nie może być pusta');
    }

    this.currentModelName = name;
    if (parameters) {
      this.currentModelParameters = {
        ...this.currentModelParameters,
        ...parameters,
      };
    }
  }

  // ==============================================================================================
  // PRYWATNE METODY
  // ==============================================================================================

  /**
   * Buduje ładunek żądania na podstawie bieżącej konfiguracji
   * @returns Ładunek żądania gotowy do wysłania
   */
  private buildRequestPayload(): RequestPayload {
    const messages: ChatMessage[] = [];

    // Dodaj komunikat systemowy jeśli istnieje
    if (this.currentSystemMessage) {
      messages.push({
        role: 'system',
        content: this.currentSystemMessage,
      });
    }

    // Dodaj komunikat użytkownika
    if (this.currentUserMessage) {
      messages.push({
        role: 'user',
        content: this.currentUserMessage,
      });
    }

    const payload: RequestPayload = {
      model: this.currentModelName,
      messages,
      temperature: this.currentModelParameters.temperature,
      top_p: this.currentModelParameters.top_p,
      frequency_penalty: this.currentModelParameters.frequency_penalty,
      presence_penalty: this.currentModelParameters.presence_penalty,
      max_tokens: this.currentModelParameters.max_tokens,
    };

    // Dodaj response_format jeśli skonfigurowany
    if (this.currentResponseFormat) {
      payload.response_format = this.currentResponseFormat;
    }

    return payload;
  }

  /**
   * Wykonuje żądanie HTTP do API z mechanizmem retry i backoff
   * @param payload - Ładunek żądania
   * @returns Odpowiedź z API
   */
  private async executeRequest(payload: RequestPayload): Promise<ApiResponse> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        this.logger.info(`API request attempt ${attempt}/${this.maxRetries}`, {
          model: payload.model,
          messagesCount: payload.messages.length,
        });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
          const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${this.apiKey}`,
              'HTTP-Referer': 'https://10xcards.app',
              'X-Title': '10xCards',
            },
            body: JSON.stringify(payload),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          // Obsługa błędów HTTP
          if (!response.ok) {
            await this.handleHttpError(response, attempt);
            continue; // Próbuj ponownie po obsłudze błędu
          }

          const data: ApiResponse = await response.json();

          this.logger.info('API response received', {
            tokensUsed: data.usage?.total_tokens,
          });

          return data;
        } finally {
          clearTimeout(timeoutId);
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Obsługa błędu timeout
        if (error instanceof Error && error.name === 'AbortError') {
          this.logger.warn(`Request timeout (attempt ${attempt}/${this.maxRetries})`, {
            timeout: this.timeout,
          });
          lastError = new NetworkError('Przekroczono limit czasu oczekiwania na odpowiedź API');
        }

        // Nie próbuj ponownie dla błędów, które nie powinny być retryowane
        if (error instanceof AuthenticationError) {
          throw error;
        }

        // Jeśli to ostatnia próba, rzuć błąd
        if (attempt === this.maxRetries) {
          this.logger.error(lastError, {
            attempts: attempt,
            maxRetries: this.maxRetries,
          });
          throw lastError;
        }

        // Exponential backoff przed kolejną próbą
        const backoffMs = this.calculateBackoff(attempt);
        this.logger.warn(`Retrying in ${backoffMs}ms...`, {
          attempt,
          backoffMs,
        });
        await this.sleep(backoffMs);
      }
    }

    throw lastError ?? new NetworkError('Nieoczekiwany błąd podczas komunikacji z API');
  }

  /**
   * Obsługuje błędy HTTP z odpowiedzi API
   * @param response - Odpowiedź HTTP
   * @param attempt - Numer bieżącej próby
   */
  private async handleHttpError(response: Response, attempt: number): Promise<void> {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error?.message || 'Nieznany błąd';

    this.logger.warn(`API error (attempt ${attempt})`, {
      status: response.status,
      message: errorMessage,
    });

    switch (response.status) {
      case 401:
        throw new AuthenticationError();
      case 429:
        // Rate limit - poczekaj i spróbuj ponownie
        if (attempt < this.maxRetries) {
          const backoffMs = this.calculateBackoff(attempt);
          this.logger.warn(`Rate limited. Waiting ${backoffMs}ms before retry...`, { backoffMs });
          await this.sleep(backoffMs);
          return; // Kontynuuj do następnej próby
        }
        throw new RateLimitError();
      case 500:
      case 502:
      case 503:
      case 504:
        // Server errors - poczekaj i spróbuj ponownie
        if (attempt < this.maxRetries) {
          const backoffMs = this.calculateBackoff(attempt);
          this.logger.warn(`Server error. Waiting ${backoffMs}ms before retry...`, { backoffMs });
          await this.sleep(backoffMs);
          return; // Kontynuuj do następnej próby
        }
        throw new NetworkError('Serwis OpenRouter jest tymczasowo niedostępny. Spróbuj ponownie.');
      default:
        throw new OpenRouterError(
          `Błąd API OpenRouter: ${response.status} - ${errorMessage}`,
          'API_ERROR',
          response.status
        );
    }
  }

  /**
   * Oblicza czas oczekiwania dla exponential backoff
   * @param attempt - Numer próby (1-indexed)
   * @returns Czas oczekiwania w milisekundach
   */
  private calculateBackoff(attempt: number): number {
    // Exponential backoff: 1s, 2s, 4s, ... (max 8s)
    const baseMs = 1000;
    const maxMs = 8000;
    const backoff = Math.min(baseMs * Math.pow(2, attempt - 1), maxMs);
    // Dodaj losowy jitter (0-500ms) aby uniknąć thundering herd
    return backoff + Math.random() * 500;
  }

  /**
   * Funkcja pomocnicza do oczekiwania
   * @param ms - Czas oczekiwania w milisekundach
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ================================================================================================
// FUNKCJA POMOCNICZA DLA GENEROWANIA FISZEK (kompatybilność wsteczna)
// ================================================================================================

/**
 * Prompt systemowy dla generowania fiszek
 */
const FLASHCARD_SYSTEM_PROMPT = `Jesteś ekspertem w tworzeniu fiszek edukacyjnych. Twoim zadaniem jest przeanalizowanie dostarczonego tekstu i wygenerowanie zestawu fiszek do nauki.

Zasady tworzenia fiszek:
1. Każda fiszka powinna zawierać jedno konkretne pytanie (przód) i zwięzłą odpowiedź (tył)
2. Pytania powinny być jasne i jednoznaczne
3. Odpowiedzi powinny być zwięzłe, ale kompletne
4. Skup się na najważniejszych pojęciach, faktach, datach i zależnościach
5. Unikaj pytań zbyt ogólnych lub trywialnych
6. Przód fiszki: maksymalnie 200 znaków
7. Tył fiszki: maksymalnie 500 znaków

Wygeneruj od 3 do 10 fiszek w zależności od ilości materiału.`;

/**
 * Schemat JSON dla odpowiedzi z fiszkami
 */
const FLASHCARD_RESPONSE_SCHEMA: JSONSchema = {
  type: 'json_schema',
  json_schema: {
    name: 'flashcards_response',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        flashcards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              front: {
                type: 'string',
                description: 'Pytanie lub pojęcie na przedniej stronie fiszki (max 200 znaków)',
              },
              back: {
                type: 'string',
                description: 'Odpowiedź lub wyjaśnienie na tylnej stronie fiszki (max 500 znaków)',
              },
            },
            required: ['front', 'back'],
            additionalProperties: false,
          },
        },
      },
      required: ['flashcards'],
      additionalProperties: false,
    },
  },
};

/**
 * Wywołuje OpenRouter API do generowania fiszek na podstawie tekstu
 * Funkcja zachowana dla kompatybilności wstecznej z generation.service.ts
 */
export async function generateFlashcardsWithOpenRouter(
  sourceText: string,
  model: string = 'openai/gpt-4o-mini'
): Promise<FlashcardProposalDto[]> {
  const logger = new Logger('generateFlashcardsWithOpenRouter');

  const service = new OpenRouterService({
    defaultModel: model,
  });

  service.setSystemMessage(FLASHCARD_SYSTEM_PROMPT);
  service.setResponseFormat(FLASHCARD_RESPONSE_SCHEMA);

  const userMessage = `Przeanalizuj poniższy tekst i wygeneruj fiszki edukacyjne:\n\n${sourceText}`;
  const content = await service.sendMessage(userMessage);

  // Parsowanie JSON z odpowiedzi
  let flashcardsData: { flashcards: Array<{ front: string; back: string }> };

  try {
    // Próba bezpośredniego parsowania (z response_format powinno być poprawne)
    const parsed = JSON.parse(content);
    
    // Obsługa różnych formatów odpowiedzi
    if (Array.isArray(parsed)) {
      // Model zwrócił tablicę bezpośrednio
      flashcardsData = { flashcards: parsed };
    } else if (parsed.flashcards && Array.isArray(parsed.flashcards)) {
      // Model zwrócił obiekt z kluczem flashcards
      flashcardsData = parsed;
    } else if (parsed.front && parsed.back) {
      // Model zwrócił pojedynczą fiszkę
      flashcardsData = { flashcards: [parsed] };
    } else {
      // Szukaj tablicy w dowolnym kluczu
      const arrayKey = Object.keys(parsed).find(key => Array.isArray(parsed[key]));
      if (arrayKey) {
        flashcardsData = { flashcards: parsed[arrayKey] };
      } else {
        throw new Error('Nierozpoznany format odpowiedzi');
      }
    }
  } catch (parseError) {
    // Fallback: próba wyciągnięcia JSON z odpowiedzi (dla modeli bez wsparcia response_format)
    logger.warn('Direct JSON parse failed, trying regex extraction', {
      contentPreview: content.substring(0, 200),
    });

    try {
      // Szukaj obiektu z flashcards
      const jsonMatch = content.match(/\{[\s\S]*"flashcards"[\s\S]*\}/);
      if (jsonMatch) {
        flashcardsData = JSON.parse(jsonMatch[0]);
      } else {
        // Szukaj tablicy obiektów z front/back
        const arrayMatch = content.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          flashcardsData = { flashcards: JSON.parse(arrayMatch[0]) };
        } else {
          throw new Error('Nie znaleziono JSON w odpowiedzi');
        }
      }
    } catch (fallbackError) {
      logger.error(fallbackError as Error, {
        rawContent: content.substring(0, 500),
      });
      throw new ValidationError('Nie udało się sparsować odpowiedzi z AI. Spróbuj ponownie.');
    }
  }

  // Walidacja i mapowanie na FlashcardProposalDto
  const validFlashcards: FlashcardProposalDto[] = flashcardsData.flashcards
    .filter((fc) => fc.front && fc.back && typeof fc.front === 'string' && typeof fc.back === 'string')
    .map((fc) => ({
      front: fc.front.slice(0, 200), // Ograniczenie do 200 znaków
      back: fc.back.slice(0, 500), // Ograniczenie do 500 znaków
      source: 'ai-full' as const,
    }));

  if (validFlashcards.length === 0) {
    throw new ValidationError('AI nie wygenerowało żadnych prawidłowych fiszek. Spróbuj z innym tekstem.');
  }

  logger.info('Flashcards generated successfully', {
    count: validFlashcards.length,
    model,
  });

  return validFlashcards;
}
