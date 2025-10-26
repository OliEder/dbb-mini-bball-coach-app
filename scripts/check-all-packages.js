#!/usr/bin/env node
/**
 * Prüfe ALLE Packages gegen npm Registry
 * Zeigt aktuelle vs. neueste Versionen
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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

function getLatestVersion(packageName) {
  try {
    const version = execSync(`npm view ${packageName} version`, { 
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
    return version;
  } catch (error) {
    return null;
  }
}

function parseVersion(versionString) {
  // Entferne Prefix wie ^, ~, >=, etc.
  const cleaned = versionString.replace(/^[\^~>=<]/, '');
  const parts = cleaned.split('.').map(Number);
  return {
    major: parts[0] || 0,
    minor: parts[1] || 0,
    patch: parts[2] || 0,
    original: versionString
  };
}

function compareVersions(current, latest) {
  const curr = parseVersion(current);
  const lat = parseVersion(latest);
  
  if (lat.major > curr.major) return 'major';
  if (lat.minor > curr.minor) return 'minor';
  if (lat.patch > curr.patch) return 'patch';
  return 'current';
}

function analyzePackages() {
  const packageJsonPath = path.join(__dirname, '..', 'basketball-app', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  const dependencies = packageJson.dependencies || {};
  const devDependencies = packageJson.devDependencies || {};
  
  const results = {
    dependencies: {},
    devDependencies: {},
    stats: {
      current: 0,
      patch: 0,
      minor: 0,
      major: 0,
      error: 0
    }
  };
  
  log('\n🔍 Prüfe ALLE Packages gegen npm Registry...\n', 'blue');
  log('⏳ Das kann einen Moment dauern...\n', 'yellow');
  
  // Dependencies
  log('📦 PRODUCTION DEPENDENCIES\n', 'cyan');
  Object.entries(dependencies).forEach(([name, currentVersion]) => {
    const latest = getLatestVersion(name);
    if (!latest) {
      log(`   ❌ ${name}: Fehler beim Abrufen`, 'red');
      results.stats.error++;
      return;
    }
    
    const updateType = compareVersions(currentVersion, latest);
    results.dependencies[name] = {
      current: currentVersion,
      latest: latest,
      updateType: updateType
    };
    
    results.stats[updateType]++;
    
    const icon = {
      'current': '✅',
      'patch': '🔧',
      'minor': '📦',
      'major': '🔴'
    }[updateType];
    
    const color = {
      'current': 'green',
      'patch': 'cyan',
      'minor': 'yellow',
      'major': 'red'
    }[updateType];
    
    log(`   ${icon} ${name}`, 'reset');
    log(`      Aktuell: ${currentVersion}`, 'reset');
    if (updateType !== 'current') {
      log(`      Latest:  ${latest}`, color);
    }
  });
  
  // DevDependencies
  log('\n🧪 DEV DEPENDENCIES\n', 'cyan');
  Object.entries(devDependencies).forEach(([name, currentVersion]) => {
    const latest = getLatestVersion(name);
    if (!latest) {
      log(`   ❌ ${name}: Fehler beim Abrufen`, 'red');
      results.stats.error++;
      return;
    }
    
    const updateType = compareVersions(currentVersion, latest);
    results.devDependencies[name] = {
      current: currentVersion,
      latest: latest,
      updateType: updateType
    };
    
    results.stats[updateType]++;
    
    const icon = {
      'current': '✅',
      'patch': '🔧',
      'minor': '📦',
      'major': '🔴'
    }[updateType];
    
    const color = {
      'current': 'green',
      'patch': 'cyan',
      'minor': 'yellow',
      'major': 'red'
    }[updateType];
    
    log(`   ${icon} ${name}`, 'reset');
    log(`      Aktuell: ${currentVersion}`, 'reset');
    if (updateType !== 'current') {
      log(`      Latest:  ${latest}`, color);
    }
  });
  
  return results;
}

function generateUpdatePlan(results) {
  log('\n' + '═'.repeat(60), 'blue');
  log('📊 ZUSAMMENFASSUNG', 'blue');
  log('═'.repeat(60) + '\n', 'blue');
  
  log(`✅ Aktuell:       ${results.stats.current}`, 'green');
  log(`🔧 Patch Updates: ${results.stats.patch}`, 'cyan');
  log(`📦 Minor Updates: ${results.stats.minor}`, 'yellow');
  log(`🔴 Major Updates: ${results.stats.major}`, 'red');
  if (results.stats.error > 0) {
    log(`❌ Fehler:        ${results.stats.error}`, 'red');
  }
  
  // Generiere Update-Commands
  const patchUpdates = [];
  const minorUpdates = [];
  const majorUpdates = [];
  
  [...Object.entries(results.dependencies), ...Object.entries(results.devDependencies)]
    .forEach(([name, info]) => {
      if (info.updateType === 'patch') {
        patchUpdates.push(`${name}@^${info.latest}`);
      } else if (info.updateType === 'minor') {
        minorUpdates.push(`${name}@^${info.latest}`);
      } else if (info.updateType === 'major') {
        majorUpdates.push(`${name}@^${info.latest}`);
      }
    });
  
  log('\n' + '═'.repeat(60), 'blue');
  log('🚀 UPDATE-PLAN', 'blue');
  log('═'.repeat(60) + '\n', 'blue');
  
  if (patchUpdates.length > 0) {
    log('1️⃣  PATCH UPDATES (sicher, sofort machen):\n', 'cyan');
    log('npm install ' + patchUpdates.join(' '), 'reset');
    log('');
  }
  
  if (minorUpdates.length > 0) {
    log('2️⃣  MINOR UPDATES (Features, meist sicher):\n', 'yellow');
    log('npm install ' + minorUpdates.join(' '), 'reset');
    log('');
  }
  
  if (majorUpdates.length > 0) {
    log('3️⃣  MAJOR UPDATES (Breaking Changes - einzeln prüfen!):\n', 'red');
    majorUpdates.forEach(pkg => {
      log(`npm install ${pkg}`, 'reset');
      log(`npm test`, 'cyan');
      log('');
    });
  }
  
  if (patchUpdates.length === 0 && minorUpdates.length === 0 && majorUpdates.length === 0) {
    log('🎉 Alle Packages sind aktuell!', 'green');
  }
  
  log('\n💡 Nach Updates immer testen:', 'cyan');
  log('   npm test', 'reset');
  log('   npm run build', 'reset');
  log('   npm audit\n', 'reset');
}

// Main
const results = analyzePackages();
generateUpdatePlan(results);

log('📅 Empfehlung: Dieses Script wöchentlich ausführen', 'blue');
log('   npm run check:all-packages\n', 'reset');
