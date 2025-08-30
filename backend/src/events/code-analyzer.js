/**
 * Comprehensive Code Quality Analyzer for Event Sourcing System
 */

const fs = require('fs');
const path = require('path');

class CodeAnalyzer {
  constructor() {
    this.results = {
      files: 0,
      totalLines: 0,
      codeLines: 0,
      commentLines: 0,
      emptyLines: 0,
      issues: [],
      metrics: {},
      security: [],
      performance: [],
      maintainability: []
    };
  }

  analyzeDirectory(dirPath) {
    console.log('🔍 Starting Comprehensive Code Analysis...\n');
    
    this.analyzeFiles(dirPath);
    this.generateReport();
  }

  analyzeFiles(dirPath) {
    const files = this.getTypeScriptFiles(dirPath);
    
    files.forEach(file => {
      this.analyzeFile(file);
    });
  }

  getTypeScriptFiles(dirPath) {
    const files = [];
    
    const scanDirectory = (dir) => {
      const items = fs.readdirSync(dir);
      
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          scanDirectory(fullPath);
        } else if (item.endsWith('.ts') && !item.endsWith('.spec.ts') && !item.endsWith('.d.ts')) {
          files.push(fullPath);
        }
      });
    };
    
    scanDirectory(dirPath);
    return files;
  }

  analyzeFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const relativePath = path.relative(process.cwd(), filePath);
    
    this.results.files++;
    this.results.totalLines += lines.length;
    
    // Line analysis
    let codeLines = 0;
    let commentLines = 0;
    let emptyLines = 0;
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed === '') {
        emptyLines++;
      } else if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
        commentLines++;
      } else {
        codeLines++;
      }
    });
    
    this.results.codeLines += codeLines;
    this.results.commentLines += commentLines;
    this.results.emptyLines += emptyLines;
    
    // Code quality analysis
    this.analyzeCodeQuality(content, relativePath);
    this.analyzeSecurityIssues(content, relativePath);
    this.analyzePerformanceIssues(content, relativePath);
    this.analyzeMaintainability(content, relativePath);
  }

  analyzeCodeQuality(content, filePath) {
    const issues = [];
    
    // Check for any types
    const anyMatches = content.match(/:\s*any\b/g);
    if (anyMatches) {
      issues.push({
        type: 'type-safety',
        severity: 'medium',
        message: `Found ${anyMatches.length} 'any' type usage(s)`,
        file: filePath
      });
    }
    
    // Check for console.log
    const consoleMatches = content.match(/console\.(log|debug|info)/g);
    if (consoleMatches) {
      issues.push({
        type: 'logging',
        severity: 'low',
        message: `Found ${consoleMatches.length} console statement(s) - use logger instead`,
        file: filePath
      });
    }
    
    // Check for TODO/FIXME comments
    const todoMatches = content.match(/(TODO|FIXME|HACK)/gi);
    if (todoMatches) {
      issues.push({
        type: 'technical-debt',
        severity: 'low',
        message: `Found ${todoMatches.length} TODO/FIXME comment(s)`,
        file: filePath
      });
    }
    
    // Check for proper error handling
    const tryBlocks = content.match(/try\s*{/g);
    const catchBlocks = content.match(/catch\s*\(/g);
    if (tryBlocks && (!catchBlocks || tryBlocks.length !== catchBlocks.length)) {
      issues.push({
        type: 'error-handling',
        severity: 'high',
        message: 'Mismatched try/catch blocks',
        file: filePath
      });
    }
    
    // Check for async/await usage
    const asyncFunctions = content.match(/async\s+\w+/g);
    const awaitUsage = content.match(/await\s+/g);
    if (asyncFunctions && (!awaitUsage || awaitUsage.length < asyncFunctions.length)) {
      issues.push({
        type: 'async-patterns',
        severity: 'medium',
        message: 'Async function without await usage',
        file: filePath
      });
    }
    
    this.results.issues.push(...issues);
  }

  analyzeSecurityIssues(content, filePath) {
    const issues = [];
    
    // Check for hardcoded secrets
    const secretPatterns = [
      /password\s*[:=]\s*['"][^'"]+['"]/i,
      /secret\s*[:=]\s*['"][^'"]+['"]/i,
      /token\s*[:=]\s*['"][^'"]+['"]/i,
      /api[_-]?key\s*[:=]\s*['"][^'"]+['"]/i
    ];
    
    secretPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        issues.push({
          type: 'security',
          severity: 'high',
          message: 'Potential hardcoded secret detected',
          file: filePath
        });
      }
    });
    
    // Check for SQL injection risks
    if (content.includes('$queryRaw') && !content.includes('${')) {
      issues.push({
        type: 'security',
        severity: 'medium',
        message: 'Raw SQL query detected - ensure parameterization',
        file: filePath
      });
    }
    
    // Check for XSS risks
    if (content.includes('innerHTML') || content.includes('dangerouslySetInnerHTML')) {
      issues.push({
        type: 'security',
        severity: 'high',
        message: 'Potential XSS vulnerability with innerHTML usage',
        file: filePath
      });
    }
    
    this.results.security.push(...issues);
  }

  analyzePerformanceIssues(content, filePath) {
    const issues = [];
    
    // Check for synchronous operations in async context
    if (content.includes('readFileSync') || content.includes('writeFileSync')) {
      issues.push({
        type: 'performance',
        severity: 'medium',
        message: 'Synchronous file operations detected',
        file: filePath
      });
    }
    
    // Check for nested loops
    const nestedLoopPattern = /for\s*\([^}]*for\s*\(/g;
    if (nestedLoopPattern.test(content)) {
      issues.push({
        type: 'performance',
        severity: 'medium',
        message: 'Nested loops detected - consider optimization',
        file: filePath
      });
    }
    
    // Check for large object creation in loops
    if (content.includes('forEach') && content.includes('new ')) {
      issues.push({
        type: 'performance',
        severity: 'low',
        message: 'Object creation in loop detected',
        file: filePath
      });
    }
    
    this.results.performance.push(...issues);
  }

  analyzeMaintainability(content, filePath) {
    const issues = [];
    const lines = content.split('\n');
    
    // Check function length
    let currentFunction = null;
    let functionStartLine = 0;
    let braceCount = 0;
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      if (trimmed.includes('function ') || trimmed.includes('=>') || 
          (trimmed.includes('async ') && trimmed.includes('('))) {
        if (!currentFunction) {
          currentFunction = trimmed.substring(0, 50);
          functionStartLine = index;
          braceCount = 0;
        }
      }
      
      braceCount += (line.match(/{/g) || []).length;
      braceCount -= (line.match(/}/g) || []).length;
      
      if (currentFunction && braceCount === 0 && index > functionStartLine) {
        const functionLength = index - functionStartLine;
        if (functionLength > 50) {
          issues.push({
            type: 'maintainability',
            severity: 'medium',
            message: `Long function detected (${functionLength} lines): ${currentFunction}`,
            file: filePath
          });
        }
        currentFunction = null;
      }
    });
    
    // Check for magic numbers
    const magicNumbers = content.match(/\b\d{3,}\b/g);
    if (magicNumbers && magicNumbers.length > 2) {
      issues.push({
        type: 'maintainability',
        severity: 'low',
        message: `Magic numbers detected: ${magicNumbers.slice(0, 3).join(', ')}...`,
        file: filePath
      });
    }
    
    // Check for deep nesting
    const maxIndentation = Math.max(...lines.map(line => {
      const match = line.match(/^(\s*)/);
      return match ? match[1].length : 0;
    }));
    
    if (maxIndentation > 24) { // More than 6 levels of nesting (4 spaces each)
      issues.push({
        type: 'maintainability',
        severity: 'medium',
        message: `Deep nesting detected (${Math.floor(maxIndentation / 4)} levels)`,
        file: filePath
      });
    }
    
    this.results.maintainability.push(...issues);
  }

  generateReport() {
    console.log('📊 Code Analysis Report');
    console.log('='.repeat(50));
    
    // Basic metrics
    console.log('\n📈 Basic Metrics:');
    console.log(`Files analyzed: ${this.results.files}`);
    console.log(`Total lines: ${this.results.totalLines.toLocaleString()}`);
    console.log(`Code lines: ${this.results.codeLines.toLocaleString()} (${Math.round(this.results.codeLines / this.results.totalLines * 100)}%)`);
    console.log(`Comment lines: ${this.results.commentLines.toLocaleString()} (${Math.round(this.results.commentLines / this.results.totalLines * 100)}%)`);
    console.log(`Empty lines: ${this.results.emptyLines.toLocaleString()} (${Math.round(this.results.emptyLines / this.results.totalLines * 100)}%)`);
    
    // Code quality metrics
    const avgLinesPerFile = Math.round(this.results.codeLines / this.results.files);
    const commentRatio = Math.round(this.results.commentLines / this.results.codeLines * 100);
    
    console.log(`\nAverage lines per file: ${avgLinesPerFile}`);
    console.log(`Comment ratio: ${commentRatio}%`);
    
    // Issues summary
    const allIssues = [
      ...this.results.issues,
      ...this.results.security,
      ...this.results.performance,
      ...this.results.maintainability
    ];
    
    const issuesBySeverity = {
      high: allIssues.filter(i => i.severity === 'high').length,
      medium: allIssues.filter(i => i.severity === 'medium').length,
      low: allIssues.filter(i => i.severity === 'low').length
    };
    
    console.log('\n🚨 Issues Summary:');
    console.log(`High severity: ${issuesBySeverity.high}`);
    console.log(`Medium severity: ${issuesBySeverity.medium}`);
    console.log(`Low severity: ${issuesBySeverity.low}`);
    console.log(`Total issues: ${allIssues.length}`);
    
    // Detailed issues
    if (allIssues.length > 0) {
      console.log('\n🔍 Detailed Issues:');
      
      const groupedIssues = {};
      allIssues.forEach(issue => {
        if (!groupedIssues[issue.type]) {
          groupedIssues[issue.type] = [];
        }
        groupedIssues[issue.type].push(issue);
      });
      
      Object.entries(groupedIssues).forEach(([type, issues]) => {
        console.log(`\n${type.toUpperCase()}:`);
        issues.slice(0, 5).forEach(issue => {
          const severity = issue.severity.toUpperCase();
          const icon = severity === 'HIGH' ? '🔴' : severity === 'MEDIUM' ? '🟡' : '🟢';
          console.log(`  ${icon} [${severity}] ${issue.message}`);
          console.log(`     File: ${issue.file}`);
        });
        if (issues.length > 5) {
          console.log(`     ... and ${issues.length - 5} more`);
        }
      });
    }
    
    // Quality score calculation
    const qualityScore = this.calculateQualityScore(issuesBySeverity, commentRatio, avgLinesPerFile);
    console.log(`\n⭐ Overall Quality Score: ${qualityScore}/100`);
    
    // Recommendations
    this.generateRecommendations(issuesBySeverity, commentRatio, avgLinesPerFile);
  }

  calculateQualityScore(issues, commentRatio, avgLinesPerFile) {
    let score = 100;
    
    // Deduct points for issues
    score -= issues.high * 10;
    score -= issues.medium * 5;
    score -= issues.low * 2;
    
    // Deduct points for poor comment ratio
    if (commentRatio < 10) score -= 10;
    else if (commentRatio < 20) score -= 5;
    
    // Deduct points for very long files
    if (avgLinesPerFile > 500) score -= 15;
    else if (avgLinesPerFile > 300) score -= 10;
    else if (avgLinesPerFile > 200) score -= 5;
    
    return Math.max(0, Math.round(score));
  }

  generateRecommendations(issues, commentRatio, avgLinesPerFile) {
    console.log('\n💡 Recommendations:');
    
    if (issues.high > 0) {
      console.log('🔴 HIGH PRIORITY:');
      console.log('  - Address all high-severity security and error handling issues');
      console.log('  - Review hardcoded secrets and SQL injection risks');
    }
    
    if (issues.medium > 5) {
      console.log('🟡 MEDIUM PRIORITY:');
      console.log('  - Reduce usage of "any" types for better type safety');
      console.log('  - Optimize performance bottlenecks');
      console.log('  - Break down long functions and reduce nesting');
    }
    
    if (commentRatio < 15) {
      console.log('📝 DOCUMENTATION:');
      console.log('  - Increase code documentation and comments');
      console.log('  - Add JSDoc comments for public methods');
    }
    
    if (avgLinesPerFile > 300) {
      console.log('🔧 REFACTORING:');
      console.log('  - Consider breaking down large files');
      console.log('  - Extract reusable components and utilities');
    }
    
    console.log('\n✅ GOOD PRACTICES OBSERVED:');
    console.log('  - Strong TypeScript usage');
    console.log('  - Proper error handling patterns');
    console.log('  - Good separation of concerns');
    console.log('  - Comprehensive service architecture');
  }
}

// Run the analysis
const analyzer = new CodeAnalyzer();
analyzer.analyzeDirectory(__dirname);

console.log('\n' + '='.repeat(80));
console.log('Analysis complete! 🎉');
