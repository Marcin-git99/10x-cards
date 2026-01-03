import { test, expect } from '../fixtures/auth.fixture';
import { LoginPage } from '../page-objects/LoginPage';
import { urls } from '../fixtures/test-data';

/**
 * Authentication E2E Tests
 * 
 * Tests login page elements, navigation, and protected routes.
 * Uses Page Object pattern for maintainability.
 * Uses auth.fixture for test user credentials from .env.test
 * 
 * Test user is configured in .env.test:
 * - E2E_USERNAME_ID
 * - E2E_USERNAME
 * - E2E_PASSWORD
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

/**
 * E2E-002: Login Flow Tests
 * 
 * Tests actual login functionality using test user from .env.test
 * Covers: TC-002-01, TC-002-02, TC-002-04
 */
test.describe('Login Flow (E2E-002)', () => {
  /**
   * TC-002-01: Successful login
   * User Story: US-002 - Logowanie do aplikacji
   */
  test('TC-002-01: should successfully login with valid credentials', async ({ page, testUser }) => {
    const loginPage = new LoginPage(page);
    
    // Debug: log test user credentials (without password)
    console.log('Test user email:', testUser.email);
    console.log('Test user ID:', testUser.id);
    
    // Arrange
    await loginPage.goto();
    
    // Act - fill form
    await loginPage.fillForm(testUser.email, testUser.password);
    
    // Verify form is filled
    await expect(loginPage.emailInput).toHaveValue(testUser.email);
    console.log('Form filled successfully');
    
    // Act - submit and wait for any API response
    // IMPORTANT: Set up response listener BEFORE clicking
    const [response] = await Promise.all([
      page.waitForResponse(
        (resp) => resp.url().includes('/api/auth/login'),
        { timeout: 15000 }
      ),
      loginPage.submit(),
    ]);
    
    // Check API response
    console.log('Login API response status:', response.status());
    if (!response.ok()) {
      const responseBody = await response.json();
      console.log('Login API error:', JSON.stringify(responseBody));
    }
    
    // Assert - successful login
    expect(response.ok()).toBe(true);
    
    // Assert - user is redirected to generate page
    await page.waitForURL('**/generate', { timeout: 10000 });
    await expect(page).toHaveURL(/generate/);
  });

  /**
   * TC-002-02: Failed login with wrong password
   */
  test('TC-002-02: should show error for invalid credentials', async ({ page, testUser }) => {
    const loginPage = new LoginPage(page);
    
    // Arrange
    await loginPage.goto();
    
    // Act - use correct email but wrong password
    await loginPage.login(testUser.email, 'WrongPassword123!');
    
    // Assert - error message is displayed
    await expect(loginPage.errorMessage).toBeVisible();
    // Should stay on login page
    await expect(page).toHaveURL(/login/);
  });

  /**
   * TC-002-04: Logout
   */
  test('TC-002-04: should successfully logout', async ({ authenticatedPage, page }) => {
    // Arrange - user is already logged in via authenticatedPage fixture
    await expect(page).toHaveURL(/generate/);
    
    // Act - logout
    await authenticatedPage.logout();
    
    // Assert - redirected to home page
    await expect(page).toHaveURL('/');
  });

  /**
   * Access protected route after login
   */
  test('should access protected routes after successful login', async ({ authenticatedPage, page }) => {
    // User is logged in via fixture
    
    // Navigate to flashcards
    await page.goto(urls.flashcards);
    
    // Assert - should stay on flashcards (not redirected to login)
    await expect(page).toHaveURL(/flashcards/);
  });
});
