import { useState, useEffect, useMemo } from 'react';

// Types for text validation
export interface ValidationState {
  isValid: boolean;
  errorMessage: string | null;
  charCount: number;
  showError: boolean;
}

interface UseTextValidationOptions {
  minLength?: number;
  maxLength?: number;
  debounceMs?: number;
}

const DEFAULT_OPTIONS: Required<UseTextValidationOptions> = {
  minLength: 1000,
  maxLength: 10000,
  debounceMs: 300,
};

/**
 * Custom hook for text validation with debounced validation
 * Used for validating source text input in the generate view
 */
export const useTextValidation = (
  text: string,
  options: UseTextValidationOptions = {}
): ValidationState => {
  const { minLength, maxLength, debounceMs } = { ...DEFAULT_OPTIONS, ...options };
  
  const [debouncedText, setDebouncedText] = useState(text);
  const [showError, setShowError] = useState(false);

  // Debounce text input to avoid excessive validation calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedText(text);
      // Only show error after user has stopped typing for debounce period
      if (text.length > 0) {
        setShowError(true);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [text, debounceMs]);

  // Calculate validation state based on debounced text
  const validation = useMemo((): ValidationState => {
    const charCount = debouncedText.length;
    
    // No validation for empty text initially
    if (charCount === 0) {
      return {
        isValid: false,
        errorMessage: null,
        charCount,
        showError: false,
      };
    }

    // Validate text length
    if (charCount < minLength) {
      return {
        isValid: false,
        errorMessage: `Tekst musi mieć co najmniej ${minLength} znaków`,
        charCount,
        showError,
      };
    }

    if (charCount > maxLength) {
      return {
        isValid: false,
        errorMessage: `Tekst nie może przekraczać ${maxLength} znaków`,
        charCount,
        showError,
      };
    }

    // Text is valid
    return {
      isValid: true,
      errorMessage: null,
      charCount,
      showError,
    };
  }, [debouncedText, minLength, maxLength, showError]);

  return validation;
};

/**
 * Utility function to get character count display string
 */
export const getCharCountDisplay = (current: number, max: number): string => {
  return `${current.toLocaleString('pl-PL')} / ${max.toLocaleString('pl-PL')} znaków`;
};

/**
 * Utility function to determine if text meets minimum requirements for generation
 */
export const canGenerateFromText = (text: string, minLength: number = 1000): boolean => {
  return text.length >= minLength && text.length <= 10000;
};
