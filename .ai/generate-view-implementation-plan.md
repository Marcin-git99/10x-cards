# Plan implementacji widoku Generowanie fiszek AI

## 1. Przegląd

Widok generowania fiszek AI umożliwia użytkownikom automatyczne tworzenie propozycji fiszek na podstawie dostarczonego tekstu przy użyciu sztucznej inteligencji. Użytkownik wprowadza tekst o długości 1000-10000 znaków, system komunikuje się z API modelu LLM i zwraca listę propozycji fiszek, które użytkownik może zaakceptować, edytować lub odrzucić. Zaakceptowane fiszki są następnie zapisywane w bazie danych użytkownika.

## 2. Routing widoku

Widok powinien być dostępny na ścieżce `/generate` i wymaga uwierzytelnienia użytkownika. Użytkownicy niezalogowani powinni być przekierowani do strony logowania.

## 3. Struktura komponentów

```
GenerateView
├── PageHeader (tytuł i opis strony)
├── TextInputSection
│   ├── TextAreaInput (pole tekstowe z licznikiem)
│   └── GenerateButton (przycisk generowania)
├── GenerationResults (conditional render)
│   ├── ResultsHeader (informacje o generacji)
│   ├── ProposalsList
│   │   └── ProposalCard[] (lista propozycji)
│   ├── BulkActions (zarządzanie zaznaczeniem)
│   └── BulkSaveButton (zapis fiszek)
└── LoadingOverlay (podczas generowania)
```

## 4. Szczegóły komponentów

### TextAreaInput

- **Opis komponentu**: Główne pole tekstowe do wprowadzania materiału źródłowego przez użytkownika z walidacją długości i licznikiem znaków w czasie rzeczywistym.

- **Główne elementy**: 
  - `<textarea>` z placeholder i aria-labels
  - licznik znaków (aktualny/maksymalny) 
  - komunikat walidacji pod polem
  - visual indicator dla stanów valid/invalid

- **Obsługiwane wydarzenia**: 
  - `onChange`: aktualizacja stanu tekstu i walidacji
  - `onBlur`: finalna walidacja
  - `onKeyDown`: obsługa skrótów klawiszowych

- **Warunki walidacji**: 
  - Minimalna długość: 1000 znaków (błąd: "Tekst musi mieć co najmniej 1000 znaków")
  - Maksymalna długość: 10000 znaków (błąd: "Tekst nie może przekraczać 10000 znaków")
  - Real-time validation z debounce 300ms
  - Visual feedback przez border colors i ikony

- **Typy**: `TextInputProps`, `ValidationState`

- **Propsy**: 
  - `value: string` - aktualny tekst
  - `onChange: (value: string) => void` - callback zmiany
  - `disabled: boolean` - czy pole jest zablokowane
  - `error?: string` - komunikat błędu

### GenerateButton

- **Opis komponentu**: Przycisk inicjujący proces generowania fiszek z obsługą loading state i walidacji.

- **Główne elementy**:
  - `<Button>` z ikoną AI i tekstem
  - loading spinner podczas generowania
  - aria-live region dla screen readers

- **Obsługiwane interakcje**:
  - `onClick`: rozpoczęcie procesu generowania
  - keyboard navigation support

- **Obsługiwana walidacja**:
  - Button disabled gdy tekst nie jest validny
  - Button disabled podczas generowania
  - Tooltip z powodem wyłączenia

- **Typy**: `GenerateButtonProps`, `LoadingState`

- **Propsy**:
  - `onClick: () => void` - callback generowania
  - `loading: boolean` - czy trwa generowanie
  - `disabled: boolean` - czy przycisk jest wyłączony
  - `disabledReason?: string` - powód wyłączenia

### ProposalsList

- **Opis komponentu**: Kontener wyświetlający listę wygenerowanych propozycji fiszek z obsługą bulk selection.

- **Główne elementy**:
  - nagłówek z liczbą propozycji
  - checkbox "Select All"
  - lista `ProposalCard` komponentów
  - empty state gdy brak propozycji

- **Obsługiwane interakcje**:
  - bulk select/deselect wszystkich propozycji
  - keyboard navigation między propozycjami

- **Obsługiwana walidacja**:
  - sprawdzanie czy co najmniej jedna propozycja jest zaznaczona
  - walidacja podczas bulk actions

- **Typy**: `ProposalsListProps`, `BulkSelectionState`

- **Propsy**:
  - `proposals: ProposalWithState[]` - lista propozycji
  - `onBulkSelect: (selected: boolean) => void` - bulk selection
  - `onProposalUpdate: (id: string, updates: Partial<ProposalWithState>) => void`

### ProposalCard

- **Opis komponentu**: Pojedyncza karta propozycji fiszki z opcjami akceptacji, edycji i odrzucenia, oraz inline editing mode.

- **Główne elementy**:
  - checkbox do zaznaczania
  - pola front/back (read-only lub editable)
  - action buttons (Accept, Edit, Reject)
  - validation messages podczas edycji
  - save/cancel buttons w trybie edycji

- **Obsługiwane interakcje**:
  - toggle selection checkbox
  - enter/exit edit mode
  - save/cancel editing
  - accept/reject proposal

- **Obsługiwana walidacja**:
  - front: maksymalnie 200 znaków podczas edycji
  - back: maksymalnie 500 znaków podczas edycji
  - real-time validation w edit mode
  - visual feedback dla validation errors

- **Typy**: `ProposalCardProps`, `ProposalWithState`, `EditingState`

- **Propsy**:
  - `proposal: ProposalWithState` - dane propozycji
  - `onUpdate: (updates: Partial<ProposalWithState>) => void` - aktualizacja
  - `onAccept: () => void` - akceptacja
  - `onReject: () => void` - odrzucenie

### BulkSaveButton

- **Opis komponentu**: Dedykowany przycisk do zapisu fiszek z obsługą różnych trybów zapisu (zaznaczone/wszystkie) i zaawansowanymi opcjami.

- **Główne elementy**:
  - główny przycisk z dropdown menu
  - opcja "Zapisz zaznaczone" z ikoną i licznikiem
  - opcja "Zapisz wszystkie" z ikoną i licznikiem
  - opcja "Zapisz jako..." z dodatkowymi ustawieniami
  - loading spinner i progress indicator

- **Obsługiwane interakcje**:
  - primary click: zapisz zaznaczone (domyślna akcja)
  - dropdown menu z opcjami zapisu
  - keyboard shortcuts (Ctrl+S, Ctrl+Shift+S)
  - drag & drop dla zmiany kolejności przed zapisem

- **Obsługiwana walidacja**:
  - "Zapisz zaznaczone" wyłączony gdy brak zaznaczonych
  - "Zapisz wszystkie" wyłączony gdy brak propozycji
  - walidacja wszystkich edytowanych propozycji przed zapisem
  - confirmation dialog dla dużej liczby fiszek (>20)

- **Typy**: `BulkSaveButtonProps`, `SaveMode`, `SaveProgress`

- **Propsy**:
  - `selectedCount: number` - liczba zaznaczonych propozycji
  - `totalCount: number` - łączna liczba propozycji
  - `onSave: (mode: SaveMode, options?: SaveOptions) => Promise<void>` - callback zapisu
  - `loading: boolean` - czy trwa zapisywanie
  - `progress?: SaveProgress` - progress zapisu
  - `disabled?: boolean` - czy przycisk wyłączony

### BulkActions

- **Opis komponentu**: Panel z akcjami zbiorczymi dla zarządzania zaznaczeniem propozycji fiszek.

- **Główne elementy**:
  - informacja o liczbie zaznaczonych propozycji
  - przycisk "Zaznacz wszystkie"
  - przycisk "Odznacz wszystkie"
  - przycisk "Odwróć zaznaczenie"
  - opcje filtrowania (pokaż tylko zaznaczone/odrzucone)

- **Obsługiwane interakcje**:
  - bulk select/deselect wszystkich propozycji
  - inverse selection
  - filter by selection state
  - keyboard shortcuts (Ctrl+A, Ctrl+Shift+A)

- **Obsługiwana walidacja**:
  - przyciski wyłączone gdy brak propozycji
  - visual feedback dla bulk operations

- **Typy**: `BulkActionsProps`, `SelectionMode`

- **Propsy**:
  - `selectedCount: number` - liczba zaznaczonych
  - `totalCount: number` - łączna liczba propozycji
  - `onBulkSelect: (mode: SelectionMode) => void` - bulk selection
  - `onFilter: (filter: FilterMode) => void` - filtrowanie
  - `disabled?: boolean` - czy akcje wyłączone

## 5. Typy

```typescript
// Stan pojedynczej propozycji z metadanymi UI
interface ProposalWithState extends FlashcardProposalDto {
  id: string; // lokalny ID dla React keys
  isSelected: boolean;
  isEditing: boolean;
  editedFront?: string;
  editedBack?: string;
  hasValidationErrors?: boolean;
}

// Główny stan widoku generowania
interface GenerateViewState {
  sourceText: string;
  isGenerating: boolean;
  generationResult: GenerationCreateResponseDto | null;
  proposals: ProposalWithState[];
  error: string | null;
  isSaving: boolean;
}

// Stan walidacji pola tekstowego
interface ValidationState {
  isValid: boolean;
  errorMessage: string | null;
  charCount: number;
  showError: boolean;
}

// Stan bulk actions
interface BulkSelectionState {
  allSelected: boolean;
  selectedCount: number;
  indeterminate: boolean; // dla checkbox w stanie mixed
}

// Tryby zapisu dla BulkSaveButton
type SaveMode = 'selected' | 'all' | 'custom';

// Progress zapisu fiszek
interface SaveProgress {
  current: number;
  total: number;
  status: 'preparing' | 'saving' | 'completed' | 'error';
  message?: string;
}

// Opcje zapisu fiszek (rozszerzone)
interface SaveOptions {
  saveType: SaveMode;
  proposals: ProposalWithState[];
  batchSize?: number; // dla dużych operacji
  skipValidation?: boolean;
  customTags?: string[];
}

// Tryby filtrowania
type FilterMode = 'all' | 'selected' | 'unselected' | 'edited' | 'original';

// Tryby zaznaczania
type SelectionMode = 'all' | 'none' | 'invert' | 'edited' | 'valid';

// Request/Response typy (rozszerzenia istniejących)
interface GenerateRequest extends GenerateFlashcardsCommand {
  // dodatkowe metadane jeśli potrzebne
}

interface SaveFlashcardsRequest extends FlashcardsCreateCommand {
  // będzie zawierać flashcards z source "ai-full" lub "ai-edited"
}
```

## 6. Zarządzanie stanem

Stan będzie zarządzany przez custom hook `useGenerateFlashcards` wykorzystujący `useReducer` dla complex state management:

```typescript
const useGenerateFlashcards = () => {
  const [state, dispatch] = useReducer(generateReducer, initialState);
  
  // Actions
  const generateFlashcards = async (sourceText: string) => { /* API call */ };
  const toggleProposalSelection = (id: string) => { /* update selection */ };
  const bulkToggleSelection = (mode: SelectionMode) => { /* bulk selection */ };
  const updateProposal = (id: string, updates: Partial<ProposalWithState>) => { /* update proposal */ };
  const saveFlashcards = async (mode: SaveMode, options?: SaveOptions) => { /* save to API */ };
  const filterProposals = (filter: FilterMode) => { /* filter proposals */ };
  
  return { 
    state, 
    actions: { 
      generateFlashcards, 
      toggleProposalSelection, 
      bulkToggleSelection,
      updateProposal, 
      saveFlashcards,
      filterProposals
    } 
  };
};
```

Dodatkowy hook `useTextValidation` dla walidacji tekstu źródłowego:

```typescript
const useTextValidation = (text: string) => {
  const [validation, setValidation] = useState<ValidationState>();
  // debounced validation logic
  return validation;
};
```

Dodatkowy hook `useSaveProgress` dla śledzenia postępu zapisu:

```typescript
const useSaveProgress = () => {
  const [progress, setProgress] = useState<SaveProgress | null>(null);
  
  const startSave = (total: number) => { /* initialize progress */ };
  const updateProgress = (current: number, message?: string) => { /* update progress */ };
  const completeSave = () => { /* finalize progress */ };
  
  return { progress, startSave, updateProgress, completeSave };
};
```

## 7. Integracja API

### Generowanie propozycji fiszek

**Endpoint**: `POST /api/generations`

**Request Type**: `GenerateFlashcardsCommand`
```typescript
{
  source_text: string; // 1000-10000 znaków
}
```

**Response Type**: `GenerationCreateResponseDto`
```typescript
{
  generation_id: number;
  flashcards_proposals: FlashcardProposalDto[];
  generated_count: number;
}
```

### Zapisywanie fiszek

**Endpoint**: `POST /api/flashcards`

**Request Type**: `FlashcardsCreateCommand`
```typescript
{
  flashcards: FlashcardCreateDto[]; // z source: "ai-full" lub "ai-edited"
}
```

**Response Type**: `{ flashcards: FlashcardDto[] }`

## 8. Interakcje użytkownika

1. **Wprowadzanie tekstu**: 
   - Real-time validation z licznikiem znaków
   - Visual feedback (zielony/czerwony border)
   - Debounced validation (300ms)

2. **Generowanie propozycji**:
   - Loading overlay z możliwością anulowania
   - Loading state na przycisku (spinner + tekst "Generowanie...")
   - Timeout handling (30s) z opcją retry

3. **Przeglądanie propozycji**:
   - Scroll do wyników po generacji
   - Hover effects na kartach propozycji
   - Keyboard navigation (Tab, Shift+Tab, Space, Enter)

4. **Zaznaczanie propozycji**:
   - Individual checkboxes na każdej karcie
   - Bulk select checkbox w nagłówku
   - Visual feedback dla zaznaczonych kart

5. **Edycja propozycji**:
   - Click "Edit" → inline editing mode
   - Auto-focus na pierwszym polu
   - Real-time validation podczas edycji
   - Save/Cancel buttons

6. **Zapisywanie fiszek**:
   - Główny przycisk zapisu z dropdown menu
   - Loading state z progress indicator dla dużych operacji
   - Keyboard shortcuts (Ctrl+S dla zaznaczonych, Ctrl+Shift+S dla wszystkich)
   - Batch processing dla lepszej wydajności
   - Toast notifications z detalami (np. "Zapisano 15/20 fiszek")
   - Confirmation dialog dla operacji >20 fiszek
   - Przekierowanie do `/flashcards` z success message

7. **Zarządzanie zaznaczeniem**:
   - Bulk selection controls (Zaznacz wszystkie/Odznacz wszystkie/Odwróć)
   - Filtrowanie widoku (tylko zaznaczone, edytowane itp.)
   - Keyboard shortcuts (Ctrl+A, Ctrl+Shift+A)
   - Visual feedback dla bulk operations

## 9. Warunki i walidacja

### Walidacja na poziomie TextAreaInput
- **Warunek**: długość tekstu 1000-10000 znaków
- **Komponenty**: TextAreaInput, GenerateButton
- **Wpływ na UI**: 
  - border color (red/green)
  - error message pod polem
  - GenerateButton disabled state
  - tooltip z powodem wyłączenia

### Walidacja podczas edycji propozycji
- **Warunki**: 
  - front: max 200 znaków
  - back: max 500 znaków
- **Komponenty**: ProposalCard w edit mode
- **Wpływ na UI**:
  - real-time validation messages
  - save button disabled state
  - character count dla każdego pola

### Walidacja bulk actions
- **Warunki**:
  - co najmniej jedna propozycja zaznaczona (dla "Zapisz zaznaczone")
  - wszystkie edytowane propozycje valid
- **Komponenty**: BulkActions
- **Wpływ na UI**:
  - przyciski disabled gdy warunki nie spełnione
  - tooltip z wyjaśnieniem

## 10. Obsługa błędów

### Błędy walidacji tekstu źródłowego
- **Scenario**: tekst za krótki/długi
- **Handling**: komunikat błędu pod polem tekstowym, GenerateButton wyłączony
- **Recovery**: użytkownik musi skorygować tekst

### Błędy API podczas generowania
- **Scenarios**: 
  - Timeout API (30s)
  - Błąd serwera (500)
  - Błąd modelu AI
  - Rate limiting
- **Handling**: 
  - Toast notification z konkretnym komunikatem błędu
  - Przycisk "Spróbuj ponownie"
  - Reset loading state
- **Recovery**: retry mechanism, możliwość edycji tekstu

### Błędy podczas zapisywania fiszek
- **Scenarios**: 
  - Błąd walidacji po stronie API
  - Błąd połączenia
  - Błąd autoryzacji
- **Handling**: 
  - Toast error z możliwością retry
  - Stan propozycji zachowany
  - Przycisk "Zapisz ponownie"
- **Recovery**: retry save operation

### Błędy edycji propozycji
- **Scenarios**: 
  - Przekroczenie limitów znaków
  - Puste pola
- **Handling**: 
  - Inline validation messages
  - Save button wyłączony
  - Visual feedback (red borders)
- **Recovery**: użytkownik koryguje błędy przed zapisem

## 11. Kroki implementacji

1. **Konfiguracja podstawowa**
   - Utworzenie pliku `src/pages/generate.astro`
   - Dodanie routing do głównej nawigacji
   - Konfiguracja protected route

2. **Implementacja custom hooks**
   - `useGenerateFlashcards` z useReducer
   - `useTextValidation` z debounced validation
   - Testy jednostkowe dla hooks

3. **Implementacja TextInputSection**
   - `TextAreaInput` z walidacją i licznikiem
   - `GenerateButton` z loading states
   - Integration testing

4. **Implementacja API calls**
   - Service functions dla API endpoints
   - Error handling i timeout logic
   - Mock data dla development

5. **Implementacja GenerationResults**
   - `ProposalsList` z bulk selection
   - `ProposalCard` z inline editing
   - `BulkActions` z selection management
   - `BulkSaveButton` z zaawansowanymi opcjami zapisu

6. **Styling i responsywność**
   - Mobile-first approach z Tailwind
   - Accessibility improvements (ARIA labels, focus management)
   - Cross-browser testing

7. **Integracja i testowanie end-to-end**
   - Przepływ użytkownika od generowania do zapisu
   - Error scenarios testing
   - Performance optimization

8. **Dokumentacja i finalizacja**
   - Code comments i dokumentacja API
   - User guide dla widoku
   - Code review i refactoring
