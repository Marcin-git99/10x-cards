# Diagram przepływu autentykacji - 10x-cards

<authentication_analysis>

## 1. Przepływy autentykacji

### Rejestracja (US-001):
1. Użytkownik wypełnia formularz (email, hasło, potwierdzenie hasła)
2. Walidacja po stronie klienta
3. Wysłanie do API /auth/signup
4. Walidacja po stronie serwera (Zod)
5. Supabase Auth signUp
6. Utworzenie sesji i ustawienie cookies
7. Przekierowanie do /generate

### Logowanie (US-002):
1. Użytkownik wypełnia formularz (email, hasło)
2. Wysłanie do API /auth/login
3. Supabase Auth signInWithPassword
4. Utworzenie sesji i ustawienie cookies
5. Przekierowanie do /generate

### Weryfikacja sesji (Middleware):
1. Odczyt cookies z żądania
2. Weryfikacja tokenu przez Supabase Auth getUser
3. Dodanie user do context.locals
4. Ochrona chronionych tras

### Odświeżanie tokenu:
1. Token wygasa
2. Supabase automatycznie odświeża przy następnym żądaniu
3. Nowe cookies ustawiane w odpowiedzi

### Wylogowanie:
1. Żądanie POST /auth/logout
2. Supabase Auth signOut
3. Usunięcie cookies sesji
4. Aktualizacja authStore
5. Przekierowanie do strony głównej

### Odzyskiwanie hasła (US-002):
1. Użytkownik podaje email
2. Wysłanie do API /auth/reset-password
3. Supabase wysyła email z linkiem
4. Użytkownik klika link
5. Callback ustawia nowe hasło

## 2. Główni aktorzy

- **Przeglądarka** - interfejs użytkownika (React + Astro)
- **Middleware** - weryfikacja sesji w Astro
- **API Astro** - endpointy /api/auth/*
- **Supabase Auth** - zarządzanie użytkownikami i sesjami

## 3. Procesy weryfikacji tokenów

- JWT przechowywany w cookies HttpOnly
- Middleware wywołuje getUser() przy każdym żądaniu
- Token automatycznie odświeżany przez Supabase SSR
- Wygaśnięcie tokenu → przekierowanie do logowania

## 4. Kroki autentykacji

| Krok | Opis |
|------|------|
| Walidacja klienta | Sprawdzenie formatu przed wysłaniem |
| Walidacja serwera | Zod schema validation |
| Supabase Auth | Operacje na użytkownikach |
| Cookie management | getAll/setAll przez @supabase/ssr |
| Session refresh | Automatyczne odświeżanie tokenu |

</authentication_analysis>

<mermaid_diagram>

```mermaid
sequenceDiagram
    autonumber
    
    participant Browser as Przeglądarka
    participant Middleware as Middleware Astro
    participant API as API Astro
    participant Auth as Supabase Auth
    
    %% ===== REJESTRACJA =====
    rect rgb(144, 238, 144)
        Note over Browser,Auth: REJESTRACJA (US-001)
        
        Browser->>Browser: Wypełnienie formularza
        Browser->>Browser: Walidacja klienta
        
        Browser->>API: POST /api/auth/signup
        activate API
        
        API->>API: Walidacja Zod
        
        alt Walidacja nieudana
            API-->>Browser: 400 Błąd walidacji
        else Walidacja udana
            API->>Auth: signUp(email, password)
            activate Auth
            
            alt Email już istnieje
                Auth-->>API: Błąd - konto istnieje
                API-->>Browser: 400 Konto już istnieje
            else Rejestracja udana
                Auth->>Auth: Utworzenie użytkownika
                Auth->>Auth: Utworzenie sesji
                Auth-->>API: user + session
                deactivate Auth
                
                API->>API: Ustawienie cookies
                API-->>Browser: 200 + Set-Cookie
            end
        end
        deactivate API
        
        Browser->>Browser: Aktualizacja authStore
        Browser->>Browser: Przekierowanie do /generate
    end
    
    %% ===== LOGOWANIE =====
    rect rgb(135, 206, 250)
        Note over Browser,Auth: LOGOWANIE (US-002)
        
        Browser->>API: POST /api/auth/login
        activate API
        
        API->>Auth: signInWithPassword(email, password)
        activate Auth
        
        alt Dane nieprawidłowe
            Auth-->>API: Błąd autentykacji
            API-->>Browser: 401 Nieprawidłowe dane
        else Logowanie udane
            Auth->>Auth: Weryfikacja hasła
            Auth->>Auth: Utworzenie sesji JWT
            Auth-->>API: user + session
            deactivate Auth
            
            API->>API: Ustawienie cookies HttpOnly
            API-->>Browser: 200 + Set-Cookie
        end
        deactivate API
        
        Browser->>Browser: Aktualizacja authStore
        Browser->>Browser: Przekierowanie do /generate
    end
    
    %% ===== WERYFIKACJA SESJI =====
    rect rgb(255, 255, 224)
        Note over Browser,Auth: WERYFIKACJA SESJI (Middleware)
        
        Browser->>Middleware: Żądanie chronionej strony
        activate Middleware
        
        Middleware->>Middleware: Odczyt cookies
        Middleware->>Auth: getUser()
        activate Auth
        
        alt Token ważny
            Auth-->>Middleware: user object
            deactivate Auth
            Middleware->>Middleware: locals.user = user
            Middleware-->>Browser: Dostęp przyznany
        else Token wygasły
            Auth->>Auth: Próba odświeżenia
            
            alt Odświeżenie udane
                Auth-->>Middleware: user + nowy token
                Middleware->>Middleware: Aktualizacja cookies
                Middleware-->>Browser: Dostęp + Set-Cookie
            else Odświeżenie nieudane
                Auth-->>Middleware: null
                Middleware-->>Browser: 302 Redirect /auth/login
            end
        else Brak tokenu
            Auth-->>Middleware: null
            deactivate Auth
            Middleware-->>Browser: 302 Redirect /auth/login
        end
        deactivate Middleware
    end
    
    %% ===== ZAPIS FISZEK (niezalogowany) =====
    rect rgb(255, 182, 193)
        Note over Browser,Auth: ZAPIS FISZEK - NIEZALOGOWANY (US-004)
        
        Browser->>Browser: Generowanie propozycji fiszek
        Browser->>Browser: Kliknięcie Zapisz
        Browser->>Browser: Sprawdzenie authStore
        
        alt Użytkownik niezalogowany
            Browser->>Browser: Przekierowanie do /auth/login
            Note right of Browser: Propozycje zachowane w stanie
        else Użytkownik zalogowany
            Browser->>API: POST /api/flashcards
            API->>Auth: Weryfikacja sesji
            Auth-->>API: user
            API->>API: Zapis do bazy
            API-->>Browser: 201 Fiszki zapisane
        end
    end
    
    %% ===== WYLOGOWANIE =====
    rect rgb(211, 211, 211)
        Note over Browser,Auth: WYLOGOWANIE
        
        Browser->>API: POST /api/auth/logout
        activate API
        
        API->>Auth: signOut()
        activate Auth
        Auth->>Auth: Unieważnienie sesji
        Auth-->>API: success
        deactivate Auth
        
        API->>API: Usunięcie cookies
        API-->>Browser: 200 + Clear-Cookie
        deactivate API
        
        Browser->>Browser: clearUser() w authStore
        Browser->>Browser: Przekierowanie do /
    end
    
    %% ===== RESETOWANIE HASŁA =====
    rect rgb(230, 230, 250)
        Note over Browser,Auth: RESETOWANIE HASŁA (US-002)
        
        Browser->>API: POST /api/auth/reset-password
        activate API
        
        API->>Auth: resetPasswordForEmail(email)
        activate Auth
        Auth->>Auth: Generowanie tokenu
        Auth->>Auth: Wysłanie emaila
        Auth-->>API: success
        deactivate Auth
        
        API-->>Browser: 200 Email wysłany
        deactivate API
        
        Note over Browser: Użytkownik sprawdza email
        
        Browser->>API: GET /api/auth/callback?token=...
        activate API
        API->>Auth: Weryfikacja tokenu
        Auth-->>API: Token OK
        API-->>Browser: Formularz nowego hasła
        deactivate API
    end
```

</mermaid_diagram>

## Podsumowanie przepływów

| Przepływ | Endpoint | Metoda Supabase | Rezultat |
|----------|----------|-----------------|----------|
| Rejestracja | POST /api/auth/signup | signUp | Konto + sesja |
| Logowanie | POST /api/auth/login | signInWithPassword | Sesja JWT |
| Wylogowanie | POST /api/auth/logout | signOut | Usunięcie sesji |
| Reset hasła | POST /api/auth/reset-password | resetPasswordForEmail | Email z linkiem |
| Weryfikacja | Middleware | getUser | user w locals |

## Bezpieczeństwo

- **Cookies**: HttpOnly, Secure, SameSite=Lax
- **Tokeny**: JWT z automatycznym odświeżaniem
- **Walidacja**: Zod po stronie serwera
- **RLS**: Row Level Security w Supabase

