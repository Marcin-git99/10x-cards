import { useReducer, useCallback } from 'react';
import type {
  FlashcardProposalDto,
  GenerationCreateResponseDto,
  GenerateFlashcardsCommand,
  FlashcardsCreateCommand,
  FlashcardDto,
} from '../../types';
import { 
  generateFlashcardsApi, 
  saveFlashcardsApi, 
  getErrorMessage 
} from '../../lib/services/flashcards.client';

// Extended types for the generate view state management
export interface ProposalWithState extends FlashcardProposalDto {
  id: string; // lokalny ID dla React keys
  isSelected: boolean;
  isEditing: boolean;
  editedFront?: string;
  editedBack?: string;
  hasValidationErrors?: boolean;
}

export interface GenerateViewState {
  sourceText: string;
  isGenerating: boolean;
  generationResult: GenerationCreateResponseDto | null;
  proposals: ProposalWithState[];
  error: string | null;
  isSaving: boolean;
}

export interface BulkSelectionState {
  allSelected: boolean;
  selectedCount: number;
  indeterminate: boolean; // dla checkbox w stanie mixed
}

export type SaveMode = 'selected' | 'all' | 'custom';
export type FilterMode = 'all' | 'selected' | 'unselected' | 'edited' | 'original';
export type SelectionMode = 'all' | 'none' | 'invert' | 'edited' | 'valid';

export interface SaveProgress {
  current: number;
  total: number;
  status: 'preparing' | 'saving' | 'completed' | 'error';
  message?: string;
}

export interface SaveOptions {
  saveType: SaveMode;
  proposals: ProposalWithState[];
  batchSize?: number;
  skipValidation?: boolean;
  customTags?: string[];
}

// Action types for the reducer
type GenerateAction =
  | { type: 'SET_SOURCE_TEXT'; payload: string }
  | { type: 'GENERATE_START' }
  | { type: 'GENERATE_SUCCESS'; payload: GenerationCreateResponseDto }
  | { type: 'GENERATE_ERROR'; payload: string }
  | { type: 'TOGGLE_PROPOSAL_SELECTION'; payload: string }
  | { type: 'BULK_SELECT'; payload: SelectionMode }
  | { type: 'UPDATE_PROPOSAL'; payload: { id: string; updates: Partial<ProposalWithState> } }
  | { type: 'SAVE_START' }
  | { type: 'SAVE_SUCCESS' }
  | { type: 'SAVE_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESET_STATE' };

// Initial state
const initialState: GenerateViewState = {
  sourceText: '',
  isGenerating: false,
  generationResult: null,
  proposals: [],
  error: null,
  isSaving: false,
};

// Helper function to generate unique IDs for proposals
const generateProposalId = (): string => {
  return `proposal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Helper function to convert API proposals to ProposalWithState
const mapProposalsToState = (proposals: FlashcardProposalDto[]): ProposalWithState[] => {
  return proposals.map((proposal) => ({
    ...proposal,
    id: generateProposalId(),
    isSelected: true, // by default, all proposals are selected
    isEditing: false,
    editedFront: undefined,
    editedBack: undefined,
    hasValidationErrors: false,
  }));
};

// Helper function to validate proposal content
const validateProposal = (proposal: ProposalWithState): boolean => {
  const frontText = proposal.editedFront || proposal.front;
  const backText = proposal.editedBack || proposal.back;
  
  return frontText.length > 0 && frontText.length <= 200 &&
         backText.length > 0 && backText.length <= 500;
};

// Reducer function
const generateReducer = (state: GenerateViewState, action: GenerateAction): GenerateViewState => {
  switch (action.type) {
    case 'SET_SOURCE_TEXT':
      return {
        ...state,
        sourceText: action.payload,
        // Clear previous generation if text changes significantly
        ...(state.generationResult && action.payload !== state.sourceText 
          ? { generationResult: null, proposals: [] } 
          : {}),
      };

    case 'GENERATE_START':
      return {
        ...state,
        isGenerating: true,
        error: null,
        generationResult: null,
        proposals: [],
      };

    case 'GENERATE_SUCCESS':
      return {
        ...state,
        isGenerating: false,
        generationResult: action.payload,
        proposals: mapProposalsToState(action.payload.flashcards_proposals),
        error: null,
      };

    case 'GENERATE_ERROR':
      return {
        ...state,
        isGenerating: false,
        error: action.payload,
        generationResult: null,
        proposals: [],
      };

    case 'TOGGLE_PROPOSAL_SELECTION':
      return {
        ...state,
        proposals: state.proposals.map((proposal) =>
          proposal.id === action.payload
            ? { ...proposal, isSelected: !proposal.isSelected }
            : proposal
        ),
      };

    case 'BULK_SELECT':
      return {
        ...state,
        proposals: state.proposals.map((proposal) => {
          switch (action.payload) {
            case 'all':
              return { ...proposal, isSelected: true };
            case 'none':
              return { ...proposal, isSelected: false };
            case 'invert':
              return { ...proposal, isSelected: !proposal.isSelected };
            case 'edited':
              return { 
                ...proposal, 
                isSelected: proposal.editedFront !== undefined || proposal.editedBack !== undefined 
              };
            case 'valid':
              return { ...proposal, isSelected: validateProposal(proposal) };
            default:
              return proposal;
          }
        }),
      };

    case 'UPDATE_PROPOSAL':
      return {
        ...state,
        proposals: state.proposals.map((proposal) =>
          proposal.id === action.payload.id
            ? {
                ...proposal,
                ...action.payload.updates,
                // Update validation status if content changed
                hasValidationErrors: action.payload.updates.editedFront !== undefined || 
                                   action.payload.updates.editedBack !== undefined
                  ? !validateProposal({ ...proposal, ...action.payload.updates })
                  : proposal.hasValidationErrors,
              }
            : proposal
        ),
      };

    case 'SAVE_START':
      return {
        ...state,
        isSaving: true,
        error: null,
      };

    case 'SAVE_SUCCESS':
      return {
        ...state,
        isSaving: false,
        // Mark saved proposals as no longer selected
        proposals: state.proposals.map((proposal) => ({
          ...proposal,
          isSelected: false,
        })),
      };

    case 'SAVE_ERROR':
      return {
        ...state,
        isSaving: false,
        error: action.payload,
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    case 'RESET_STATE':
      return initialState;

    default:
      return state;
  }
};

/**
 * Main custom hook for managing flashcard generation state
 * Provides all necessary actions and state for the generate view
 */
export const useGenerateFlashcards = () => {
  const [state, dispatch] = useReducer(generateReducer, initialState);

  // API call to generate flashcards
  const generateFlashcards = useCallback(async (sourceText: string) => {
    dispatch({ type: 'GENERATE_START' });

    try {
      const result = await generateFlashcardsApi(sourceText);
      dispatch({ type: 'GENERATE_SUCCESS', payload: result });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      dispatch({ type: 'GENERATE_ERROR', payload: errorMessage });
    }
  }, []);

  // Toggle selection of individual proposal
  const toggleProposalSelection = useCallback((id: string) => {
    dispatch({ type: 'TOGGLE_PROPOSAL_SELECTION', payload: id });
  }, []);

  // Bulk selection operations
  const bulkToggleSelection = useCallback((mode: SelectionMode) => {
    dispatch({ type: 'BULK_SELECT', payload: mode });
  }, []);

  // Update proposal content or state
  const updateProposal = useCallback((id: string, updates: Partial<ProposalWithState>) => {
    dispatch({ type: 'UPDATE_PROPOSAL', payload: { id, updates } });
  }, []);

  // Save flashcards to API
  const saveFlashcards = useCallback(async (mode: SaveMode, options?: SaveOptions) => {
    dispatch({ type: 'SAVE_START' });

    try {
      let proposalsToSave: ProposalWithState[];
      
      switch (mode) {
        case 'selected':
          proposalsToSave = state.proposals.filter(p => p.isSelected);
          break;
        case 'all':
          proposalsToSave = state.proposals;
          break;
        case 'custom':
          proposalsToSave = options?.proposals || [];
          break;
        default:
          throw new Error('Invalid save mode');
      }

      // Validate proposals before saving
      const invalidProposals = proposalsToSave.filter(p => !validateProposal(p));
      if (invalidProposals.length > 0 && !options?.skipValidation) {
        throw new Error(`${invalidProposals.length} propozycji zawiera błędy walidacji`);
      }

      // Convert proposals to flashcard create DTOs
      const flashcardsToCreate = proposalsToSave.map(proposal => ({
        front: proposal.editedFront || proposal.front,
        back: proposal.editedBack || proposal.back,
        source: (proposal.editedFront || proposal.editedBack) ? 'ai-edited' as const : 'ai-full' as const,
        generation_id: state.generationResult?.generation_id || null,
      }));

      const command: FlashcardsCreateCommand = { flashcards: flashcardsToCreate };
      const result = await saveFlashcardsApi(command);
      dispatch({ type: 'SAVE_SUCCESS' });
      
      return result.flashcards;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      dispatch({ type: 'SAVE_ERROR', payload: errorMessage });
      throw error;
    }
  }, [state.proposals, state.generationResult]);

  // Set source text
  const setSourceText = useCallback((text: string) => {
    dispatch({ type: 'SET_SOURCE_TEXT', payload: text });
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // Reset all state
  const resetState = useCallback(() => {
    dispatch({ type: 'RESET_STATE' });
  }, []);

  // Computed values for bulk selection state
  const bulkSelectionState: BulkSelectionState = {
    selectedCount: state.proposals.filter(p => p.isSelected).length,
    allSelected: state.proposals.length > 0 && state.proposals.every(p => p.isSelected),
    indeterminate: state.proposals.some(p => p.isSelected) && !state.proposals.every(p => p.isSelected),
  };

  return {
    // State
    state,
    bulkSelectionState,
    
    // Actions
    actions: {
      generateFlashcards,
      toggleProposalSelection,
      bulkToggleSelection,
      updateProposal,
      saveFlashcards,
      setSourceText,
      clearError,
      resetState,
    },
  };
};
