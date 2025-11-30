import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, Save, ChevronDown, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SaveMode, SaveOptions, SaveProgress } from './hooks/useGenerateFlashcards';

export interface BulkSaveButtonProps {
  selectedCount: number;
  totalCount: number;
  onSave: (mode: SaveMode, options?: SaveOptions) => Promise<void>;
  loading: boolean;
  progress?: SaveProgress;
  disabled?: boolean;
  className?: string;
}

/**
 * BulkSaveButton component - zaawansowany przycisk zapisu fiszek
 * Obsługuje różne tryby zapisu, dropdown menu, progress tracking
 */
export const BulkSaveButton: React.FC<BulkSaveButtonProps> = ({
  selectedCount,
  totalCount,
  onSave,
  loading,
  progress,
  disabled = false,
  className = '',
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState<SaveMode | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        if (event.key === 's' && !event.shiftKey) {
          event.preventDefault();
          if (selectedCount > 0 && !loading && !disabled) {
            handleSave('selected');
          }
        } else if (event.key === 'S' && event.shiftKey) {
          event.preventDefault();
          if (totalCount > 0 && !loading && !disabled) {
            handleSave('all');
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedCount, totalCount, loading, disabled]);

  const handleSave = useCallback(async (mode: SaveMode, options?: SaveOptions) => {
    const count = mode === 'selected' ? selectedCount : totalCount;
    
    // Show confirmation for large operations
    if (count > 20 && !showConfirmDialog) {
      setShowConfirmDialog(mode);
      return;
    }

    setShowConfirmDialog(null);
    setIsDropdownOpen(false);

    try {
      await onSave(mode, options);
    } catch (error) {
      console.error('Save error:', error);
    }
  }, [selectedCount, totalCount, showConfirmDialog, onSave]);

  const handleDropdownToggle = useCallback(() => {
    if (!disabled && !loading) {
      setIsDropdownOpen(!isDropdownOpen);
    }
  }, [disabled, loading, isDropdownOpen]);

  // Main button (Save Selected) disabled state
  const mainButtonDisabled = disabled || loading || selectedCount === 0;
  
  // Save All disabled state
  const saveAllDisabled = disabled || loading || totalCount === 0;

  // Progress display
  if (loading && progress) {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          <span className="text-sm text-blue-800">
            {progress.message || `Zapisywanie... ${progress.current}/${progress.total}`}
          </span>
        </div>
        {progress.total > 1 && (
          <div className="flex-1 max-w-48">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
                aria-hidden="true"
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className={cn("relative inline-flex shadow-sm", className)} ref={dropdownRef}>
        {/* Main Save Button */}
        <Button
          type="button"
          onClick={() => handleSave('selected')}
          disabled={mainButtonDisabled}
          className={cn(
            "rounded-r-none border-r-0 focus:z-10",
            mainButtonDisabled && "bg-muted text-muted-foreground opacity-50"
          )}
          variant={mainButtonDisabled ? "secondary" : "default"} // Green styling is default/primary usually, or custom via className
          title={mainButtonDisabled 
            ? (selectedCount === 0 ? 'Zaznacz co najmniej jedną propozycję' : 'Zapisywanie w toku')
            : `Zapisz zaznaczone fiszki (${selectedCount}) - Ctrl+S`
          }
          aria-describedby="save-button-status"
        >
          <Save className="mr-2 h-4 w-4" />
          Zapisz zaznaczone ({selectedCount})
        </Button>

        {/* Dropdown Toggle */}
        <Button
          type="button"
          onClick={handleDropdownToggle}
          disabled={disabled || loading}
          className={cn(
            "rounded-l-none px-2 focus:z-10",
             (disabled || loading) && "bg-muted text-muted-foreground opacity-50"
          )}
          variant={disabled || loading ? "secondary" : "default"}
          aria-expanded={isDropdownOpen}
          aria-haspopup="true"
          aria-label="Więcej opcji zapisu"
        >
          <ChevronDown className="h-4 w-4" />
        </Button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute right-0 top-full mt-1 w-56 bg-popover border rounded-md shadow-lg z-50 animate-in fade-in-0 zoom-in-95">
            <div className="p-1">
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleSave('selected')}
                disabled={selectedCount === 0}
                className="w-full justify-start text-sm font-normal"
              >
                <Save className="mr-2 h-4 w-4" />
                Zapisz zaznaczone ({selectedCount})
                <span className="ml-auto text-xs text-muted-foreground">Ctrl+S</span>
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={() => handleSave('all')}
                disabled={saveAllDisabled}
                className="w-full justify-start text-sm font-normal"
              >
                <Save className="mr-2 h-4 w-4" />
                Zapisz wszystkie ({totalCount})
                <span className="ml-auto text-xs text-muted-foreground">Ctrl+Shift+S</span>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50" role="dialog" aria-labelledby="confirm-dialog-title">
          <div className="bg-card border rounded-lg p-6 max-w-md mx-auto shadow-xl">
            <div className="flex items-center mb-4">
              <AlertCircle className="h-6 w-6 text-yellow-600 mr-3" />
              <h3 id="confirm-dialog-title" className="text-lg font-semibold">
                Potwierdź zapis fiszek
              </h3>
            </div>
            <p className="text-muted-foreground mb-6">
              Czy na pewno chcesz zapisać {showConfirmDialog === 'selected' ? selectedCount : totalCount} fiszek? 
              Ta operacja może zająć chwilę.
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="outline"
                type="button"
                onClick={() => setShowConfirmDialog(null)}
              >
                Anuluj
              </Button>
              <Button
                type="button"
                onClick={() => handleSave(showConfirmDialog)}
              >
                Tak, zapisz
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Screen reader status */}
      <div 
        id="save-button-status"
        className="sr-only" 
        aria-live="polite"
      >
        {loading && 'Trwa zapisywanie fiszek...'}
        {mainButtonDisabled && selectedCount === 0 && 'Brak zaznaczonych propozycji do zapisania'}
      </div>
    </>
  );
};
