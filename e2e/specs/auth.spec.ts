import { test, expect } from '@playwright/test';
import { LoginPage } from '../page-objects/LoginPage';
import { urls } from '../fixtures/test-data';

/**
 * Authentication E2E Tests
 * 
 * Tests login page elements, navigation, and protected routes.
 * Uses Page Object pattern for maintainability.
 * 
 * Note: Form validation and loading state tests require 
 * specific timing - add them as needed based on app behavior.
 */

test.describe('Login Page', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test.describe('Page Load', () => {
    test('should display login form elements', async () => {
      await expect(loginPage.emailInput).toBeVisible();
      await expect(loginPage.passwordInput).toBeVisible();
      await expect(loginPage.submitButton).toBeVisible();
    });

    test('should have correct page title', async ({ page }) => {
      await expect(page).toHaveTitle(/sign in|login/i);
    });

    test('should display link to signup page', async () => {
      await expect(loginPage.signupLink).toBeVisible();
    });

    test('should display forgot password link', async () => {
      await expect(loginPage.forgotPasswordLink).toBeVisible();
    });
  });

  test.describe('Navigation', () => {
    test('should navigate to signup page when clicking signup link', async ({ page }) => {
      await loginPage.signupLink.click();
      await expect(page).toHaveURL(/signup/);
    });

    test('should navigate to reset password page when clicking forgot password link', async ({ page }) => {
      await loginPage.forgotPasswordLink.click();
      await expect(page).toHaveURL(/reset-password/);
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper input types', async () => {
      await expect(loginPage.emailInput).toHaveAttribute('type', 'email');
      await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
    });

    test('should be keyboard navigable', async ({ page }) => {
      // Focus email input
      await loginPage.emailInput.focus();
      await expect(loginPage.emailInput).toBeFocused();
      
      // Tab to password
      await page.keyboard.press('Tab');
      await expect(loginPage.passwordInput).toBeFocused();
    });

    test('should have accessible labels', async ({ page }) => {
      // Check that inputs have associated labels
      const emailLabel = page.locator('label[for="email"]');
      const passwordLabel = page.locator('label[for="password"]');
      
      await expect(emailLabel).toBeVisible();
      await expect(passwordLabel).toBeVisible();
    });
  });

  test.describe('Form Interaction', () => {
    test('should allow typing in email field', async () => {
      await loginPage.emailInput.fill('test@example.com');
      await expect(loginPage.emailInput).toHaveValue('test@example.com');
    });

    test('should allow typing in password field', async () => {
      await loginPage.passwordInput.fill('password123');
      await expect(loginPage.passwordInput).toHaveValue('password123');
    });

    test('should clear form fields', async () => {
      await loginPage.emailInput.fill('test@example.com');
      await loginPage.passwordInput.fill('password123');
      
      await loginPage.emailInput.clear();
      await loginPage.passwordInput.clear();
      
      await expect(loginPage.emailInput).toHaveValue('');
      await expect(loginPage.passwordInput).toHaveValue('');
    });
  });
});

test.describe('Protected Routes', () => {
  test('should redirect to login when accessing generate page without auth', async ({ page }) => {
    await page.goto(urls.generate);
    await expect(page).toHaveURL(/login/);
  });

  test('should redirect to login when accessing flashcards without auth', async ({ page }) => {
    await page.goto(urls.flashcards);
    await expect(page).toHaveURL(/login/);
  });
});
