#!/usr/bin/env node

import { DebtQAValidator, QAReport } from './debt-qa-report';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Comprehensive test runner for debt management system
 * Executes all validation, performance, security, and integration tests
 */
class ComprehensiveTestRunner {
  private qaValidator: DebtQAValidator;

  async run(): Promise<void> {
    console.log('🚀 Starting Comprehensive Debt Management Tests...\n');

    try {
      // Initialize QA validator
      this.qaValidator = new DebtQAValidator();
      await this.qaValidator.initialize();

      console.log('✅ Test framework initialized');

      // Run comprehensive QA tests
      console.log('🔍 Running comprehensive QA validation...');
      const qaReport = await this.qaValidator.runComprehensiveQA();

      // Generate reports
      await this.generateReports(qaReport);

      // Display summary
      this.displaySummary(qaReport);

      // Cleanup
      await this.qaValidator.cleanup();

      // Exit with appropriate code
      process.exit(qaReport.overallStatus === 'PASS' ? 0 : 1);

    } catch (error) {
      console.error('❌ Test execution failed:', error);
      
      if (this.qaValidator) {
        await this.qaValidator.cleanup();
      }
      
      process.exit(1);
    }
  }

  private async generateReports(qaReport: QAReport): Promise<void> {
    const reportsDir = path.join(__dirname, '..', 'reports');
    
    // Ensure reports directory exists
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // Generate JSON report
    const jsonReportPath = path.join(reportsDir, `qa-report-${Date.now()}.json`);
    fs.writeFileSync(jsonReportPath, JSON.stringify(qaReport, null, 2));

    // Generate HTML report
    const htmlReportPath = path.join(reportsDir, `qa-report-${Date.now()}.html`);
    const htmlContent = this.generateHtmlReport(qaReport);
    fs.writeFileSync(htmlReportPath, htmlContent);

    // Generate markdown report
    const mdReportPath = path.join(reportsDir, `qa-report-${Date.now()}.md`);
    const mdContent = this.generateMarkdownReport(qaReport);
    fs.writeFileSync(mdReportPath, mdContent);

    console.log(`📊 Reports generated:`);
    console.log(`   JSON: ${jsonReportPath}`);
    console.log(`   HTML: ${htmlReportPath}`);
    console.log(`   Markdown: ${mdReportPath}`);
  }

  private generateHtmlReport(report: QAReport): string {
    const statusColor = {
      'PASS': '#28a745',
      'FAIL': '#dc3545',
      'WARNING': '#ffc107'
    };

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Debt Management QA Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .status-badge { padding: 5px 10px; border-radius: 3px; color: white; font-weight: bold; }
        .pass { background-color: ${statusColor.PASS}; }
        .fail { background-color: ${statusColor.FAIL}; }
        .warning { background-color: ${statusColor.WARNING}; }
        .category { margin: 20px 0; }
        .test-result { margin: 10px 0; padding: 10px; border-left: 4px solid #ddd; }
        .test-result.pass { border-left-color: ${statusColor.PASS}; }
        .test-result.fail { border-left-color: ${statusColor.FAIL}; }
        .test-result.warning { border-left-color: ${statusColor.WARNING}; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f8f9fa; }
        .performance-metrics { display: flex; gap: 20px; margin: 20px 0; }
        .metric { background: #f8f9fa; padding: 15px; border-radius: 5px; flex: 1; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Debt Management System - QA Report</h1>
        <p><strong>Generated:</strong> ${report.timestamp.toISOString()}</p>
        <p><strong>Overall Status:</strong> <span class="status-badge ${report.overallStatus.toLowerCase()}">${report.overallStatus}</span></p>
    </div>

    <div class="performance-metrics">
        <div class="metric">
            <h3>Total Tests</h3>
            <p style="font-size: 2em; margin: 0;">${report.totalTests}</p>
        </div>
        <div class="metric">
            <h3>Passed</h3>
            <p style="font-size: 2em; margin: 0; color: ${statusColor.PASS};">${report.passed}</p>
        </div>
        <div class="metric">
            <h3>Failed</h3>
            <p style="font-size: 2em; margin: 0; color: ${statusColor.FAIL};">${report.failed}</p>
        </div>
        <div class="metric">
            <h3>Warnings</h3>
            <p style="font-size: 2em; margin: 0; color: ${statusColor.WARNING};">${report.warnings}</p>
        </div>
    </div>

    <h2>Performance Metrics</h2>
    <table>
        <tr>
            <th>Metric</th>
            <th>Value</th>
        </tr>
        <tr>
            <td>Average Response Time</td>
            <td>${report.performance.averageResponseTime.toFixed(2)}ms</td>
        </tr>
        <tr>
            <td>Maximum Response Time</td>
            <td>${report.performance.maxResponseTime}ms</td>
        </tr>
        <tr>
            <td>Minimum Response Time</td>
            <td>${report.performance.minResponseTime}ms</td>
        </tr>
    </table>

    <h2>Test Results by Category</h2>
    ${Object.entries(report.categories).map(([category, stats]) => `
        <div class="category">
            <h3>${category}</h3>
            <p>Total: ${stats.total} | Passed: ${stats.passed} | Failed: ${stats.failed} | Warnings: ${stats.warnings}</p>
            ${report.results
              .filter(r => r.category === category)
              .map(result => `
                <div class="test-result ${result.status.toLowerCase()}">
                    <h4>${result.testName} <span class="status-badge ${result.status.toLowerCase()}">${result.status}</span></h4>
                    <p><strong>Message:</strong> ${result.message}</p>
                    <p><strong>Execution Time:</strong> ${result.executionTime}ms</p>
                    ${result.details ? `<details><summary>Details</summary><pre>${JSON.stringify(result.details, null, 2)}</pre></details>` : ''}
                </div>
              `).join('')}
        </div>
    `).join('')}

    <h2>Coverage Summary</h2>
    <table>
        <tr>
            <th>Coverage Area</th>
            <th>Items Covered</th>
        </tr>
        <tr>
            <td>Debt Types</td>
            <td>${report.coverage.debtTypes.join(', ')}</td>
        </tr>
        <tr>
            <td>Business Rules</td>
            <td>${report.coverage.businessRules.join(', ')}</td>
        </tr>
        <tr>
            <td>Error Scenarios</td>
            <td>${report.coverage.errorScenarios.join(', ')}</td>
        </tr>
    </table>
</body>
</html>`;
  }

  private generateMarkdownReport(report: QAReport): string {
    return `# Debt Management System - QA Report

**Generated:** ${report.timestamp.toISOString()}  
**Overall Status:** ${report.overallStatus}

## Summary

| Metric | Value |
|--------|-------|
| Total Tests | ${report.totalTests} |
| Passed | ${report.passed} |
| Failed | ${report.failed} |
| Warnings | ${report.warnings} |

## Performance Metrics

| Metric | Value |
|--------|-------|
| Average Response Time | ${report.performance.averageResponseTime.toFixed(2)}ms |
| Maximum Response Time | ${report.performance.maxResponseTime}ms |
| Minimum Response Time | ${report.performance.minResponseTime}ms |

## Test Results by Category

${Object.entries(report.categories).map(([category, stats]) => `
### ${category}

**Summary:** Total: ${stats.total} | Passed: ${stats.passed} | Failed: ${stats.failed} | Warnings: ${stats.warnings}

${report.results
  .filter(r => r.category === category)
  .map(result => `
#### ${result.testName} - ${result.status}

- **Message:** ${result.message}
- **Execution Time:** ${result.executionTime}ms
${result.details ? `- **Details:** \`\`\`json\n${JSON.stringify(result.details, null, 2)}\n\`\`\`` : ''}
`).join('')}
`).join('')}

## Coverage Summary

### Debt Types Covered
${report.coverage.debtTypes.map(type => `- ${type}`).join('\n')}

### Business Rules Tested
${report.coverage.businessRules.map(rule => `- ${rule}`).join('\n')}

### Error Scenarios Covered
${report.coverage.errorScenarios.map(scenario => `- ${scenario}`).join('\n')}

## Recommendations

${report.failed > 0 ? '⚠️ **CRITICAL:** Some tests failed. Review failed tests and fix issues before deployment.' : ''}
${report.warnings > 0 ? '⚠️ **WARNING:** Some tests generated warnings. Review and address if necessary.' : ''}
${report.performance.averageResponseTime > 1000 ? '⚠️ **PERFORMANCE:** Average response time exceeds 1 second. Consider optimization.' : ''}
${report.overallStatus === 'PASS' ? '✅ **SUCCESS:** All tests passed. System is ready for deployment.' : ''}
`;
  }

  private displaySummary(report: QAReport): void {
    console.log('\n' + '='.repeat(60));
    console.log('📋 COMPREHENSIVE QA REPORT SUMMARY');
    console.log('='.repeat(60));
    
    console.log(`\n📊 Test Results:`);
    console.log(`   Total Tests: ${report.totalTests}`);
    console.log(`   ✅ Passed: ${report.passed}`);
    console.log(`   ❌ Failed: ${report.failed}`);
    console.log(`   ⚠️  Warnings: ${report.warnings}`);
    
    console.log(`\n⚡ Performance:`);
    console.log(`   Average Response Time: ${report.performance.averageResponseTime.toFixed(2)}ms`);
    console.log(`   Max Response Time: ${report.performance.maxResponseTime}ms`);
    console.log(`   Min Response Time: ${report.performance.minResponseTime}ms`);

    console.log(`\n📈 Coverage:`);
    console.log(`   Debt Types: ${report.coverage.debtTypes.length}`);
    console.log(`   Business Rules: ${report.coverage.businessRules.length}`);
    console.log(`   Error Scenarios: ${report.coverage.errorScenarios.length}`);

    console.log(`\n🎯 Overall Status: ${report.overallStatus}`);

    if (report.failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      report.results
        .filter(r => r.status === 'FAIL')
        .forEach(result => {
          console.log(`   - ${result.category}: ${result.testName}`);
          console.log(`     Error: ${result.message}`);
        });
    }

    if (report.warnings > 0) {
      console.log('\n⚠️  WARNINGS:');
      report.results
        .filter(r => r.status === 'WARNING')
        .forEach(result => {
          console.log(`   - ${result.category}: ${result.testName}`);
          console.log(`     Warning: ${result.message}`);
        });
    }

    console.log('\n' + '='.repeat(60));
  }
}

// Run the comprehensive tests if this file is executed directly
if (require.main === module) {
  const runner = new ComprehensiveTestRunner();
  runner.run().catch(console.error);
}

export { ComprehensiveTestRunner };
