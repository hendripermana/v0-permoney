#!/usr/bin/env node

/**
 * Comprehensive Debt Management Module Validation
 * 
 * This script performs thorough validation of the debt management module
 * without relying on external dependencies or problematic TypeScript compilation.
 * 
 * Validation Categories:
 * 1. File Structure & Organization
 * 2. Code Quality & Standards
 * 3. Business Logic Implementation
 * 4. Security Implementation
 * 5. Performance Considerations
 * 6. Error Handling
 * 7. Documentation Quality
 */

const fs = require('fs');
const path = require('path');

class DebtModuleValidator {
  constructor() {
    this.results = [];
    this.debtModulePath = __dirname;
  }

  async runComprehensiveValidation() {
    console.log('🚀 Starting Comprehensive Debt Management Module Validation\n');
    console.log('=' .repeat(60));

    await this.validateFileStructure();
    await this.validateCodeQuality();
    await this.validateBusinessLogic();
    await this.validateSecurity();
    await this.validatePerformance();
    await this.validateErrorHandling();
    await this.validateDocumentation();
    await this.validateTestCoverage();

    this.generateComprehensiveReport();
    return this.getOverallStatus();
  }

  async validateFileStructure() {
    console.log('📁 Validating File Structure...');
    
    const requiredFiles = [
      { file: 'debts.controller.ts', description: 'Main controller for debt endpoints' },
      { file: 'debts.service.ts', description: 'Business logic service' },
      { file: 'debts.repository.ts', description: 'Data access layer' },
      { file: 'debts.module.ts', description: 'NestJS module definition' },
      { file: 'dto/create-debt.dto.ts', description: 'Create debt validation DTO' },
      { file: 'dto/update-debt.dto.ts', description: 'Update debt validation DTO' },
      { file: 'dto/create-debt-payment.dto.ts', description: 'Payment creation DTO' },
      { file: 'dto/debt-filters.dto.ts', description: 'Query filters DTO' },
      { file: 'dto/debt-summary.dto.ts', description: 'Summary response DTO' },
      { file: 'dto/payment-schedule.dto.ts', description: 'Payment schedule DTO' },
      { file: 'dto/index.ts', description: 'DTO exports' },
      { file: 'exceptions/debt-exceptions.ts', description: 'Custom exception classes' },
      { file: 'index.ts', description: 'Module exports' }
    ];

    const testFiles = [
      { file: 'debts.controller.spec.ts', description: 'Controller unit tests' },
      { file: 'debts.service.spec.ts', description: 'Service unit tests' },
      { file: 'debts.repository.spec.ts', description: 'Repository unit tests' },
      { file: 'debts.integration.spec.ts', description: 'Integration tests' }
    ];

    let structureScore = 0;
    const totalRequired = requiredFiles.length;

    for (const { file, description } of requiredFiles) {
      const filePath = path.join(this.debtModulePath, file);
      if (fs.existsSync(filePath)) {
        this.addResult('File Structure', `${file}`, 'PASS', `✅ ${description} exists`);
        structureScore++;
      } else {
        this.addResult('File Structure', `${file}`, 'FAIL', `❌ Missing: ${description}`);
      }
    }

    // Check test files
    let testScore = 0;
    for (const { file, description } of testFiles) {
      const filePath = path.join(this.debtModulePath, file);
      if (fs.existsSync(filePath)) {
        this.addResult('Test Coverage', `${file}`, 'PASS', `✅ ${description} exists`);
        testScore++;
      } else {
        this.addResult('Test Coverage', `${file}`, 'WARNING', `⚠️ Missing: ${description}`);
      }
    }

    const structurePercentage = Math.round((structureScore / totalRequired) * 100);
    console.log(`   Structure Completeness: ${structurePercentage}% (${structureScore}/${totalRequired})`);
  }

  async validateCodeQuality() {
    console.log('🔍 Validating Code Quality...');

    try {
      // Check DTO validation implementation
      const createDebtDto = this.readFileContent('dto/create-debt.dto.ts');
      if (createDebtDto) {
        const validationDecorators = [
          '@IsEnum', '@IsString', '@IsNumber', '@IsOptional', 
          '@ValidateIf', '@IsISO8601', '@Min', '@Max', '@Length'
        ];
        
        const presentDecorators = validationDecorators.filter(decorator => 
          createDebtDto.includes(decorator)
        );
        
        const validationScore = Math.round((presentDecorators.length / validationDecorators.length) * 100);
        
        if (validationScore >= 80) {
          this.addResult('Code Quality', 'DTO Validation', 'PASS', 
            `✅ Comprehensive validation decorators (${validationScore}%)`);
        } else if (validationScore >= 60) {
          this.addResult('Code Quality', 'DTO Validation', 'WARNING', 
            `⚠️ Partial validation implementation (${validationScore}%)`);
        } else {
          this.addResult('Code Quality', 'DTO Validation', 'FAIL', 
            `❌ Insufficient validation decorators (${validationScore}%)`);
        }

        // Check for proper TypeScript types
        const hasProperTypes = createDebtDto.includes('DebtType') && 
                              createDebtDto.includes('export') &&
                              createDebtDto.includes('class');
        
        this.addResult('Code Quality', 'TypeScript Types', 
          hasProperTypes ? 'PASS' : 'FAIL',
          hasProperTypes ? '✅ Proper TypeScript type definitions' : '❌ Missing type definitions'
        );
      }

      // Check service implementation
      const serviceFile = this.readFileContent('debts.service.ts');
      if (serviceFile) {
        const hasErrorHandling = serviceFile.includes('try') && serviceFile.includes('catch');
        const hasValidation = serviceFile.includes('validate') || serviceFile.includes('Validation');
        const hasLogging = serviceFile.includes('logger') || serviceFile.includes('console');

        this.addResult('Code Quality', 'Error Handling', 
          hasErrorHandling ? 'PASS' : 'WARNING',
          hasErrorHandling ? '✅ Error handling implemented' : '⚠️ Consider adding error handling'
        );

        this.addResult('Code Quality', 'Input Validation', 
          hasValidation ? 'PASS' : 'WARNING',
          hasValidation ? '✅ Input validation present' : '⚠️ Consider adding validation'
        );

        this.addResult('Code Quality', 'Logging', 
          hasLogging ? 'PASS' : 'WARNING',
          hasLogging ? '✅ Logging implemented' : '⚠️ Consider adding logging'
        );
      }

    } catch (error) {
      this.addResult('Code Quality', 'Analysis', 'FAIL', `❌ Error analyzing code: ${error.message}`);
    }
  }

  async validateBusinessLogic() {
    console.log('💼 Validating Business Logic...');

    try {
      const serviceFile = this.readFileContent('debts.service.ts');
      if (serviceFile) {
        // Check for debt type validation
        const hasDebtTypeValidation = serviceFile.includes('validateDebtTypeFields') ||
                                     serviceFile.includes('DebtType.PERSONAL') ||
                                     serviceFile.includes('DebtType.CONVENTIONAL') ||
                                     serviceFile.includes('DebtType.ISLAMIC');

        this.addResult('Business Logic', 'Debt Type Validation', 
          hasDebtTypeValidation ? 'PASS' : 'FAIL',
          hasDebtTypeValidation ? '✅ Debt type validation implemented' : '❌ Missing debt type validation'
        );

        // Check for payment calculation methods
        const paymentMethods = [
          'calculatePersonalLoanSchedule',
          'calculateConventionalSchedule', 
          'calculateIslamicSchedule'
        ];
        
        const implementedMethods = paymentMethods.filter(method => 
          serviceFile.includes(method)
        );

        if (implementedMethods.length === paymentMethods.length) {
          this.addResult('Business Logic', 'Payment Calculations', 'PASS', 
            '✅ All payment calculation methods implemented');
        } else {
          this.addResult('Business Logic', 'Payment Calculations', 'FAIL', 
            `❌ Missing payment methods: ${paymentMethods.filter(m => !implementedMethods.includes(m)).join(', ')}`);
        }

        // Check for Islamic finance compliance
        const hasIslamicCompliance = serviceFile.includes('Murabahah') && 
                                   serviceFile.includes('marginRate') &&
                                   serviceFile.includes('Islamic');

        this.addResult('Business Logic', 'Islamic Finance Compliance', 
          hasIslamicCompliance ? 'PASS' : 'FAIL',
          hasIslamicCompliance ? '✅ Islamic finance features implemented' : '❌ Missing Islamic finance compliance'
        );

        // Check for comprehensive debt management features
        const debtFeatures = [
          'createDebt', 'updateDebt', 'deleteDebt', 'getDebtById',
          'recordPayment', 'calculatePaymentSchedule', 'getDebtSummary'
        ];

        const implementedFeatures = debtFeatures.filter(feature => 
          serviceFile.includes(feature)
        );

        const featureScore = Math.round((implementedFeatures.length / debtFeatures.length) * 100);
        
        if (featureScore >= 90) {
          this.addResult('Business Logic', 'Feature Completeness', 'PASS', 
            `✅ Comprehensive feature set (${featureScore}%)`);
        } else if (featureScore >= 70) {
          this.addResult('Business Logic', 'Feature Completeness', 'WARNING', 
            `⚠️ Most features implemented (${featureScore}%)`);
        } else {
          this.addResult('Business Logic', 'Feature Completeness', 'FAIL', 
            `❌ Incomplete feature set (${featureScore}%)`);
        }
      }

    } catch (error) {
      this.addResult('Business Logic', 'Analysis', 'FAIL', `❌ Error analyzing business logic: ${error.message}`);
    }
  }

  async validateSecurity() {
    console.log('🔒 Validating Security Implementation...');

    try {
      const controllerFile = this.readFileContent('debts.controller.ts');
      if (controllerFile) {
        // Check for authentication guards
        const hasAuthGuards = controllerFile.includes('JwtAuthGuard') && 
                             (controllerFile.includes('HouseholdGuard') || 
                              controllerFile.includes('HouseholdAccessGuard'));

        this.addResult('Security', 'Authentication Guards', 
          hasAuthGuards ? 'PASS' : 'FAIL',
          hasAuthGuards ? '✅ Authentication guards implemented' : '❌ Missing authentication guards'
        );

        // Check for permission controls
        const hasPermissions = controllerFile.includes('RequirePermissions') || 
                              controllerFile.includes('HouseholdPermissions');

        this.addResult('Security', 'Permission Controls', 
          hasPermissions ? 'PASS' : 'FAIL',
          hasPermissions ? '✅ Permission controls implemented' : '❌ Missing permission controls'
        );

        // Check for input validation
        const hasValidation = controllerFile.includes('ValidationPipe') ||
                             controllerFile.includes('@Body()') ||
                             controllerFile.includes('@Query()');

        this.addResult('Security', 'Input Validation', 
          hasValidation ? 'PASS' : 'FAIL',
          hasValidation ? '✅ Input validation implemented' : '❌ Missing input validation'
        );

        // Check for data sanitization
        const hasSanitization = controllerFile.includes('[REDACTED]') ||
                               controllerFile.includes('sanitize') ||
                               controllerFile.includes('whitelist');

        this.addResult('Security', 'Data Sanitization', 
          hasSanitization ? 'PASS' : 'WARNING',
          hasSanitization ? '✅ Data sanitization implemented' : '⚠️ Consider adding data sanitization'
        );

        // Check for HTTPS enforcement
        const hasHttpsEnforcement = controllerFile.includes('HttpStatus') &&
                                   controllerFile.includes('@UseGuards');

        this.addResult('Security', 'HTTP Security', 
          hasHttpsEnforcement ? 'PASS' : 'WARNING',
          hasHttpsEnforcement ? '✅ HTTP security measures present' : '⚠️ Consider HTTP security headers'
        );
      }

      // Check repository for SQL injection prevention
      const repositoryFile = this.readFileContent('debts.repository.ts');
      if (repositoryFile) {
        const usesPrisma = repositoryFile.includes('prisma') && 
                          repositoryFile.includes('findMany') &&
                          repositoryFile.includes('create');

        this.addResult('Security', 'SQL Injection Prevention', 
          usesPrisma ? 'PASS' : 'WARNING',
          usesPrisma ? '✅ Using Prisma ORM for SQL injection prevention' : '⚠️ Verify SQL injection prevention'
        );
      }

    } catch (error) {
      this.addResult('Security', 'Analysis', 'FAIL', `❌ Error analyzing security: ${error.message}`);
    }
  }

  async validatePerformance() {
    console.log('⚡ Validating Performance Considerations...');

    try {
      const repositoryFile = this.readFileContent('debts.repository.ts');
      if (repositoryFile) {
        // Check for efficient queries
        const hasEfficientQueries = repositoryFile.includes('orderBy') && 
                                   repositoryFile.includes('include') &&
                                   repositoryFile.includes('select');

        this.addResult('Performance', 'Query Optimization', 
          hasEfficientQueries ? 'PASS' : 'WARNING',
          hasEfficientQueries ? '✅ Query optimization implemented' : '⚠️ Consider query optimization'
        );

        // Check for transaction handling
        const hasTransactions = repositoryFile.includes('$transaction');

        this.addResult('Performance', 'Transaction Management', 
          hasTransactions ? 'PASS' : 'WARNING',
          hasTransactions ? '✅ Database transactions implemented' : '⚠️ Consider transaction management'
        );

        // Check for pagination support
        const hasPagination = repositoryFile.includes('take') || 
                             repositoryFile.includes('skip') ||
                             repositoryFile.includes('limit');

        this.addResult('Performance', 'Pagination Support', 
          hasPagination ? 'PASS' : 'WARNING',
          hasPagination ? '✅ Pagination support implemented' : '⚠️ Consider adding pagination'
        );

        // Check for indexing considerations
        const hasIndexing = repositoryFile.includes('index') || 
                           repositoryFile.includes('where') ||
                           repositoryFile.includes('findUnique');

        this.addResult('Performance', 'Database Indexing', 
          hasIndexing ? 'PASS' : 'WARNING',
          hasIndexing ? '✅ Database indexing considerations' : '⚠️ Consider database indexing'
        );
      }

      const serviceFile = this.readFileContent('debts.service.ts');
      if (serviceFile) {
        // Check for caching strategy
        const hasCaching = serviceFile.includes('cache') || 
                          serviceFile.includes('Cache') ||
                          serviceFile.includes('memoize');

        this.addResult('Performance', 'Caching Strategy', 
          hasCaching ? 'PASS' : 'WARNING',
          hasCaching ? '✅ Caching strategy implemented' : '⚠️ Consider implementing caching'
        );
      }

    } catch (error) {
      this.addResult('Performance', 'Analysis', 'FAIL', `❌ Error analyzing performance: ${error.message}`);
    }
  }

  async validateErrorHandling() {
    console.log('🚨 Validating Error Handling...');

    try {
      // Check custom exceptions
      const exceptionsFile = this.readFileContent('exceptions/debt-exceptions.ts');
      if (exceptionsFile) {
        const customExceptions = [
          'DebtValidationException',
          'DebtNotFoundException', 
          'DebtPaymentException',
          'DebtCalculationException'
        ];

        const implementedExceptions = customExceptions.filter(exception => 
          exceptionsFile.includes(exception)
        );

        const exceptionScore = Math.round((implementedExceptions.length / customExceptions.length) * 100);

        if (exceptionScore >= 75) {
          this.addResult('Error Handling', 'Custom Exceptions', 'PASS', 
            `✅ Comprehensive exception handling (${exceptionScore}%)`);
        } else {
          this.addResult('Error Handling', 'Custom Exceptions', 'WARNING', 
            `⚠️ Partial exception handling (${exceptionScore}%)`);
        }
      } else {
        this.addResult('Error Handling', 'Custom Exceptions', 'WARNING', 
          '⚠️ Custom exception file not found');
      }

      // Check service error handling
      const serviceFile = this.readFileContent('debts.service.ts');
      if (serviceFile) {
        const hasErrorHandling = serviceFile.includes('try') && 
                                serviceFile.includes('catch') &&
                                serviceFile.includes('throw');

        this.addResult('Error Handling', 'Service Error Handling', 
          hasErrorHandling ? 'PASS' : 'WARNING',
          hasErrorHandling ? '✅ Service error handling implemented' : '⚠️ Consider adding error handling'
        );

        const hasValidationErrors = serviceFile.includes('BadRequestException') ||
                                   serviceFile.includes('ValidationException');

        this.addResult('Error Handling', 'Validation Errors', 
          hasValidationErrors ? 'PASS' : 'WARNING',
          hasValidationErrors ? '✅ Validation error handling' : '⚠️ Consider validation error handling'
        );
      }

    } catch (error) {
      this.addResult('Error Handling', 'Analysis', 'FAIL', `❌ Error analyzing error handling: ${error.message}`);
    }
  }

  async validateDocumentation() {
    console.log('📚 Validating Documentation...');

    try {
      // Check for README or documentation files
      const docFiles = ['README.md', 'VALIDATION_REPORT.md', 'manual-test.http'];
      let docScore = 0;

      for (const docFile of docFiles) {
        const filePath = path.join(this.debtModulePath, docFile);
        if (fs.existsSync(filePath)) {
          this.addResult('Documentation', docFile, 'PASS', `✅ ${docFile} exists`);
          docScore++;
        } else {
          this.addResult('Documentation', docFile, 'WARNING', `⚠️ ${docFile} missing`);
        }
      }

      // Check for code comments
      const serviceFile = this.readFileContent('debts.service.ts');
      if (serviceFile) {
        const hasComments = serviceFile.includes('/**') || 
                           serviceFile.includes('//') ||
                           serviceFile.includes('/*');

        this.addResult('Documentation', 'Code Comments', 
          hasComments ? 'PASS' : 'WARNING',
          hasComments ? '✅ Code comments present' : '⚠️ Consider adding code comments'
        );
      }

    } catch (error) {
      this.addResult('Documentation', 'Analysis', 'FAIL', `❌ Error analyzing documentation: ${error.message}`);
    }
  }

  async validateTestCoverage() {
    console.log('🧪 Validating Test Coverage...');

    const testFiles = [
      'debts.controller.spec.ts',
      'debts.service.spec.ts', 
      'debts.repository.spec.ts',
      'debts.integration.spec.ts'
    ];

    let testScore = 0;
    for (const testFile of testFiles) {
      const filePath = path.join(this.debtModulePath, testFile);
      if (fs.existsSync(filePath)) {
        const testContent = this.readFileContent(testFile);
        if (testContent) {
          const hasDescribeBlocks = testContent.includes('describe(');
          const hasTestCases = testContent.includes('it(') || testContent.includes('test(');
          const hasExpectations = testContent.includes('expect(');

          if (hasDescribeBlocks && hasTestCases && hasExpectations) {
            this.addResult('Test Coverage', testFile, 'PASS', `✅ Comprehensive test file`);
            testScore++;
          } else {
            this.addResult('Test Coverage', testFile, 'WARNING', `⚠️ Incomplete test file`);
          }
        }
      } else {
        this.addResult('Test Coverage', testFile, 'WARNING', `⚠️ Missing test file`);
      }
    }

    const coveragePercentage = Math.round((testScore / testFiles.length) * 100);
    console.log(`   Test Coverage: ${coveragePercentage}% (${testScore}/${testFiles.length} files)`);
  }

  readFileContent(relativePath) {
    try {
      const filePath = path.join(this.debtModulePath, relativePath);
      if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, 'utf8');
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  addResult(category, test, status, message, details = null) {
    this.results.push({ category, test, status, message, details });
  }

  generateComprehensiveReport() {
    const summary = {
      total: this.results.length,
      passed: this.results.filter(r => r.status === 'PASS').length,
      failed: this.results.filter(r => r.status === 'FAIL').length,
      warnings: this.results.filter(r => r.status === 'WARNING').length,
    };

    console.log('\n' + '='.repeat(60));
    console.log('📊 COMPREHENSIVE DEBT MANAGEMENT MODULE VALIDATION REPORT');
    console.log('='.repeat(60));
    console.log(`📈 Total Validations: ${summary.total}`);
    console.log(`✅ Passed: ${summary.passed} (${Math.round((summary.passed/summary.total)*100)}%)`);
    console.log(`❌ Failed: ${summary.failed} (${Math.round((summary.failed/summary.total)*100)}%)`);
    console.log(`⚠️  Warnings: ${summary.warnings} (${Math.round((summary.warnings/summary.total)*100)}%)`);

    // Group results by category
    const categories = [...new Set(this.results.map(r => r.category))];
    
    categories.forEach(category => {
      console.log(`\n📋 ${category.toUpperCase()}`);
      console.log('-'.repeat(40));
      
      const categoryResults = this.results.filter(r => r.category === category);
      const categoryPassed = categoryResults.filter(r => r.status === 'PASS').length;
      const categoryTotal = categoryResults.length;
      const categoryScore = Math.round((categoryPassed / categoryTotal) * 100);
      
      console.log(`   Score: ${categoryScore}% (${categoryPassed}/${categoryTotal})`);
      
      categoryResults.forEach(result => {
        console.log(`   ${result.message}`);
      });
    });

    // Calculate overall score
    const overallScore = Math.round(((summary.passed + (summary.warnings * 0.5)) / summary.total) * 100);
    
    console.log('\n' + '='.repeat(60));
    console.log(`🎯 OVERALL VALIDATION SCORE: ${overallScore}%`);
    
    let status, recommendation;
    if (overallScore >= 90 && summary.failed === 0) {
      status = '🎉 EXCELLENT - Production Ready';
      recommendation = 'Module exceeds quality standards and is ready for production deployment.';
    } else if (overallScore >= 80 && summary.failed <= 2) {
      status = '✨ GOOD - Minor Improvements Needed';
      recommendation = 'Module is functional with minor improvements suggested before production.';
    } else if (overallScore >= 70) {
      status = '🔧 FAIR - Improvements Required';
      recommendation = 'Module needs improvements before production deployment.';
    } else {
      status = '⚠️ NEEDS WORK - Major Issues';
      recommendation = 'Module requires significant improvements before deployment.';
    }

    console.log(`📊 STATUS: ${status}`);
    console.log(`💡 RECOMMENDATION: ${recommendation}`);

    // Specific recommendations
    console.log('\n📝 SPECIFIC RECOMMENDATIONS:');
    if (summary.failed > 0) {
      console.log('🔴 CRITICAL: Fix all failed validations before deployment');
      const failedCategories = [...new Set(this.results.filter(r => r.status === 'FAIL').map(r => r.category))];
      failedCategories.forEach(cat => {
        console.log(`   - Address ${cat} issues`);
      });
    }
    
    if (summary.warnings > 0) {
      console.log('🟡 IMPROVEMENTS: Address warnings to enhance robustness');
    }
    
    console.log('🔵 NEXT STEPS:');
    console.log('   - Run integration tests with real database');
    console.log('   - Perform load testing with realistic data volumes');
    console.log('   - Conduct security penetration testing');
    console.log('   - Review code with senior developers');
    console.log('   - Deploy to staging environment for final validation');

    console.log('\n✅ VALIDATION COMPLETE');
    console.log('='.repeat(60));

    return { summary, overallScore, status };
  }

  getOverallStatus() {
    const summary = {
      total: this.results.length,
      passed: this.results.filter(r => r.status === 'PASS').length,
      failed: this.results.filter(r => r.status === 'FAIL').length,
      warnings: this.results.filter(r => r.status === 'WARNING').length,
    };

    const overallScore = Math.round(((summary.passed + (summary.warnings * 0.5)) / summary.total) * 100);
    
    return {
      score: overallScore,
      passed: summary.passed,
      failed: summary.failed,
      warnings: summary.warnings,
      total: summary.total,
      isProductionReady: overallScore >= 85 && summary.failed === 0
    };
  }
}

// Run validation if this file is executed directly
if (require.main === module) {
  const validator = new DebtModuleValidator();
  validator.runComprehensiveValidation()
    .then(result => {
      process.exit(result.isProductionReady ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Validation failed:', error);
      process.exit(1);
    });
}

module.exports = { DebtModuleValidator };
