# Plan implementacji usługi OpenRouter

## 1. Opis usługi

Usługa OpenRouter integruje komunikację z modelem LLM poprzez API OpenRouter.
Głównym celem tej usługi jest umożliwienie automatycznego generowania odpowiedzi na podstawie kombinacji komunikatów systemowych oraz użytkownika, przy jednoczesnym przetwarzaniu strukturalnych odpowiedzi w formacie JSON.

### Lokalizacja w strukturze projektu

```
src/lib/openrouter.service.ts
```

### Powiązania z istniejącym kodem

- Wywoływana przez: `src/lib/generation.service.ts`
- Walidacja danych wejściowych: `src/pages/api/generations.ts` (1000-10000 znaków)

---

## 2. Opis konstruktora

Konstruktor klasy `OpenRouterService`:
- **Inicjuje konfigurację API** (API key z `import.meta.env.OPENROUTER_API_KEY`, baza URL)
- **Ustawia domyślne parametry modelu** (temperature: 0.7, top_p: 1, frequency_penalty: 0, presence_penalty: 0, max_tokens: 2000)
- Akceptuje opcjonalne parametry inicjalizacyjne (timeout: 60s, maxRetries: 3)

```typescript
constructor(config: OpenRouterConfig = {}) {
  // Inicjalizacja klucza API
  const apiKey = config.apiKey ?? import.meta.env.OPENROUTER_API_KEY;
  // ...
}
```

---

## 3. Publiczne metody i pola

### Publiczne pola

| Pole | Typ | Opis |
|------|-----|------|
| `apiUrl` | `string` | URL API OpenRouter (readonly) |
| `apiKey` | `string` | Klucz API (readonly) |

### Publiczne metody

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `sendMessage` | `(userMessage: string): Promise<string>` | Wysyła komunikat i zwraca odpowiedź |
| `setSystemMessage` | `(message: string): void` | Ustawia komunikat systemowy |
| `setUserMessage` | `(message: string): void` | Ustawia komunikat użytkownika |
| `setResponseFormat` | `(schema: JSONSchema): void` | Konfiguruje schemat JSON odpowiedzi |
| `setModel` | `(name: string, parameters?: ModelParameters): void` | Wybiera model i parametry |

---

## 4. Prywatne metody i pola

### Prywatne pola

| Pole | Typ | Opis |
|------|-----|------|
| `currentSystemMessage` | `string` | Bieżący komunikat systemowy |
| `currentUserMessage` | `string` | Bieżący komunikat użytkownika |
| `currentResponseFormat` | `JSONSchema \| null` | Schemat odpowiedzi JSON |
| `currentModelName` | `string` | Nazwa aktualnego modelu |
| `currentModelParameters` | `ModelParameters` | Parametry modelu |
| `maxRetries` | `number` | Max liczba prób (domyślnie 3) |
| `timeout` | `number` | Timeout w ms (domyślnie 60000) |

### Prywatne metody

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `buildRequestPayload` | `(): RequestPayload` | Buduje ładunek żądania |
| `executeRequest` | `(payload: RequestPayload): Promise<ApiResponse>` | Wykonuje żądanie HTTP z retry |
| `handleHttpError` | `(response: Response, attempt: number): Promise<void>` | Obsługuje błędy HTTP |
| `calculateBackoff` | `(attempt: number): number` | Oblicza czas oczekiwania |
| `sleep` | `(ms: number): Promise<void>` | Funkcja oczekiwania |

---

## 5. Obsługa błędów

### Hierarchia błędów

```typescript
OpenRouterError (bazowy)
├── AuthenticationError (401 - nieprawidłowy API key)
├── RateLimitError (429 - przekroczenie limitów)
├── NetworkError (timeout, błędy połączenia)
└── ValidationError (nieprawidłowa odpowiedź)
```

### Mapowanie kodów HTTP

| Kod HTTP | Klasa błędu | Komunikat |
|----------|-------------|-----------|
| 401 | `AuthenticationError` | "Nieprawidłowy klucz API OpenRouter" |
| 429 | `RateLimitError` | "Przekroczono limit zapytań do API..." |
| 500, 502, 503, 504 | `NetworkError` | "Serwis OpenRouter jest tymczasowo niedostępny..." |

### Mechanizm retry z exponential backoff

- Maksymalnie 3 próby
- Backoff: 1s → 2s → 4s (z randomowym jitter 0-500ms)
- Retry dla: 429, 500, 502, 503, 504
- Brak retry dla: 401 (AuthenticationError)

---

## 6. Względy bezpieczeństwa

- ✅ Klucz API przechowywany w `import.meta.env.OPENROUTER_API_KEY`
- ✅ Komunikacja HTTPS z API
- ✅ Brak logowania klucza API i danych wrażliwych
- ✅ Walidacja danych wejściowych przed wysłaniem
- ✅ Timeout zapobiegający zawieszeniu żądań

---

## 7. Interfejsy TypeScript

### ModelParameters

```typescript
interface ModelParameters {
  temperature?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  max_tokens?: number;
}
```

### JSONSchema (response_format)

```typescript
interface JSONSchema {
  type: 'json_schema';
  json_schema: {
    name: string;
    strict?: boolean;
    schema: Record<string, unknown>;
  };
}
```

### OpenRouterConfig

```typescript
interface OpenRouterConfig {
  apiKey?: string;
  apiUrl?: string;
  timeout?: number;
  maxRetries?: number;
  defaultModel?: string;
  defaultModelParameters?: ModelParameters;
}
```

---

## 8. Przykłady użycia

### Podstawowe użycie klasy

```typescript
const service = new OpenRouterService({
  defaultModel: 'anthropic/claude-3.5-haiku',
});

service.setSystemMessage('Jesteś pomocnym asystentem...');
const response = await service.sendMessage('Jak działa fotosynteza?');
```

### Użycie z response_format (JSON schema)

```typescript
service.setResponseFormat({
  type: 'json_schema',
  json_schema: {
    name: 'flashcards',
    strict: true,
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          front: { type: 'string' },
          back: { type: 'string' }
        }
      }
    }
  }
});
```

### Funkcja kompatybilności wstecznej

```typescript
// Dla generation.service.ts - bez zmian w kodzie wywołującym
import { generateFlashcardsWithOpenRouter } from './openrouter.service';

const flashcards = await generateFlashcardsWithOpenRouter(sourceText, 'anthropic/claude-3.5-haiku');
```

---

## 9. Integracja z generation.service.ts

Funkcja `generateFlashcardsWithOpenRouter()` jest zachowana dla kompatybilności wstecznej. Wewnętrznie używa klasy `OpenRouterService`:

```typescript
export async function generateFlashcardsWithOpenRouter(
  sourceText: string,
  model: string = 'anthropic/claude-3.5-haiku'
): Promise<FlashcardProposalDto[]> {
  const service = new OpenRouterService({ defaultModel: model });
  service.setSystemMessage(FLASHCARD_SYSTEM_PROMPT);
  const content = await service.sendMessage(`Przeanalizuj poniższy tekst...`);
  // ...parsowanie i walidacja JSON...
}
```

---

## 10. Status implementacji

| Element | Status |
|---------|--------|
| Konstruktor z konfiguracją | ✅ Zaimplementowany |
| Publiczne metody (setSystemMessage, setUserMessage, setModel, setResponseFormat) | ✅ Zaimplementowane |
| sendMessage() | ✅ Zaimplementowany |
| Prywatne metody (executeRequest, buildRequestPayload) | ✅ Zaimplementowane |
| Obsługa błędów z retry i backoff | ✅ Zaimplementowana |
| Hierarchia klas błędów | ✅ Zaimplementowana |
| Integracja z generation.service.ts | ✅ Kompatybilność zachowana |
