import type { FlashcardProposalDto } from '../types';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Prompt systemowy dla generowania fiszek
 */
const SYSTEM_PROMPT = `Jesteś ekspertem w tworzeniu fiszek edukacyjnych. Twoim zadaniem jest przeanalizowanie dostarczonego tekstu i wygenerowanie zestawu fiszek do nauki.

Zasady tworzenia fiszek:
1. Każda fiszka powinna zawierać jedno konkretne pytanie (przód) i zwięzłą odpowiedź (tył)
2. Pytania powinny być jasne i jednoznaczne
3. Odpowiedzi powinny być zwięzłe, ale kompletne
4. Skup się na najważniejszych pojęciach, faktach, datach i zależnościach
5. Unikaj pytań zbyt ogólnych lub trywialnych
6. Przód fiszki: maksymalnie 200 znaków
7. Tył fiszki: maksymalnie 500 znaków

Odpowiedz TYLKO w formacie JSON - tablica obiektów z polami "front" i "back":
[
  {"front": "Pytanie 1?", "back": "Odpowiedź 1"},
  {"front": "Pytanie 2?", "back": "Odpowiedź 2"}
]

Nie dodawaj żadnego tekstu przed ani po JSON. Wygeneruj od 3 do 10 fiszek w zależności od ilości materiału.`;

/**
 * Interfejs odpowiedzi z OpenAI API
 */
interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Wywołuje OpenAI API do generowania fiszek na podstawie tekstu
 */
export async function generateFlashcardsWithOpenAI(
  sourceText: string,
  model: string = 'gpt-4o-mini'
): Promise<FlashcardProposalDto[]> {
  const apiKey = import.meta.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('Brak klucza API OpenAI. Ustaw zmienną OPENAI_API_KEY w pliku .env');
  }
  
  console.log('=== OpenAI API Call START ===');
  console.log('Model:', model);
  console.log('Source text length:', sourceText.length);
  
  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: `Przeanalizuj poniższy tekst i wygeneruj fiszki edukacyjne:\n\n${sourceText}`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI API error:', response.status, errorData);
      
      if (response.status === 401) {
        throw new Error('Nieprawidłowy klucz API OpenAI');
      }
      if (response.status === 429) {
        throw new Error('Przekroczono limit zapytań do API. Spróbuj ponownie za chwilę.');
      }
      if (response.status === 500 || response.status === 503) {
        throw new Error('Serwis OpenAI jest tymczasowo niedostępny. Spróbuj ponownie.');
      }
      
      throw new Error(`Błąd API OpenAI: ${response.status} - ${errorData.error?.message || 'Nieznany błąd'}`);
    }
    
    const data: OpenAIResponse = await response.json();
    
    console.log('OpenAI response received');
    console.log('Tokens used:', data.usage?.total_tokens || 'unknown');
    
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('Pusta odpowiedź z API OpenAI');
    }
    
    // Parsowanie JSON z odpowiedzi
    let flashcards: Array<{ front: string; back: string }>;
    
    try {
      // Próba wyciągnięcia JSON z odpowiedzi (może być otoczony tekstem)
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Nie znaleziono tablicy JSON w odpowiedzi');
      }
      flashcards = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw content:', content);
      throw new Error('Nie udało się sparsować odpowiedzi z AI. Spróbuj ponownie.');
    }
    
    // Walidacja i mapowanie na FlashcardProposalDto
    const validFlashcards: FlashcardProposalDto[] = flashcards
      .filter(fc => fc.front && fc.back && typeof fc.front === 'string' && typeof fc.back === 'string')
      .map(fc => ({
        front: fc.front.slice(0, 200),  // Ograniczenie do 200 znaków
        back: fc.back.slice(0, 500),    // Ograniczenie do 500 znaków
        source: 'ai-full' as const
      }));
    
    if (validFlashcards.length === 0) {
      throw new Error('AI nie wygenerowało żadnych prawidłowych fiszek. Spróbuj z innym tekstem.');
    }
    
    console.log('=== OpenAI API Call SUCCESS ===');
    console.log('Generated flashcards:', validFlashcards.length);
    
    return validFlashcards;
    
  } catch (error) {
    console.error('=== OpenAI API Call ERROR ===');
    console.error('Error:', error);
    
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Nieoczekiwany błąd podczas komunikacji z API OpenAI');
  }
}

