#!/usr/bin/env node
/**
 * Check workbox versions
 */

const { execSync } = require('child_process');

const packages = [
  'workbox-build',
  'workbox-core',
  'workbox-precaching',
  'workbox-routing',
  'workbox-strategies',
  'workbox-cacheable-response',
  'workbox-expiration',
  'vite-plugin-pwa'
];

console.log('🔍 Prüfe Workbox & PWA Versionen...\n');

packages.forEach(pkg => {
  try {
    const current = execSync(`npm list ${pkg} --depth=0 --json`, { 
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    });
    const parsed = JSON.parse(current);
    const version = parsed.dependencies?.[pkg]?.version || 'nicht installiert';
    
    const latest = execSync(`npm view ${pkg} version`, { 
      encoding: 'utf8' 
    }).trim();
    
    console.log(`${pkg}:`);
    console.log(`  Aktuell: ${version}`);
    console.log(`  Latest:  ${latest}`);
    console.log('');
  } catch (error) {
    console.log(`${pkg}: Fehler`);
  }
});
