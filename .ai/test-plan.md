# Plan Testów dla Projektu 10x-cards

## 1. Streszczenie

### 1.1 Cel dokumentu

Niniejszy dokument definiuje kompleksową strategię testowania aplikacji **10x-cards** — narzędzia do szybkiego tworzenia fiszek edukacyjnych z wykorzystaniem AI (LLM). Plan obejmuje weryfikację kluczowych funkcjonalności MVP, integracji między komponentami oraz poprawności działania całego systemu od frontendu po backend.

### 1.2 Zakres testów

#### W zakresie (in-scope)
- Generowanie fiszek przez AI (dostępne bez logowania) — US-003
- Przegląd, edycja, akceptacja/odrzucenie propozycji fiszek — US-004
- System uwierzytelniania (rejestracja, logowanie, reset hasła, usuwanie konta) — US-001, US-002
- Ręczne CRUD fiszek (wymaga logowania) — US-005, US-006, US-007
- Sesja nauki ze spaced repetition — US-008 *(do implementacji)*
- Bezpieczny dostęp i autoryzacja — US-009
- Zgodność z RODO (prawo do usunięcia danych)
- Integracja z Supabase (Auth + Database)
- Integracja z Openrouter.ai (LLM API)

#### Poza zakresem (out-of-scope)
- Aplikacje mobilne
- Import dokumentów (PDF, DOCX)
- Współdzielenie fiszek między użytkownikami
- Zaawansowany algorytm powtórek (własna implementacja)
- Publicznie dostępne API
- Mechanizmy gamifikacji

### 1.3 Architektura aplikacji

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Astro 5   │  │  React 19   │  │  Tailwind 4 + Shadcn/UI│ │
│  │   (SSR)     │  │  (Islands)  │  │      (Styling)         │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│                           │                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Zustand (State Management)                  │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MIDDLEWARE (Astro)                           │
│  • Obsługa sesji (Supabase SSR)                                │
│  • Ochrona ścieżek (PUBLIC_PATHS / PROTECTED_PATHS)            │
│  • Walidacja JWT                                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API ENDPOINTS                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ /api/auth/*  │  │/api/flashcards│  │  /api/generations   │  │
│  │  (6 routes)  │  │   (CRUD)     │  │   (AI generation)   │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│       SUPABASE          │     │     OPENROUTER.AI       │
│  ┌─────────────────┐    │     │                         │
│  │   PostgreSQL    │    │     │   LLM API Gateway       │
│  │   (flashcards,  │    │     │   (openai/gpt-4o-mini)  │
│  │   generations)  │    │     │                         │
│  └─────────────────┘    │     └─────────────────────────┘
│  ┌─────────────────┐    │
│  │   Auth (JWT)    │    │
│  └─────────────────┘    │
│  ┌─────────────────┐    │
│  │   RLS Policies  │    │
│  └─────────────────┘    │
└─────────────────────────┘
```

---

## 1.4 Pierwsze kroki — szybki start z testami

Ta sekcja pomoże Ci szybko uruchomić testy w projekcie 10x-cards.

### Krok 1: Instalacja zależności

```bash
# Zainstaluj wszystkie zależności projektu (w tym testowe)
npm install

# Zainstaluj przeglądarkę Chromium dla testów E2E
npx playwright install chromium
```

### Krok 2: Uruchomienie testów jednostkowych

```bash
# Uruchom testy jednostkowe (single run - zalecane)
npm run test

# Uruchom testy w trybie watch (dla developmentu)
npm run test:watch

# Uruchom testy z interfejsem graficznym
npm run test:ui

# Uruchom testy z raportem pokrycia kodu
npm run test:coverage
```

### Krok 3: Uruchomienie testów E2E

```bash
# WAŻNE: Testy E2E wymagają uruchomionej aplikacji!
# W pierwszym terminalu uruchom aplikację:
npm run dev

# W drugim terminalu uruchom testy E2E:
npm run test:e2e

# Lub z interfejsem graficznym (łatwiejsze debugowanie):
npm run test:e2e:ui

# Generator testów E2E (nagrywanie akcji w przeglądarce):
npm run test:e2e:codegen
```

### Struktura plików testowych

```
10x-cards/
├── tests/                    # Testy jednostkowe i integracyjne
│   ├── unit/                 # Testy jednostkowe
│   │   └── hooks/            # Testy hooków React
│   ├── integration/          # Testy integracyjne
│   └── setup/                # Konfiguracja testów
│       ├── setup.ts          # Setup file (uruchamiany przed testami)
│       └── mocks/            # Mocki API (MSW)
├── e2e/                      # Testy E2E (Playwright)
│   ├── specs/                # Pliki testowe *.spec.ts
│   ├── page-objects/         # Page Object Model
│   └── fixtures/             # Dane testowe
├── vitest.config.ts          # Konfiguracja Vitest
└── playwright.config.ts      # Konfiguracja Playwright
```

### Przydatne linki do dokumentacji

| Narzędzie | Dokumentacja | Opis |
|-----------|--------------|------|
| **Vitest** | [vitest.dev](https://vitest.dev/) | Framework do testów jednostkowych |
| **React Testing Library** | [testing-library.com/react](https://testing-library.com/docs/react-testing-library/intro/) | Testowanie komponentów React |
| **Playwright** | [playwright.dev](https://playwright.dev/) | Framework do testów E2E |
| **MSW** | [mswjs.io](https://mswjs.io/) | Mockowanie API w testach |

### Częste problemy i rozwiązania

| Problem | Rozwiązanie |
|---------|-------------|
| `vitest: command not found` | Uruchom `npm install` |
| Testy E2E timeout | Upewnij się, że aplikacja działa na `localhost:4321` |
| `Cannot find module '@/...'` | Sprawdź aliasy w `vitest.config.ts` |
| Testy nie znajdują elementów | Użyj `npm run test:e2e:ui` do debugowania |

---

## 2. Strategia testowania

### 2.1 Testy jednostkowe

**Cel:** Walidacja logiki pojedynczych funkcji, komponentów React oraz modułów przetwarzania danych.

#### Komponenty React wymagające unit testów:

| Komponent | Plik | Zakres testów |
|-----------|------|---------------|
| `TextAreaInput` | `src/components/TextAreaInput.tsx` | Walidacja długości tekstu, obsługa onChange, stany disabled |
| `GenerateButton` | `src/components/GenerateButton.tsx` | Stany loading/disabled, wyświetlanie komunikatów |
| `ProposalCard` | `src/components/ProposalCard.tsx` | Renderowanie front/back, obsługa akcji (akceptuj/edytuj/odrzuć) |
| `ProposalsList` | `src/components/ProposalsList.tsx` | Bulk selection, iteracja po propozycjach |
| `BulkSaveButton` | `src/components/BulkSaveButton.tsx` | Logika zapisu, progress bar |
| `FlashcardCard` | `src/components/FlashcardCard.tsx` | Renderowanie fiszki, obsługa edycji/usuwania |
| `LoginForm` | `src/components/auth/LoginForm.tsx` | Walidacja formularza, obsługa błędów |
| `SignupForm` | `src/components/auth/SignupForm.tsx` | Walidacja pól, zgodność haseł |

#### Hooki wymagające unit testów:

| Hook | Plik | Zakres testów |
|------|------|---------------|
| `useTextValidation` | `src/components/hooks/useTextValidation.ts` | Walidacja 1000-10000 znaków, debouncing |
| `useGenerateFlashcards` | `src/components/hooks/useGenerateFlashcards.ts` | Zarządzanie stanem generowania, obsługa błędów |
| `useFlashcards` | `src/components/hooks/useFlashcards.ts` | Pobieranie fiszek, paginacja |
| `useSaveProgress` | `src/components/hooks/useSaveProgress.ts` | Śledzenie postępu zapisu |

#### Logika biznesowa i utility:

| Moduł | Plik | Zakres testów |
|-------|------|---------------|
| `createSourceTextHash` | `src/lib/generation.service.ts` | Generowanie hash MD5 |
| `generateFlashcardsWithOpenRouter` | `src/lib/openrouter.service.ts` | Parsowanie odpowiedzi LLM, obsługa błędów |
| `flashcard.service` | `src/lib/flashcard.service.ts` | CRUD operacje, walidacja danych |
| Schematy Zod | `src/lib/schemas/auth.ts` | Walidacja danych wejściowych |
| `canGenerateFromText` | `src/components/hooks/useTextValidation.ts` | Sprawdzanie wymagań dla generowania |

**Narzędzia:** Vitest, React Testing Library, @testing-library/dom

**Konfiguracja Vitest:**
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup/setup.ts'],
    include: ['tests/unit/**/*.test.ts', 'tests/unit/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/'],
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
```

---

### 2.2 Testy integracyjne

**Cel:** Weryfikacja poprawnej współpracy między komponentami frontendu, komunikacji z API oraz integracji z Supabase.

#### Kluczowe integracje do przetestowania:

| Integracja | Opis | Priorytet |
|------------|------|-----------|
| Frontend ↔ Supabase Auth | Rejestracja, logowanie, wylogowanie, usuwanie konta | 🔴 Krytyczny |
| Frontend ↔ Supabase Database | CRUD fiszek z uwzględnieniem RLS | 🔴 Krytyczny |
| Frontend ↔ Openrouter.ai API | Generowanie fiszek, obsługa timeoutów | 🔴 Krytyczny |
| Middleware ↔ Supabase Auth | Walidacja sesji, ochrona ścieżek | 🔴 Krytyczny |
| Zustand Store ↔ API | Synchronizacja stanu z backendem | 🟠 Wysoki |
| Zod Schemas ↔ API Endpoints | Walidacja danych wejściowych | 🟠 Wysoki |

#### Scenariusze integracyjne:

```typescript
// Przykład testu integracyjnego dla generowania fiszek
describe('Generation Integration', () => {
  it('should generate flashcards from valid source text', async () => {
    // Mock Openrouter API response
    server.use(
      http.post('https://openrouter.ai/api/v1/chat/completions', () => {
        return HttpResponse.json({
          choices: [{
            message: {
              content: JSON.stringify({
                flashcards: [
                  { front: 'Pytanie 1', back: 'Odpowiedź 1' },
                  { front: 'Pytanie 2', back: 'Odpowiedź 2' },
                ]
              })
            }
          }]
        });
      })
    );

    const result = await generateFlashcards(mockSupabase, userId, validSourceText);
    
    expect(result.flashcards_proposals).toHaveLength(2);
    expect(result.generation_id).toBeDefined();
  });
});
```

**Narzędzia:** Vitest, MSW (Mock Service Worker)

**Konfiguracja MSW:**
```typescript
// tests/setup/msw-handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  // Mock Supabase Auth
  http.post('*/auth/v1/token', () => {
    return HttpResponse.json({
      access_token: 'mock-token',
      user: { id: 'user-123', email: 'test@example.com' }
    });
  }),
  
  // Mock Openrouter API
  http.post('https://openrouter.ai/api/v1/chat/completions', () => {
    return HttpResponse.json({
      choices: [{ message: { content: '{"flashcards": []}' } }]
    });
  }),
];
```

---

### 2.3 Testy E2E

**Cel:** Symulacja pełnych ścieżek użytkownika, weryfikacja działania aplikacji w przeglądarce.

#### Krytyczne ścieżki użytkownika:

| ID | User Story | Ścieżka testowa | Priorytet |
|----|------------|-----------------|-----------|
| E2E-001 | US-001 | Rejestracja nowego użytkownika | 🔴 Krytyczny |
| E2E-002 | US-002 | Logowanie istniejącego użytkownika | 🔴 Krytyczny |
| E2E-003 | US-002 | Reset hasła | 🟠 Wysoki |
| E2E-004 | US-003 | Generowanie fiszek przez AI (bez logowania) | 🔴 Krytyczny |
| E2E-005 | US-004 | Przegląd → edycja → akceptacja propozycji | 🔴 Krytyczny |
| E2E-006 | US-004 | Zapis fiszek (przekierowanie do logowania) | 🔴 Krytyczny |
| E2E-007 | US-005 | Edycja zapisanej fiszki | 🟠 Wysoki |
| E2E-008 | US-006 | Usunięcie fiszki z potwierdzeniem | 🟠 Wysoki |
| E2E-009 | US-007 | Ręczne tworzenie fiszki | 🟠 Wysoki |
| E2E-010 | US-008 | Sesja nauki (do implementacji) | 🟡 Średni |
| E2E-011 | US-009 | Odmowa dostępu dla niezalogowanego | 🔴 Krytyczny |

**Narzędzia:** Playwright

**Struktura katalogów E2E:**
```
e2e/
├── fixtures/
│   ├── test-data.ts          # Dane testowe
│   └── auth.fixture.ts       # Fixture do autentykacji
├── page-objects/
│   ├── LoginPage.ts
│   ├── SignupPage.ts
│   ├── GeneratePage.ts
│   ├── FlashcardsPage.ts
│   └── StudyPage.ts
├── specs/
│   ├── auth.spec.ts
│   ├── generate.spec.ts
│   ├── flashcards.spec.ts
│   └── study.spec.ts
└── playwright.config.ts
```

**Przykład Page Object:**
```typescript
// e2e/page-objects/GeneratePage.ts
import { Page, Locator } from '@playwright/test';

export class GeneratePage {
  readonly page: Page;
  readonly sourceTextArea: Locator;
  readonly generateButton: Locator;
  readonly proposalsList: Locator;
  readonly saveButton: Locator;
  readonly charCounter: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sourceTextArea = page.getByRole('textbox', { name: /tekst źródłowy/i });
    this.generateButton = page.getByRole('button', { name: /generuj/i });
    this.proposalsList = page.locator('#generation-results');
    this.saveButton = page.getByRole('button', { name: /zapisz/i });
    this.charCounter = page.locator('[data-testid="char-counter"]');
  }

  async goto() {
    await this.page.goto('/generate');
  }

  async enterSourceText(text: string) {
    await this.sourceTextArea.fill(text);
  }

  async generate() {
    await this.generateButton.click();
    await this.proposalsList.waitFor({ state: 'visible' });
  }

  async getProposalsCount(): Promise<number> {
    return await this.page.locator('[data-testid="proposal-card"]').count();
  }
}
```

**Konfiguracja Playwright:**
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/specs',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'test-results/e2e-junit.xml' }],
  ],
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

### 2.4 Testy API

**Cel:** Weryfikacja poprawności endpointów API, walidacji danych i obsługi błędów.

#### Endpointy do przetestowania:

| Endpoint | Metoda | Wymaga Auth | Zakres testów |
|----------|--------|-------------|---------------|
| `/api/auth/signup` | POST | ❌ | Walidacja email/hasło, duplikaty |
| `/api/auth/login` | POST | ❌ | Poprawne/błędne dane, rate limiting |
| `/api/auth/logout` | POST | ✅ | Wylogowanie, czyszczenie sesji |
| `/api/auth/reset-password` | POST | ❌ | Wysyłanie maila reset |
| `/api/auth/update-password` | POST | ✅ | Zmiana hasła |
| `/api/auth/delete-account` | DELETE | ✅ | Usuwanie konta i danych (RODO) |
| `/api/generations` | POST | ❌ | Generowanie fiszek, walidacja 1000-10000 znaków |
| `/api/flashcards` | GET | ✅ | Pobieranie fiszek, paginacja |
| `/api/flashcards` | POST | ✅ | Tworzenie fiszek (batch) |
| `/api/flashcards/[id]` | PUT | ✅ | Aktualizacja fiszki |
| `/api/flashcards/[id]` | DELETE | ✅ | Usuwanie fiszki |

> ✅ **US-003 zaimplementowane:** Generowanie fiszek jest dostępne bez logowania. Dla zalogowanych użytkowników metadane są zapisywane w bazie (`generation_id`), dla niezalogowanych — zwracane są tylko propozycje bez zapisu (`generation_id: null`).

**Scenariusze testowe API:**

```typescript
// tests/api/generations.test.ts
describe('POST /api/generations', () => {
  it('should return 400 for text < 1000 characters', async () => {
    const response = await fetch('/api/generations', {
      method: 'POST',
      body: JSON.stringify({ source_text: 'za krótki tekst' }),
    });
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.message).toContain('1000 znaków');
  });

  it('should return 400 for text > 10000 characters', async () => {
    const response = await fetch('/api/generations', {
      method: 'POST',
      body: JSON.stringify({ source_text: 'a'.repeat(10001) }),
    });
    expect(response.status).toBe(400);
  });

  it('should return 201 with generated flashcards', async () => {
    const response = await fetch('/api/generations', {
      method: 'POST',
      body: JSON.stringify({ source_text: validText }),
    });
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.generation_id).toBeDefined();
    expect(body.flashcards_proposals).toBeInstanceOf(Array);
  });
});
```

---

### 2.5 Testy bezpieczeństwa

**Cel:** Sprawdzenie mechanizmów autoryzacji, weryfikacja zabezpieczeń przed atakami oraz kontrola dostępu do funkcji chronionych.

#### Obszary testów bezpieczeństwa:

| Obszar | Opis | Narzędzie |
|--------|------|-----------|
| Row Level Security (RLS) | User widzi tylko swoje fiszki | Testy manualne + Playwright |
| Walidacja JWT | Tokeny są poprawnie weryfikowane | Vitest |
| IDOR Protection | Brak dostępu do cudzych zasobów | Playwright |
| XSS Prevention | Sanityzacja danych wejściowych | OWASP ZAP |
| CSRF Protection | Ochrona przed cross-site request forgery | Manual |
| Rate Limiting | Ochrona przed brute force | Manual + k6 |

#### Testy RLS w Supabase:

```typescript
// tests/security/rls.test.ts
describe('Row Level Security', () => {
  it('user cannot access flashcards of another user', async () => {
    // Login as user A
    const userA = await loginAs('userA@test.com');
    
    // Create flashcard as user A
    const flashcard = await createFlashcard(userA.token, { front: 'Q', back: 'A' });
    
    // Login as user B
    const userB = await loginAs('userB@test.com');
    
    // Try to access user A's flashcard
    const response = await fetch(`/api/flashcards/${flashcard.id}`, {
      headers: { Authorization: `Bearer ${userB.token}` }
    });
    
    expect(response.status).toBe(404); // Not found due to RLS
  });

  it('user cannot update flashcards of another user', async () => {
    // Similar test for PUT endpoint
  });

  it('user cannot delete flashcards of another user', async () => {
    // Similar test for DELETE endpoint
  });
});
```

#### Testy IDOR:

```typescript
// e2e/specs/security.spec.ts
test('IDOR: cannot access other user flashcard via URL manipulation', async ({ page }) => {
  // Login as user A and get flashcard ID
  await loginAs(page, 'userA@test.com');
  await page.goto('/flashcards');
  const flashcardId = await page.locator('[data-flashcard-id]').first().getAttribute('data-flashcard-id');
  
  // Logout and login as user B
  await logout(page);
  await loginAs(page, 'userB@test.com');
  
  // Try to access user A's flashcard
  const response = await page.goto(`/api/flashcards/${flashcardId}`);
  expect(response?.status()).toBe(404);
});
```

**Narzędzia:** OWASP ZAP, Snyk (dependency scanning)

---

### 2.6 Testy wydajnościowe (opcjonalne dla MVP)

**Cel:** Mierzenie czasu odpowiedzi endpointów API, ocena szybkości renderowania oraz testy obciążeniowe.

#### Metryki do monitorowania:

| Metryka | Cel | Akceptowalne |
|---------|-----|--------------|
| Czas generowania fiszek AI | < 30s | < 60s |
| Czas odpowiedzi GET /flashcards | < 200ms | < 500ms |
| Czas odpowiedzi POST /flashcards | < 300ms | < 1s |
| Time to First Byte (TTFB) | < 200ms | < 500ms |
| Largest Contentful Paint (LCP) | < 2.5s | < 4s |
| First Input Delay (FID) | < 100ms | < 300ms |

#### Testy obciążeniowe:

```javascript
// k6/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp up
    { duration: '1m', target: 20 },   // Stay at 20 users
    { duration: '30s', target: 0 },   // Ramp down
  ],
};

export default function () {
  const res = http.get('http://localhost:4321/api/flashcards');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  sleep(1);
}
```

**Narzędzia:** k6, Lighthouse CI, Web Vitals

---

## 3. Przypadki testowe według User Stories

### 3.1 US-001: Rejestracja konta

| ID testu | Scenariusz | Kroki testowe | Oczekiwany rezultat | Priorytet |
|----------|------------|---------------|---------------------|-----------|
| TC-001-01 | Poprawna rejestracja | 1. Przejdź do /auth/signup<br>2. Wypełnij email, hasło, potwierdzenie<br>3. Kliknij "Zarejestruj" | Konto utworzone, użytkownik zalogowany, przekierowanie do /generate | 🔴 Krytyczny |
| TC-001-02 | Walidacja email | 1. Wprowadź niepoprawny format email<br>2. Kliknij "Zarejestruj" | Komunikat błędu walidacji | 🟠 Wysoki |
| TC-001-03 | Hasła niezgodne | 1. Wprowadź różne hasła w polach<br>2. Kliknij "Zarejestruj" | Komunikat "Hasła nie są zgodne" | 🟠 Wysoki |
| TC-001-04 | Hasło za krótkie | 1. Wprowadź hasło < 8 znaków<br>2. Kliknij "Zarejestruj" | Komunikat o minimalnej długości hasła | 🟠 Wysoki |
| TC-001-05 | Email już istnieje | 1. Użyj emaila istniejącego użytkownika<br>2. Kliknij "Zarejestruj" | Komunikat "Email już zarejestrowany" | 🟠 Wysoki |
| TC-001-06 | Puste pola | 1. Pozostaw wszystkie pola puste<br>2. Kliknij "Zarejestruj" | Komunikaty walidacji dla wszystkich pól | 🟡 Średni |

### 3.2 US-002: Logowanie do aplikacji

| ID testu | Scenariusz | Kroki testowe | Oczekiwany rezultat | Priorytet |
|----------|------------|---------------|---------------------|-----------|
| TC-002-01 | Poprawne logowanie | 1. Przejdź do /auth/login<br>2. Wprowadź poprawne dane<br>3. Kliknij "Zaloguj" | Użytkownik zalogowany, przekierowanie do /generate | 🔴 Krytyczny |
| TC-002-02 | Błędne hasło | 1. Wprowadź poprawny email, błędne hasło<br>2. Kliknij "Zaloguj" | Komunikat "Nieprawidłowy email lub hasło" | 🔴 Krytyczny |
| TC-002-03 | Nieistniejący email | 1. Wprowadź nieistniejący email<br>2. Kliknij "Zaloguj" | Komunikat "Nieprawidłowy email lub hasło" | 🟠 Wysoki |
| TC-002-04 | Wylogowanie | 1. Będąc zalogowanym, kliknij "Wyloguj" | Sesja zakończona, przekierowanie do strony głównej | 🔴 Krytyczny |
| TC-002-05 | Reset hasła | 1. Kliknij "Zapomniałem hasła"<br>2. Wprowadź email<br>3. Kliknij "Resetuj" | Email z linkiem do resetu wysłany | 🟠 Wysoki |
| TC-002-06 | Rate limiting | 1. Wykonaj 10 nieudanych prób logowania | Komunikat "Zbyt wiele prób logowania" | 🟡 Średni |

### 3.3 US-003: Generowanie fiszek przy użyciu AI

| ID testu | Scenariusz | Kroki testowe | Oczekiwany rezultat | Priorytet |
|----------|------------|---------------|---------------------|-----------|
| TC-003-01 | Generowanie bez logowania | 1. Bez logowania przejdź do /generate<br>2. Wklej tekst 1500 znaków<br>3. Kliknij "Generuj" | Propozycje fiszek wyświetlone | 🔴 Krytyczny |
| TC-003-02 | Walidacja min. znaków | 1. Wklej tekst 500 znaków<br>2. Obserwuj przycisk "Generuj" | Przycisk nieaktywny, komunikat o min. 1000 znakach | 🔴 Krytyczny |
| TC-003-03 | Walidacja max. znaków | 1. Wklej tekst 11000 znaków<br>2. Obserwuj przycisk "Generuj" | Przycisk nieaktywny, komunikat o max. 10000 znakach | 🔴 Krytyczny |
| TC-003-04 | Licznik znaków | 1. Wpisuj tekst<br>2. Obserwuj licznik | Licznik aktualizuje się w czasie rzeczywistym | 🟠 Wysoki |
| TC-003-05 | Błąd API LLM | 1. (Mock) Symuluj timeout API<br>2. Kliknij "Generuj" | Komunikat błędu, możliwość ponowienia | 🔴 Krytyczny |
| TC-003-06 | Stan ładowania | 1. Kliknij "Generuj"<br>2. Obserwuj UI podczas generowania | Skeleton loader, komunikat "Trwa generowanie..." | 🟠 Wysoki |
| TC-003-07 | Graniczny przypadek 1000 znaków | 1. Wklej dokładnie 1000 znaków<br>2. Kliknij "Generuj" | Generowanie rozpoczyna się poprawnie | 🟡 Średni |
| TC-003-08 | Graniczny przypadek 10000 znaków | 1. Wklej dokładnie 10000 znaków<br>2. Kliknij "Generuj" | Generowanie rozpoczyna się poprawnie | 🟡 Średni |

### 3.4 US-004: Przegląd i zatwierdzanie propozycji fiszek

| ID testu | Scenariusz | Kroki testowe | Oczekiwany rezultat | Priorytet |
|----------|------------|---------------|---------------------|-----------|
| TC-004-01 | Przegląd propozycji | 1. Wygeneruj fiszki<br>2. Przejrzyj listę | Lista propozycji z front/back, licznik | 🔴 Krytyczny |
| TC-004-02 | Akceptacja fiszki | 1. Wygeneruj fiszki<br>2. Kliknij "Akceptuj" przy fiszce | Fiszka zaznaczona jako zaakceptowana | 🔴 Krytyczny |
| TC-004-03 | Edycja propozycji | 1. Wygeneruj fiszki<br>2. Kliknij "Edytuj"<br>3. Zmień treść<br>4. Zapisz | Treść fiszki zaktualizowana | 🔴 Krytyczny |
| TC-004-04 | Odrzucenie propozycji | 1. Wygeneruj fiszki<br>2. Kliknij "Odrzuć" | Fiszka usunięta z listy propozycji | 🟠 Wysoki |
| TC-004-05 | Bulk selection | 1. Wygeneruj fiszki<br>2. Zaznacz wszystkie/odznacz | Licznik zaznaczonych się aktualizuje | 🟠 Wysoki |
| TC-004-06 | Zapis bez logowania | 1. Bez logowania wygeneruj fiszki<br>2. Kliknij "Zapisz" | Przekierowanie do /auth/login | 🔴 Krytyczny |
| TC-004-07 | Zapis po zalogowaniu | 1. Zaloguj się<br>2. Wygeneruj fiszki<br>3. Zaznacz i zapisz | Fiszki zapisane, przekierowanie do /flashcards | 🔴 Krytyczny |
| TC-004-08 | Źródło fiszki | 1. Zapisz fiszkę bez edycji<br>2. Sprawdź source | source = "ai-full" | 🟡 Średni |
| TC-004-09 | Źródło edytowanej fiszki | 1. Edytuj fiszkę przed zapisem<br>2. Sprawdź source | source = "ai-edited" | 🟡 Średni |

### 3.5 US-005: Edycja fiszek

| ID testu | Scenariusz | Kroki testowe | Oczekiwany rezultat | Priorytet |
|----------|------------|---------------|---------------------|-----------|
| TC-005-01 | Edycja front | 1. Przejdź do /flashcards<br>2. Kliknij fiszkę<br>3. Edytuj "Przód"<br>4. Zapisz | Front zaktualizowany | 🔴 Krytyczny |
| TC-005-02 | Edycja back | 1. Edytuj "Tył" fiszki<br>2. Zapisz | Back zaktualizowany | 🔴 Krytyczny |
| TC-005-03 | Walidacja front max 200 | 1. Wprowadź > 200 znaków w front<br>2. Zapisz | Błąd walidacji | 🟠 Wysoki |
| TC-005-04 | Walidacja back max 500 | 1. Wprowadź > 500 znaków w back<br>2. Zapisz | Błąd walidacji | 🟠 Wysoki |
| TC-005-05 | Anulowanie edycji | 1. Rozpocznij edycję<br>2. Kliknij "Anuluj" | Zmiany odrzucone | 🟡 Średni |
| TC-005-06 | Zmiana source na ai-edited | 1. Edytuj fiszkę AI<br>2. Zapisz | source zmienia się na "ai-edited" | 🟡 Średni |

### 3.6 US-006: Usuwanie fiszek

| ID testu | Scenariusz | Kroki testowe | Oczekiwany rezultat | Priorytet |
|----------|------------|---------------|---------------------|-----------|
| TC-006-01 | Usunięcie z potwierdzeniem | 1. Kliknij "Usuń" przy fiszce<br>2. Potwierdź w dialogu | Fiszka usunięta z listy | 🔴 Krytyczny |
| TC-006-02 | Anulowanie usuwania | 1. Kliknij "Usuń"<br>2. Anuluj w dialogu | Fiszka pozostaje | 🟠 Wysoki |
| TC-006-03 | Usunięcie nieistniejącej | 1. (API) DELETE /flashcards/999999 | 404 Not Found | 🟡 Średni |

### 3.7 US-007: Ręczne tworzenie fiszek

| ID testu | Scenariusz | Kroki testowe | Oczekiwany rezultat | Priorytet |
|----------|------------|---------------|---------------------|-----------|
| TC-007-01 | Tworzenie ręczne | 1. Przejdź do /flashcards<br>2. Kliknij "Dodaj fiszkę"<br>3. Wypełnij front/back<br>4. Zapisz | Nowa fiszka na liście z source="manual" | 🔴 Krytyczny |
| TC-007-02 | Walidacja pustych pól | 1. Pozostaw pola puste<br>2. Kliknij "Zapisz" | Błędy walidacji | 🟠 Wysoki |
| TC-007-03 | generation_id = null dla manual | 1. Utwórz fiszkę ręcznie<br>2. Sprawdź w DB | generation_id jest null | 🟡 Średni |

### 3.8 US-008: Sesja nauki z algorytmem powtórek *(do implementacji)*

| ID testu | Scenariusz | Kroki testowe | Oczekiwany rezultat | Priorytet |
|----------|------------|---------------|---------------------|-----------|
| TC-008-01 | Start sesji nauki | 1. Przejdź do /study<br>2. Kliknij "Rozpocznij" | Wyświetla się pierwsza fiszka (front) | 🔴 Krytyczny |
| TC-008-02 | Odsłonięcie odpowiedzi | 1. W sesji nauki kliknij "Pokaż odpowiedź" | Wyświetla się back fiszki | 🔴 Krytyczny |
| TC-008-03 | Ocena fiszki | 1. Po odsłonięciu wybierz ocenę<br>2. Obserwuj kolejną fiszkę | Kolejna fiszka wyświetlona | 🔴 Krytyczny |
| TC-008-04 | Zakończenie sesji | 1. Przejdź przez wszystkie fiszki | Podsumowanie sesji | 🟠 Wysoki |
| TC-008-05 | Pusta sesja | 1. Usuń wszystkie fiszki<br>2. Przejdź do /study | Komunikat "Brak fiszek do nauki" | 🟠 Wysoki |

### 3.9 US-009: Bezpieczny dostęp i autoryzacja

| ID testu | Scenariusz | Kroki testowe | Oczekiwany rezultat | Priorytet |
|----------|------------|---------------|---------------------|-----------|
| TC-009-01 | Odmowa dostępu do /flashcards | 1. Bez logowania przejdź do /flashcards | Przekierowanie do /auth/login | 🔴 Krytyczny |
| TC-009-02 | Odmowa dostępu do /study | 1. Bez logowania przejdź do /study | Przekierowanie do /auth/login | 🔴 Krytyczny |
| TC-009-03 | Dostęp do /generate bez logowania | 1. Bez logowania przejdź do /generate | Strona dostępna | 🔴 Krytyczny |
| TC-009-04 | API 401 dla chronionych endpointów | 1. Bez tokenu wywołaj GET /api/flashcards | 401 Unauthorized | 🔴 Krytyczny |
| TC-009-05 | RLS izolacja danych | 1. Zaloguj jako user A<br>2. Utwórz fiszkę<br>3. Zaloguj jako user B<br>4. Pobierz fiszki | User B nie widzi fiszek user A | 🔴 Krytyczny |
| TC-009-06 | IDOR protection | 1. Zaloguj jako user A<br>2. Spróbuj edytować/usunąć fiszkę user B | 404 lub 403 | 🔴 Krytyczny |

---

## 4. Przypadki brzegowe i negatywne

### 4.1 Generowanie fiszek (US-003)

| ID | Scenariusz | Oczekiwane zachowanie |
|----|------------|----------------------|
| NEG-003-01 | Tekst = 999 znaków | Błąd walidacji "min. 1000 znaków" |
| NEG-003-02 | Tekst = 10001 znaków | Błąd walidacji "max. 10000 znaków" |
| NEG-003-03 | Tekst = pusty string | Przycisk nieaktywny |
| NEG-003-04 | Tekst = same spacje | Traktowane jako pusty tekst |
| NEG-003-05 | Timeout API LLM (> 60s) | Komunikat błędu timeout, możliwość retry |
| NEG-003-06 | Błąd 500 z API LLM | Komunikat błędu serwera, log do generation_error_logs |
| NEG-003-07 | Nieprawidłowy JSON z LLM | Błąd parsowania, log błędu |
| NEG-003-08 | LLM zwraca pustą listę fiszek | Komunikat "Nie udało się wygenerować fiszek" |

### 4.2 Autentykacja (US-001, US-002)

| ID | Scenariusz | Oczekiwane zachowanie |
|----|------------|----------------------|
| NEG-001-01 | Email bez @ | Błąd walidacji format email |
| NEG-001-02 | Hasło = "123" | Błąd walidacji min. długość |
| NEG-002-01 | 10+ nieudanych logowań | Rate limiting, blokada czasowa |
| NEG-002-02 | Wygasły token JWT | 401, przekierowanie do logowania |
| NEG-002-03 | Zmanipulowany token JWT | 401 Unauthorized |

### 4.3 CRUD fiszek (US-005, US-006, US-007)

| ID | Scenariusz | Oczekiwane zachowanie |
|----|------------|----------------------|
| NEG-005-01 | Front > 200 znaków | Błąd walidacji |
| NEG-005-02 | Back > 500 znaków | Błąd walidacji |
| NEG-005-03 | Front = pusty | Błąd walidacji |
| NEG-005-04 | Back = pusty | Błąd walidacji |
| NEG-006-01 | Usunięcie nieistniejącej fiszki | 404 Not Found |
| NEG-006-02 | Usunięcie cudzej fiszki | 404 (RLS) |
| NEG-007-01 | Tworzenie z generation_id dla manual | Błąd walidacji |

### 4.4 Sesja nauki (US-008)

| ID | Scenariusz | Oczekiwane zachowanie |
|----|------------|----------------------|
| NEG-008-01 | Brak fiszek do powtórki | Komunikat "Brak fiszek" |
| NEG-008-02 | Sesja przerwana (refresh) | Możliwość kontynuacji lub restart |

---

## 5. Środowisko testowe

### 5.1 Środowisko lokalne (development)

```bash
# Uruchomienie Supabase lokalnie
supabase start

# Uruchomienie dev server
npm run dev

# Zmienne środowiskowe (.env.local)
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=<local_anon_key>
SUPABASE_SERVICE_ROLE_KEY=<local_service_role_key>
OPENROUTER_API_KEY=<test_api_key>
```

### 5.2 Środowisko CI (GitHub Actions)

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm ci
      - run: npm run test:coverage
      
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

### 5.3 Środowisko staging (DigitalOcean)

- Dedykowana instancja Supabase (oddzielna baza danych)
- Docker container z aplikacją
- Mockowane API Openrouter dla testów automatycznych
- Rzeczywiste API dla smoke testów

### 5.4 Konfiguracja testów

#### Instalacja zależności:

```bash
# Dodanie Vitest i narzędzi testowych
npm install -D vitest @vitest/coverage-v8 @vitest/ui
npm install -D @testing-library/react @testing-library/dom @testing-library/jest-dom
npm install -D jsdom
npm install -D msw

# Dodanie Playwright
npm install -D @playwright/test
npx playwright install
```

#### Skrypty w package.json:

```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:codegen": "playwright codegen http://localhost:4321"
  }
}
```

---

## 6. Metryki sukcesu testów

### 6.1 Powiązanie z metrykami PRD

| Metryka PRD | Cel | Sposób weryfikacji |
|-------------|-----|-------------------|
| 75% akceptacji fiszek AI | Użytkownicy akceptują ≥75% wygenerowanych fiszek | Analiza danych z tabeli `generations` (accepted_*_count / generated_count) |
| 75% fiszek tworzonych przez AI | Większość fiszek pochodzi z AI | Analiza source w tabeli `flashcards` |

### 6.2 Metryki pokrycia testami

| Kategoria | Cel minimum | Cel optymalny |
|-----------|-------------|---------------|
| Pokrycie kodu (statements) | 70% | 80% |
| Pokrycie kodu (branches) | 60% | 75% |
| Pokrycie kodu (functions) | 70% | 85% |
| Testy E2E krytycznych ścieżek | 100% US-001 do US-009 | + edge cases |

### 6.3 Kryteria jakości

| Kryterium | Wymaganie |
|-----------|-----------|
| Wszystkie testy jednostkowe | ✅ PASS |
| Wszystkie testy E2E | ✅ PASS |
| Brak błędów krytycznych | 0 blokerów |
| Brak regresji | 0 failed tests w CI |
| Czas odpowiedzi API | < 500ms (p95) |
| Zgodność z WCAG 2.1 AA | Axe/pa11y bez critical errors |

---

## 7. Ryzyka i zależności

### 7.1 Ryzyka techniczne

| Ryzyko | Prawdopodobieństwo | Wpływ | Mitygacja |
|--------|-------------------|-------|-----------|
| Niedostępność API Openrouter | Średnie | 🔴 Wysoki | Mockowanie w testach, retry logic w kodzie |
| Rate limiting API LLM | Wysokie | 🟠 Średni | Throttling, kolejkowanie requestów |
| Zmiany w Supabase Auth API | Niskie | 🟠 Średni | Pinowanie wersji, monitoring changelog |
| Timeout generowania fiszek | Średnie | 🟠 Średni | Timeout handling, feedback dla użytkownika |
| Niestabilność testów E2E | Średnie | 🟡 Niski | Retry, stabilne selektory, wait conditions |

### 7.2 Zależności zewnętrzne

| Zależność | Typ | Strategia testowania |
|-----------|-----|---------------------|
| Openrouter.ai | API LLM | MSW mock w unit/integration, rzeczywiste API w smoke tests |
| Supabase Auth | Autentykacja | Supabase local w dev, mock w CI |
| Supabase Database | Storage | Supabase local w dev, testowa instancja w CI |

### 7.3 Strategia mockowania Openrouter API

```typescript
// tests/mocks/openrouter.ts
export const mockOpenRouterSuccess = http.post(
  'https://openrouter.ai/api/v1/chat/completions',
  () => {
    return HttpResponse.json({
      id: 'gen-123',
      choices: [{
        message: {
          content: JSON.stringify({
            flashcards: [
              { front: 'Co to jest TypeScript?', back: 'Typowany nadzbiór JavaScript' },
              { front: 'Co to jest React?', back: 'Biblioteka do budowania UI' },
            ]
          })
        }
      }]
    });
  }
);

export const mockOpenRouterTimeout = http.post(
  'https://openrouter.ai/api/v1/chat/completions',
  async () => {
    await delay(65000); // Symulacja timeout
    return HttpResponse.error();
  }
);

export const mockOpenRouterError = http.post(
  'https://openrouter.ai/api/v1/chat/completions',
  () => {
    return HttpResponse.json(
      { error: { message: 'Rate limit exceeded' } },
      { status: 429 }
    );
  }
);
```

---

## 8. Harmonogram testów

### Faza I (1-2 tygodnie): Testy jednostkowe i integracyjne

**Kryteria wejścia:**
- Skonfigurowane środowisko Vitest
- Zainstalowane MSW do mockowania API
- Zdefiniowane struktury katalogów testów

**Zakres:**
- Testy jednostkowe dla hooków (`useTextValidation`, `useGenerateFlashcards`, `useFlashcards`)
- Testy jednostkowe dla serwisów (`generation.service`, `flashcard.service`)
- Testy walidacji Zod schemas
- Testy integracyjne dla przepływów API

**Kryteria wyjścia:**
- Pokrycie kodu ≥ 70%
- Wszystkie testy PASS
- Brak regresji w istniejących funkcjonalnościach

### Faza II (2-3 tygodnie): Testy E2E i bezpieczeństwa

**Kryteria wejścia:**
- Skonfigurowany Playwright
- Page Object Model dla kluczowych stron
- Środowisko testowe z Supabase local

**Zakres:**
- Testy E2E dla wszystkich User Stories (US-001 do US-009)
- Testy RLS (Row Level Security)
- Testy IDOR
- Testy walidacji JWT

**Kryteria wyjścia:**
- 100% krytycznych ścieżek pokrytych testami E2E
- Brak błędów bezpieczeństwa kategorii Critical/High
- Playwright report bez failures

### Faza III (1 tydzień): Testy wydajnościowe i regresyjne

**Kryteria wejścia:**
- Ukończone fazy I i II
- Skonfigurowany Lighthouse CI
- Przygotowane skrypty k6

**Zakres:**
- Testy wydajnościowe API (czas odpowiedzi)
- Testy Web Vitals (LCP, FID, CLS)
- Testy obciążeniowe (k6)
- Pełny cykl regresyjny

**Kryteria wyjścia:**
- API response time < 500ms (p95)
- Web Vitals w "good" range
- Brak regresji w funkcjonalnościach

### Faza IV (ciągła): Testy regresyjne w CI/CD

**Zakres:**
- Automatyczne uruchamianie testów przy każdym PR
- Blokowanie merge przy failujących testach
- Raportowanie pokrycia kodu

**Workflow:**
```
PR Created → Lint → Unit Tests → Integration Tests → E2E Tests → Deploy to Staging
```

---

## 9. Role i odpowiedzialności

| Rola | Odpowiedzialności |
|------|-------------------|
| **Inżynier QA** | Przygotowanie Test Planu, implementacja testów E2E, raportowanie wyników |
| **Developerzy** | Implementacja testów jednostkowych, naprawa zgłoszonych błędów, code review testów |
| **Product Owner** | Weryfikacja spełnienia wymagań biznesowych, akceptacja kryteriów testowych |
| **DevOps** | Konfiguracja CI/CD, środowiska testowe, monitoring |

---

## 10. Procedury raportowania błędów

### 10.1 Szablon zgłoszenia błędu

```markdown
## Tytuł
[Krótki, opisowy tytuł]

## Środowisko
- Przeglądarka: Chrome 120
- System: Windows 11
- Środowisko: local / staging / production

## Kroki reprodukcji
1. Przejdź do...
2. Kliknij...
3. Wprowadź...

## Oczekiwany rezultat
[Co powinno się stać]

## Faktyczny rezultat
[Co faktycznie się stało]

## Priorytet
- [ ] 🔴 Krytyczny (blokuje główną funkcjonalność)
- [ ] 🟠 Wysoki (główne ścieżki użytkownika)
- [ ] 🟡 Średni (funkcje pomocnicze)
- [ ] 🟢 Niski (edge cases, UI/UX)

## Załączniki
[Screenshoty, logi, nagrania]
```

### 10.2 Kategoryzacja błędów

| Priorytet | Opis | SLA naprawy |
|-----------|------|-------------|
| 🔴 Krytyczny | Blokuje główną funkcjonalność (logowanie, generowanie) | < 24h |
| 🟠 Wysoki | Główne ścieżki użytkownika uszkodzone | < 3 dni |
| 🟡 Średni | Funkcje pomocnicze, błędy UI | < 1 tydzień |
| 🟢 Niski | Edge cases, drobne niedogodności | Backlog |

### 10.3 Narzędzia do zarządzania błędami

- **GitHub Issues** — śledzenie błędów, integracja z PR
- **GitHub Projects** — kanban board dla priorytetyzacji

---

## 11. Narzędzia do testowania

| Narzędzie | Zastosowanie |
|-----------|--------------|
| **Vitest** | Testy jednostkowe i integracyjne (zoptymalizowany dla Vite/Astro) |
| **React Testing Library** | Testowanie komponentów React |
| **@testing-library/dom** | Testowanie statycznych komponentów Astro |
| **Playwright** | Testy E2E, wieloprzeglądarkowość |
| **MSW (Mock Service Worker)** | Mockowanie API w testach |
| **Axe/pa11y** | Testy dostępności (WCAG) |
| **Lighthouse CI** | Testy wydajnościowe frontendu |
| **k6** | Testy obciążeniowe API |
| **Codecov** | Śledzenie pokrycia kodu |
| **OWASP ZAP** | Skanowanie bezpieczeństwa (opcjonalne) |

---

## 12. Załączniki

### 12.1 Struktura katalogów testów

```
10x-cards/
├── tests/
│   ├── unit/
│   │   ├── components/
│   │   │   ├── TextAreaInput.test.tsx
│   │   │   ├── GenerateButton.test.tsx
│   │   │   ├── ProposalCard.test.tsx
│   │   │   └── ...
│   │   ├── hooks/
│   │   │   ├── useTextValidation.test.ts
│   │   │   ├── useGenerateFlashcards.test.ts
│   │   │   └── ...
│   │   ├── services/
│   │   │   ├── generation.service.test.ts
│   │   │   ├── flashcard.service.test.ts
│   │   │   └── ...
│   │   └── schemas/
│   │       └── auth.test.ts
│   ├── integration/
│   │   ├── api/
│   │   │   ├── generations.test.ts
│   │   │   ├── flashcards.test.ts
│   │   │   └── auth.test.ts
│   │   └── flows/
│   │       └── generate-save-flow.test.ts
│   ├── setup/
│   │   ├── setup.ts
│   │   └── msw-handlers.ts
│   └── mocks/
│       ├── supabase.ts
│       └── openrouter.ts
├── e2e/
│   ├── fixtures/
│   │   ├── test-data.ts
│   │   └── auth.fixture.ts
│   ├── page-objects/
│   │   ├── LoginPage.ts
│   │   ├── SignupPage.ts
│   │   ├── GeneratePage.ts
│   │   ├── FlashcardsPage.ts
│   │   └── StudyPage.ts
│   └── specs/
│       ├── auth.spec.ts
│       ├── generate.spec.ts
│       ├── flashcards.spec.ts
│       ├── study.spec.ts
│       └── security.spec.ts
├── vitest.config.ts
└── playwright.config.ts
```

### 12.2 Checklist przed release

- [ ] Wszystkie testy jednostkowe PASS
- [ ] Wszystkie testy integracyjne PASS
- [ ] Wszystkie testy E2E PASS
- [ ] Pokrycie kodu ≥ 70%
- [ ] Brak błędów krytycznych/wysokich
- [ ] Testy bezpieczeństwa (RLS, IDOR) PASS
- [ ] Lighthouse score ≥ 90 (Performance)
- [ ] Axe accessibility check PASS
- [ ] Smoke tests na staging PASS
- [ ] Dokumentacja zaktualizowana

---

*Dokument utworzony: grudzień 2024*  
*Wersja: 1.0*  
*Autor: AI Assistant (Claude)*

