import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

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

  const sizeMap = {
    sm: 'sm',
    md: 'default',
    lg: 'lg',
  } as const;

  const handleClick = (e: React.MouseEvent) => {
    if (!disabled && !loading) {
      onClick();
    }
  };

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
    <div className="relative inline-block">
      <Button
        type="button"
        onClick={handleClick}
        disabled={disabled || loading}
        className={cn(
          "relative transition-all duration-200",
          "w-full sm:w-auto",
          className
        )}
        size={sizeMap[size]}
        aria-label={getAriaLabel()}
        aria-describedby={disabled && disabledReason ? 'generate-button-tooltip' : undefined}
        onMouseEnter={() => disabled && disabledReason && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => disabled && disabledReason && setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <span>Generowanie...</span>
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            <span>Generuj fiszki AI</span>
          </>
        )}
      </Button>

      {showTooltip && disabled && disabledReason && (
        <div
          id="generate-button-tooltip"
          role="tooltip"
          className={`
            absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2
            px-3 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg shadow-sm
            whitespace-nowrap z-50 opacity-90
            before:content-[''] before:absolute before:top-full before:left-1/2
            before:transform before:-translate-x-1/2 before:border-4
            before:border-transparent before:border-t-primary
          `}
        >
          {disabledReason}
        </div>
      )}

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
