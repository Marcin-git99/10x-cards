/**
 * Test data fixtures for E2E tests
 * 
 * Contains reusable test data including users, flashcards, and text samples.
 * Use these fixtures to maintain consistency across tests.
 */

// ============================================================================
// USER DATA
// ============================================================================

export const testUsers = {
  /** Valid user for successful login tests */
  validUser: {
    email: 'test@example.com',
    password: 'TestPassword123!',
  },
  
  /** User with invalid credentials */
  invalidUser: {
    email: 'invalid@example.com',
    password: 'WrongPassword123!',
  },
  
  /** User for registration tests */
  newUser: {
    email: `newuser_${Date.now()}@example.com`,
    password: 'NewUserPassword123!',
    confirmPassword: 'NewUserPassword123!',
  },
} as const;

// ============================================================================
// TEXT SAMPLES FOR FLASHCARD GENERATION
// ============================================================================

/**
 * Sample text that meets minimum length requirements (1000+ chars)
 * Topic: JavaScript fundamentals
 */
export const validSourceText = `
JavaScript jest językiem programowania wysokiego poziomu, który jest jednym z podstawowych
technologii World Wide Web. Wraz z HTML i CSS stanowi trzon nowoczesnego rozwoju stron
internetowych. JavaScript umożliwia tworzenie interaktywnych stron internetowych i jest
niezbędny do tworzenia aplikacji webowych.

Zmienne w JavaScript mogą być deklarowane za pomocą var, let lub const. Słowo kluczowe var
było oryginalnym sposobem deklarowania zmiennych, ale ma problemy ze scopingiem. Wprowadzone
w ES6 let i const rozwiązują te problemy - let dla zmiennych, które mogą być reassignowane,
a const dla tych, które powinny pozostać niezmienne.

Funkcje są podstawowymi blokami budulcowymi w JavaScript. Mogą być deklarowane na kilka
sposobów: jako deklaracje funkcji, wyrażenia funkcyjne lub funkcje strzałkowe. Funkcje
strzałkowe, wprowadzone w ES6, oferują bardziej zwięzłą składnię i nie mają własnego this.

Obiekty i tablice to podstawowe struktury danych w JavaScript. Obiekty przechowują dane
jako pary klucz-wartość, podczas gdy tablice są uporządkowanymi kolekcjami elementów.
Obie struktury mogą zawierać dowolne typy danych, w tym inne obiekty i tablice.

Asynchroniczność jest kluczowym konceptem w JavaScript. Callbacks były pierwotnym sposobem
obsługi operacji asynchronicznych, ale prowadziły do "callback hell". Promises wprowadzone
w ES6 i async/await z ES2017 znacznie uprościły pisanie kodu asynchronicznego.
`.trim();

/**
 * Sample text that's too short (below 1000 chars)
 */
export const tooShortText = `
JavaScript jest językiem programowania używanym do tworzenia interaktywnych stron internetowych.
Zmienne deklarujemy za pomocą let, const lub var. Funkcje to podstawowe bloki kodu.
`.trim();

/**
 * Sample text that's too long (over 10000 chars)
 */
export const tooLongText = validSourceText.repeat(15);

// ============================================================================
// FLASHCARD DATA
// ============================================================================

export const sampleFlashcards = {
  /** Valid flashcard for creation tests */
  valid: {
    front: 'Czym jest JavaScript?',
    back: 'JavaScript to wysokopoziomowy język programowania używany głównie do tworzenia interaktywnych stron internetowych.',
  },
  
  /** Flashcard with minimal content */
  minimal: {
    front: 'Test',
    back: 'Odpowiedź',
  },
  
  /** Flashcard with maximum length content */
  maxLength: {
    front: 'a'.repeat(200),
    back: 'b'.repeat(500),
  },
  
  /** Empty flashcard (for validation tests) */
  empty: {
    front: '',
    back: '',
  },
} as const;

// ============================================================================
// GENERATED PROPOSALS (Mock data matching API response structure)
// ============================================================================

export const mockGeneratedProposals = [
  {
    id: 'proposal-1',
    front: 'Co to jest JavaScript?',
    back: 'JavaScript jest językiem programowania wysokiego poziomu używanym do tworzenia interaktywnych stron internetowych.',
    source: 'ai-full',
  },
  {
    id: 'proposal-2', 
    front: 'Jakie są sposoby deklarowania zmiennych w JavaScript?',
    back: 'Zmienne można deklarować za pomocą var, let lub const. Let i const zostały wprowadzone w ES6.',
    source: 'ai-full',
  },
  {
    id: 'proposal-3',
    front: 'Czym są funkcje strzałkowe?',
    back: 'Funkcje strzałkowe to zwięzła składnia funkcji wprowadzona w ES6, która nie ma własnego this.',
    source: 'ai-full',
  },
] as const;

// ============================================================================
// API RESPONSE MOCKS
// ============================================================================

export const apiResponses = {
  /** Successful generation response */
  generationSuccess: {
    generation_id: 'gen-123',
    proposals: mockGeneratedProposals,
    generated_count: 3,
  },
  
  /** Error response for rate limiting */
  rateLimitError: {
    error: 'Too many requests',
    message: 'Przekroczono limit żądań. Spróbuj ponownie za chwilę.',
  },
  
  /** Error response for invalid input */
  validationError: {
    error: 'Validation failed',
    message: 'Tekst źródłowy jest zbyt krótki.',
  },
} as const;

// ============================================================================
// TEST TIMEOUTS AND DELAYS
// ============================================================================

export const timeouts = {
  /** Standard timeout for page loads */
  pageLoad: 5000,
  
  /** Timeout for API operations */
  apiRequest: 10000,
  
  /** Short wait for animations */
  animation: 300,
  
  /** Wait for debounced inputs */
  debounce: 500,
} as const;

// ============================================================================
// URL PATHS
// ============================================================================

export const urls = {
  home: '/',
  login: '/auth/login',
  signup: '/auth/signup',
  generate: '/generate',
  flashcards: '/flashcards',
  profile: '/profile',
} as const;

