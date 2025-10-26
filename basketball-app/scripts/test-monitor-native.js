#!/usr/bin/env node

/**
 * Test Monitor - Zero Dependencies Version
 * 
 * Überwacht Unit und E2E Tests mit nativen Node.js Features
 */

const { watch } = require('fs');
const { readFile, access } = require('fs/promises');
const { join } = require('path');

// ANSI Color Codes
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

// Helper functions for colored output
const color = (text, ...codes) => {
  const colorCodes = codes.map(c => colors[c] || '').join('');
  return `${colorCodes}${text}${colors.reset}`;
};

class TestMonitor {
  constructor() {
    this.vitestResults = null;
    this.playwrightResults = null;
    this.vitestPath = join(__dirname, '..', 'test-results', 'vitest-results.json');
    this.playwrightPath = join(__dirname, '..', 'test-results', 'results.json');
    this.lastUpdate = new Date();
  }

  async start() {
    console.clear();
    console.log(color('🏀 Basketball PWA Test Monitor', 'blue', 'bold'));
    console.log(color('='.repeat(60), 'gray'));
    console.log(color('📁 Watching test results...', 'yellow'));
    
    // Simplified paths - relative to project root
    this.vitestPath = join(__dirname, '..', 'test-results', 'vitest-results.json');
    this.playwrightPath = join(__dirname, '..', 'playwright-report', 'results.json');
    
    console.log(color(`   Vitest: ${this.vitestPath}`, 'gray'));
    console.log(color(`   Playwright: ${this.playwrightPath}`, 'gray'));
    console.log(color('='.repeat(60), 'gray'));
    console.log();

    // Create test-results directory if not exists
    const { mkdir } = require('fs').promises;
    try {
      await mkdir(join(__dirname, '..', 'test-results'), { recursive: true });
    } catch (err) {
      // Directory might already exist
    }

    // Initial read
    await this.readAllResults();

    // Watch for changes in test output
    this.watchTestOutput();

    // Periodic refresh (every 2 seconds)
    setInterval(() => this.displayDashboard(), 2000);
  }

  watchTestOutput() {
    // Watch console output for test results
    const originalLog = console.log;
    const self = this;
    
    // Try to watch the test results directory
    const { watchFile } = require('fs');
    
    // Watch for any JSON files in test-results
    const testResultsDir = join(__dirname, '..', 'test-results');
    
    try {
      watchFile(testResultsDir, { persistent: true, interval: 1000 }, () => {
        this.readAllResults();
      });
    } catch (err) {
      // Fallback: just poll every second
      setInterval(() => this.readAllResults(), 1000);
    }
  }

  watchFile(path, type) {
    try {
      watch(path, { persistent: true }, async (eventType) => {
        if (eventType === 'change') {
          await this.readResults(path, type);
          this.lastUpdate = new Date();
          this.displayDashboard();
        }
      }).on('error', (err) => {
        // File might not exist yet - that's ok
      });
    } catch (err) {
      // Initial watch might fail if file doesn't exist
    }
  }

  async readAllResults() {
    await this.readResults(this.vitestPath, 'vitest');
    await this.readResults(this.playwrightPath, 'playwright');
    this.displayDashboard();
  }

  async readResults(path, type) {
    try {
      await access(path);
      const content = await readFile(path, 'utf-8');
      const results = JSON.parse(content);
      
      if (type === 'vitest') {
        this.vitestResults = this.parseVitestResults(results);
      } else {
        this.playwrightResults = this.parsePlaywrightResults(results);
      }
    } catch (error) {
      // File doesn't exist or is invalid
      if (type === 'vitest') {
        this.vitestResults = null;
      } else {
        this.playwrightResults = null;
      }
    }
  }

  parseVitestResults(data) {
    const stats = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      failures: []
    };

    // Check different formats
    if (data.testResults) {
      data.testResults.forEach(file => {
        file.assertionResults?.forEach(test => {
          stats.total++;
          if (test.status === 'passed') stats.passed++;
          else if (test.status === 'failed') {
            stats.failed++;
            stats.failures.push({
              file: file.name?.replace(process.cwd(), '.') || 'unknown',
              test: test.title || 'unknown test',
              error: test.failureMessages?.[0]
            });
          }
          else if (test.status === 'skipped' || test.status === 'pending') {
            stats.skipped++;
          }
        });
      });
      stats.duration = data.testResults.reduce((acc, r) => acc + (r.duration || 0), 0);
    } else if (data.numTotalTests) {
      // Alternative format
      stats.total = data.numTotalTests;
      stats.passed = data.numPassedTests || 0;
      stats.failed = data.numFailedTests || 0;
      stats.skipped = data.numPendingTests || 0;
      stats.duration = Date.now() - data.startTime || 0;
    }

    return stats;
  }

  parsePlaywrightResults(data) {
    const stats = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      failures: []
    };

    if (data.suites) {
      data.suites.forEach(suite => {
        suite.specs?.forEach(spec => {
          spec.tests?.forEach(test => {
            stats.total++;
            if (test.status === 'expected' || test.status === 'passed') {
              stats.passed++;
            } else if (test.status === 'unexpected' || test.status === 'failed') {
              stats.failed++;
              stats.failures.push({
                file: suite.file?.replace(process.cwd(), '.') || 'unknown',
                test: `${suite.title} > ${test.title}`,
                error: test.errors?.[0]?.message
              });
            } else if (test.status === 'skipped') {
              stats.skipped++;
            }
          });
        });
        
        // Alternative structure
        suite.tests?.forEach(test => {
          stats.total++;
          if (test.status === 'passed') stats.passed++;
          else if (test.status === 'failed') {
            stats.failed++;
            stats.failures.push({
              file: suite.title,
              test: test.title,
              error: test.error?.message
            });
          }
          else if (test.status === 'skipped') stats.skipped++;
        });
      });
      stats.duration = data.duration || 0;
    }

    // Alternative format
    if (data.stats) {
      stats.total = data.stats.total || 0;
      stats.passed = data.stats.passed || 0;
      stats.failed = data.stats.failed || 0;
      stats.skipped = data.stats.skipped || 0;
      stats.duration = data.stats.duration || 0;
    }

    return stats;
  }

  displayDashboard() {
    console.clear();
    
    // Header
    console.log(color('🏀 Basketball PWA Test Monitor', 'blue', 'bold'));
    console.log(color('='.repeat(60), 'gray'));
    console.log(color(`Last Update: ${this.lastUpdate.toLocaleTimeString()}`, 'gray'));
    console.log(color('='.repeat(60), 'gray'));
    console.log();

    // Unit Tests (Vitest)
    console.log(color('📦 Unit Tests (Vitest)', 'cyan', 'bold'));
    if (this.vitestResults) {
      this.displayTestResults(this.vitestResults);
    } else {
      console.log(color('   No results available', 'gray'));
    }
    console.log();

    // E2E Tests (Playwright)
    console.log(color('🎭 E2E Tests (Playwright)', 'magenta', 'bold'));
    if (this.playwrightResults) {
      this.displayTestResults(this.playwrightResults);
    } else {
      console.log(color('   No results available', 'gray'));
    }
    console.log();

    // Overall Status
    const overallPassed = this.calculateOverallStatus();
    console.log(color('='.repeat(60), 'gray'));
    if (overallPassed === null) {
      console.log(color('⏳ Waiting for test results...', 'yellow', 'bold'));
    } else if (overallPassed) {
      console.log(color('✅ All tests passing!', 'green', 'bold'));
    } else {
      console.log(color('❌ Some tests failing - see details above', 'red', 'bold'));
    }
    console.log(color('='.repeat(60), 'gray'));

    // Instructions
    console.log();
    console.log(color('Commands:', 'gray'));
    console.log(color('  Unit Tests:  npm test', 'gray'));
    console.log(color('  E2E Tests:   npm run test:e2e', 'gray'));
    console.log(color('  All Tests:   npm run test:all', 'gray'));
    console.log(color('  Exit:        Ctrl+C', 'gray'));
  }

  displayTestResults(stats) {
    const { total, passed, failed, skipped, duration } = stats;
    
    if (total === 0) {
      console.log(color('   No tests found', 'gray'));
      return;
    }
    
    // Summary line
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
    const statusEmoji = failed === 0 ? '✅' : '❌';
    const statusColor = failed === 0 ? 'green' : 'red';
    
    console.log(`   ${statusEmoji} ${color(`${passed}/${total}`, statusColor)} tests passed (${passRate}%)`);
    
    // Details
    if (failed > 0) {
      console.log(color(`   ❌ ${failed} failed`, 'red'));
    }
    if (skipped > 0) {
      console.log(color(`   ⏭️  ${skipped} skipped`, 'yellow'));
    }
    
    // Duration
    const durationSec = (duration / 1000).toFixed(2);
    console.log(color(`   ⏱️  ${durationSec}s`, 'gray'));
    
    // Failed tests details
    if (stats.failures && stats.failures.length > 0) {
      console.log();
      console.log(color('   Failed Tests:', 'red'));
      stats.failures.slice(0, 5).forEach(failure => {
        console.log(color(`     • ${failure.test}`, 'red'));
        if (failure.error) {
          const errorLine = failure.error.split('\n')[0].substring(0, 80);
          console.log(color(`       ${errorLine}`, 'gray'));
        }
      });
      if (stats.failures.length > 5) {
        console.log(color(`     ... and ${stats.failures.length - 5} more`, 'gray'));
      }
    }
  }

  calculateOverallStatus() {
    // If we have no results at all, return null
    if (!this.vitestResults && !this.playwrightResults) {
      return null;
    }
    
    let totalFailed = 0;
    
    if (this.vitestResults) {
      totalFailed += this.vitestResults.failed;
    }
    if (this.playwrightResults) {
      totalFailed += this.playwrightResults.failed;
    }
    
    return totalFailed === 0;
  }
}

// Start monitor
const monitor = new TestMonitor();
monitor.start().catch(err => {
  console.error(color('Failed to start monitor:', 'red'), err);
  process.exit(1);
});

// Handle exit
process.on('SIGINT', () => {
  console.log();
  console.log(color('👋 Test Monitor stopped', 'yellow'));
  process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', (err) => {
  console.error(color('Uncaught error:', 'red'), err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(color('Unhandled rejection at:', 'red'), promise, 'reason:', reason);
});
