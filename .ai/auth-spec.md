# Specyfikacja modułu autoryzacji i rejestracji użytkowników - 10x-cards

## 1. ARCHITEKTURA INTERFEJSU UŻYTKOWNIKA

### A. Struktura interfejsu i relacje komponentów

**Główny układ (@Layout.astro):**
- Utrzymuje spójny wygląd aplikacji (nagłówek, stopka, tło).
- Rozszerzony o komponent nawigacji z elementami autoryzacyjnymi.

**Topbar (@Topbar.tsx) - NOWY KOMPONENT:**
- Wyświetla logo i tytuł ("10x Cards").
- Zawiera nawigację do głównych sekcji: "Generuj fiszki", "Moje fiszki", "Sesja nauki".
- Przy niezalogowanym użytkowniku wyświetla przyciski "Logowanie" i "Rejestracja" w prawym górnym rogu.
- Po zalogowaniu wyświetla:
  - Informację o użytkowniku (email).
  - Przycisk "Wyloguj".
  - Menu użytkownika z opcją "Usuń konto" (realizacja wymagania RODO z PRD sekcja 3.3).
- Otrzymuje dane użytkownika jako props z Astro, które inicjalizują globalny store (authStore z Zustand).

**Strona generowania (@generate.astro + @GenerateView.tsx):**
- Dostępna dla wszystkich użytkowników (zalogowanych i niezalogowanych).
- Umożliwia generowanie propozycji fiszek bez logowania.
- Komponent GenerateView rozszerzony o logikę sprawdzania autoryzacji przy próbie zapisu:
  - Niezalogowany użytkownik widzi propozycje, ale przy próbie zapisu zostaje przekierowany do strony logowania z linkiem do rejestracji (zgodnie z US-004).
  - Zalogowany użytkownik może zapisać fiszki do bazy danych.

**Strona "Moje fiszki" (@flashcards.astro + @FlashcardsView.tsx):**
- Dostęp wymaga autoryzacji.
- W przypadku braku logowania użytkownik zostaje przekierowany do strony logowania.
- Wyświetla komunikat zachęcający do logowania dla niezalogowanych użytkowników próbujących uzyskać dostęp bezpośrednio.

### B. Nowe strony autoryzacyjne

Utworzenie dedykowanych stron Astro w katalogu `/src/pages/auth/`:

**Strona rejestracji (@/pages/auth/signup.astro):**
- Formularz rejestracyjny obsługiwany przez komponent React (@SignupForm.tsx).
- Wymagane pola:
  - Adres email (walidacja formatu).
  - Hasło (minimum 8 znaków).
  - Potwierdzenie hasła (zgodność z polem hasła).
- Link do strony logowania dla istniejących użytkowników.

**Strona logowania (@/pages/auth/login.astro):**
- Formularz logowania obsługiwany przez komponent React (@LoginForm.tsx).
- Wymagane pola:
  - Adres email.
  - Hasło.
- Checkbox "Zapamiętaj mnie" (opcjonalny).
- Link do strony resetowania hasła.
- Link do strony rejestracji dla nowych użytkowników.

**Strona resetowania hasła (@/pages/auth/reset-password.astro):**
- Formularz inicjacji resetowania hasła (@ResetPasswordForm.tsx).
- Wymagane pole: adres email.
- Potwierdzenie wysłania linku resetującego.

**UWAGA:** Obecna strona `/login.astro` zostanie zastąpiona przez `/auth/login.astro`. Przyciski logowania przez GitHub i Google zostaną usunięte zgodnie z wymaganiami PRD (US-001).

### C. Walidacja i komunikaty błędów

**Walidacja po stronie klienta (przed wysłaniem formularza):**

| Pole | Walidacja | Komunikat błędu |
|------|-----------|-----------------|
| Email | Niepusty, poprawny format | "Nieprawidłowy adres email" |
| Hasło | Minimum 8 znaków | "Hasło musi zawierać co najmniej 8 znaków" |
| Potwierdzenie hasła | Zgodność z hasłem | "Hasła nie są zgodne" |

**Walidacja po stronie serwera:**

| Scenariusz | Kod HTTP | Komunikat |
|------------|----------|-----------|
| Email już istnieje | 400 | "Konto z tym adresem email już istnieje" |
| Nieprawidłowe dane logowania | 401 | "Nieprawidłowy email lub hasło" |
| Brak wymaganych pól | 400 | "Wszystkie pola są wymagane" |
| Token wygasł | 401 | "Sesja wygasła, zaloguj się ponownie" |

**Prezentacja błędów:**
- Komunikaty wyświetlane inline pod odpowiednimi polami formularza.
- Ogólne błędy serwera wyświetlane w komponencie Alert (Shadcn/ui).
- Styling zgodny z Tailwind CSS i komponentami Shadcn/ui.

---

## 2. LOGIKA BACKENDOWA

### A. Struktura endpointów API

Endpointy umieszczone w katalogu `/src/pages/api/auth/`:

| Endpoint | Metoda | Opis |
|----------|--------|------|
| `/api/auth/signup` | POST | Rejestracja nowego użytkownika |
| `/api/auth/login` | POST | Logowanie użytkownika |
| `/api/auth/logout` | POST | Wylogowanie użytkownika |
| `/api/auth/reset-password` | POST | Inicjacja procesu odzyskiwania hasła |
| `/api/auth/delete-account` | DELETE | Usunięcie konta i powiązanych danych (zgodnie z RODO) |
| `/api/auth/callback` | GET | Obsługa callback'ów Supabase (weryfikacja email, reset hasła) |

**Struktura żądań i odpowiedzi:**

```
POST /api/auth/signup
Request:  { email: string, password: string, confirmPassword: string }
Response: { user: { id: string, email: string }, message: string }

POST /api/auth/login
Request:  { email: string, password: string }
Response: { user: { id: string, email: string }, session: { access_token: string } }

POST /api/auth/logout
Request:  (brak body, autoryzacja przez cookie)
Response: { message: string }

POST /api/auth/reset-password
Request:  { email: string }
Response: { message: string }

DELETE /api/auth/delete-account
Request:  (brak body, autoryzacja przez cookie)
Response: { message: string }
Uwaga: Usuwa konto użytkownika oraz wszystkie powiązane fiszki (zgodnie z RODO i PRD sekcja 3.3)
```

### B. Modele danych

**Supabase Auth:**
- Główne dane użytkownika (id, email, hasło) zarządzane przez Supabase Auth.
- Tabela `auth.users` automatycznie zarządzana przez Supabase.

**Relacja z istniejącymi danymi:**
- Tabela `flashcards` posiada kolumnę `user_id` (UUID) powiązaną z `auth.users.id`.
- Polityki RLS (Row Level Security) zapewniają dostęp tylko do własnych fiszek.

### C. Mechanizm walidacji danych wejściowych

Wykorzystanie biblioteki Zod do walidacji:

```
// Schematy walidacji (src/lib/schemas/auth.ts)

SignupSchema:
  - email: z.string().email()
  - password: z.string().min(8)
  - confirmPassword: z.string()
  - refine: password === confirmPassword

LoginSchema:
  - email: z.string().email()
  - password: z.string().min(1)

ResetPasswordSchema:
  - email: z.string().email()
```

**Proces walidacji:**
1. Parsowanie body żądania przez odpowiedni schemat Zod.
2. W przypadku błędu walidacji zwrot HTTP 400 z listą błędów.
3. Przejście do logiki biznesowej tylko po pozytywnej walidacji.

### D. Obsługa wyjątków

**Struktura błędów API:**
```
{
  error: string,        // Kod błędu (np. "VALIDATION_ERROR", "AUTH_ERROR")
  message: string,      // Czytelny komunikat dla użytkownika
  details?: object      // Opcjonalne szczegóły (np. lista błędów walidacji)
}
```

**Logowanie błędów:**
- Wszystkie błędy logowane na serwerze z timestamp i kontekstem.
- Błędy Supabase Auth mapowane na przyjazne komunikaty użytkownika.
- Nieprzewidziane błędy zwracają HTTP 500 z ogólnym komunikatem.

---

## 3. SYSTEM AUTENTYKACJI

### A. Wykorzystanie Supabase Auth

**Rejestracja:**
- Metoda: `supabase.auth.signUp({ email, password })`
- Konto aktywowane natychmiast po rejestracji (bez wymogu weryfikacji email w MVP).
- Automatyczne utworzenie sesji po pomyślnej rejestracji.
- Przekierowanie do strony `/generate` po pomyślnej rejestracji.

**Logowanie:**
- Metoda: `supabase.auth.signInWithPassword({ email, password })`
- Zwraca obiekt sesji z tokenami (access_token, refresh_token).
- Tokeny przechowywane w ciasteczkach HttpOnly.
- Przekierowanie do strony `/generate` po pomyślnym logowaniu (zgodnie z US-002).

**Wylogowanie:**
- Metoda: `supabase.auth.signOut()`
- Usunięcie ciasteczek sesji.
- Aktualizacja globalnego stanu (authStore).

**Odzyskiwanie hasła:**
- Metoda: `supabase.auth.resetPasswordForEmail(email)`
- Wysłanie emaila z linkiem do resetowania hasła.
- Link kieruje do `/auth/reset-password?token=...`

### B. Integracja z Astro

**Middleware (@/src/middleware/index.ts):**
```
Rozszerzenie istniejącego middleware o:
1. Odczyt tokenów z ciasteczek żądania.
2. Weryfikacja sesji przez supabase.auth.getUser().
3. Dodanie obiektu user do context.locals.
4. Ochrona tras wymagających autoryzacji.
```

**Chronione trasy:**
- `/flashcards` - wymaga zalogowania (US-005, US-006, US-007)
- `/study` - wymaga zalogowania (US-008 - sesja nauki)
- `/api/flashcards/*` - wymaga zalogowania (operacje na fiszkach użytkownika)
- `/api/auth/delete-account` - wymaga zalogowania (usunięcie konta)

**Publiczne trasy:**
- `/` - strona główna
- `/generate` - generowanie fiszek
- `/auth/*` - strony autoryzacyjne
- `/api/auth/*` - endpointy autoryzacyjne
- `/api/generations` - generowanie fiszek (dostępne dla wszystkich)

**Przekazywanie użytkownika do komponentów React:**
```astro
---
const user = Astro.locals.user;
---
<Layout>
  <Topbar client:load user={user} />
  <GenerateView client:load user={user} />
</Layout>
```

### C. Zarządzanie stanem (authStore)

**Store Zustand (@/src/lib/stores/authStore.ts):**
```
Stan:
  - user: User | null
  - isAuthenticated: boolean
  - isLoading: boolean

Akcje:
  - setUser(user): void
  - clearUser(): void
  - checkAuth(): Promise<void>
```

**Inicjalizacja:**
- Komponent Topbar inicjalizuje store danymi użytkownika z props (SSR).
- Komponenty React subskrybują store do reaktywnych aktualizacji UI.

### D. Bezpieczeństwo

**Przechowywanie tokenów:**
- Tokeny JWT przechowywane w ciasteczkach z flagami:
  - `HttpOnly` - ochrona przed XSS
  - `Secure` - tylko HTTPS (produkcja)
  - `SameSite=Lax` - ochrona przed CSRF

**Row Level Security (RLS):**
- Polityki na tabeli `flashcards`:
  - SELECT: `auth.uid() = user_id`
  - INSERT: `auth.uid() = user_id`
  - UPDATE: `auth.uid() = user_id`
  - DELETE: `auth.uid() = user_id`

**Dodatkowe zabezpieczenia:**
- Rate limiting na endpointach autoryzacyjnych.
- Walidacja siły hasła (minimum 8 znaków).
- Brak zewnętrznych serwisów logowania (zgodnie z PRD US-001).

---

## 4. PODSUMOWANIE ZMIAN

### Nowe pliki do utworzenia:

```
src/
├── pages/
│   ├── auth/
│   │   ├── login.astro
│   │   ├── signup.astro
│   │   └── reset-password.astro
│   └── study.astro              # US-008: Sesja nauki (chroniona)
├── pages/api/auth/
│   ├── signup.ts
│   ├── login.ts
│   ├── logout.ts
│   ├── reset-password.ts
│   ├── delete-account.ts        # RODO: Usunięcie konta
│   └── callback.ts
├── components/
│   ├── Topbar.tsx
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── SignupForm.tsx
│   │   └── ResetPasswordForm.tsx
│   └── StudyView.tsx            # US-008: Komponent sesji nauki
├── lib/
│   ├── schemas/
│   │   └── auth.ts
│   └── stores/
│       └── authStore.ts
```

### Pliki do modyfikacji:

| Plik | Zakres zmian |
|------|--------------|
| `src/layouts/Layout.astro` | Dodanie Topbar, przekazywanie user |
| `src/middleware/index.ts` | Obsługa sesji, ochrona tras |
| `src/pages/generate.astro` | Przekazywanie user do GenerateView |
| `src/pages/flashcards.astro` | Ochrona trasy, przekierowanie |
| `src/components/GenerateView.tsx` | Logika autoryzacji przy zapisie |
| `src/db/supabase.client.ts` | Konfiguracja dla SSR z ciasteczkami |

### Pliki do usunięcia:

| Plik | Powód |
|------|-------|
| `src/pages/login.astro` | Zastąpiony przez `/auth/login.astro` |

