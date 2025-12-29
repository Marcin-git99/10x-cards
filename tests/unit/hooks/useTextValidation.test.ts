import { renderHook, act, waitFor } from '@testing-library/react';
import { useTextValidation, getCharCountDisplay, canGenerateFromText } from '@/components/hooks/useTextValidation';

describe('useTextValidation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('returns invalid state with no error for empty text', () => {
      const { result } = renderHook(() => useTextValidation(''));

      expect(result.current.isValid).toBe(false);
      expect(result.current.errorMessage).toBeNull();
      expect(result.current.charCount).toBe(0);
      expect(result.current.showError).toBe(false);
    });
  });

  describe('text too short', () => {
    it('returns invalid state with error when text is below minLength after debounce', async () => {
      const shortText = 'a'.repeat(500);
      const { result } = renderHook(() => useTextValidation(shortText));

      // Initially, debounce hasn't fired
      expect(result.current.showError).toBe(false);

      // Fast-forward debounce time
      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current.isValid).toBe(false);
      expect(result.current.errorMessage).toBe('Tekst musi mieć co najmniej 1000 znaków');
      expect(result.current.charCount).toBe(500);
      expect(result.current.showError).toBe(true);
    });

    it('respects custom minLength option', async () => {
      const text = 'a'.repeat(50);
      const { result } = renderHook(() => 
        useTextValidation(text, { minLength: 100 })
      );

      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current.isValid).toBe(false);
      expect(result.current.errorMessage).toBe('Tekst musi mieć co najmniej 100 znaków');
    });
  });

  describe('text too long', () => {
    it('returns invalid state with error when text exceeds maxLength', async () => {
      const longText = 'a'.repeat(15000);
      const { result } = renderHook(() => useTextValidation(longText));

      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current.isValid).toBe(false);
      expect(result.current.errorMessage).toBe('Tekst nie może przekraczać 10000 znaków');
      expect(result.current.charCount).toBe(15000);
    });

    it('respects custom maxLength option', async () => {
      const text = 'a'.repeat(600);
      const { result } = renderHook(() => 
        useTextValidation(text, { minLength: 100, maxLength: 500 })
      );

      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current.isValid).toBe(false);
      expect(result.current.errorMessage).toBe('Tekst nie może przekraczać 500 znaków');
    });
  });

  describe('valid text', () => {
    it('returns valid state when text length is within bounds', async () => {
      const validText = 'a'.repeat(2000);
      const { result } = renderHook(() => useTextValidation(validText));

      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current.isValid).toBe(true);
      expect(result.current.errorMessage).toBeNull();
      expect(result.current.charCount).toBe(2000);
    });

    it('accepts text at exact minLength boundary', async () => {
      const boundaryText = 'a'.repeat(1000);
      const { result } = renderHook(() => useTextValidation(boundaryText));

      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current.isValid).toBe(true);
      expect(result.current.errorMessage).toBeNull();
    });

    it('accepts text at exact maxLength boundary', async () => {
      const boundaryText = 'a'.repeat(10000);
      const { result } = renderHook(() => useTextValidation(boundaryText));

      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current.isValid).toBe(true);
      expect(result.current.errorMessage).toBeNull();
    });
  });

  describe('debounce behavior', () => {
    it('respects custom debounceMs option', async () => {
      const text = 'a'.repeat(2000);
      const { result } = renderHook(() => 
        useTextValidation(text, { debounceMs: 500 })
      );

      // Initially, debouncedText starts with initial value (text)
      // but showError is false until debounce fires
      expect(result.current.showError).toBe(false);

      // After 300ms (less than 500ms debounceMs), showError should still be false
      await act(async () => {
        vi.advanceTimersByTime(300);
      });
      expect(result.current.showError).toBe(false);

      // After additional 200ms (total 500ms), debounce fires and showError becomes true
      await act(async () => {
        vi.advanceTimersByTime(200);
      });
      expect(result.current.showError).toBe(true);
      expect(result.current.charCount).toBe(2000);
    });

    it('resets debounce timer on text change', async () => {
      const { result, rerender } = renderHook(
        ({ text }) => useTextValidation(text),
        { initialProps: { text: 'a'.repeat(500) } }
      );

      // Advance partway through debounce (200ms of 300ms default)
      await act(async () => {
        vi.advanceTimersByTime(200);
      });

      // showError should still be false (debounce not completed)
      expect(result.current.showError).toBe(false);

      // Change text (resets timer)
      rerender({ text: 'a'.repeat(2000) });

      // After additional 200ms (total 400ms from start, but only 200ms from text change)
      await act(async () => {
        vi.advanceTimersByTime(200);
      });
      
      // Timer was reset, so showError should still be false
      expect(result.current.showError).toBe(false);

      // After full debounce from last change (100ms more = 300ms total)
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      
      // Now debounce has completed with new text
      expect(result.current.showError).toBe(true);
      expect(result.current.charCount).toBe(2000);
    });
  });
});

describe('getCharCountDisplay', () => {
  it('formats numbers with Polish locale', () => {
    // Polish uses space as thousands separator
    expect(getCharCountDisplay(1500, 10000)).toMatch(/1[\s ]?500/);
    expect(getCharCountDisplay(1500, 10000)).toMatch(/10[\s ]?000/);
  });

  it('includes "znaków" suffix', () => {
    expect(getCharCountDisplay(100, 1000)).toContain('znaków');
  });
});

describe('canGenerateFromText', () => {
  it('returns true for valid text length', () => {
    expect(canGenerateFromText('a'.repeat(1000))).toBe(true);
    expect(canGenerateFromText('a'.repeat(5000))).toBe(true);
    expect(canGenerateFromText('a'.repeat(10000))).toBe(true);
  });

  it('returns false for text below default minLength', () => {
    expect(canGenerateFromText('a'.repeat(999))).toBe(false);
    expect(canGenerateFromText('')).toBe(false);
  });

  it('returns false for text above maxLength', () => {
    expect(canGenerateFromText('a'.repeat(10001))).toBe(false);
  });

  it('respects custom minLength parameter', () => {
    expect(canGenerateFromText('a'.repeat(50), 100)).toBe(false);
    expect(canGenerateFromText('a'.repeat(100), 100)).toBe(true);
  });
});

