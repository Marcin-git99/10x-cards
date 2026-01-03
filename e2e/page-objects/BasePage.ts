import { Page, Locator } from '@playwright/test';

/**
 * Base Page Object class
 * 
 * Provides common functionality for all page objects:
 * - Navigation
 * - Common elements (header, footer)
 * - Utility methods
 * 
 * Guidelines:
 * - Use locators for resilient element selection
 * - Implement reusable methods for common actions
 */
export class BasePage {
  readonly page: Page;
  
  // Common elements
  readonly header: Locator;
  readonly topbar: Locator;
  readonly loginButton: Locator;
  readonly logoutButton: Locator;
  readonly userAvatar: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Header elements
    this.header = page.locator('header');
    this.topbar = page.getByTestId('topbar');
    this.loginButton = page.getByRole('link', { name: /zaloguj/i });
    this.logoutButton = page.getByRole('button', { name: /wyloguj/i });
    this.userAvatar = page.getByTestId('user-avatar');
  }

  /**
   * Navigate to a path
   */
  async goto(path: string = '/') {
    await this.page.goto(path);
  }

  /**
   * Wait for page to be fully loaded
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Check if user is logged in
   */
  async isLoggedIn(): Promise<boolean> {
    try {
      await this.userAvatar.waitFor({ timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Click logout and wait for redirect
   */
  async logout() {
    await this.logoutButton.click();
    await this.page.waitForURL('/');
  }

  /**
   * Get current URL path
   */
  getCurrentPath(): string {
    return new URL(this.page.url()).pathname;
  }
}

