/**
 * Vitest Setup
 * 
 * Global Test Configuration
 */

import '@testing-library/jest-dom';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock IndexedDB for tests
import 'fake-indexeddb/auto';
