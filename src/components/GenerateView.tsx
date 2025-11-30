import React, { useCallback, useEffect } from 'react';
import { TextAreaInput } from './TextAreaInput';
import { GenerateButton } from './GenerateButton';
import { ProposalsList } from './ProposalsList';
import { BulkSaveButton } from './BulkSaveButton';
import { useGenerateFlashcards } from './hooks/useGenerateFlashcards';
import { useTextValidation, canGenerateFromText } from './hooks/useTextValidation';

export interface GenerateViewProps {
  className?: string;
}

/**
 * GenerateView - główny komponent widoku generowania fiszek AI
 * Łączy wszystkie komponenty i zarządza stanem całego przepływu
 */
export const GenerateView: React.FC<GenerateViewProps> = ({
  className = '',
}) => {
  const { state, bulkSelectionState, actions } = useGenerateFlashcards();
  const textValidation = useTextValidation(state.sourceText);

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
  const handleSave = useCallback(async (mode: 'selected' | 'all') => {
    try {
      const savedFlashcards = await actions.saveFlashcards(mode);
      
      // Show success message and optionally redirect
      if (savedFlashcards && savedFlashcards.length > 0) {
        // Could show a toast notification here
        console.log(`Successfully saved ${savedFlashcards.length} flashcards`);
        
        // Optionally redirect to flashcards page after successful save
        // window.location.href = '/flashcards';
      }
    } catch (error) {
      console.error('Save failed:', error);
      // Error is handled by the hook
    }
  }, [actions]);

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
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-red-800 font-medium">Wystąpił błąd</h3>
              <p className="text-red-700 text-sm mt-1">{state.error}</p>
            </div>
            <button
              type="button"
              onClick={actions.clearError}
              className="ml-auto text-red-400 hover:text-red-600 p-1"
              aria-label="Zamknij komunikat o błędzie"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Text Input Section */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="source-text" className="block text-lg font-medium text-gray-900 mb-2">
                Tekst źródłowy
              </label>
              <p className="text-sm text-gray-600 mb-4">
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

      {/* Loading Overlay */}
      {state.isGenerating && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-auto shadow-xl">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Generowanie fiszek...
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Sztuczna inteligencja analizuje Twój tekst i tworzy propozycje fiszek.
              </p>
              <p className="text-xs text-gray-500">
                To może potrwać do 30 sekund
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Generation Results Section */}
      {(state.proposals.length > 0 || state.generationResult) && (
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
                    <span className="text-sm text-gray-600">
                      <span className="font-medium text-gray-900">{bulkSelectionState.selectedCount}</span> z{' '}
                      <span className="font-medium text-gray-900">{state.proposals.length}</span> zaznaczonych
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <BulkSaveButton
                      selectedCount={bulkSelectionState.selectedCount}
                      totalCount={state.proposals.length}
                      onSave={handleSave}
                      loading={state.isSaving}
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
          Generowane fiszki będą zapisane w Twojej kolekcji i dostępne w sekcji "Moje fiszki".
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
