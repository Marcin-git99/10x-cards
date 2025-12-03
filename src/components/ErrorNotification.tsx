import React from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, X } from "lucide-react";

export interface ErrorNotificationProps {
  message: string;
  title?: string;
  onDismiss?: () => void;
  className?: string;
}

/**
 * ErrorNotification component - wyświetla komunikaty o błędach
 * Wykorzystuje shadcn/ui Alert z możliwością zamknięcia
 */
export const ErrorNotification: React.FC<ErrorNotificationProps> = ({
  message,
  title = "Wystąpił błąd",
  onDismiss,
  className = '',
}) => {
  if (!message) return null;

  return (
    <Alert 
      variant="destructive" 
      className={className}
      role="alert"
      aria-live="assertive"
    >
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex items-center justify-between gap-4">
        <span>{message}</span>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 text-destructive hover:text-destructive/80 p-1 rounded-sm hover:bg-destructive/10 transition-colors"
            aria-label="Zamknij komunikat o błędzie"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </AlertDescription>
    </Alert>
  );
};

