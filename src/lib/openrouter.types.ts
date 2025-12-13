import { z } from 'zod';

// ================================================================================================
// INTERFEJSY TYPESCRIPT
// ================================================================================================

/**
 * Parametry modelu LLM
 */
export interface ModelParameters {
  temperature?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  max_tokens?: number;
}

/**
 * Wiadomość w konwersacji
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Schemat JSON dla strukturalnych odpowiedzi (response_format)
 */
export interface JSONSchema {
  type: 'json_schema';
  json_schema: {
    name: string;
    strict?: boolean;
    schema: Record<string, unknown>;
  };
}

/**
 * Ładunek żądania do API OpenRouter
 */
export interface RequestPayload {
  messages: ChatMessage[];
  model: string;
  response_format?: JSONSchema;
  temperature?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  max_tokens?: number;
}

/**
 * Odpowiedź z API OpenRouter
 */
export interface ApiResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    finish_reason?: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Opcje inicjalizacji usługi OpenRouter
 */
export interface OpenRouterConfig {
  apiKey?: string;
  apiUrl?: string;
  timeout?: number;
  maxRetries?: number;
  defaultModel?: string;
  defaultModelParameters?: ModelParameters;
}

// ================================================================================================
// KLASY BŁĘDÓW
// ================================================================================================

/**
 * Bazowa klasa błędu OpenRouter
 */
export class OpenRouterError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = 'OpenRouterError';
  }
}

/**
 * Błąd uwierzytelniania (401)
 */
export class AuthenticationError extends OpenRouterError {
  constructor(message: string = 'Nieprawidłowy klucz API OpenRouter') {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

/**
 * Błąd limitu zapytań (429)
 */
export class RateLimitError extends OpenRouterError {
  constructor(message: string = 'Przekroczono limit zapytań do API. Spróbuj ponownie za chwilę.') {
    super(message, 'RATE_LIMIT', 429);
    this.name = 'RateLimitError';
  }
}

/**
 * Błąd sieci (timeout, błędy połączenia)
 */
export class NetworkError extends OpenRouterError {
  constructor(message: string = 'Błąd połączenia z API OpenRouter') {
    super(message, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}

/**
 * Błąd walidacji odpowiedzi
 */
export class ValidationError extends OpenRouterError {
  constructor(message: string = 'Nieprawidłowa odpowiedź z API') {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

// ================================================================================================
// SCHEMATY WALIDACJI ZOD
// ================================================================================================

/**
 * Schemat walidacji parametrów modelu
 */
export const modelParametersSchema = z.object({
  temperature: z.number().min(0).max(2).optional(),
  top_p: z.number().min(0).max(1).optional(),
  frequency_penalty: z.number().min(-2).max(2).optional(),
  presence_penalty: z.number().min(-2).max(2).optional(),
  max_tokens: z.number().positive().optional(),
});

/**
 * Schemat walidacji wiadomości
 */
export const messageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string().min(1),
});

/**
 * Schemat walidacji konfiguracji
 */
export const configSchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
  apiUrl: z.string().url().optional(),
  timeout: z.number().positive().optional(),
  maxRetries: z.number().positive().optional(),
  defaultModel: z.string().optional(),
  defaultModelParameters: modelParametersSchema.optional(),
});

/**
 * Schemat walidacji ładunku żądania
 */
export const requestPayloadSchema = z.object({
  messages: z.array(messageSchema).min(1),
  model: z.string().min(1),
  response_format: z
    .object({
      type: z.literal('json_schema'),
      json_schema: z.object({
        name: z.string(),
        strict: z.boolean().optional(),
        schema: z.record(z.unknown()),
      }),
    })
    .optional(),
  temperature: z.number().min(0).max(2).optional(),
  top_p: z.number().min(0).max(1).optional(),
  frequency_penalty: z.number().min(-2).max(2).optional(),
  presence_penalty: z.number().min(-2).max(2).optional(),
  max_tokens: z.number().positive().optional(),
});

/**
 * Schemat walidacji odpowiedzi API
 */
export const apiResponseSchema = z.object({
  choices: z.array(
    z.object({
      message: z.object({
        content: z.string(),
        role: z.string(),
      }),
      finish_reason: z.string().optional(),
    })
  ),
  usage: z
    .object({
      prompt_tokens: z.number(),
      completion_tokens: z.number(),
      total_tokens: z.number(),
    })
    .optional(),
});

