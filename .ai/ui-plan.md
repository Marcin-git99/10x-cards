# Architektura UI dla 10x-cards

## 1. Przegląd struktury UI

Aplikacja 10x-cards została zaprojektowana jako responsywna aplikacja webowa oparta o React 19, Astro 5 i komponenty Shadcn/ui. Architektura UI koncentruje się na szybkim i intuicyjnym tworzeniu fiszek przy użyciu sztucznej inteligencji oraz efektywnej nauce metodą spaced repetition.

Główna struktura składa się z 5 kluczowych widoków połączonych prostą nawigacją, z dodatkowymi modalami dla operacji CRUD na fiszkach. Wszystkie widoki są responsywne (mobile-first) z podstawową dostępnością.

## 2. Lista widoków

### Auth View (`/auth`)
- **Główny cel**: Umożliwienie bezpiecznej rejestracji i logowania użytkowników
- **Kluczowe informacje**: Formularz uwierzytelniania, komunikaty błędów, opcje rejestracji/logowania
- **Kluczowe komponenty**:
  - `AuthForm` - formularz z polami email/hasło
  - `AuthToggle` - przełącznik między logowaniem a rejestracją
  - `ErrorAlert` - komunikaty błędów
  - `LoadingSpinner` - stan ładowania podczas uwierzytelniania
- **UX/Dostępność/Bezpieczeństwo**: 
  - Prosty formularz
  - Czytelne komunikaty błędów
  - Podstawowa obsługa klawiatury
  - Zabezpieczenia JWT

### Dashboard (`/`)
- **Główny cel**: Centralny punkt dostępu do wszystkich funkcji aplikacji
- **Kluczowe informacje**: Podstawowe statystyki fiszek, szybki dostęp do głównych funkcji
- **Kluczowe komponenty**:
  - `StatsCards` - karty ze statystykami (liczba fiszek)
  - `QuickActions` - przyciski dostępu do głównych funkcji
  - `WelcomeMessage` - powitanie użytkownika
- **UX/Dostępność/Bezpieczeństwo**:
  - Proste menu nawigacyjne
  - Podstawowa struktura nagłówków
  - Dane tylko zalogowanego użytkownika (RLS)

### Generate View (`/generate`)
- **Główny cel**: Generowanie propozycji fiszek przez AI i ich zatwierdzanie
- **Kluczowe informacje**: Pole tekstowe (1000-10000 znaków), lista wygenerowanych propozycji, opcje akceptacji/edycji/odrzucenia
- **Kluczowe komponenty**:
  - `TextArea` - obszar tekstowy z licznikiem znaków
  - `GenerateButton` - przycisk z loading state
  - `ProposalsList` - lista wygenerowanych fiszek
  - `ProposalCard` - pojedyncza propozycja z opcjami akceptuj/edytuj/odrzuć
  - `BulkActions` - przyciski "Zapisz wszystkie" / "Zapisz zatwierdzone"
- **UX/Dostępność/Bezpieczeństwo**:
  - Komunikaty o stanie generowania
  - Podstawowe labele dla formularzy
  - Timeout handling dla API calls

### My Flashcards View (`/flashcards`)
- **Główny cel**: Zarządzanie wszystkimi fiszkami użytkownika (CRUD operations)
- **Kluczowe informacje**: Lista wszystkich fiszek, opcje edycji/usuwania
- **Kluczowe komponenty**:
  - `FlashcardsList` - lista fiszek z podstawową paginacją
  - `FlashcardCard` - pojedyncza karta fiszki z opcjami akcji
  - `AddButton` - przycisk do dodania nowej fiszki
  - `EmptyState` - stan gdy brak fiszek
- **UX/Dostępność/Bezpieczeństwo**:
  - Podstawowa paginacja
  - Confirmation dialogs dla usuwania
  - Tylko fiszki zalogowanego użytkownika

### Study Session View (`/study`)
- **Główny cel**: Przeprowadzenie sesji nauki z algorytmem spaced repetition
- **Kluczowe informacje**: Aktualna fiszka (przód/tył), ocena przyswojenia
- **Kluczowe komponenty**:
  - `StudyCard` - wyświetlanie fiszki (przód/tył)
  - `RatingButtons` - ocena przyswojenia (zgodnie z algorytmem)
  - `SessionComplete` - podsumowanie po zakończeniu
  - `NoCardsState` - gdy brak fiszek do nauki
- **UX/Dostępność/Bezpieczeństwo**:
  - Podstawowa nawigacja klawiszami
  - Podstawowe labele dla przycisków
  - Session progress w localStorage

### User Profile View (`/profile`)
- **Główny cel**: Podstawowe zarządzanie kontem użytkownika
- **Kluczowe informacje**: Dane konta, podstawowe statystyki
- **Kluczowe komponenty**:
  - `ProfileForm` - edycja podstawowych danych
  - `StatsSection` - podstawowe statystyki nauki
  - `LogoutButton` - wylogowanie
- **UX/Dostępność/Bezpieczeństwo**:
  - Podstawowe labele formularzy
  - Confirmation dla wylogowania

### Modale

#### Edit Flashcard Modal
- **Główny cel**: Edycja pojedynczej fiszki
- **Komponenty**: `EditForm`, podstawowa walidacja (max 200/500 znaków)
- **Dostępność**: Focus trap, Esc key handling

#### Create Flashcard Modal
- **Główny cel**: Ręczne tworzenie nowej fiszki
- **Komponenty**: `CreateForm`, podstawowa walidacja
- **Dostępność**: Focus management, podstawowe error messaging

## 3. Mapa podróży użytkownika

### Główny przepływ użytkownika:

1. **Wejście na aplikację**
   - Sprawdzenie stanu autoryzacji
   - Jeśli niezalogowany → przekierowanie do `/auth`
   - Jeśli zalogowany → przekierowanie do dashboard `/`

2. **Proces uwierzytelniania** (`/auth`)
   - Wybór między logowaniem a rejestracją
   - Wypełnienie formularza z walidacją w czasie rzeczywistym
   - Po sukcesie → automatyczne przekierowanie do dashboard

3. **Dashboard** (`/`)
   - Przegląd statystyk i ostatnich aktywności
   - Wybór głównej akcji:
     - "Generuj nowe fiszki" → `/generate`
     - "Przeglądaj fiszki" → `/flashcards`
     - "Rozpocznij naukę" → `/study`
     - "Ustawienia" → `/profile`

4. **Przepływ generowania fiszek** (`/generate`)
   - Wprowadzenie tekstu (1000-10000 znaków)
   - Kliknięcie "Generuj" → loading state + progress
   - Przegląd propozycji → akceptacja/edycja/odrzucenie każdej
   - Bulk save zatwierdzonych → przekierowanie do `/flashcards` z toast success

5. **Zarządzanie fiszkami** (`/flashcards`)
   - Przeglądanie listy z filtrami i sortowaniem
   - Edycja fiszki → modal → zapis → toast success
   - Usuwanie fiszki → confirmation → usunięcie → toast success
   - Dodanie nowej → modal → zapis → toast success

6. **Sesja nauki** (`/study`)
   - Rozpoczęcie sesji → wyświetlenie pierwszej fiszki (przód)
   - Flip na tył → ocena przyswojenia → następna fiszka
   - Zakończenie sesji → podsumowanie → powrót do dashboard

### Przepływy alternatywne:

- **Brak fiszek do nauki**: `/study` → EmptyState → link do `/generate` lub `/flashcards`
- **Błędy API**: Podstawowe error messages
- **Session timeout**: Automatic logout + redirect to `/auth`

## 4. Układ i struktura nawigacji

### Główna nawigacja (dla zalogowanych użytkowników):

**Top Navigation Bar:**
- Logo aplikacji (link do dashboard)
- Główne menu poziome:
  - Dashboard (`/`)
  - Generuj fiszki (`/generate`)
  - Moje fiszki (`/flashcards`)
  - Sesja nauki (`/study`)
- User menu (dropdown):
  - Profil (`/profile`)
  - Wyloguj

**Mobile Navigation:**
- Hamburger menu z wszystkimi opcjami
- Bottom tab bar dla głównych funkcji

### Nawigacja kontekstowa:

**Call-to-Action Flows:**
- Dashboard → "Rozpocznij naukę" → `/study`
- EmptyState w `/study` → "Dodaj fiszki" → `/generate`
- Success w `/generate` → "Zobacz fiszki" → `/flashcards`

**Keyboard Navigation:**
- Tab order zgodny z visual order
- Podstawowe focus indicators

## 5. Kluczowe komponenty

### Komponenty layoutu:
- **`AppShell`** - główny layout z nawigacją
- **`ProtectedRoute`** - wrapper dla autoryzowanych widoków

### Komponenty nawigacji:
- **`MainNavigation`** - główne menu z active states
- **`MobileMenu`** - hamburger menu dla mobile
- **`UserMenu`** - dropdown z opcjami użytkownika

### Komponenty formularzy:
- **`Input`** - podstawowy input z walidacją
- **`TextArea`** - textarea z licznikiem znaków
- **`Button`** - button component z loading states
- **`FormField`** - wrapper z label i error message

### Komponenty UI:
- **`Modal`** - modal z podstawowym focus trap
- **`Toast`** - system notyfikacji
- **`LoadingSpinner`** - loading states
- **`EmptyState`** - placeholder dla pustych list
- **`ConfirmDialog`** - confirmation dla usuwania

### Komponenty danych:
- **`FlashcardCard`** - wyświetlanie pojedynczej fiszki
- **`StatCard`** - karty statystyk na dashboard

Wszystkie komponenty są zbudowane z wykorzystaniem Shadcn/ui jako foundation, rozszerzone o podstawową funkcjonalność zgodnie z wymaganiami MVP. Komponenty są responsywne (Tailwind breakpoints) z podstawową dostępnością.
