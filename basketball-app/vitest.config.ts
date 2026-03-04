import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    setupFiles: './src/test/setup.ts',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],  // Nur tests/ Verzeichnis
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
