import { useState, useCallback } from 'react';
import type { FlashcardDto } from '../types';
import { Button } from './ui/button';

interface FlashcardViewerProps {
  flashcards: FlashcardDto[];
}

export function FlashcardViewer({ flashcards }: FlashcardViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  const currentCard = flashcards[currentIndex];
  const totalCards = flashcards.length;
  
  const handleFlip = useCallback(() => {
    setIsFlipped(prev => !prev);
  }, []);
  
  const handlePrevious = useCallback(() => {
    setIsFlipped(false);
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : totalCards - 1));
  }, [totalCards]);
  
  const handleNext = useCallback(() => {
    setIsFlipped(false);
    setCurrentIndex(prev => (prev < totalCards - 1 ? prev + 1 : 0));
  }, [totalCards]);
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case ' ':
      case 'Enter':
        e.preventDefault();
        handleFlip();
        break;
      case 'ArrowLeft':
        handlePrevious();
        break;
      case 'ArrowRight':
        handleNext();
        break;
    }
  }, [handleFlip, handlePrevious, handleNext]);

  if (!currentCard) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">Brak fiszek do wyświetlenia</p>
      </div>
    );
  }

  return (
    <div 
      className="flex flex-col items-center gap-8"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="application"
      aria-label="Przeglądarka fiszek"
    >
      {/* Progress indicator */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600 font-medium">
          Fiszka {currentIndex + 1} z {totalCards}
        </span>
        <div className="flex gap-1">
          {flashcards.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setIsFlipped(false);
                setCurrentIndex(idx);
              }}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentIndex 
                  ? 'bg-emerald-500 w-4' 
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Przejdź do fiszki ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Flashcard with flip effect */}
      <div 
        className="perspective-1000 w-full max-w-2xl cursor-pointer"
        onClick={handleFlip}
        role="button"
        aria-pressed={isFlipped}
        aria-label={isFlipped ? "Kliknij aby zobaczyć pytanie" : "Kliknij aby zobaczyć odpowiedź"}
      >
        <div 
          className={`relative w-full min-h-[320px] transition-transform duration-500 transform-style-3d ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front side - Question */}
          <div 
            className="absolute inset-0 backface-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-8 flex flex-col justify-center items-center text-white shadow-xl"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <span className="text-xs uppercase tracking-wider opacity-75 mb-4">Pytanie</span>
            <p className="text-2xl font-semibold text-center leading-relaxed">
              {currentCard.front}
            </p>
            <span className="mt-6 text-sm opacity-75">
              Kliknij lub naciśnij spację aby zobaczyć odpowiedź
            </span>
          </div>
          
          {/* Back side - Answer */}
          <div 
            className="absolute inset-0 backface-hidden rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 p-8 flex flex-col justify-center items-center text-white shadow-xl"
            style={{ 
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)'
            }}
          >
            <span className="text-xs uppercase tracking-wider opacity-75 mb-4">Odpowiedź</span>
            <p className="text-xl text-center leading-relaxed">
              {currentCard.back}
            </p>
            <span className="mt-6 text-sm opacity-75">
              Kliknij lub naciśnij spację aby wrócić do pytania
            </span>
          </div>
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="lg"
          onClick={handlePrevious}
          className="gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Poprzednia
        </Button>
        
        <Button
          variant="default"
          size="lg"
          onClick={handleFlip}
          className="min-w-[140px] bg-emerald-600 hover:bg-emerald-700"
        >
          {isFlipped ? 'Pokaż pytanie' : 'Pokaż odpowiedź'}
        </Button>
        
        <Button
          variant="outline"
          size="lg"
          onClick={handleNext}
          className="gap-2"
        >
          Następna
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      </div>
      
      {/* Keyboard hint */}
      <p className="text-sm text-gray-500 text-center">
        <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">←</kbd> poprzednia &nbsp;
        <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Spacja</kbd> odwróć &nbsp;
        <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">→</kbd> następna
      </p>
    </div>
  );
}

