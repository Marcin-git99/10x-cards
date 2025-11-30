import React, { useState, useRef, useCallback, useEffect } from 'react';
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
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
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
      <div className={`relative inline-flex ${className}`} ref={dropdownRef}>
        {/* Main Save Button */}
        <button
          type="button"
          onClick={() => handleSave('selected')}
          disabled={mainButtonDisabled}
          className={`
            inline-flex items-center px-4 py-2 text-sm font-medium rounded-l-lg border
            transition-all duration-200
            ${mainButtonDisabled
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed border-gray-300'
              : 'bg-green-600 hover:bg-green-700 text-white border-green-600 hover:border-green-700 shadow-sm hover:shadow-md'
            }
          `}
          title={mainButtonDisabled 
            ? (selectedCount === 0 ? 'Zaznacz co najmniej jedną propozycję' : 'Zapisywanie w toku')
            : `Zapisz zaznaczone fiszki (${selectedCount}) - Ctrl+S`
          }
          aria-describedby="save-button-status"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Zapisz zaznaczone ({selectedCount})
        </button>

        {/* Dropdown Toggle */}
        <button
          type="button"
          onClick={handleDropdownToggle}
          disabled={disabled || loading}
          className={`
            px-2 py-2 text-sm font-medium rounded-r-lg border-l-0 border
            transition-all duration-200
            ${disabled || loading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed border-gray-300'
              : 'bg-green-600 hover:bg-green-700 text-white border-green-600 hover:border-green-700 shadow-sm hover:shadow-md'
            }
          `}
          aria-expanded={isDropdownOpen}
          aria-haspopup="true"
          aria-label="Więcej opcji zapisu"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <div className="py-1">
              <button
                type="button"
                onClick={() => handleSave('selected')}
                disabled={selectedCount === 0}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center"
              >
                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Zapisz zaznaczone ({selectedCount})
                <span className="ml-auto text-xs text-gray-400">Ctrl+S</span>
              </button>

              <button
                type="button"
                onClick={() => handleSave('all')}
                disabled={saveAllDisabled}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center"
              >
                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Zapisz wszystkie ({totalCount})
                <span className="ml-auto text-xs text-gray-400">Ctrl+Shift+S</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50" role="dialog" aria-labelledby="confirm-dialog-title">
          <div className="bg-white rounded-lg p-6 max-w-md mx-auto shadow-xl">
            <div className="flex items-center mb-4">
              <svg className="w-6 h-6 text-yellow-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <h3 id="confirm-dialog-title" className="text-lg font-medium text-gray-900">
                Potwierdź zapis fiszek
              </h3>
            </div>
            <p className="text-gray-600 mb-6">
              Czy na pewno chcesz zapisać {showConfirmDialog === 'selected' ? selectedCount : totalCount} fiszek? 
              Ta operacja może zająć chwilę.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmDialog(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Anuluj
              </button>
              <button
                type="button"
                onClick={() => handleSave(showConfirmDialog)}
                className="px-4 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
              >
                Tak, zapisz
              </button>
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
