/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: './src/test/setup.ts',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx', 'src/**/*.test.ts', 'src/**/*.test.tsx'],  // Tests in tests/ UND src/
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.pact.test.ts',  // PACT-Tests separat
        '**/*.config.*',
      ],
    },
    exclude: [
      'node_modules',
      '**/dist/**',
      '**/*.config.*',
      'e2e/**',  // E2E Tests werden von Playwright ausgeführt
      '**/zu-loeschen/**',  // Archivierte Tests
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@domains': path.resolve(__dirname, './src/domains'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@features': path.resolve(__dirname, './src/features'),
      '@test': path.resolve(__dirname, './src/test'),
    },
  },
});
