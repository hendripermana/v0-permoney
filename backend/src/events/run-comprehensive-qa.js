#!/usr/bin/env node

/**
 * Comprehensive QA Validation Suite
 * Runs all quality assurance checks for the Event Sourcing system
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Starting Comprehensive QA Validation Suite');
console.log('='.repeat(80));

const startTime = Date.now();

// QA Test Suite
const qaTests = [
  {
    name: 'File Structure Verification',
    script: 'verify-simple.js',
    weight: 10,
    description: 'Validates all required files are present'
  },
  {
    name: 'Code Quality Analysis',
    script: 'code-analyzer.js',
    weight: 25,
    description: 'Analyzes code quality, complexity, and best practices'
  },
  {
    name: 'Security Audit',
    script: 'security-audit.js',
    weight: 30,
    description: 'Identifies security vulnerabilities and compliance issues'
  },
  {
    name: 'Performance Analysis',
    script: 'performance-analyzer.js',
    weight: 35,
    description: 'Evaluates performance bottlenecks and scalability'
  }
];

let totalScore = 0;
let totalWeight = 0;
const results = [];

console.log('\n📋 Running QA Test Suite...\n');

qaTests.forEach((test, index) => {
  console.log(`${index + 1}. ${test.name}`);
  console.log(`   ${test.description}`);
  console.log(`   Weight: ${test.weight}%`);
  
  try {
    const output = execSync(`node ${test.script}`, { 
      cwd: __dirname,
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    // Extract score from output (simplified scoring)
    let score = 100; // Default score
    
    // Parse output for specific scores
    if (output.includes('Quality Score: ')) {
      const match = output.match(/Quality Score: (\d+)\/100/);
      if (match) score = parseInt(match[1]);
    } else if (output.includes('Security Score: ')) {
      const match = output.match(/Security Score: (\d+)\/100/);
      if (match) score = parseInt(match[1]);
    } else if (output.includes('Performance Score: ')) {
      const match = output.match(/Performance Score: (\d+)\/100/);
      if (match) score = parseInt(match[1]);
    }
    
    // Adjust score based on issues found
    const highIssues = (output.match(/High: (\d+)/g) || []).reduce((sum, match) => {
      return sum + parseInt(match.match(/\d+/)[0]);
    }, 0);
    
    const mediumIssues = (output.match(/Medium: (\d+)/g) || []).reduce((sum, match) => {
      return sum + parseInt(match.match(/\d+/)[0]);
    }, 0);
    
    // Penalty for issues
    score = Math.max(0, score - (highIssues * 10) - (mediumIssues * 5));
    
    results.push({
      name: test.name,
      score,
      weight: test.weight,
      status: score >= 70 ? '✅ PASS' : score >= 50 ? '⚠️ WARN' : '❌ FAIL',
      issues: { high: highIssues, medium: mediumIssues }
    });
    
    totalScore += score * (test.weight / 100);
    totalWeight += test.weight;
    
    console.log(`   Result: ${score}/100 ${score >= 70 ? '✅' : score >= 50 ? '⚠️' : '❌'}`);
    
  } catch (error) {
    console.log(`   Result: ERROR ❌`);
    console.log(`   Error: ${error.message.split('\n')[0]}`);
    
    results.push({
      name: test.name,
      score: 0,
      weight: test.weight,
      status: '❌ ERROR',
      error: error.message.split('\n')[0]
    });
  }
  
  console.log('');
});

// Calculate final score
const finalScore = Math.round(totalScore);

console.log('📊 QA Validation Results');
console.log('='.repeat(50));

// Individual test results
results.forEach(result => {
  console.log(`${result.name}: ${result.score}/100 (${result.weight}%) ${result.status}`);
  if (result.issues) {
    console.log(`  Issues: ${result.issues.high} high, ${result.issues.medium} medium`);
  }
  if (result.error) {
    console.log(`  Error: ${result.error}`);
  }
});

console.log('');
console.log(`🎯 Overall QA Score: ${finalScore}/100`);

// Grade calculation
let grade, status, recommendation;
if (finalScore >= 90) {
  grade = 'A';
  status = '🟢 EXCELLENT';
  recommendation = 'Ready for production deployment';
} else if (finalScore >= 80) {
  grade = 'B';
  status = '🟢 GOOD';
  recommendation = 'Ready for production with minor improvements';
} else if (finalScore >= 70) {
  grade = 'C';
  status = '🟡 ACCEPTABLE';
  recommendation = 'Requires improvements before production';
} else if (finalScore >= 60) {
  grade = 'D';
  status = '🟡 NEEDS WORK';
  recommendation = 'Significant improvements required';
} else {
  grade = 'F';
  status = '🔴 CRITICAL ISSUES';
  recommendation = 'Major fixes required before deployment';
}

console.log(`Grade: ${grade} - ${status}`);
console.log(`Recommendation: ${recommendation}`);

// Detailed breakdown
console.log('\n📈 Score Breakdown:');
results.forEach(result => {
  const weightedScore = result.score * (result.weight / 100);
  console.log(`  ${result.name}: ${result.score} × ${result.weight}% = ${weightedScore.toFixed(1)} points`);
});

// Summary statistics
const totalIssues = results.reduce((sum, r) => sum + (r.issues ? r.issues.high + r.issues.medium : 0), 0);
const passedTests = results.filter(r => r.score >= 70).length;
const failedTests = results.filter(r => r.score < 50).length;

console.log('\n📋 Summary Statistics:');
console.log(`Tests Passed: ${passedTests}/${results.length}`);
console.log(`Tests Failed: ${failedTests}/${results.length}`);
console.log(`Total Issues Found: ${totalIssues}`);
console.log(`Execution Time: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);

// Recommendations based on score
console.log('\n💡 Next Steps:');
if (finalScore >= 80) {
  console.log('✅ System is ready for production with these final steps:');
  console.log('  1. Address any remaining high-priority security issues');
  console.log('  2. Set up production infrastructure (Redis, TimescaleDB)');
  console.log('  3. Configure monitoring and alerting');
  console.log('  4. Run load testing in staging environment');
} else if (finalScore >= 60) {
  console.log('⚠️ System needs improvements before production:');
  console.log('  1. Fix all high-priority security vulnerabilities');
  console.log('  2. Optimize performance bottlenecks');
  console.log('  3. Improve code quality and reduce complexity');
  console.log('  4. Add comprehensive testing coverage');
} else {
  console.log('🔴 Critical issues must be addressed:');
  console.log('  1. Immediate security fixes required');
  console.log('  2. Major performance optimizations needed');
  console.log('  3. Code quality improvements essential');
  console.log('  4. Architecture review recommended');
}

// Generate final report
const reportData = {
  timestamp: new Date().toISOString(),
  overallScore: finalScore,
  grade,
  status,
  recommendation,
  testResults: results,
  summary: {
    totalTests: results.length,
    passedTests,
    failedTests,
    totalIssues,
    executionTime: (Date.now() - startTime) / 1000
  }
};

fs.writeFileSync(
  path.join(__dirname, 'qa-validation-results.json'),
  JSON.stringify(reportData, null, 2)
);

console.log('\n📄 Detailed reports available:');
console.log('  - qa-validation.md (Comprehensive QA assessment)');
console.log('  - comprehensive-qa-report.md (Executive summary)');
console.log('  - qa-validation-results.json (Machine-readable results)');

console.log('\n' + '='.repeat(80));
console.log(`🎉 QA Validation Complete! Final Score: ${finalScore}/100 (${grade})`);

// Exit with appropriate code
process.exit(finalScore >= 70 ? 0 : 1);
