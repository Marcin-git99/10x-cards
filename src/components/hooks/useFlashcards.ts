import { useState, useEffect, useCallback } from 'react';
import type { FlashcardDto, PaginationDto } from '../../types';

interface UseFlashcardsState {
  flashcards: FlashcardDto[];
  pagination: PaginationDto | null;
  isLoading: boolean;
  error: string | null;
}

interface UseFlashcardsReturn extends UseFlashcardsState {
  refetch: () => Promise<void>;
  goToPage: (page: number) => void;
}

export function useFlashcards(initialPage: number = 1, limit: number = 20): UseFlashcardsReturn {
  const [state, setState] = useState<UseFlashcardsState>({
    flashcards: [],
    pagination: null,
    isLoading: true,
    error: null
  });
  
  const [currentPage, setCurrentPage] = useState(initialPage);

  const fetchFlashcards = useCallback(async (page: number) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await fetch(`/api/flashcards?page=${page}&limit=${limit}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Błąd HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      setState({
        flashcards: data.data || [],
        pagination: data.pagination || null,
        isLoading: false,
        error: null
      });
    } catch (err) {
      console.error('Błąd pobierania fiszek:', err);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Wystąpił błąd podczas pobierania fiszek'
      }));
    }
  }, [limit]);

  useEffect(() => {
    fetchFlashcards(currentPage);
  }, [currentPage, fetchFlashcards]);

  const refetch = useCallback(async () => {
    await fetchFlashcards(currentPage);
  }, [currentPage, fetchFlashcards]);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  return {
    ...state,
    refetch,
    goToPage
  };
}

