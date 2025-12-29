import js from '@eslint/js';
import typescript from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import astro from 'eslint-plugin-astro';
import prettier from 'eslint-config-prettier';

/** @type {import('eslint').Linter.Config[]} */
export default [
  // Bazowa konfiguracja JavaScript
  js.configs.recommended,

  // TypeScript
  ...typescript.configs.recommended,

  // React
  {
    files: ['**/*.{jsx,tsx}'],
    plugins: {
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off', // React 17+ nie wymaga importu React
      'react/prop-types': 'off', // Używamy TypeScript
    },
  },

  // Astro
  ...astro.configs.recommended,

  // Prettier (wyłącza reguły konfliktujące z Prettier)
  prettier,

  // Globalne ustawienia
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      // TypeScript
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      
      // Ogólne
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },

  // Ignorowane pliki i katalogi
  {
    ignores: [
      'node_modules/',
      'dist/',
      '.astro/',
      'coverage/',
      'playwright-report/',
      'test-results/',
      '*.config.js',
      '*.config.ts',
    ],
  },
];

