import React, { useCallback, useEffect } from 'react';
import { Label } from "@/components/ui/label";
import { TextAreaInput } from './TextAreaInput';
import { GenerateButton } from './GenerateButton';
import { ProposalsList } from './ProposalsList';
import { BulkSaveButton } from './BulkSaveButton';
import { SkeletonLoader } from './SkeletonLoader';
import { ErrorNotification } from './ErrorNotification';
import { useGenerateFlashcards } from './hooks/useGenerateFlashcards';
import { useTextValidation, canGenerateFromText } from './hooks/useTextValidation';
import { useSaveProgress } from './hooks/useSaveProgress';

export interface User {
  id: string;
  email: string;
}

export interface GenerateViewProps {
  className?: string;
  user?: User | null;
}

/**
 * GenerateView - główny komponent widoku generowania fiszek AI
 * Łączy wszystkie komponenty i zarządza stanem całego przepływu
 */
export const GenerateView: React.FC<GenerateViewProps> = ({
  className = '',
  user = null,
}) => {
  const isAuthenticated = !!user;
  const { state, bulkSelectionState, actions } = useGenerateFlashcards();
  const textValidation = useTextValidation(state.sourceText);
  const { progress, startSave, updateProgress, completeSave, failSave, resetProgress } = useSaveProgress();

  // Auto-scroll to results after generation
  useEffect(() => {
    if (state.proposals.length > 0) {
      const resultsSection = document.getElementById('generation-results');
      if (resultsSection) {
        resultsSection.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }
  }, [state.proposals.length]);

  // Handle text input change
  const handleTextChange = useCallback((text: string) => {
    actions.setSourceText(text);
  }, [actions]);

  // Handle generate button click
  const handleGenerate = useCallback(async () => {
    if (!textValidation.isValid || state.isGenerating) return;
    
    try {
      await actions.generateFlashcards(state.sourceText);
    } catch (error) {
      console.error('Generation failed:', error);
      // Error is handled by the hook
    }
  }, [textValidation.isValid, state.isGenerating, state.sourceText, actions]);

  // Handle saving flashcards
  const handleSave = useCallback(async (mode: 'selected' | 'all' | 'custom') => {
    // Check if user is authenticated (US-004)
    if (!isAuthenticated) {
      // Redirect to login page with return URL
      window.location.href = '/auth/login';
      return;
    }

    try {
      // Determine total count for progress
      const totalToSave = mode === 'selected' 
        ? bulkSelectionState.selectedCount 
        : state.proposals.length;
      
      startSave(totalToSave);
      
      // Simulate progress updates if needed, or just rely on the API call duration
      // For now, we just wait for the API call
      
      const savedFlashcards = await actions.saveFlashcards(mode);
      
      completeSave();
      
      // Show success message and optionally redirect
      if (savedFlashcards && savedFlashcards.length > 0) {
        // Could show a toast notification here
        console.log(`Successfully saved ${savedFlashcards.length} flashcards`);
        
        // Reset progress after a delay
        setTimeout(() => {
          resetProgress();
          // Optionally redirect to flashcards page after successful save
          window.location.href = '/flashcards';
        }, 1500);
      }
    } catch (error) {
      console.error('Save failed:', error);
      failSave(error instanceof Error ? error.message : 'Błąd zapisu');
      // Error is also handled by the hook
    }
  }, [actions, bulkSelectionState.selectedCount, state.proposals.length, startSave, completeSave, failSave, resetProgress, isAuthenticated]);

  // Determine button disabled state and reason
  const generateDisabled = !textValidation.isValid || state.isGenerating;
  const getDisabledReason = () => {
    if (state.isGenerating) return 'Trwa generowanie...';
    if (textValidation.errorMessage) return textValidation.errorMessage;
    if (!canGenerateFromText(state.sourceText)) return 'Wprowadź tekst o długości 1000-10000 znaków';
    return undefined;
  };

  return (
    <div className={`max-w-4xl mx-auto space-y-8 ${className}`}>
      {/* Error display */}
      {state.error && (
        <ErrorNotification
          message={state.error}
          onDismiss={actions.clearError}
        />
      )}

      {/* Text Input Section */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="source-text" className="block text-lg font-medium mb-2">
                Tekst źródłowy
              </Label>
              <p className="text-sm text-muted-foreground mb-4">
                Wklej tutaj materiał do nauki. Tekst musi zawierać od 1000 do 10000 znaków.
              </p>
            </div>
            
            <TextAreaInput
              value={state.sourceText}
              onChange={handleTextChange}
              disabled={state.isGenerating}
              placeholder="Wklej tutaj swój tekst do nauki..."
              rows={12}
            />
            
            <div className="flex justify-end pt-4">
              <GenerateButton
                onClick={handleGenerate}
                loading={state.isGenerating}
                disabled={generateDisabled}
                disabledReason={getDisabledReason()}
                size="md"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Loading State */}
      {state.isGenerating && (
        <section className="space-y-4">
          <div className="flex items-center justify-center py-4">
            <span className="text-sm text-muted-foreground animate-pulse">
              Sztuczna inteligencja analizuje Twój tekst i tworzy propozycje fiszek...
            </span>
          </div>
          <SkeletonLoader count={3} />
        </section>
      )}

      {/* Generation Results Section */}
      {(state.proposals.length > 0 || state.generationResult) && !state.isGenerating && (
        <section id="generation-results" className="scroll-mt-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Results Header */}
            <div className="border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Propozycje fiszek
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Przejrzyj propozycje wygenerowane przez AI. Możesz je edytować przed zapisaniem.
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-500">
                    {state.generationResult && (
                      <span className="text-green-600 font-medium">
                        Wygenerowano {state.generationResult.generated_count} fiszek
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Bulk Actions Bar */}
            {state.proposals.length > 0 && (
              <div className="border-b border-gray-200 p-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span data-testid="selected-count" className="text-sm text-gray-600">
                      <span className="font-medium text-gray-900">{bulkSelectionState.selectedCount}</span> z{' '}
                      <span className="font-medium text-gray-900">{state.proposals.length}</span> zaznaczonych
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    {!isAuthenticated && (
                      <span className="text-sm text-amber-600">
                        <a href="/auth/login" className="underline hover:text-amber-700">Zaloguj się</a>, aby zapisać fiszki
                      </span>
                    )}
                    <BulkSaveButton
                      selectedCount={bulkSelectionState.selectedCount}
                      totalCount={state.proposals.length}
                      onSave={handleSave}
                      loading={state.isSaving}
                      progress={progress}
                      disabled={state.isSaving}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Proposals List */}
            <div className="p-6">
              <ProposalsList
                proposals={state.proposals}
                bulkSelectionState={bulkSelectionState}
                onBulkSelect={actions.bulkToggleSelection}
                onProposalUpdate={actions.updateProposal}
                disabled={state.isSaving}
              />
            </div>
          </div>
        </section>
      )}

      {/* Help Section */}
      <section className="text-center text-sm text-gray-500">
        <p className="mb-2">
          💡 <strong>Wskazówka:</strong> Dla najlepszych rezultatów, wprowadź tekst zawierający jasno zdefiniowane pojęcia,
          definicje, lub informacje które można przekształcić w pytania i odpowiedzi.
        </p>
        <p>
          Generowane fiszki będą zapisane w Twojej kolekcji i dostępne w sekcji &quot;Moje fiszki&quot;.
        </p>
      </section>

      {/* Screen reader announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {state.isGenerating && 'Trwa generowanie propozycji fiszek'}
        {state.proposals.length > 0 && !state.isGenerating && `Wygenerowano ${state.proposals.length} propozycji fiszek`}
        {state.isSaving && 'Trwa zapisywanie fiszek'}
      </div>
    </div>
  );
};
