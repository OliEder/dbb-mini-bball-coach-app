/**
 * Vitest Setup
 * 
 * Global Test Configuration
 */

import { afterEach, expect } from 'vitest';
import * as jestDomMatchers from '@testing-library/jest-dom/matchers';
import { cleanup } from '@testing-library/react';
import { toHaveNoViolations } from 'jest-axe';

// Extend expect with jest-dom and axe matchers
expect.extend(jestDomMatchers);
expect.extend(toHaveNoViolations);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock IndexedDB for tests
import 'fake-indexeddb/auto';
