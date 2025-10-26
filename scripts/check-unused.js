#!/usr/bin/env node
/**
 * Finde ungenutzte Dependencies
 * 
 * Prüft ob Packages importiert werden im Code
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function getPackageJson() {
  const pkgPath = path.join(__dirname, '..', 'basketball-app', 'package.json');
  return JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
}

function searchInCode(packageName) {
  const srcPath = path.join(__dirname, '..', 'basketball-app', 'src');
  
  try {
    // Suche nach verschiedenen Import-Patterns
    const patterns = [
      `from '${packageName}'`,
      `from "${packageName}"`,
      `require('${packageName}')`,
      `require("${packageName}")`,
      `import('${packageName}')`,
      `import("${packageName}")`,
    ];
    
    for (const pattern of patterns) {
      const result = execSync(
        `grep -r "${pattern}" "${srcPath}" 2>/dev/null || true`,
        { encoding: 'utf8' }
      );
      
      if (result.trim()) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    return false;
  }
}

function checkConfigFiles(packageName) {
  const configFiles = [
    'vite.config.ts',
    'vitest.config.ts',
    'playwright.config.ts',
    'tailwind.config.js',
    'postcss.config.js',
    '.eslintrc.js',
    'tsconfig.json'
  ];
  
  const basePath = path.join(__dirname, '..', 'basketball-app');
  
  for (const file of configFiles) {
    const filePath = path.join(basePath, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes(packageName)) {
        return file;
      }
    }
  }
  
  return null;
}

function analyzePackages() {
  const pkg = getPackageJson();
  const dependencies = pkg.dependencies || {};
  const devDependencies = pkg.devDependencies || {};
  
  log('\n🔍 Analysiere Dependencies...\n', 'blue');
  
  const results = {
    used: [],
    config: [],
    unused: [],
    framework: []
  };
  
  // Framework-Dependencies (immer benötigt)
  const frameworkPackages = [
    'react',
    'react-dom',
    'react-router-dom'
  ];
  
  // Prüfe Dependencies
  log('📦 PRODUCTION DEPENDENCIES\n', 'cyan');
  
  Object.keys(dependencies).forEach(pkgName => {
    if (frameworkPackages.includes(pkgName)) {
      results.framework.push(pkgName);
      log(`   ✅ ${pkgName} (Framework)`, 'green');
      return;
    }
    
    const usedInCode = searchInCode(pkgName);
    const usedInConfig = checkConfigFiles(pkgName);
    
    if (usedInCode) {
      results.used.push(pkgName);
      log(`   ✅ ${pkgName} (genutzt im Code)`, 'green');
    } else if (usedInConfig) {
      results.config.push({ name: pkgName, file: usedInConfig });
      log(`   ⚙️  ${pkgName} (genutzt in ${usedInConfig})`, 'cyan');
    } else {
      results.unused.push(pkgName);
      log(`   ❌ ${pkgName} (möglicherweise ungenutzt!)`, 'red');
    }
  });
  
  // Prüfe DevDependencies
  log('\n🧪 DEV DEPENDENCIES\n', 'cyan');
  
  const knownDevTools = {
    'vite': 'Build-Tool',
    'vitest': 'Test-Runner',
    '@vitest/ui': 'Test-UI',
    'typescript': 'TypeScript Compiler',
    'eslint': 'Linter',
    '@playwright/test': 'E2E Tests',
    'tailwindcss': 'CSS Framework',
    'postcss': 'CSS Processor',
    'autoprefixer': 'CSS Tool',
    'tsx': 'TypeScript Executor',
    'vite-plugin-pwa': 'PWA Plugin',
    'happy-dom': 'Test Environment'
  };
  
  Object.keys(devDependencies).forEach(pkgName => {
    if (knownDevTools[pkgName]) {
      log(`   ✅ ${pkgName} (${knownDevTools[pkgName]})`, 'green');
    } else if (pkgName.startsWith('@types/')) {
      log(`   📘 ${pkgName} (TypeScript Types)`, 'blue');
    } else if (pkgName.startsWith('@testing-library/')) {
      log(`   🧪 ${pkgName} (Testing)`, 'cyan');
    } else if (pkgName.startsWith('@typescript-eslint/')) {
      log(`   🔍 ${pkgName} (ESLint TypeScript)`, 'cyan');
    } else {
      const usedInCode = searchInCode(pkgName);
      const usedInConfig = checkConfigFiles(pkgName);
      
      if (usedInCode) {
        log(`   ✅ ${pkgName} (genutzt im Code)`, 'green');
      } else if (usedInConfig) {
        log(`   ⚙️  ${pkgName} (genutzt in ${usedInConfig})`, 'cyan');
      } else {
        log(`   ⚠️  ${pkgName} (prüfen!)`, 'yellow');
      }
    }
  });
  
  return results;
}

function generateReport(results) {
  log('\n' + '═'.repeat(60), 'blue');
  log('📊 ZUSAMMENFASSUNG', 'blue');
  log('═'.repeat(60) + '\n', 'blue');
  
  if (results.unused.length > 0) {
    log('❌ MÖGLICHERWEISE UNGENUTZT (dependencies):\n', 'red');
    results.unused.forEach(pkg => {
      log(`   ${pkg}`, 'reset');
    });
    log('\n💡 Zum Entfernen:', 'yellow');
    log(`   npm uninstall ${results.unused.join(' ')}\n`, 'reset');
  } else {
    log('✅ Alle dependencies werden genutzt!\n', 'green');
  }
  
  log('📋 EMPFEHLUNGEN:\n', 'cyan');
  log('1. Prüfe ungenutzte Packages manuell (könnte false-positives geben)', 'reset');
  log('2. Importiere Libraries nur wenn wirklich benötigt', 'reset');
  log('3. Nutze tree-shaking (Vite macht das automatisch)', 'reset');
  log('4. Führe regelmäßig aus: npm run check:unused\n', 'reset');
}

// Main
log('╔══════════════════════════════════════════╗', 'blue');
log('║   🔍 Unused Dependencies Check          ║', 'blue');
log('╚══════════════════════════════════════════╝', 'blue');

const results = analyzePackages();
generateReport(results);

log('⚠️  HINWEIS:', 'yellow');
log('   Dieses Script findet nur Import-Statements.', 'reset');
log('   Packages die über Config-Files genutzt werden', 'reset');
log('   könnten als "ungenutzt" markiert sein.\n', 'reset');
