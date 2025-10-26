#!/usr/bin/env node
/**
 * Check npm package versions
 * 
 * Prüft ob alle Packages auf dem neuesten Stand sind
 * Zeigt veraltete Packages mit verfügbaren Updates
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

function checkOutdated() {
  log('\n🔍 Prüfe npm-Packages auf Updates...\n', 'blue');
  
  try {
    // npm outdated zeigt veraltete Packages
    const result = execSync('npm outdated --json', { 
      cwd: path.join(__dirname, '..', 'basketball-app'),
      encoding: 'utf8'
    });
    
    if (!result) {
      log('✅ Alle Packages sind aktuell!', 'green');
      return;
    }
    
    const outdated = JSON.parse(result);
    const packages = Object.keys(outdated);
    
    if (packages.length === 0) {
      log('✅ Alle Packages sind aktuell!', 'green');
      return;
    }
    
    log(`⚠️  ${packages.length} Packages haben Updates verfügbar:\n`, 'yellow');
    
    // Sortiere nach Severity
    const critical = [];
    const major = [];
    const minor = [];
    const patch = [];
    
    packages.forEach(pkg => {
      const info = outdated[pkg];
      const current = info.current;
      const latest = info.latest;
      const wanted = info.wanted;
      
      // Parse versions
      const currentParts = current.split('.').map(Number);
      const latestParts = latest.split('.').map(Number);
      
      const majorDiff = latestParts[0] - currentParts[0];
      const minorDiff = latestParts[1] - currentParts[1];
      const patchDiff = latestParts[2] - currentParts[2];
      
      const item = {
        name: pkg,
        current,
        wanted,
        latest,
        type: info.type || 'dependencies'
      };
      
      // Security-critical packages (wegen Supply-Chain-Attacken)
      const criticalPackages = [
        '@types/',
        'typescript',
        'vite',
        'react',
        'eslint',
        '@testing-library'
      ];
      
      const isCritical = criticalPackages.some(pattern => pkg.includes(pattern));
      
      if (isCritical && majorDiff > 0) {
        critical.push(item);
      } else if (majorDiff > 0) {
        major.push(item);
      } else if (minorDiff > 0) {
        minor.push(item);
      } else if (patchDiff > 0) {
        patch.push(item);
      }
    });
    
    // Output
    if (critical.length > 0) {
      log('🚨 KRITISCH (Security-relevante Packages mit Major-Updates):', 'red');
      critical.forEach(pkg => {
        log(`   ${pkg.name}`, 'reset');
        log(`      Aktuell: ${pkg.current}`, 'reset');
        log(`      Latest:  ${pkg.latest}`, 'green');
        log(`      Typ:     ${pkg.type}`, 'cyan');
      });
      log('');
    }
    
    if (major.length > 0) {
      log('⚠️  MAJOR Updates (Breaking Changes möglich):', 'yellow');
      major.forEach(pkg => {
        log(`   ${pkg.name}: ${pkg.current} → ${pkg.latest}`, 'reset');
      });
      log('');
    }
    
    if (minor.length > 0) {
      log('📦 MINOR Updates (Features, abwärtskompatibel):', 'cyan');
      minor.forEach(pkg => {
        log(`   ${pkg.name}: ${pkg.current} → ${pkg.latest}`, 'reset');
      });
      log('');
    }
    
    if (patch.length > 0) {
      log('🔧 PATCH Updates (Bugfixes):', 'blue');
      patch.forEach(pkg => {
        log(`   ${pkg.name}: ${pkg.current} → ${pkg.latest}`, 'reset');
      });
      log('');
    }
    
    // Recommendations
    log('\n💡 Empfehlungen:\n', 'blue');
    
    if (critical.length > 0) {
      log('   1. 🚨 SOFORT kritische Packages updaten:', 'red');
      log('      npm install ' + critical.map(p => `${p.name}@latest`).join(' '), 'reset');
      log('');
    }
    
    if (patch.length > 0) {
      log('   2. 🔧 Patch-Updates sind sicher:', 'blue');
      log('      npm update', 'reset');
      log('');
    }
    
    if (minor.length > 0 || major.length > 0) {
      log('   3. ⚠️  Major/Minor Updates einzeln prüfen:', 'yellow');
      log('      npm install <package>@latest', 'reset');
      log('      npm test', 'reset');
      log('');
    }
    
    log('   4. 📋 Detaillierte Changelogs prüfen:', 'cyan');
    [...critical, ...major, ...minor].slice(0, 5).forEach(pkg => {
      log(`      https://www.npmjs.com/package/${pkg.name}`, 'reset');
    });
    
  } catch (error) {
    if (error.status === 1) {
      // npm outdated gibt Exit Code 1 wenn Updates vorhanden
      // Das ist normal, daher nochmal ohne JSON probieren
      try {
        execSync('npm outdated', {
          cwd: path.join(__dirname, '..', 'basketball-app'),
          stdio: 'inherit'
        });
      } catch (e) {
        // Ignore
      }
    } else {
      log(`❌ Fehler: ${error.message}`, 'red');
    }
  }
}

function checkAudit() {
  log('\n🔒 Prüfe auf Sicherheitslücken...\n', 'blue');
  
  try {
    execSync('npm audit --json', {
      cwd: path.join(__dirname, '..', 'basketball-app'),
      stdio: 'inherit'
    });
  } catch (error) {
    log('\n⚠️  Sicherheitslücken gefunden!', 'yellow');
    log('   Führe aus: npm audit fix', 'cyan');
  }
}

function main() {
  log('╔══════════════════════════════════════════╗', 'blue');
  log('║   🏀 Basketball App - Package Check    ║', 'blue');
  log('╚══════════════════════════════════════════╝', 'blue');
  
  checkOutdated();
  checkAudit();
  
  log('\n📅 Empfehlung: Dieses Script wöchentlich ausführen', 'cyan');
  log('   npm run check:packages\n', 'cyan');
}

main();
