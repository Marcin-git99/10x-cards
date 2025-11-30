import React, { useState } from 'react';

export interface LoadingState {
  isLoading: boolean;
  progress?: number;
  stage?: 'analyzing' | 'generating' | 'processing';
}

export interface GenerateButtonProps {
  onClick: () => void;
  loading: boolean;
  disabled: boolean;
  disabledReason?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * GenerateButton component for initiating flashcard generation
 * Includes loading states, validation, and accessibility features
 */
export const GenerateButton: React.FC<GenerateButtonProps> = ({
  onClick,
  loading = false,
  disabled = false,
  disabledReason,
  className = '',
  size = 'md',
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  // Size-based styling
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base',
  };

  // Generate button classes based on state
  const getButtonClassName = () => {
    const baseClasses = `
      inline-flex items-center justify-center font-medium rounded-lg
      transition-all duration-200 ease-in-out
      focus:outline-none focus:ring-2 focus:ring-offset-2
      disabled:cursor-not-allowed
      relative
    `;

    const sizeClass = sizeClasses[size];

    if (loading) {
      return `${baseClasses} ${sizeClass} bg-blue-600 text-white cursor-wait focus:ring-blue-500 ${className}`;
    }

    if (disabled) {
      return `${baseClasses} ${sizeClass} bg-gray-300 text-gray-500 focus:ring-gray-300 ${className}`;
    }

    return `${baseClasses} ${sizeClass} bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md focus:ring-blue-500 active:scale-95 ${className}`;
  };

  // Handle button click
  const handleClick = () => {
    if (!disabled && !loading) {
      onClick();
    }
  };

  // Handle keyboard interaction
  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  };

  // Loading spinner component
  const LoadingSpinner = () => (
    <svg
      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  // AI icon component
  const AIIcon = () => (
    <svg
      className="w-5 h-5 mr-2"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M13 10V3L4 14h7v7l9-11h-7z"
      />
    </svg>
  );

  // Generate button content based on state
  const getButtonContent = () => {
    if (loading) {
      return (
        <>
          <LoadingSpinner />
          <span>Generowanie...</span>
        </>
      );
    }

    return (
      <>
        <AIIcon />
        <span>Generuj fiszki AI</span>
      </>
    );
  };

  // Generate aria-label based on state
  const getAriaLabel = () => {
    if (loading) {
      return 'Trwa generowanie fiszek przez sztuczną inteligencję';
    }
    
    if (disabled && disabledReason) {
      return `Generuj fiszki AI - wyłączony: ${disabledReason}`;
    }

    return 'Generuj fiszki przy użyciu sztucznej inteligencji';
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        disabled={disabled || loading}
        className={getButtonClassName()}
        aria-label={getAriaLabel()}
        aria-describedby={disabled && disabledReason ? 'generate-button-tooltip' : undefined}
        onMouseEnter={() => disabled && disabledReason && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => disabled && disabledReason && setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
      >
        {getButtonContent()}
      </button>

      {/* Tooltip for disabled state */}
      {showTooltip && disabled && disabledReason && (
        <div
          id="generate-button-tooltip"
          role="tooltip"
          className={`
            absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2
            px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm
            whitespace-nowrap z-50 opacity-90
            before:content-[''] before:absolute before:top-full before:left-1/2
            before:transform before:-translate-x-1/2 before:border-4
            before:border-transparent before:border-t-gray-900
          `}
        >
          {disabledReason}
        </div>
      )}

      {/* Screen reader live region for status updates */}
      <div
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      >
        {loading && 'Trwa generowanie fiszek...'}
        {disabled && disabledReason && `Przycisk wyłączony: ${disabledReason}`}
      </div>
    </div>
  );
};
