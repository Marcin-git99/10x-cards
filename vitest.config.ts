/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // Environment
    environment: 'jsdom',
    
    // Global test APIs (describe, it, expect, vi)
    globals: true,
    
    // Setup files for reusable configuration
    setupFiles: ['./tests/setup/setup.ts'],
    
    // Test file patterns
    include: [
      'tests/unit/**/*.test.ts',
      'tests/unit/**/*.test.tsx',
      'tests/integration/**/*.test.ts',
      'tests/integration/**/*.test.tsx',
    ],
    
    // Exclude patterns
    exclude: [
      'node_modules',
      'dist',
      'e2e',
      '.astro',
    ],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'tests/',
        'e2e/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/types.ts',
        'src/components/ui/**', // Shadcn components (external)
      ],
    },
    
    // Mock configuration
    mockReset: true,
    restoreMocks: true,
    
    // Reporter
    reporter: ['verbose'],
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
