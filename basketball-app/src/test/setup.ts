/**
 * Vitest Setup
 * 
 * Global Test Configuration
 */

import '@testing-library/jest-dom';
import { afterEach, expect } from 'vitest';
import { cleanup } from '@testing-library/react';
import { toHaveNoViolations } from 'jest-axe';

// Extend expect with axe matchers
expect.extend(toHaveNoViolations);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock IndexedDB for tests
import 'fake-indexeddb/auto';
