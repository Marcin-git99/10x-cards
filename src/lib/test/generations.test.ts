import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateFlashcards, createSourceTextHash } from '../generation.service';
import { DEFAULT_USER_ID } from '@/db/supabase.client';

// Mock dla supabase client
const mockSupabaseClient = {
  from: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  single: vi.fn().mockReturnValue({ data: { id: 1 }, error: null })
};

describe('generation.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createSourceTextHash', () => {
    it('powinien generować hash MD5 z tekstu źródłowego', () => {
      const sourceText = 'Przykładowy tekst źródłowy';
      const hash = createSourceTextHash(sourceText);
      
      // MD5 hash dla 'Przykładowy tekst źródłowy' (możesz zweryfikować na stronie https://www.md5hashgenerator.com/)
      const expectedHash = '3f8e2c2ec09760a6fb8d068f26c148d0';
      
      expect(hash).toBe(expectedHash);
    });
  });

  describe('generateFlashcards', () => {
    it('powinien zwrócić wygenerowane propozycje fiszek', async () => {
      const sourceText = 'To jest przykładowy tekst źródłowy o długości większej niż 1000 znaków...'.padEnd(1100, ' ');

      const result = await generateFlashcards(
        mockSupabaseClient as any,
        DEFAULT_USER_ID,
        sourceText
      );

      expect(result).toHaveProperty('generation_id');
      expect(result).toHaveProperty('flashcards_proposals');
      expect(result).toHaveProperty('generated_count');
      expect(result.flashcards_proposals.length).toBeGreaterThan(0);
      expect(result.generated_count).toBe(result.flashcards_proposals.length);
      
      // Weryfikacja wywołania zapisania metadanych generacji
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('generations');
      expect(mockSupabaseClient.insert).toHaveBeenCalled();
    });
  });
});
