import React from 'react';
import { Textarea } from "@/components/ui/textarea";

export interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
  placeholder?: string;
  rows?: number;
  className?: string;
}

const MIN_LENGTH = 1000;
const MAX_LENGTH = 10000;

/**
 * TextAreaInput component for source text input with real-time validation
 * Includes character counter, validation messages, and accessibility features
 */
export function TextAreaInput({
  value = '',
  onChange,
  disabled = false,
  error: externalError,
  placeholder = 'Wklej tutaj swój tekst do nauki...',
  rows = 12,
  className = '',
}: TextInputProps) {
  // Calculate character count directly from prop
  const charCount = value.length;
  
  // Determine validation state
  const isValid = charCount >= MIN_LENGTH && charCount <= MAX_LENGTH;
  const isTooShort = charCount > 0 && charCount < MIN_LENGTH;
  const isTooLong = charCount > MAX_LENGTH;
  
  // Determine which error to show
  let displayError = externalError;
  if (!displayError && isTooShort) {
    displayError = `Tekst musi mieć co najmniej ${MIN_LENGTH} znaków`;
  } else if (!displayError && isTooLong) {
    displayError = `Tekst nie może przekraczać ${MAX_LENGTH} znaków`;
  }
  
  // Determine input styling based on validation state
  const inputClassName = (() => {
    if (displayError) {
      return `border-destructive/50 focus-visible:ring-destructive focus-visible:border-destructive ${className}`;
    }
    
    if (isValid) {
      return `border-emerald-400 dark:border-emerald-600 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 ${className}`;
    }
    
    return className;
  })();

  // Handle text change
  function handleChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    onChange(event.target.value);
  }

  // Generate unique IDs for accessibility
  const textareaId = 'source-text-input';
  const charCountId = `${textareaId}-char-count`;
  const errorId = `${textareaId}-error`;

  // Format character count display
  const charCountDisplay = `${charCount.toLocaleString('pl-PL')} / ${MAX_LENGTH.toLocaleString('pl-PL')} znaków`;

  return (
    <div className="space-y-2">
      {/* Main textarea */}
      <Textarea
        id={textareaId}
        name="source-text"
        rows={rows}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        placeholder={placeholder}
        className={inputClassName}
        aria-describedby={`${charCountId} ${displayError ? errorId : ''}`}
        aria-invalid={!!displayError}
        aria-required="true"
      />
      
      {/* Bottom section with character count and error message */}
      <div className="flex justify-between items-start">
        {/* Character counter */}
        <div 
          id={charCountId}
          data-testid="char-counter"
          className={`text-sm transition-colors ${
            charCount > MAX_LENGTH 
              ? 'text-destructive' 
              : charCount >= 8000 
                ? 'text-yellow-600 dark:text-yellow-400' 
                : 'text-muted-foreground'
          }`}
        >
          {charCountDisplay}
        </div>
        
        {/* Validation/Error message */}
        {displayError && charCount > 0 && (
          <div 
            id={errorId}
            className="text-sm text-destructive font-medium"
            role="alert"
          >
            {displayError}
          </div>
        )}
      </div>
      
      {/* Progress bar for character count (visual indicator) */}
      <div className="w-full bg-secondary rounded-full h-1">
        <div
          className={`h-1 rounded-full transition-all duration-300 ${
            charCount < MIN_LENGTH
              ? 'bg-destructive'
              : charCount > MAX_LENGTH
                ? 'bg-destructive'
                : charCount >= 8000
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
          }`}
          style={{
            width: `${Math.min((charCount / MAX_LENGTH) * 100, 100)}%`,
          }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
