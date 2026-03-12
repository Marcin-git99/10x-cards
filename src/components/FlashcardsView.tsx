import { useState, useCallback } from 'react';
import { useFlashcards } from './hooks/useFlashcards';
import { FlashcardCard } from './FlashcardCard';
import { EditFlashcardModal } from './EditFlashcardModal';
import { CreateFlashcardModal } from './CreateFlashcardModal';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';
import type { FlashcardDto } from '../types';

export function FlashcardsView() {
  const { flashcards, pagination, isLoading, error, refetch, goToPage } = useFlashcards(1, 20);
  
  const [editingFlashcard, setEditingFlashcard] = useState<FlashcardDto | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const handleEdit = useCallback((flashcard: FlashcardDto) => {
    setEditingFlashcard(flashcard);
    setIsEditModalOpen(true);
  }, []);
  
  const handleDelete = useCallback(async (flashcard: FlashcardDto) => {
    try {
      const response = await fetch(`/api/flashcards/${flashcard.id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Błąd podczas usuwania fiszki');
      }
      
      await refetch();
    } catch (err) {
      console.error('Błąd usuwania:', err);
      alert(err instanceof Error ? err.message : 'Wystąpił błąd podczas usuwania fiszki');
    }
  }, [refetch]);
  
  const handleSaveEdit = useCallback(async (id: number, front: string, back: string) => {
    const response = await fetch(`/api/flashcards/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ front, back })
    });
    
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || 'Błąd podczas zapisywania fiszki');
    }
    
    await refetch();
  }, [refetch]);
  
  const handleCreate = useCallback(async (front: string, back: string) => {
    const response = await fetch('/api/flashcards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        flashcards: [{
          front,
          back,
          source: 'manual',
          generation_id: null
        }]
      })
    });
    
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || 'Błąd podczas tworzenia fiszki');
    }
    
    await refetch();
  }, [refetch]);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-center">
          <svg className="w-12 h-12 text-destructive mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="text-lg font-semibold text-destructive mb-2">Wystąpił błąd</h3>
          <p className="text-destructive/80 mb-4">{error}</p>
          <Button onClick={refetch} variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10">
            Spróbuj ponownie
          </Button>
        </div>
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div className="max-w-6xl mx-auto">
        <div data-testid="empty-state" className="bg-muted border border-border rounded-lg p-12 text-center">
          <svg className="w-16 h-16 text-muted-foreground mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="text-xl font-semibold text-foreground mb-2">Brak fiszek</h3>
          <p className="text-muted-foreground mb-6">
            Nie masz jeszcze żadnych zapisanych fiszek. Wygeneruj fiszki z tekstu lub utwórz je ręcznie!
          </p>
          <div className="flex justify-center gap-4">
            <Button 
              onClick={() => setIsCreateModalOpen(true)}
              variant="outline"
              className="gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Utwórz ręcznie
            </Button>
            <Button 
              onClick={() => window.location.href = '/generate'}
              className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Generuj z AI
            </Button>
          </div>
        </div>
        
        <CreateFlashcardModal
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
          onCreate={handleCreate}
        />
      </div>
    );
  }

  const totalPages = pagination ? Math.ceil(pagination.total / pagination.limit) : 1;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <p className="text-muted-foreground">
            Łącznie <span className="font-semibold text-foreground">{pagination?.total || flashcards.length}</span> fiszek
          </p>
        </div>
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Dodaj fiszkę
        </Button>
      </div>
      
      <div data-testid="flashcards-list" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {flashcards.map((flashcard) => (
          <FlashcardCard
            key={flashcard.id}
            flashcard={flashcard}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>
      
      {pagination && totalPages > 1 && (
        <div data-testid="pagination" className="mt-8 flex justify-center items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(pagination.page - 1)}
            disabled={pagination.page <= 1}
          >
            Poprzednie
          </Button>
          <span className="text-sm text-muted-foreground px-4">
            Strona {pagination.page} z {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(pagination.page + 1)}
            disabled={pagination.page >= totalPages}
          >
            Następne
          </Button>
        </div>
      )}
      
      <EditFlashcardModal
        flashcard={editingFlashcard}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onSave={handleSaveEdit}
      />
      
      <CreateFlashcardModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onCreate={handleCreate}
      />
    </div>
  );
}
