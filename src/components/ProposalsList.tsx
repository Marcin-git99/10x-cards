import React, { useCallback, useRef, useEffect } from 'react';
import { ProposalCard } from './ProposalCard';
import type { ProposalWithState, SelectionMode, BulkSelectionState } from './hooks/useGenerateFlashcards';

export interface ProposalsListProps {
  proposals: ProposalWithState[];
  bulkSelectionState: BulkSelectionState;
  onBulkSelect: (mode: SelectionMode) => void;
  onProposalUpdate: (id: string, updates: Partial<ProposalWithState>) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * ProposalsList component - kontener dla listy propozycji fiszek
 * Obsługuje bulk selection, keyboard navigation i zarządzanie propozycjami
 */
export const ProposalsList: React.FC<ProposalsListProps> = ({
  proposals,
  bulkSelectionState,
  onBulkSelect,
  onProposalUpdate,
  disabled = false,
  className = '',
}) => {
  const listRef = useRef<HTMLDivElement>(null);

  // Scroll to results after generation
  useEffect(() => {
    if (proposals.length > 0 && listRef.current) {
      listRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  }, [proposals.length]);

  // Handle bulk selection
  const handleBulkSelectAll = useCallback(() => {
    if (!disabled) {
      onBulkSelect(bulkSelectionState.allSelected ? 'none' : 'all');
    }
  }, [disabled, bulkSelectionState.allSelected, onBulkSelect]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case 'a':
          event.preventDefault();
          if (!disabled) {
            onBulkSelect('all');
          }
          break;
        case 'A':
          if (event.shiftKey) {
            event.preventDefault();
            if (!disabled) {
              onBulkSelect('none');
            }
          }
          break;
        case 'i':
          event.preventDefault();
          if (!disabled) {
            onBulkSelect('invert');
          }
          break;
      }
    }
  }, [disabled, onBulkSelect]);

  // Empty state
  if (proposals.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="max-w-sm mx-auto">
          <svg 
            className="w-16 h-16 mx-auto mb-4 text-gray-300"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Brak propozycji fiszek
          </h3>
          <p className="text-gray-600">
            Wprowadź tekst i kliknij "Generuj fiszki AI", aby zobaczyć propozycje.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={listRef}
      className={`space-y-4 ${className}`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label="Lista propozycji fiszek"
      aria-describedby="proposals-help"
    >
      {/* Header with bulk selection */}
      <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-center gap-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={bulkSelectionState.allSelected}
              ref={input => {
                if (input) input.indeterminate = bulkSelectionState.indeterminate;
              }}
              onChange={handleBulkSelectAll}
              disabled={disabled}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
              aria-describedby="bulk-select-status"
            />
            <span className="ml-2 text-sm font-medium text-gray-700">
              Zaznacz wszystkie
            </span>
          </label>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>|</span>
            <button
              type="button"
              onClick={() => onBulkSelect('none')}
              disabled={disabled || bulkSelectionState.selectedCount === 0}
              className="text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Odznacz wszystkie
            </button>
            <span>|</span>
            <button
              type="button"
              onClick={() => onBulkSelect('invert')}
              disabled={disabled}
              className="text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Odwróć zaznaczenie
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span 
            id="bulk-select-status"
            className="text-sm text-gray-600"
            aria-live="polite"
          >
            {bulkSelectionState.selectedCount} z {proposals.length} zaznaczonych
          </span>
        </div>
      </div>

      {/* Help text for keyboard shortcuts */}
      <div 
        id="proposals-help"
        className="text-xs text-gray-500 px-1"
      >
        Skróty klawiszowe: Ctrl+A (zaznacz wszystkie), Ctrl+Shift+A (odznacz wszystkie), Ctrl+I (odwróć zaznaczenie)
      </div>

      {/* Proposals list */}
      <div 
        className="space-y-3"
        role="list"
        aria-label={`${proposals.length} propozycji fiszek`}
      >
        {proposals.map((proposal, index) => (
          <div
            key={proposal.id}
            role="listitem"
            aria-posinset={index + 1}
            aria-setsize={proposals.length}
          >
            <ProposalCard
              proposal={proposal}
              onUpdate={(updates) => onProposalUpdate(proposal.id, updates)}
              disabled={disabled}
            />
          </div>
        ))}
      </div>

      {/* Summary footer */}
      <div className="text-center pt-6 pb-4">
        <p className="text-sm text-gray-600">
          Pokazano {proposals.length} {proposals.length === 1 ? 'propozycję' : 'propozycji'} fiszek
          {bulkSelectionState.selectedCount > 0 && (
            <span className="ml-2 text-blue-600 font-medium">
              • {bulkSelectionState.selectedCount} zaznaczonych
            </span>
          )}
        </p>
      </div>

      {/* Screen reader announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {bulkSelectionState.selectedCount === proposals.length && 'Wszystkie propozycje są zaznaczone'}
        {bulkSelectionState.selectedCount === 0 && proposals.length > 0 && 'Żadna propozycja nie jest zaznaczona'}
      </div>
    </div>
  );
};
