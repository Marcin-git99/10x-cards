import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Generate Page Object
 * 
 * Encapsulates all interactions with the flashcard generation page.
 * This is the main feature page where users generate AI flashcards.
 */
export class GeneratePage extends BasePage {
  readonly sourceTextArea: Locator;
  readonly charCounter: Locator;
  readonly generateButton: Locator;
  readonly proposalsList: Locator;
  readonly proposalCards: Locator;
  readonly saveButton: Locator;
  readonly selectedCount: Locator;
  readonly loadingIndicator: Locator;
  readonly errorNotification: Locator;

  constructor(page: Page) {
    super(page);
    
    this.sourceTextArea = page.getByRole('textbox', { name: /tekst źródłowy/i });
    this.charCounter = page.getByTestId('char-counter');
    this.generateButton = page.getByRole('button', { name: /generuj/i });
    this.proposalsList = page.locator('#generation-results');
    this.proposalCards = page.getByTestId('proposal-card');
    this.saveButton = page.getByRole('button', { name: /zapisz/i });
    this.selectedCount = page.getByTestId('selected-count');
    this.loadingIndicator = page.getByTestId('loading-indicator');
    this.errorNotification = page.getByTestId('error-notification');
  }

  /**
   * Navigate to generate page
   */
  async goto() {
    await super.goto('/generate');
  }

  /**
   * Enter source text
   */
  async enterSourceText(text: string) {
    await this.sourceTextArea.fill(text);
  }

  /**
   * Click generate button
   */
  async clickGenerate() {
    await this.generateButton.click();
  }

  /**
   * Generate flashcards from text
   */
  async generateFlashcards(text: string) {
    await this.enterSourceText(text);
    await this.clickGenerate();
    await this.waitForProposals();
  }

  /**
   * Wait for proposals to appear
   */
  async waitForProposals() {
    await this.proposalsList.waitFor({ state: 'visible', timeout: 60000 });
  }

  /**
   * Get number of generated proposals
   */
  async getProposalsCount(): Promise<number> {
    return await this.proposalCards.count();
  }

  /**
   * Accept proposal at index
   */
  async acceptProposal(index: number) {
    const card = this.proposalCards.nth(index);
    await card.getByRole('button', { name: /akceptuj/i }).click();
  }

  /**
   * Reject proposal at index
   */
  async rejectProposal(index: number) {
    const card = this.proposalCards.nth(index);
    await card.getByRole('button', { name: /odrzuć/i }).click();
  }

  /**
   * Click save selected flashcards
   */
  async saveFlashcards() {
    await this.saveButton.click();
  }

  /**
   * Assert generate button is disabled
   */
  async assertGenerateButtonDisabled() {
    await expect(this.generateButton).toBeDisabled();
  }

  /**
   * Assert generate button is enabled
   */
  async assertGenerateButtonEnabled() {
    await expect(this.generateButton).toBeEnabled();
  }

  /**
   * Assert character count
   */
  async assertCharCount(expectedCount: number) {
    await expect(this.charCounter).toContainText(expectedCount.toLocaleString('pl-PL'));
  }

  /**
   * Assert proposals count
   */
  async assertProposalsCount(expectedCount: number) {
    await expect(this.proposalCards).toHaveCount(expectedCount);
  }

  /**
   * Generate sample text of specified length
   */
  static generateSampleText(length: number): string {
    const baseText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ';
    const repetitions = Math.ceil(length / baseText.length);
    return baseText.repeat(repetitions).slice(0, length);
  }
}

