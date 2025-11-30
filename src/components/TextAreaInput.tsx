import React, { useCallback } from 'react';
import { useTextValidation, getCharCountDisplay } from './hooks/useTextValidation';

export interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
  placeholder?: string;
  rows?: number;
  className?: string;
}

/**
 * TextAreaInput component for source text input with real-time validation
 * Includes character counter, validation messages, and accessibility features
 */
export const TextAreaInput: React.FC<TextInputProps> = ({
  value,
  onChange,
  disabled = false,
  error: externalError,
  placeholder = 'Wklej tutaj swój tekst do nauki...',
  rows = 12,
  className = '',
}) => {
  // Use validation hook with debounced validation
  const validation = useTextValidation(value);
  
  // Determine which error to show (external error takes precedence)
  const displayError = externalError || (validation.showError ? validation.errorMessage : null);
  
  // Determine input styling based on validation state
  const getInputClassName = () => {
    const baseClasses = `
      w-full p-4 text-sm border rounded-lg resize-none transition-colors
      focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none
      disabled:bg-gray-50 disabled:cursor-not-allowed
    `;
    
    if (displayError) {
      return `${baseClasses} border-red-300 focus:ring-red-500 focus:border-red-500 ${className}`;
    }
    
    if (validation.isValid && value.length > 0) {
      return `${baseClasses} border-green-300 focus:ring-green-500 focus:border-green-500 ${className}`;
    }
    
    return `${baseClasses} border-gray-300 ${className}`;
  };

  // Handle text change with proper event typing
  const handleChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = event.target.value;
    onChange(newValue);
  }, [onChange]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Allow Ctrl+A for select all
    if (event.ctrlKey && event.key === 'a') {
      return;
    }
    
    // Could add other keyboard shortcuts here (Ctrl+V for paste, etc.)
    
    // Prevent input if at max length and not deleting/backspacing
    if (value.length >= 10000 && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      event.preventDefault();
    }
  }, [value.length]);

  // Handle blur for final validation
  const handleBlur = useCallback(() => {
    // This could trigger additional validation logic if needed
    // For now, the validation hook handles this via debouncing
  }, []);

  // Generate unique IDs for accessibility
  const textareaId = 'source-text-input';
  const charCountId = `${textareaId}-char-count`;
  const errorId = `${textareaId}-error`;

  return (
    <div className="space-y-2">
      {/* Main textarea */}
      <textarea
        id={textareaId}
        name="source-text"
        rows={rows}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        disabled={disabled}
        placeholder={placeholder}
        className={getInputClassName()}
        aria-describedby={`${charCountId} ${displayError ? errorId : ''}`}
        aria-invalid={!!displayError}
        aria-required="true"
      />
      
      {/* Bottom section with character count and error message */}
      <div className="flex justify-between items-start">
        {/* Character counter */}
        <div 
          id={charCountId}
          className={`text-sm transition-colors ${
            validation.charCount > 10000 
              ? 'text-red-600' 
              : validation.charCount >= 8000 
                ? 'text-yellow-600' 
                : 'text-gray-500'
          }`}
          aria-live="polite"
        >
          {getCharCountDisplay(validation.charCount, 10000)}
        </div>
        
        {/* Validation/Error message */}
        {displayError && (
          <div 
            id={errorId}
            className="text-sm text-red-600 font-medium"
            role="alert"
            aria-live="polite"
          >
            {displayError}
          </div>
        )}
      </div>
      
      {/* Progress bar for character count (visual indicator) */}
      <div className="w-full bg-gray-200 rounded-full h-1">
        <div
          className={`h-1 rounded-full transition-all duration-300 ${
            validation.charCount < 1000
              ? 'bg-red-500'
              : validation.charCount > 10000
                ? 'bg-red-500'
                : validation.charCount >= 8000
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
          }`}
          style={{
            width: `${Math.min((validation.charCount / 10000) * 100, 100)}%`,
          }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
};
