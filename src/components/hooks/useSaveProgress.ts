import { useState, useCallback } from 'react';
import type { SaveProgress } from './useGenerateFlashcards';

interface UseSaveProgressReturn {
  progress: SaveProgress | undefined;
  startSave: (total: number) => void;
  updateProgress: (current: number, message?: string) => void;
  completeSave: () => void;
  failSave: (message: string) => void;
  resetProgress: () => void;
}

/**
 * Custom hook do zarządzania stanem postępu zapisu
 * Pozwala na śledzenie postępu operacji zapisu wielu elementów
 */
export const useSaveProgress = (): UseSaveProgressReturn => {
  const [progress, setProgress] = useState<SaveProgress | undefined>(undefined);

  const startSave = useCallback((total: number) => {
    setProgress({
      current: 0,
      total,
      status: 'preparing',
      message: 'Przygotowywanie do zapisu...'
    });
  }, []);

  const updateProgress = useCallback((current: number, message?: string) => {
    setProgress(prev => {
      if (!prev) return undefined;
      return {
        ...prev,
        current,
        status: 'saving',
        message: message || `Zapisano ${current} z ${prev.total}`
      };
    });
  }, []);

  const completeSave = useCallback(() => {
    setProgress(prev => {
      if (!prev) return undefined;
      return {
        ...prev,
        current: prev.total,
        status: 'completed',
        message: 'Zapisywanie zakończone pomyślnie'
      };
    });
  }, []);

  const failSave = useCallback((message: string) => {
    setProgress(prev => {
      if (!prev) return undefined;
      return {
        ...prev,
        status: 'error',
        message
      };
    });
  }, []);

  const resetProgress = useCallback(() => {
    setProgress(undefined);
  }, []);

  return {
    progress,
    startSave,
    updateProgress,
    completeSave,
    failSave,
    resetProgress
  };
};

