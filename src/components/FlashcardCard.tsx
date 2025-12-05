import { useState } from 'react';
import type { FlashcardDto } from '../types';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

interface FlashcardCardProps {
  flashcard: FlashcardDto;
  onEdit: (flashcard: FlashcardDto) => void;
  onDelete: (flashcard: FlashcardDto) => void;
}

export function FlashcardCard({ flashcard, onEdit, onDelete }: FlashcardCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const sourceLabel = {
    'ai-full': 'AI',
    'ai-edited': 'AI (edytowana)',
    'manual': 'Ręczna'
  }[flashcard.source] || flashcard.source;
  
  const sourceColor = {
    'ai-full': 'bg-emerald-100 text-emerald-700',
    'ai-edited': 'bg-blue-100 text-blue-700',
    'manual': 'bg-gray-100 text-gray-700'
  }[flashcard.source] || 'bg-gray-100 text-gray-700';

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    onDelete(flashcard);
    setShowDeleteConfirm(false);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        {/* Header with source badge and actions */}
        <div className="flex items-start justify-between mb-4">
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${sourceColor}`}>
            {sourceLabel}
          </span>
          
          {!showDeleteConfirm && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(flashcard)}
                className="h-8 w-8 p-0"
                aria-label="Edytuj fiszkę"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteClick}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                aria-label="Usuń fiszkę"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </Button>
            </div>
          )}
        </div>
        
        {/* Delete confirmation */}
        {showDeleteConfirm && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800 mb-3">Czy na pewno chcesz usunąć tę fiszkę?</p>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirmDelete}
              >
                Usuń
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelDelete}
              >
                Anuluj
              </Button>
            </div>
          </div>
        )}
        
        {/* Front (question) */}
        <div className="mb-4">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Przód</span>
          <p className="mt-1 text-gray-900 font-medium">{flashcard.front}</p>
        </div>
        
        {/* Divider */}
        <div className="border-t border-gray-100 my-3" />
        
        {/* Back (answer) */}
        <div>
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Tył</span>
          <p className="mt-1 text-gray-700">{flashcard.back}</p>
        </div>
        
        {/* Footer with date */}
        <div className="mt-4 pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-400">
            {new Date(flashcard.created_at).toLocaleDateString('pl-PL', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

