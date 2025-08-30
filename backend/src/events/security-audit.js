/**
 * Security Audit Tool for Event Sourcing System
 */

const fs = require('fs');
const path = require('path');

class SecurityAuditor {
  constructor() {
    this.vulnerabilities = [];
    this.securityScore = 100;
    this.checkedFiles = 0;
  }

  audit(dirPath) {
    console.log('🔒 Starting Security Audit...\n');
    
    this.auditDirectory(dirPath);
    this.generateSecurityReport();
  }

  auditDirectory(dirPath) {
    const files = this.getSourceFiles(dirPath);
    
    files.forEach(file => {
      this.auditFile(file);
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
        } else if (item.endsWith('.ts') || item.endsWith('.js')) {
          files.push(fullPath);
        }
      });
    };
    
    scanDirectory(dirPath);
    return files;
  }

  auditFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(process.cwd(), filePath);
    
    this.checkedFiles++;
    
    // Security checks
    this.checkHardcodedSecrets(content, relativePath);
    this.checkSQLInjection(content, relativePath);
    this.checkXSSVulnerabilities(content, relativePath);
    this.checkInputValidation(content, relativePath);
    this.checkAuthenticationIssues(content, relativePath);
    this.checkDataExposure(content, relativePath);
    this.checkCryptographicIssues(content, relativePath);
    this.checkLoggingSecurity(content, relativePath);
  }

  checkHardcodedSecrets(content, filePath) {
    const secretPatterns = [
      { pattern: /password\s*[:=]\s*['"][^'"]{8,}['"]/, severity: 'HIGH', type: 'Hardcoded Password' },
      { pattern: /secret\s*[:=]\s*['"][^'"]{16,}['"]/, severity: 'HIGH', type: 'Hardcoded Secret' },
      { pattern: /token\s*[:=]\s*['"][^'"]{20,}['"]/, severity: 'HIGH', type: 'Hardcoded Token' },
      { pattern: /api[_-]?key\s*[:=]\s*['"][^'"]{16,}['"]/, severity: 'HIGH', type: 'Hardcoded API Key' },
      { pattern: /private[_-]?key\s*[:=]\s*['"][^'"]{32,}['"]/, severity: 'CRITICAL', type: 'Hardcoded Private Key' },
      { pattern: /jwt[_-]?secret\s*[:=]\s*['"][^'"]{16,}['"]/, severity: 'HIGH', type: 'Hardcoded JWT Secret' }
    ];

    secretPatterns.forEach(({ pattern, severity, type }) => {
      const matches = content.match(pattern);
      if (matches) {
        this.addVulnerability({
          type,
          severity,
          file: filePath,
          description: `${type} found in source code`,
          recommendation: 'Move secrets to environment variables or secure vault'
        });
      }
    });
  }

  checkSQLInjection(content, filePath) {
    // Check for raw SQL queries
    const rawSQLPatterns = [
      { pattern: /\$queryRaw`[^`]*\$\{[^}]+\}[^`]*`/, severity: 'HIGH', type: 'SQL Injection Risk' },
      { pattern: /query\s*\(\s*['"][^'"]*\$\{[^}]+\}[^'"]*['"]/, severity: 'HIGH', type: 'SQL Injection Risk' },
      { pattern: /execute\s*\(\s*['"][^'"]*\+[^'"]*['"]/, severity: 'MEDIUM', type: 'SQL Concatenation' }
    ];

    rawSQLPatterns.forEach(({ pattern, severity, type }) => {
      if (pattern.test(content)) {
        this.addVulnerability({
          type,
          severity,
          file: filePath,
          description: 'Potential SQL injection vulnerability detected',
          recommendation: 'Use parameterized queries and input validation'
        });
      }
    });
  }

  checkXSSVulnerabilities(content, filePath) {
    const xssPatterns = [
      { pattern: /innerHTML\s*=/, severity: 'HIGH', type: 'XSS Vulnerability' },
      { pattern: /dangerouslySetInnerHTML/, severity: 'HIGH', type: 'XSS Vulnerability' },
      { pattern: /document\.write\s*\(/, severity: 'MEDIUM', type: 'XSS Risk' },
      { pattern: /eval\s*\(/, severity: 'CRITICAL', type: 'Code Injection' }
    ];

    xssPatterns.forEach(({ pattern, severity, type }) => {
      if (pattern.test(content)) {
        this.addVulnerability({
          type,
          severity,
          file: filePath,
          description: 'Potential XSS vulnerability detected',
          recommendation: 'Sanitize user input and use safe DOM manipulation'
        });
      }
    });
  }

  checkInputValidation(content, filePath) {
    // Check for missing input validation
    if (content.includes('@Body()') || content.includes('@Query()') || content.includes('@Param()')) {
      const hasValidation = content.includes('@IsString()') || 
                           content.includes('@IsNumber()') || 
                           content.includes('@IsEmail()') ||
                           content.includes('class-validator');
      
      if (!hasValidation) {
        this.addVulnerability({
          type: 'Missing Input Validation',
          severity: 'MEDIUM',
          file: filePath,
          description: 'Controller endpoints without input validation',
          recommendation: 'Add class-validator decorators to DTOs'
        });
      }
    }
  }

  checkAuthenticationIssues(content, filePath) {
    // Check for authentication bypasses
    const authIssues = [
      { pattern: /\/\*\s*@UseGuards\([^)]+\)\s*\*\//, severity: 'HIGH', type: 'Commented Auth Guard' },
      { pattern: /@Public\(\)/, severity: 'MEDIUM', type: 'Public Endpoint' },
      { pattern: /jwt\.sign\([^,]+,\s*['"][^'"]{1,15}['"]/, severity: 'HIGH', type: 'Weak JWT Secret' }
    ];

    authIssues.forEach(({ pattern, severity, type }) => {
      if (pattern.test(content)) {
        this.addVulnerability({
          type,
          severity,
          file: filePath,
          description: `${type} detected`,
          recommendation: 'Review authentication implementation'
        });
      }
    });
  }

  checkDataExposure(content, filePath) {
    // Check for sensitive data exposure
    const exposurePatterns = [
      { pattern: /password(?!Hash)/, severity: 'MEDIUM', type: 'Password Field Exposure' },
      { pattern: /select.*\*.*from/i, severity: 'LOW', type: 'SELECT * Query' },
      { pattern: /console\.log\([^)]*password[^)]*\)/, severity: 'HIGH', type: 'Password Logging' },
      { pattern: /console\.log\([^)]*token[^)]*\)/, severity: 'HIGH', type: 'Token Logging' }
    ];

    exposurePatterns.forEach(({ pattern, severity, type }) => {
      if (pattern.test(content)) {
        this.addVulnerability({
          type,
          severity,
          file: filePath,
          description: `${type} detected`,
          recommendation: 'Avoid exposing sensitive data'
        });
      }
    });
  }

  checkCryptographicIssues(content, filePath) {
    const cryptoIssues = [
      { pattern: /md5|sha1/i, severity: 'HIGH', type: 'Weak Hash Algorithm' },
      { pattern: /Math\.random\(\)/, severity: 'MEDIUM', type: 'Weak Random Generator' },
      { pattern: /crypto\.createHash\(['"]md5['"]/, severity: 'HIGH', type: 'MD5 Usage' }
    ];

    cryptoIssues.forEach(({ pattern, severity, type }) => {
      if (pattern.test(content)) {
        this.addVulnerability({
          type,
          severity,
          file: filePath,
          description: `${type} detected`,
          recommendation: 'Use cryptographically secure alternatives'
        });
      }
    });
  }

  checkLoggingSecurity(content, filePath) {
    // Check for sensitive data in logs
    if (content.includes('logger') || content.includes('console.log')) {
      const sensitiveLogging = [
        /log.*password/i,
        /log.*token/i,
        /log.*secret/i,
        /log.*key/i
      ];

      sensitiveLogging.forEach(pattern => {
        if (pattern.test(content)) {
          this.addVulnerability({
            type: 'Sensitive Data Logging',
            severity: 'HIGH',
            file: filePath,
            description: 'Sensitive data may be logged',
            recommendation: 'Sanitize log data and avoid logging sensitive information'
          });
        }
      });
    }
  }

  addVulnerability(vulnerability) {
    this.vulnerabilities.push(vulnerability);
    
    // Deduct points based on severity
    switch (vulnerability.severity) {
      case 'CRITICAL':
        this.securityScore -= 20;
        break;
      case 'HIGH':
        this.securityScore -= 10;
        break;
      case 'MEDIUM':
        this.securityScore -= 5;
        break;
      case 'LOW':
        this.securityScore -= 2;
        break;
    }
  }

  generateSecurityReport() {
    console.log('🔒 Security Audit Report');
    console.log('='.repeat(50));
    
    console.log(`\n📊 Audit Summary:`);
    console.log(`Files scanned: ${this.checkedFiles}`);
    console.log(`Vulnerabilities found: ${this.vulnerabilities.length}`);
    console.log(`Security Score: ${Math.max(0, this.securityScore)}/100`);
    
    // Group vulnerabilities by severity
    const bySeverity = {
      CRITICAL: this.vulnerabilities.filter(v => v.severity === 'CRITICAL'),
      HIGH: this.vulnerabilities.filter(v => v.severity === 'HIGH'),
      MEDIUM: this.vulnerabilities.filter(v => v.severity === 'MEDIUM'),
      LOW: this.vulnerabilities.filter(v => v.severity === 'LOW')
    };
    
    console.log(`\n🚨 Vulnerabilities by Severity:`);
    console.log(`Critical: ${bySeverity.CRITICAL.length} 🔴`);
    console.log(`High: ${bySeverity.HIGH.length} 🟠`);
    console.log(`Medium: ${bySeverity.MEDIUM.length} 🟡`);
    console.log(`Low: ${bySeverity.LOW.length} 🟢`);
    
    // Detailed vulnerabilities
    if (this.vulnerabilities.length > 0) {
      console.log(`\n🔍 Detailed Findings:`);
      
      ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].forEach(severity => {
        const vulns = bySeverity[severity];
        if (vulns.length > 0) {
          console.log(`\n${severity} SEVERITY:`);
          vulns.forEach((vuln, index) => {
            const icon = severity === 'CRITICAL' ? '🔴' : 
                        severity === 'HIGH' ? '🟠' : 
                        severity === 'MEDIUM' ? '🟡' : '🟢';
            console.log(`  ${icon} ${vuln.type}`);
            console.log(`     File: ${vuln.file}`);
            console.log(`     Issue: ${vuln.description}`);
            console.log(`     Fix: ${vuln.recommendation}`);
            if (index < vulns.length - 1) console.log('');
          });
        }
      });
    }
    
    // Security recommendations
    this.generateSecurityRecommendations(bySeverity);
    
    // Compliance check
    this.checkCompliance();
  }

  generateSecurityRecommendations(bySeverity) {
    console.log(`\n💡 Security Recommendations:`);
    
    if (bySeverity.CRITICAL.length > 0) {
      console.log(`🔴 CRITICAL ACTIONS REQUIRED:`);
      console.log(`  - Address all critical vulnerabilities immediately`);
      console.log(`  - Review code injection and hardcoded secrets`);
      console.log(`  - Implement security code review process`);
    }
    
    if (bySeverity.HIGH.length > 0) {
      console.log(`🟠 HIGH PRIORITY:`);
      console.log(`  - Fix SQL injection and XSS vulnerabilities`);
      console.log(`  - Implement proper input validation`);
      console.log(`  - Review authentication mechanisms`);
    }
    
    if (bySeverity.MEDIUM.length > 0) {
      console.log(`🟡 MEDIUM PRIORITY:`);
      console.log(`  - Enhance input validation coverage`);
      console.log(`  - Review data exposure risks`);
      console.log(`  - Implement security headers`);
    }
    
    console.log(`\n✅ SECURITY BEST PRACTICES:`);
    console.log(`  - Use environment variables for secrets`);
    console.log(`  - Implement rate limiting`);
    console.log(`  - Add security headers middleware`);
    console.log(`  - Regular security audits`);
    console.log(`  - Dependency vulnerability scanning`);
    console.log(`  - Implement CSRF protection`);
    console.log(`  - Use HTTPS in production`);
    console.log(`  - Implement proper session management`);
  }

  checkCompliance() {
    console.log(`\n📋 Compliance Assessment:`);
    
    const score = Math.max(0, this.securityScore);
    let grade, status;
    
    if (score >= 90) {
      grade = 'A';
      status = '✅ EXCELLENT';
    } else if (score >= 80) {
      grade = 'B';
      status = '✅ GOOD';
    } else if (score >= 70) {
      grade = 'C';
      status = '⚠️ ACCEPTABLE';
    } else if (score >= 60) {
      grade = 'D';
      status = '⚠️ NEEDS IMPROVEMENT';
    } else {
      grade = 'F';
      status = '❌ CRITICAL ISSUES';
    }
    
    console.log(`Security Grade: ${grade} (${score}/100) - ${status}`);
    
    // Group vulnerabilities by severity for compliance check
    const bySeverity = {
      CRITICAL: this.vulnerabilities.filter(v => v.severity === 'CRITICAL'),
      HIGH: this.vulnerabilities.filter(v => v.severity === 'HIGH'),
      MEDIUM: this.vulnerabilities.filter(v => v.severity === 'MEDIUM'),
      LOW: this.vulnerabilities.filter(v => v.severity === 'LOW')
    };
    
    // OWASP Top 10 compliance
    console.log(`\n🛡️ OWASP Top 10 Compliance:`);
    console.log(`  A01 - Broken Access Control: ${bySeverity.HIGH.filter(v => v.type.includes('Auth')).length === 0 ? '✅' : '❌'}`);
    console.log(`  A02 - Cryptographic Failures: ${bySeverity.HIGH.filter(v => v.type.includes('Hash')).length === 0 ? '✅' : '❌'}`);
    console.log(`  A03 - Injection: ${bySeverity.HIGH.filter(v => v.type.includes('Injection')).length === 0 ? '✅' : '❌'}`);
    console.log(`  A04 - Insecure Design: ⚠️ Manual Review Required`);
    console.log(`  A05 - Security Misconfiguration: ⚠️ Manual Review Required`);
    console.log(`  A06 - Vulnerable Components: ⚠️ Dependency Scan Required`);
    console.log(`  A07 - Identity/Auth Failures: ${bySeverity.HIGH.filter(v => v.type.includes('Auth')).length === 0 ? '✅' : '❌'}`);
    console.log(`  A08 - Software Integrity: ⚠️ Manual Review Required`);
    console.log(`  A09 - Logging Failures: ${bySeverity.HIGH.filter(v => v.type.includes('Logging')).length === 0 ? '✅' : '❌'}`);
    console.log(`  A10 - Server-Side Request Forgery: ✅ Not Applicable`);
  }
}

// Run the security audit
const auditor = new SecurityAuditor();
auditor.audit(__dirname);

console.log('\n' + '='.repeat(80));
console.log('Security audit complete! 🔒');
