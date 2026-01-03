import { test as base } from '@playwright/test';
import { LoginPage } from '../page-objects/LoginPage';

/**
 * E2E Test User Credentials
 * 
 * Loaded from environment variables set in .env.test
 * These credentials are for the dedicated E2E testing Supabase instance.
 */
export interface TestUser {
  id: string;
  email: string;
  password: string;
}

/**
 * Get E2E test user from environment variables
 * 
 * Requires .env.test to have:
 * - E2E_USERNAME_ID
 * - E2E_USERNAME  
 * - E2E_PASSWORD
 */
export function getTestUser(): TestUser {
  const id = process.env.E2E_USERNAME_ID;
  const email = process.env.E2E_USERNAME;
  const password = process.env.E2E_PASSWORD;

  if (!id || !email || !password) {
    throw new Error(
      'E2E test user credentials not found. ' +
      'Make sure .env.test has E2E_USERNAME_ID, E2E_USERNAME, and E2E_PASSWORD defined.'
    );
  }

  return { id, email, password };
}

/**
 * Extended test fixture with authentication helpers
 */
export const test = base.extend<{
  testUser: TestUser;
  loginPage: LoginPage;
  authenticatedPage: LoginPage;
}>({
  /**
   * Test user credentials from environment
   */
  // eslint-disable-next-line no-empty-pattern
  testUser: async ({}, use) => {
    const user = getTestUser();
    await use(user);
  },

  /**
   * Login page object
   */
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  /**
   * Pre-authenticated page (logs in before test)
   */
  authenticatedPage: async ({ page, testUser }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testUser.email, testUser.password);
    await loginPage.assertLoginSuccess();
    await use(loginPage);
  },
});

export { expect } from '@playwright/test';

