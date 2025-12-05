import { useState } from 'react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from './ui/dialog';

interface CreateFlashcardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (front: string, back: string) => Promise<void>;
}

const MAX_FRONT_LENGTH = 200;
const MAX_BACK_LENGTH = 500;

export function CreateFlashcardModal({ open, onOpenChange, onCreate }: CreateFlashcardModalProps) {
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setFront('');
    setBack('');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Walidacja
    if (!front.trim()) {
      setError('Przód fiszki nie może być pusty');
      return;
    }
    if (!back.trim()) {
      setError('Tył fiszki nie może być pusty');
      return;
    }
    if (front.length > MAX_FRONT_LENGTH) {
      setError(`Przód fiszki nie może przekraczać ${MAX_FRONT_LENGTH} znaków`);
      return;
    }
    if (back.length > MAX_BACK_LENGTH) {
      setError(`Tył fiszki nie może przekraczać ${MAX_BACK_LENGTH} znaków`);
      return;
    }
    
    setIsSaving(true);
    setError(null);
    
    try {
      await onCreate(front.trim(), back.trim());
      resetForm();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd podczas tworzenia fiszki');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      resetForm();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogClose onClose={handleClose} />
        
        <DialogHeader>
          <DialogTitle>Nowa fiszka</DialogTitle>
          <DialogDescription>
            Utwórz nową fiszkę ręcznie. Maksymalnie {MAX_FRONT_LENGTH} znaków na przód i {MAX_BACK_LENGTH} na tył.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="px-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="create-front">
                Przód (pytanie)
                <span className="ml-2 text-xs text-gray-400">
                  {front.length}/{MAX_FRONT_LENGTH}
                </span>
              </Label>
              <Textarea
                id="create-front"
                value={front}
                onChange={(e) => setFront(e.target.value)}
                placeholder="Wpisz pytanie..."
                rows={3}
                maxLength={MAX_FRONT_LENGTH}
                disabled={isSaving}
                autoFocus
                className={front.length > MAX_FRONT_LENGTH ? 'border-red-500' : ''}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="create-back">
                Tył (odpowiedź)
                <span className="ml-2 text-xs text-gray-400">
                  {back.length}/{MAX_BACK_LENGTH}
                </span>
              </Label>
              <Textarea
                id="create-back"
                value={back}
                onChange={(e) => setBack(e.target.value)}
                placeholder="Wpisz odpowiedź..."
                rows={4}
                maxLength={MAX_BACK_LENGTH}
                disabled={isSaving}
                className={back.length > MAX_BACK_LENGTH ? 'border-red-500' : ''}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSaving}
            >
              Anuluj
            </Button>
            <Button
              type="submit"
              disabled={isSaving || !front.trim() || !back.trim()}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isSaving ? 'Tworzenie...' : 'Utwórz fiszkę'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

