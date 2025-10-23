/**
 * Test Results Watcher
 * 
 * Überwacht Test-Ergebnisse und gibt Feedback
 */

import { watch } from 'fs';
import { readFile } from 'fs/promises';
import { join } from 'path';

interface TestResult {
  suites: Array<{
    title: string;
    tests: Array<{
      title: string;
      status: 'passed' | 'failed' | 'skipped';
      error?: {
        message: string;
        stack: string;
      };
    }>;
  }>;
  stats: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
  };
}

class TestWatcher {
  private resultsPath: string;
  private lastResults: TestResult | null = null;

  constructor() {
    this.resultsPath = join(process.cwd(), 'test-results', 'results.json');
  }

  async start() {
    console.log('🔍 Test Watcher gestartet...');
    console.log(`📁 Überwache: ${this.resultsPath}`);
    
    // Initial read
    await this.readResults();
    
    // Watch for changes
    watch(this.resultsPath, async (eventType) => {
      if (eventType === 'change') {
        await this.readResults();
      }
    });
  }

  private async readResults() {
    try {
      const content = await readFile(this.resultsPath, 'utf-8');
      const results: TestResult = JSON.parse(content);
      
      this.analyzeResults(results);
      this.lastResults = results;
    } catch (error) {
      // File might not exist yet
      if ((error as any).code !== 'ENOENT') {
        console.error('❌ Fehler beim Lesen der Test-Ergebnisse:', error);
      }
    }
  }

  private analyzeResults(results: TestResult) {
    const { stats } = results;
    const emoji = stats.failed === 0 ? '✅' : '❌';
    
    console.log('\n' + '='.repeat(50));
    console.log(`${emoji} Test-Ergebnisse: ${new Date().toLocaleTimeString()}`);
    console.log('='.repeat(50));
    
    console.log(`📊 Gesamt: ${stats.total}`);
    console.log(`✅ Bestanden: ${stats.passed}`);
    console.log(`❌ Fehlgeschlagen: ${stats.failed}`);
    console.log(`⏭️  Übersprungen: ${stats.skipped}`);
    console.log(`⏱️  Dauer: ${(stats.duration / 1000).toFixed(2)}s`);
    
    // Show failed tests
    if (stats.failed > 0) {
      console.log('\n❌ Fehlgeschlagene Tests:');
      results.suites.forEach(suite => {
        const failedTests = suite.tests.filter(test => test.status === 'failed');
        if (failedTests.length > 0) {
          console.log(`\n  📦 ${suite.title}:`);
          failedTests.forEach(test => {
            console.log(`    ❌ ${test.title}`);
            if (test.error) {
              console.log(`       ${test.error.message}`);
            }
          });
        }
      });
    }
    
    // Compare with last run
    if (this.lastResults) {
      const diff = stats.failed - this.lastResults.stats.failed;
      if (diff > 0) {
        console.log(`\n⚠️  ${diff} neue fehlerhafte Tests!`);
      } else if (diff < 0) {
        console.log(`\n🎉 ${Math.abs(diff)} Tests repariert!`);
      }
    }
    
    console.log('\n' + '='.repeat(50));
  }
}

// Start watcher
const watcher = new TestWatcher();
watcher.start();

// Keep process alive
process.on('SIGINT', () => {
  console.log('\n👋 Test Watcher beendet');
  process.exit(0);
});
