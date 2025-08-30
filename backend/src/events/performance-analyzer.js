/**
 * Performance Analysis Tool for Event Sourcing System
 */

const fs = require('fs');
const path = require('path');

class PerformanceAnalyzer {
  constructor() {
    this.metrics = {
      files: 0,
      totalComplexity: 0,
      performanceIssues: [],
      scalabilityIssues: [],
      memoryIssues: [],
      databaseIssues: []
    };
  }

  analyze(dirPath) {
    console.log('⚡ Starting Performance Analysis...\n');
    
    this.analyzeDirectory(dirPath);
    this.generatePerformanceReport();
  }

  analyzeDirectory(dirPath) {
    const files = this.getSourceFiles(dirPath);
    
    files.forEach(file => {
      this.analyzeFile(file);
    });
  }

  getSourceFiles(dirPath) {
    const files = [];
    
    const scanDirectory = (dir) => {
      const items = fs.readdirSync(dir);
      
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.')) {
          scanDirectory(fullPath);
        } else if (item.endsWith('.ts') && !item.includes('spec') && !item.includes('test')) {
          files.push(fullPath);
        }
      });
    };
    
    scanDirectory(dirPath);
    return files;
  }

  analyzeFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(process.cwd(), filePath);
    
    this.metrics.files++;
    
    // Analyze different performance aspects
    this.analyzeCyclomaticComplexity(content, relativePath);
    this.analyzeAsyncPatterns(content, relativePath);
    this.analyzeDatabaseQueries(content, relativePath);
    this.analyzeMemoryUsage(content, relativePath);
    this.analyzeLoopComplexity(content, relativePath);
    this.analyzeScalabilityIssues(content, relativePath);
  }

  analyzeCyclomaticComplexity(content, filePath) {
    // Count decision points
    const decisionPoints = [
      /\bif\s*\(/g,
      /\belse\s+if\s*\(/g,
      /\bwhile\s*\(/g,
      /\bfor\s*\(/g,
      /\bswitch\s*\(/g,
      /\bcase\s+/g,
      /\bcatch\s*\(/g,
      /\?\s*[^:]+\s*:/g, // ternary operators
      /&&|\|\|/g // logical operators
    ];

    let complexity = 1; // Base complexity
    
    decisionPoints.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    });

    this.metrics.totalComplexity += complexity;

    if (complexity > 15) {
      this.metrics.performanceIssues.push({
        type: 'High Complexity',
        severity: 'HIGH',
        file: filePath,
        value: complexity,
        description: `Cyclomatic complexity of ${complexity} exceeds recommended limit of 15`,
        impact: 'Difficult to test and maintain, potential performance issues',
        recommendation: 'Break down into smaller functions'
      });
    } else if (complexity > 10) {
      this.metrics.performanceIssues.push({
        type: 'Medium Complexity',
        severity: 'MEDIUM',
        file: filePath,
        value: complexity,
        description: `Cyclomatic complexity of ${complexity} is moderately high`,
        impact: 'May be difficult to test thoroughly',
        recommendation: 'Consider refactoring complex functions'
      });
    }
  }

  analyzeAsyncPatterns(content, filePath) {
    // Check for async/await patterns
    const asyncIssues = [];

    // Sequential async calls that could be parallel
    const sequentialAwaitPattern = /await\s+[^;]+;\s*\n\s*await\s+[^;]+;/g;
    const sequentialMatches = content.match(sequentialAwaitPattern);
    if (sequentialMatches && sequentialMatches.length > 2) {
      asyncIssues.push({
        type: 'Sequential Async Calls',
        severity: 'MEDIUM',
        file: filePath,
        count: sequentialMatches.length,
        description: 'Multiple sequential await calls detected',
        impact: 'Unnecessary waiting time, poor performance',
        recommendation: 'Use Promise.all() for independent async operations'
      });
    }

    // Async functions without proper error handling
    const asyncFunctions = content.match(/async\s+function|async\s+\w+\s*=>/g);
    const tryBlocks = content.match(/try\s*{/g);
    
    if (asyncFunctions && (!tryBlocks || asyncFunctions.length > tryBlocks.length)) {
      asyncIssues.push({
        type: 'Missing Error Handling',
        severity: 'HIGH',
        file: filePath,
        description: 'Async functions without proper error handling',
        impact: 'Unhandled promise rejections, application crashes',
        recommendation: 'Add try-catch blocks to async functions'
      });
    }

    // Blocking operations in async context
    const blockingOps = [
      'readFileSync',
      'writeFileSync',
      'execSync',
      'JSON.parse', // when used with large data
    ];

    blockingOps.forEach(op => {
      if (content.includes(op)) {
        asyncIssues.push({
          type: 'Blocking Operation',
          severity: 'HIGH',
          file: filePath,
          operation: op,
          description: `Blocking operation ${op} detected in async context`,
          impact: 'Blocks event loop, poor performance',
          recommendation: `Use async version: ${op.replace('Sync', '')}`
        });
      }
    });

    this.metrics.performanceIssues.push(...asyncIssues);
  }

  analyzeDatabaseQueries(content, filePath) {
    const dbIssues = [];

    // N+1 query pattern detection
    if (content.includes('forEach') && content.includes('findUnique')) {
      dbIssues.push({
        type: 'Potential N+1 Query',
        severity: 'HIGH',
        file: filePath,
        description: 'forEach with database query detected',
        impact: 'Multiple database round trips, poor performance',
        recommendation: 'Use batch queries or include relations'
      });
    }

    // Missing pagination
    if (content.includes('findMany') && !content.includes('take') && !content.includes('skip')) {
      dbIssues.push({
        type: 'Missing Pagination',
        severity: 'MEDIUM',
        file: filePath,
        description: 'findMany without pagination detected',
        impact: 'Memory issues with large datasets',
        recommendation: 'Add take/skip parameters for pagination'
      });
    }

    // SELECT * equivalent
    if (content.includes('findMany') && !content.includes('select')) {
      dbIssues.push({
        type: 'Over-fetching Data',
        severity: 'MEDIUM',
        file: filePath,
        description: 'Query without field selection detected',
        impact: 'Unnecessary data transfer, memory usage',
        recommendation: 'Use select to fetch only needed fields'
      });
    }

    // Raw queries without proper indexing hints
    if (content.includes('$queryRaw')) {
      dbIssues.push({
        type: 'Raw Query Usage',
        severity: 'MEDIUM',
        file: filePath,
        description: 'Raw SQL query detected',
        impact: 'Potential performance issues without proper indexing',
        recommendation: 'Ensure proper indexing and query optimization'
      });
    }

    // Transaction usage analysis
    const transactionCount = (content.match(/\$transaction/g) || []).length;
    if (transactionCount > 3) {
      dbIssues.push({
        type: 'Heavy Transaction Usage',
        severity: 'MEDIUM',
        file: filePath,
        count: transactionCount,
        description: 'Multiple database transactions detected',
        impact: 'Potential deadlocks and performance issues',
        recommendation: 'Optimize transaction scope and consider batching'
      });
    }

    this.metrics.databaseIssues.push(...dbIssues);
  }

  analyzeMemoryUsage(content, filePath) {
    const memoryIssues = [];

    // Large array operations
    if (content.includes('.map(') && content.includes('.filter(') && content.includes('.reduce(')) {
      memoryIssues.push({
        type: 'Chained Array Operations',
        severity: 'MEDIUM',
        file: filePath,
        description: 'Multiple chained array operations detected',
        impact: 'Multiple intermediate arrays created, high memory usage',
        recommendation: 'Consider using for loops or single-pass operations'
      });
    }

    // Object creation in loops
    const loopPatterns = ['forEach', 'for (', 'while ('];
    const hasObjectCreation = content.includes('new ') || content.includes('{}') || content.includes('[]');
    
    if (hasObjectCreation && loopPatterns.some(pattern => content.includes(pattern))) {
      memoryIssues.push({
        type: 'Object Creation in Loops',
        severity: 'MEDIUM',
        file: filePath,
        description: 'Object creation inside loops detected',
        impact: 'High memory allocation, potential garbage collection pressure',
        recommendation: 'Move object creation outside loops or use object pooling'
      });
    }

    // Large data structures
    const largeDataPatterns = [
      /new Array\(\d{4,}\)/,
      /Array\(\d{4,}\)/,
      /Buffer\.alloc\(\d{6,}\)/
    ];

    largeDataPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        memoryIssues.push({
          type: 'Large Data Structure',
          severity: 'HIGH',
          file: filePath,
          description: 'Large data structure allocation detected',
          impact: 'High memory usage, potential out-of-memory errors',
          recommendation: 'Consider streaming or chunked processing'
        });
      }
    });

    // Memory leaks - event listeners without cleanup
    if (content.includes('addEventListener') && !content.includes('removeEventListener')) {
      memoryIssues.push({
        type: 'Potential Memory Leak',
        severity: 'HIGH',
        file: filePath,
        description: 'Event listeners without cleanup detected',
        impact: 'Memory leaks, degraded performance over time',
        recommendation: 'Add proper cleanup in destroy/unmount methods'
      });
    }

    this.metrics.memoryIssues.push(...memoryIssues);
  }

  analyzeLoopComplexity(content, filePath) {
    const loopIssues = [];

    // Nested loops
    const nestedLoopPattern = /for\s*\([^}]*{[^}]*for\s*\(/g;
    const nestedMatches = content.match(nestedLoopPattern);
    if (nestedMatches) {
      loopIssues.push({
        type: 'Nested Loops',
        severity: 'HIGH',
        file: filePath,
        count: nestedMatches.length,
        description: 'Nested loops detected',
        impact: 'O(n²) or higher complexity, poor performance with large datasets',
        recommendation: 'Consider using hash maps, sets, or more efficient algorithms'
      });
    }

    // Large loop iterations
    const largeIterationPattern = /for\s*\([^}]*\d{4,}[^}]*\)/g;
    if (largeIterationPattern.test(content)) {
      loopIssues.push({
        type: 'Large Iteration Count',
        severity: 'MEDIUM',
        file: filePath,
        description: 'Loop with large iteration count detected',
        impact: 'Long execution time, blocking operations',
        recommendation: 'Consider chunking or async processing'
      });
    }

    this.metrics.performanceIssues.push(...loopIssues);
  }

  analyzeScalabilityIssues(content, filePath) {
    const scalabilityIssues = [];

    // Synchronous operations that don't scale
    const syncOps = ['readFileSync', 'writeFileSync', 'execSync'];
    syncOps.forEach(op => {
      if (content.includes(op)) {
        scalabilityIssues.push({
          type: 'Synchronous Operation',
          severity: 'HIGH',
          file: filePath,
          operation: op,
          description: `Synchronous operation ${op} detected`,
          impact: 'Blocks event loop, limits concurrent request handling',
          recommendation: `Use async version: ${op.replace('Sync', '')}`
        });
      }
    });

    // Global state usage
    if (content.includes('global.') || content.includes('process.env') && !content.includes('ConfigService')) {
      scalabilityIssues.push({
        type: 'Global State Usage',
        severity: 'MEDIUM',
        file: filePath,
        description: 'Direct global state access detected',
        impact: 'Difficult to scale horizontally, testing issues',
        recommendation: 'Use dependency injection and configuration services'
      });
    }

    // Hardcoded limits
    const hardcodedLimits = content.match(/\b(100|1000|10000)\b/g);
    if (hardcodedLimits && hardcodedLimits.length > 2) {
      scalabilityIssues.push({
        type: 'Hardcoded Limits',
        severity: 'MEDIUM',
        file: filePath,
        description: 'Hardcoded numeric limits detected',
        impact: 'Inflexible scaling, requires code changes for different environments',
        recommendation: 'Use configuration-based limits'
      });
    }

    // Missing rate limiting
    if (content.includes('@Post') || content.includes('@Put')) {
      if (!content.includes('@Throttle') && !content.includes('RateLimit')) {
        scalabilityIssues.push({
          type: 'Missing Rate Limiting',
          severity: 'MEDIUM',
          file: filePath,
          description: 'API endpoints without rate limiting',
          impact: 'Vulnerable to abuse, poor performance under load',
          recommendation: 'Add @Throttle decorator or rate limiting middleware'
        });
      }
    }

    this.metrics.scalabilityIssues.push(...scalabilityIssues);
  }

  generatePerformanceReport() {
    console.log('⚡ Performance Analysis Report');
    console.log('='.repeat(50));
    
    const allIssues = [
      ...this.metrics.performanceIssues,
      ...this.metrics.databaseIssues,
      ...this.metrics.memoryIssues,
      ...this.metrics.scalabilityIssues
    ];

    console.log(`\n📊 Analysis Summary:`);
    console.log(`Files analyzed: ${this.metrics.files}`);
    console.log(`Total issues found: ${allIssues.length}`);
    console.log(`Average complexity per file: ${Math.round(this.metrics.totalComplexity / this.metrics.files)}`);

    // Group by severity
    const bySeverity = {
      HIGH: allIssues.filter(i => i.severity === 'HIGH'),
      MEDIUM: allIssues.filter(i => i.severity === 'MEDIUM'),
      LOW: allIssues.filter(i => i.severity === 'LOW')
    };

    console.log(`\n🚨 Issues by Severity:`);
    console.log(`High: ${bySeverity.HIGH.length} 🔴`);
    console.log(`Medium: ${bySeverity.MEDIUM.length} 🟡`);
    console.log(`Low: ${bySeverity.LOW.length} 🟢`);

    // Category breakdown
    console.log(`\n📈 Issues by Category:`);
    console.log(`Performance: ${this.metrics.performanceIssues.length}`);
    console.log(`Database: ${this.metrics.databaseIssues.length}`);
    console.log(`Memory: ${this.metrics.memoryIssues.length}`);
    console.log(`Scalability: ${this.metrics.scalabilityIssues.length}`);

    // Detailed issues
    if (allIssues.length > 0) {
      console.log(`\n🔍 Critical Performance Issues:`);
      
      bySeverity.HIGH.slice(0, 10).forEach(issue => {
        console.log(`\n🔴 ${issue.type}`);
        console.log(`   File: ${issue.file}`);
        console.log(`   Issue: ${issue.description}`);
        console.log(`   Impact: ${issue.impact}`);
        console.log(`   Fix: ${issue.recommendation}`);
      });

      if (bySeverity.HIGH.length > 10) {
        console.log(`\n   ... and ${bySeverity.HIGH.length - 10} more high-priority issues`);
      }
    }

    // Performance score
    const performanceScore = this.calculatePerformanceScore(bySeverity);
    console.log(`\n⭐ Performance Score: ${performanceScore}/100`);

    // Recommendations
    this.generatePerformanceRecommendations(bySeverity);

    // Scalability assessment
    this.assessScalability();
  }

  calculatePerformanceScore(bySeverity) {
    let score = 100;
    
    // Deduct points based on severity
    score -= bySeverity.HIGH.length * 15;
    score -= bySeverity.MEDIUM.length * 8;
    score -= bySeverity.LOW.length * 3;
    
    // Complexity penalty
    const avgComplexity = this.metrics.totalComplexity / this.metrics.files;
    if (avgComplexity > 15) score -= 20;
    else if (avgComplexity > 10) score -= 10;
    
    return Math.max(0, Math.round(score));
  }

  generatePerformanceRecommendations(bySeverity) {
    console.log(`\n💡 Performance Recommendations:`);
    
    if (bySeverity.HIGH.length > 0) {
      console.log(`🔴 CRITICAL OPTIMIZATIONS:`);
      console.log(`  - Fix blocking operations and async patterns`);
      console.log(`  - Optimize database queries and reduce N+1 problems`);
      console.log(`  - Address memory leaks and large allocations`);
      console.log(`  - Reduce cyclomatic complexity in critical paths`);
    }
    
    if (bySeverity.MEDIUM.length > 0) {
      console.log(`🟡 IMPORTANT IMPROVEMENTS:`);
      console.log(`  - Add pagination to large data queries`);
      console.log(`  - Optimize array operations and loops`);
      console.log(`  - Implement proper error handling`);
      console.log(`  - Add rate limiting to API endpoints`);
    }
    
    console.log(`\n✅ PERFORMANCE BEST PRACTICES:`);
    console.log(`  - Use Promise.all() for parallel async operations`);
    console.log(`  - Implement database query optimization`);
    console.log(`  - Add proper indexing strategies`);
    console.log(`  - Use streaming for large data processing`);
    console.log(`  - Implement caching layers`);
    console.log(`  - Monitor and profile performance regularly`);
    console.log(`  - Use connection pooling for databases`);
    console.log(`  - Implement graceful degradation`);
  }

  assessScalability() {
    console.log(`\n🚀 Scalability Assessment:`);
    
    const scalabilityScore = Math.max(0, 100 - (this.metrics.scalabilityIssues.length * 10));
    let scalabilityGrade;
    
    if (scalabilityScore >= 90) scalabilityGrade = 'A - Excellent';
    else if (scalabilityScore >= 80) scalabilityGrade = 'B - Good';
    else if (scalabilityScore >= 70) scalabilityGrade = 'C - Acceptable';
    else if (scalabilityScore >= 60) scalabilityGrade = 'D - Needs Work';
    else scalabilityGrade = 'F - Critical Issues';
    
    console.log(`Scalability Grade: ${scalabilityGrade} (${scalabilityScore}/100)`);
    
    console.log(`\n📊 Scalability Factors:`);
    console.log(`  Async Operations: ${this.metrics.performanceIssues.filter(i => i.type.includes('Async')).length === 0 ? '✅' : '❌'}`);
    console.log(`  Database Optimization: ${this.metrics.databaseIssues.length < 3 ? '✅' : '❌'}`);
    console.log(`  Memory Management: ${this.metrics.memoryIssues.length < 2 ? '✅' : '❌'}`);
    console.log(`  Rate Limiting: ${this.metrics.scalabilityIssues.filter(i => i.type.includes('Rate')).length === 0 ? '✅' : '❌'}`);
    console.log(`  Configuration-based: ${this.metrics.scalabilityIssues.filter(i => i.type.includes('Hardcoded')).length === 0 ? '✅' : '❌'}`);
    
    console.log(`\n🎯 Expected Performance Targets:`);
    console.log(`  Event Tracking: < 50ms response time`);
    console.log(`  Analytics Queries: < 2s response time`);
    console.log(`  Pattern Detection: < 10s processing time`);
    console.log(`  Concurrent Users: 1,000+ with proper scaling`);
    console.log(`  Events/Second: 500+ with queue optimization`);
  }
}

// Run the performance analysis
const analyzer = new PerformanceAnalyzer();
analyzer.analyze(__dirname);

console.log('\n' + '='.repeat(80));
console.log('Performance analysis complete! ⚡');
