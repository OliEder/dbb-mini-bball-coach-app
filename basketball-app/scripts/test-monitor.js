/**
 * Advanced Test Monitor
 * 
 * Überwacht Unit und E2E Tests und gibt strukturiertes Feedback
 */

const { watch } = require('fs');
const { readFile, access } = require('fs/promises');
const { join } = require('path');
const chalk = require('chalk');

class TestMonitor {
  constructor() {
    this.vitestResults = null;
    this.playwrightResults = null;
    this.vitestPath = join(process.cwd(), '..', 'test-results', 'vitest-results.json');
    this.playwrightPath = join(process.cwd(), '..', 'test-results', 'results.json');
  }

  async start() {
    console.clear();
    console.log(chalk.blue.bold('🏀 Basketball PWA Test Monitor'));
    console.log(chalk.gray('=' .repeat(60)));
    console.log(chalk.yellow('📁 Watching test results...'));
    console.log(chalk.gray(`   Vitest: ${this.vitestPath}`));
    console.log(chalk.gray(`   Playwright: ${this.playwrightPath}`));
    console.log(chalk.gray('=' .repeat(60)));
    console.log();

    // Initial read
    await this.readAllResults();

    // Watch both files
    this.watchFile(this.vitestPath, 'vitest');
    this.watchFile(this.playwrightPath, 'playwright');

    // Periodic refresh (every 5 seconds)
    setInterval(() => this.displayDashboard(), 5000);
  }

  watchFile(path, type) {
    watch(path, { persistent: true }, async (eventType) => {
      if (eventType === 'change') {
        await this.readResults(path, type);
        this.displayDashboard();
      }
    }).on('error', () => {
      // File might not exist yet
    });
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
    // Vitest JSON reporter format
    const stats = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      failures: []
    };

    if (data.testResults) {
      data.testResults.forEach(file => {
        file.assertionResults?.forEach(test => {
          stats.total++;
          if (test.status === 'passed') stats.passed++;
          else if (test.status === 'failed') {
            stats.failed++;
            stats.failures.push({
              file: file.name.replace(process.cwd(), '.'),
              test: test.title,
              error: test.failureMessages?.[0]
            });
          }
          else if (test.status === 'skipped') stats.skipped++;
        });
      });
      stats.duration = data.testResults.reduce((acc, r) => acc + (r.duration || 0), 0);
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
            if (test.status === 'expected') stats.passed++;
            else if (test.status === 'unexpected') {
              stats.failed++;
              stats.failures.push({
                file: suite.file?.replace(process.cwd(), '.'),
                test: `${suite.title} > ${test.title}`,
                error: test.errors?.[0]?.message
              });
            }
            else if (test.status === 'skipped') stats.skipped++;
          });
        });
      });
      stats.duration = data.duration || 0;
    }

    // Alternative format
    if (data.stats) {
      return {
        total: data.stats.total,
        passed: data.stats.passed,
        failed: data.stats.failed,
        skipped: data.stats.skipped,
        duration: data.stats.duration,
        failures: []
      };
    }

    return stats;
  }

  displayDashboard() {
    console.clear();
    
    // Header
    console.log(chalk.blue.bold('🏀 Basketball PWA Test Monitor'));
    console.log(chalk.gray('=' .repeat(60)));
    console.log(chalk.gray(`Last Update: ${new Date().toLocaleTimeString()}`));
    console.log(chalk.gray('=' .repeat(60)));
    console.log();

    // Unit Tests (Vitest)
    console.log(chalk.cyan.bold('📦 Unit Tests (Vitest)'));
    if (this.vitestResults) {
      this.displayTestResults(this.vitestResults);
    } else {
      console.log(chalk.gray('   No results available'));
    }
    console.log();

    // E2E Tests (Playwright)
    console.log(chalk.magenta.bold('🎭 E2E Tests (Playwright)'));
    if (this.playwrightResults) {
      this.displayTestResults(this.playwrightResults);
    } else {
      console.log(chalk.gray('   No results available'));
    }
    console.log();

    // Overall Status
    const overallPassed = this.calculateOverallStatus();
    console.log(chalk.gray('=' .repeat(60)));
    if (overallPassed) {
      console.log(chalk.green.bold('✅ All tests passing!'));
    } else {
      console.log(chalk.red.bold('❌ Some tests failing - see details above'));
    }
    console.log(chalk.gray('=' .repeat(60)));

    // Instructions
    console.log();
    console.log(chalk.gray('Commands:'));
    console.log(chalk.gray('  Unit Tests:  npm test'));
    console.log(chalk.gray('  E2E Tests:   npm run test:e2e'));
    console.log(chalk.gray('  All Tests:   npm run test:all'));
    console.log(chalk.gray('  Exit:        Ctrl+C'));
  }

  displayTestResults(stats) {
    const { total, passed, failed, skipped, duration } = stats;
    
    // Summary line
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
    const statusEmoji = failed === 0 ? '✅' : '❌';
    const statusColor = failed === 0 ? chalk.green : chalk.red;
    
    console.log(`   ${statusEmoji} ${statusColor(`${passed}/${total}`)} tests passed (${passRate}%)`);
    
    // Details
    if (failed > 0) {
      console.log(chalk.red(`   ❌ ${failed} failed`));
    }
    if (skipped > 0) {
      console.log(chalk.yellow(`   ⏭️  ${skipped} skipped`));
    }
    
    // Duration
    const durationSec = (duration / 1000).toFixed(2);
    console.log(chalk.gray(`   ⏱️  ${durationSec}s`));
    
    // Failed tests details
    if (stats.failures && stats.failures.length > 0) {
      console.log();
      console.log(chalk.red('   Failed Tests:'));
      stats.failures.slice(0, 5).forEach(failure => {
        console.log(chalk.red(`     • ${failure.test}`));
        if (failure.error) {
          const errorLine = failure.error.split('\n')[0].substring(0, 80);
          console.log(chalk.gray(`       ${errorLine}`));
        }
      });
      if (stats.failures.length > 5) {
        console.log(chalk.gray(`     ... and ${stats.failures.length - 5} more`));
      }
    }
  }

  calculateOverallStatus() {
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
monitor.start();

// Handle exit
process.on('SIGINT', () => {
  console.log();
  console.log(chalk.yellow('👋 Test Monitor stopped'));
  process.exit(0);
});
