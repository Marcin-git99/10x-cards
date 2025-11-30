import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { ProposalWithState } from './hooks/useGenerateFlashcards';

export interface ProposalCardProps {
  proposal: ProposalWithState;
  onUpdate: (updates: Partial<ProposalWithState>) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * ProposalCard component - pojedyncza karta propozycji fiszki
 * Obsługuje inline editing, selection, validation i akcje użytkownika
 */
export const ProposalCard: React.FC<ProposalCardProps> = ({
  proposal,
  onUpdate,
  disabled = false,
  className = '',
}) => {
  const [editedFront, setEditedFront] = useState(proposal.editedFront || proposal.front);
  const [editedBack, setEditedBack] = useState(proposal.editedBack || proposal.back);
  const frontInputRef = useRef<HTMLTextAreaElement>(null);
  const backInputRef = useRef<HTMLTextAreaElement>(null);

  // Automatyczne fokus na pierwszym polu przy wejściu w tryb edycji
  useEffect(() => {
    if (proposal.isEditing && frontInputRef.current) {
      frontInputRef.current.focus();
    }
  }, [proposal.isEditing]);

  // Walidacja podczas edycji
  const frontValid = editedFront.trim().length > 0 && editedFront.trim().length <= 200;
  const backValid = editedBack.trim().length > 0 && editedBack.trim().length <= 500;
  const isValid = frontValid && backValid;

  // Toggle selection
  const handleToggleSelection = useCallback((checked: boolean | string) => {
    if (!disabled) {
      onUpdate({ isSelected: checked === true });
    }
  }, [disabled, onUpdate]);

  // Enter edit mode
  const handleEdit = useCallback(() => {
    if (!disabled) {
      setEditedFront(proposal.editedFront || proposal.front);
      setEditedBack(proposal.editedBack || proposal.back);
      onUpdate({ isEditing: true });
    }
  }, [disabled, proposal.front, proposal.back, proposal.editedFront, proposal.editedBack, onUpdate]);

  // Save changes
  const handleSave = useCallback(() => {
    if (isValid) {
      const hasChanges = editedFront !== proposal.front || editedBack !== proposal.back;
      onUpdate({
        isEditing: false,
        editedFront: hasChanges ? editedFront.trim() : undefined,
        editedBack: hasChanges ? editedBack.trim() : undefined,
        hasValidationErrors: false,
      });
    }
  }, [isValid, editedFront, editedBack, proposal.front, proposal.back, onUpdate]);

  // Cancel editing
  const handleCancel = useCallback(() => {
    setEditedFront(proposal.editedFront || proposal.front);
    setEditedBack(proposal.editedBack || proposal.back);
    onUpdate({ 
      isEditing: false,
      hasValidationErrors: false,
    });
  }, [proposal.front, proposal.back, proposal.editedFront, proposal.editedBack, onUpdate]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.ctrlKey || event.metaKey) {
      if (event.key === 's') {
        event.preventDefault();
        if (proposal.isEditing && isValid) {
          handleSave();
        }
      } else if (event.key === 'Escape') {
        event.preventDefault();
        if (proposal.isEditing) {
          handleCancel();
        }
      }
    }
  }, [proposal.isEditing, isValid, handleSave, handleCancel]);

  const displayFront = proposal.editedFront || proposal.front;
  const displayBack = proposal.editedBack || proposal.back;
  const isEdited = proposal.editedFront !== undefined || proposal.editedBack !== undefined;

  return (
    <div
      className={`
        relative bg-white border rounded-lg p-4 transition-all duration-200
        ${proposal.isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-sm'}
        ${className}
      `}
      onKeyDown={handleKeyDown}
    >
      {/* Selection checkbox */}
      <div className="flex items-start gap-3">
        <div className="flex items-center mt-1">
          <Checkbox
            checked={proposal.isSelected}
            onCheckedChange={handleToggleSelection}
            disabled={disabled}
            aria-label={`Zaznacz propozycję fiszki: ${displayFront.slice(0, 50)}...`}
          />
        </div>

        <div className="flex-1 min-w-0">
          {/* Front side */}
          <div className="mb-4">
            <Label className="block mb-2 text-muted-foreground">
              Przód fiszki
              {isEdited && <span className="text-blue-600 text-xs ml-1">(edytowane)</span>}
            </Label>
            {proposal.isEditing ? (
              <div className="space-y-1">
                <Textarea
                  ref={frontInputRef}
                  value={editedFront}
                  onChange={(e) => setEditedFront(e.target.value)}
                  rows={2}
                  maxLength={200}
                  className={`
                    w-full p-3 text-sm rounded-lg resize-none
                    ${frontValid ? 'border-gray-300' : 'border-destructive focus-visible:ring-destructive'}
                  `}
                  placeholder="Wprowadź tekst dla przodu fiszki..."
                  aria-describedby={`front-char-count-${proposal.id} ${!frontValid ? `front-error-${proposal.id}` : ''}`}
                />
                <div className="flex justify-between items-center">
                  <span
                    id={`front-char-count-${proposal.id}`}
                    className={`text-xs ${editedFront.length > 200 ? 'text-destructive' : 'text-muted-foreground'}`}
                  >
                    {editedFront.length}/200 znaków
                  </span>
                  {!frontValid && (
                    <span
                      id={`front-error-${proposal.id}`}
                      className="text-xs text-destructive"
                      role="alert"
                    >
                      {editedFront.trim().length === 0 ? 'Pole nie może być puste' : 'Maksymalnie 200 znaków'}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-background border border-input rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{displayFront}</p>
              </div>
            )}
          </div>

          {/* Back side */}
          <div className="mb-4">
            <Label className="block mb-2 text-muted-foreground">
              Tył fiszki
            </Label>
            {proposal.isEditing ? (
              <div className="space-y-1">
                <Textarea
                  ref={backInputRef}
                  value={editedBack}
                  onChange={(e) => setEditedBack(e.target.value)}
                  rows={3}
                  maxLength={500}
                  className={`
                    w-full p-3 text-sm rounded-lg resize-none
                    ${backValid ? 'border-gray-300' : 'border-destructive focus-visible:ring-destructive'}
                  `}
                  placeholder="Wprowadź tekst dla tyłu fiszki..."
                  aria-describedby={`back-char-count-${proposal.id} ${!backValid ? `back-error-${proposal.id}` : ''}`}
                />
                <div className="flex justify-between items-center">
                  <span
                    id={`back-char-count-${proposal.id}`}
                    className={`text-xs ${editedBack.length > 500 ? 'text-destructive' : 'text-muted-foreground'}`}
                  >
                    {editedBack.length}/500 znaków
                  </span>
                  {!backValid && (
                    <span
                      id={`back-error-${proposal.id}`}
                      className="text-xs text-destructive"
                      role="alert"
                    >
                      {editedBack.trim().length === 0 ? 'Pole nie może być puste' : 'Maksymalnie 500 znaków'}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-background border border-input rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{displayBack}</p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2">
            {proposal.isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={disabled}
                  className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground border border-input rounded-md hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Anuluj
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={disabled || !isValid}
                  className="px-3 py-1.5 text-sm text-primary-foreground bg-green-600 hover:bg-green-700 disabled:bg-muted disabled:cursor-not-allowed rounded-md transition-colors"
                  title={!isValid ? 'Popraw błędy walidacji przed zapisaniem' : 'Zapisz zmiany (Ctrl+S)'}
                >
                  Zapisz
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleEdit}
                disabled={disabled}
                className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 border border-blue-300 rounded-md hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Edytuj
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Screen reader announcements */}
      <div className="sr-only" aria-live="polite">
        {proposal.isEditing && 'Tryb edycji aktywny'}
        {!isValid && proposal.isEditing && 'Propozycja zawiera błędy walidacji'}
      </div>
    </div>
  );
};
