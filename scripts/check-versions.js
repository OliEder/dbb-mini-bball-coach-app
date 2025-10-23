#!/usr/bin/env node
/**
 * Quick check: Welche Versionen sind verfügbar?
 */

const { execSync } = require('child_process');

const packages = [
  'happy-dom',
  'vite',
  'vitest',
  '@vitest/ui',
  'vite-plugin-pwa'
];

console.log('🔍 Prüfe verfügbare Versionen...\n');

packages.forEach(pkg => {
  try {
    const latest = execSync(`npm view ${pkg} version`, { encoding: 'utf8' }).trim();
    console.log(`${pkg}: ${latest}`);
  } catch (error) {
    console.log(`${pkg}: ERROR`);
  }
});
