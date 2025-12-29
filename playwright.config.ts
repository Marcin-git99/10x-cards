import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for E2E tests
 * @see https://playwright.dev/docs/test-configuration
 * 
 * Guidelines:
 * - Only Chromium/Desktop Chrome browser (as per project rules)
 * - Page Object Model for maintainable tests
 * - Locators for resilient element selection
 * - Browser contexts for isolating test environments
 */
export default defineConfig({
  // Test directory
  testDir: './e2e',
  
  // Test file pattern
  testMatch: '**/*.spec.ts',
  
  // Run tests in parallel
  fullyParallel: true,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Limit workers on CI for stability
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/e2e-results.json' }],
    ['list'],
  ],
  
  // Shared settings for all projects
  use: {
    // Base URL for navigation
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:4321',
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Video on failure (useful for debugging)
    video: 'on-first-retry',
    
    // Default timeout for actions
    actionTimeout: 10000,
    
    // Default timeout for navigation
    navigationTimeout: 30000,
  },
  
  // Projects - only Chromium as per guidelines
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Viewport
        viewport: { width: 1280, height: 720 },
      },
    },
  ],
  
  // Global timeout for each test
  timeout: 30000,
  
  // Expect timeout
  expect: {
    timeout: 5000,
    // Visual comparison settings
    toHaveScreenshot: {
      maxDiffPixels: 100,
    },
  },
  
  // Output directory for test artifacts
  outputDir: 'test-results/e2e-artifacts',
  
  // Web server configuration
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});

