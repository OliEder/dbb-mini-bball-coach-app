#!/usr/bin/env node
/**
 * Hole die tatsächlich neuesten stabilen Versionen von npm
 */

const { execSync } = require('child_process');

const packages = {
  'happy-dom': 'devDependencies',
  'vite': 'devDependencies', 
  'vitest': 'devDependencies',
  '@vitest/ui': 'devDependencies',
  'vite-plugin-pwa': 'devDependencies'
};

console.log('🔍 Hole neueste stabile Versionen von npm...\n');

const versions = {};

Object.keys(packages).forEach(pkg => {
  try {
    const version = execSync(`npm view ${pkg} version`, { encoding: 'utf8' }).trim();
    versions[pkg] = version;
    console.log(`✅ ${pkg}: ${version}`);
  } catch (error) {
    console.log(`❌ ${pkg}: Fehler beim Abrufen`);
  }
});

console.log('\n📋 Für package.json:');
console.log('\n"devDependencies": {');
Object.entries(versions).forEach(([pkg, version]) => {
  console.log(`  "${pkg}": "^${version}",`);
});
console.log('}');
