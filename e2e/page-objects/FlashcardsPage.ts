import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Flashcards Page Object
 * 
 * Encapsulates all interactions with the "My Flashcards" page.
 * This page requires authentication.
 */
export class FlashcardsPage extends BasePage {
  readonly flashcardsList: Locator;
  readonly flashcardCards: Locator;
  readonly addFlashcardButton: Locator;
  readonly emptyStateMessage: Locator;
  readonly pagination: Locator;
  
  // Create/Edit modal elements
  readonly modal: Locator;
  readonly frontInput: Locator;
  readonly backInput: Locator;
  readonly saveModalButton: Locator;
  readonly cancelModalButton: Locator;
  
  // Delete confirmation dialog
  readonly deleteDialog: Locator;
  readonly confirmDeleteButton: Locator;
  readonly cancelDeleteButton: Locator;

  constructor(page: Page) {
    super(page);
    
    this.flashcardsList = page.locator('[data-testid="flashcards-list"]');
    this.flashcardCards = page.locator('[data-testid="flashcard-card"]');
    this.addFlashcardButton = page.getByRole('button', { name: /dodaj fiszkę/i });
    this.emptyStateMessage = page.locator('[data-testid="empty-state"]');
    this.pagination = page.locator('[data-testid="pagination"]');
    
    // Modal
    this.modal = page.locator('[role="dialog"]');
    this.frontInput = page.getByLabel(/przód/i);
    this.backInput = page.getByLabel(/tył/i);
    this.saveModalButton = page.locator('[role="dialog"]').getByRole('button', { name: /zapisz/i });
    this.cancelModalButton = page.locator('[role="dialog"]').getByRole('button', { name: /anuluj/i });
    
    // Delete dialog
    this.deleteDialog = page.locator('[role="alertdialog"]');
    this.confirmDeleteButton = page.locator('[role="alertdialog"]').getByRole('button', { name: /usuń/i });
    this.cancelDeleteButton = page.locator('[role="alertdialog"]').getByRole('button', { name: /anuluj/i });
  }

  /**
   * Navigate to flashcards page
   */
  async goto() {
    await super.goto('/flashcards');
  }

  /**
   * Get number of flashcards
   */
  async getFlashcardsCount(): Promise<number> {
    return await this.flashcardCards.count();
  }

  /**
   * Click add flashcard button
   */
  async clickAddFlashcard() {
    await this.addFlashcardButton.click();
    await this.modal.waitFor({ state: 'visible' });
  }

  /**
   * Fill flashcard form in modal
   */
  async fillFlashcardForm(front: string, back: string) {
    await this.frontInput.fill(front);
    await this.backInput.fill(back);
  }

  /**
   * Save flashcard from modal
   */
  async saveFlashcard() {
    await this.saveModalButton.click();
    await this.modal.waitFor({ state: 'hidden' });
  }

  /**
   * Create a new flashcard
   */
  async createFlashcard(front: string, back: string) {
    await this.clickAddFlashcard();
    await this.fillFlashcardForm(front, back);
    await this.saveFlashcard();
  }

  /**
   * Click edit button on flashcard at index
   */
  async editFlashcard(index: number) {
    const card = this.flashcardCards.nth(index);
    await card.getByRole('button', { name: /edytuj/i }).click();
    await this.modal.waitFor({ state: 'visible' });
  }

  /**
   * Click delete button on flashcard at index
   */
  async deleteFlashcard(index: number) {
    const card = this.flashcardCards.nth(index);
    await card.getByRole('button', { name: /usuń/i }).click();
    await this.deleteDialog.waitFor({ state: 'visible' });
  }

  /**
   * Confirm deletion
   */
  async confirmDelete() {
    await this.confirmDeleteButton.click();
    await this.deleteDialog.waitFor({ state: 'hidden' });
  }

  /**
   * Cancel deletion
   */
  async cancelDelete() {
    await this.cancelDeleteButton.click();
    await this.deleteDialog.waitFor({ state: 'hidden' });
  }

  /**
   * Assert flashcards count
   */
  async assertFlashcardsCount(expectedCount: number) {
    await expect(this.flashcardCards).toHaveCount(expectedCount);
  }

  /**
   * Assert empty state is displayed
   */
  async assertEmptyState() {
    await expect(this.emptyStateMessage).toBeVisible();
  }
}

