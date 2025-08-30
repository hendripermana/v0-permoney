import { DebtTestFramework } from './debt-test-framework';
import { DebtsService } from '../debts.service';
import { DebtsRepository } from '../debts.repository';
import { DebtType } from '../dto/create-debt.dto';

export interface QATestResult {
  testName: string;
  category: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  message: string;
  executionTime: number;
  details?: unknown;
}

export interface QAReport {
  timestamp: Date;
  totalTests: number;
  passed: number;
  failed: number;
  warnings: number;
  overallStatus: 'PASS' | 'FAIL' | 'WARNING';
  categories: {
    [category: string]: {
      total: number;
      passed: number;
      failed: number;
      warnings: number;
    };
  };
  results: QATestResult[];
  performance: {
    averageResponseTime: number;
    maxResponseTime: number;
    minResponseTime: number;
  };
  coverage: {
    debtTypes: string[];
    businessRules: string[];
    errorScenarios: string[];
  };
}

export class DebtQAValidator {
  private testFramework: DebtTestFramework;
  private debtsService: DebtsService;
  private debtsRepository: DebtsRepository;
  private results: QATestResult[] = [];

  async initialize(): Promise<void> {
    this.testFramework = new DebtTestFramework();
    await this.testFramework.initialize();
    
    this.debtsService = this.testFramework.getApp().get<DebtsService>(DebtsService);
    this.debtsRepository = this.testFramework.getApp().get<DebtsRepository>(DebtsRepository);
  }

  async runComprehensiveQA(): Promise<QAReport> {
    this.results = [];
    
    await this.testDataValidation();
    await this.testBusinessLogic();
    await this.testPerformance();
    await this.testSecurity();
    await this.testErrorHandling();
    await this.testIntegration();

    return this.generateReport();
  }

  private async testDataValidation(): Promise<void> {
    const category = 'Data Validation';

    // Test 1: Valid debt creation
    await this.runTest(category, 'Valid Personal Debt Creation', async () => {
      const user = await this.testFramework.createTestUser();
      const household = await this.testFramework.createTestHousehold(user.id);

      const debt = await this.debtsService.createDebt(household.id, {
        type: DebtType.PERSONAL,
        name: 'Test Debt',
        creditor: 'Test Creditor',
        principalAmount: 1000,
        startDate: '2024-01-01',
      }, user.id);

      if (!debt || debt.principalAmountCents !== BigInt(100000)) {
        throw new Error('Debt creation failed or amount incorrect');
      }

      return { debtId: debt.id, amount: debt.principalAmountCents };
    });

    // Test 2: Invalid debt type validation
    await this.runTest(category, 'Invalid Debt Type Rejection', async () => {
      const user = await this.testFramework.createTestUser();
      const household = await this.testFramework.createTestHousehold(user.id);

      try {
        await this.debtsService.createDebt(household.id, {
          type: DebtType.PERSONAL,
          name: 'Invalid Debt',
          creditor: 'Test Creditor',
          principalAmount: 1000,
          interestRate: 0.1, // Should be rejected for personal debt
          startDate: '2024-01-01',
        }, user.id);
        
        throw new Error('Should have rejected personal debt with interest rate');
      } catch (error) {
        if (error instanceof Error && error.message.includes('Personal loans cannot have interest rates')) {
          return { validationWorking: true };
        }
        throw error;
      }
    });

    // Test 3: Amount validation
    await this.runTest(category, 'Amount Boundary Validation', async () => {
      const user = await this.testFramework.createTestUser();
      const household = await this.testFramework.createTestHousehold(user.id);

      // Test minimum amount
      try {
        await this.debtsService.createDebt(household.id, {
          type: DebtType.PERSONAL,
          name: 'Zero Amount Debt',
          creditor: 'Test Creditor',
          principalAmount: 0,
          startDate: '2024-01-01',
        }, user.id);
        
        throw new Error('Should have rejected zero amount');
      } catch (error) {
        if (error instanceof Error && error.message.includes('Principal amount must be at least')) {
          return { boundaryValidationWorking: true };
        }
        throw error;
      }
    });
  }

  private async testBusinessLogic(): Promise<void> {
    const category = 'Business Logic';

    // Test payment calculation accuracy
    await this.runTest(category, 'Payment Schedule Calculation', async () => {
      const user = await this.testFramework.createTestUser();
      const household = await this.testFramework.createTestHousehold(user.id);

      const debt = await this.debtsService.createDebt(household.id, {
        type: DebtType.CONVENTIONAL,
        name: 'Test Credit Card',
        creditor: 'Test Bank',
        principalAmount: 10000,
        interestRate: 0.12, // 12% annual
        startDate: '2024-01-01',
        maturityDate: '2029-01-01',
      }, user.id);

      const schedule = await this.debtsService.calculatePaymentSchedule(debt.id, household.id);

      if (!schedule.monthlyPayment || schedule.monthlyPayment <= 0) {
        throw new Error('Monthly payment calculation failed');
      }

      if (schedule.summary.totalInterest <= 0) {
        throw new Error('Interest calculation failed');
      }

      return {
        monthlyPayment: schedule.monthlyPayment,
        totalInterest: schedule.summary.totalInterest,
        scheduleLength: schedule.schedule.length,
      };
    });

    // Test Islamic financing calculations
    await this.runTest(category, 'Islamic Financing Calculation', async () => {
      const user = await this.testFramework.createTestUser();
      const household = await this.testFramework.createTestHousehold(user.id);

      const debt = await this.debtsService.createDebt(household.id, {
        type: DebtType.ISLAMIC,
        name: 'Murabahah Financing',
        creditor: 'Islamic Bank',
        principalAmount: 100000,
        marginRate: 0.06, // 6% margin
        startDate: '2024-01-01',
        maturityDate: '2044-01-01',
      }, user.id);

      const schedule = await this.debtsService.calculatePaymentSchedule(debt.id, household.id);

      // Verify fixed margin calculation (not compound interest)
      const totalAmount = schedule.summary.totalAmount;
      const expectedTotalMargin = 100000 * 0.06; // Fixed margin
      
      if (Math.abs(schedule.summary.totalInterest - expectedTotalMargin) > 100) {
        throw new Error('Islamic margin calculation incorrect');
      }

      return {
        totalMargin: schedule.summary.totalInterest,
        expectedMargin: expectedTotalMargin,
        isFixedMargin: true,
      };
    });
  }

  private async testPerformance(): Promise<void> {
    const category = 'Performance';

    await this.runTest(category, 'Bulk Debt Creation Performance', async () => {
      const user = await this.testFramework.createTestUser();
      const household = await this.testFramework.createTestHousehold(user.id);

      const startTime = Date.now();
      const promises = [];

      for (let i = 0; i < 50; i++) {
        promises.push(
          this.debtsService.createDebt(household.id, {
            type: DebtType.PERSONAL,
            name: `Performance Test Debt ${i}`,
            creditor: `Creditor ${i}`,
            principalAmount: 1000 + i,
            startDate: '2024-01-01',
          }, user.id)
        );
      }

      await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      if (duration > 10000) { // 10 seconds
        throw new Error(`Performance too slow: ${duration}ms for 50 debts`);
      }

      return {
        totalDebts: 50,
        totalTime: duration,
        averageTime: duration / 50,
      };
    });
  }

  private async testSecurity(): Promise<void> {
    const category = 'Security';

    await this.runTest(category, 'Household Isolation', async () => {
      const user1 = await this.testFramework.createTestUser();
      const user2 = await this.testFramework.createTestUser();
      const household1 = await this.testFramework.createTestHousehold(user1.id);
      const household2 = await this.testFramework.createTestHousehold(user2.id);

      const debt = await this.debtsService.createDebt(household1.id, {
        type: DebtType.PERSONAL,
        name: 'Private Debt',
        creditor: 'Private Creditor',
        principalAmount: 1000,
        startDate: '2024-01-01',
      }, user1.id);

      try {
        await this.debtsService.getDebtById(debt.id, household2.id);
        throw new Error('Security breach: accessed debt from different household');
      } catch (error) {
        if (error instanceof Error && error.message.includes('Access denied')) {
          return { isolationWorking: true };
        }
        throw error;
      }
    });
  }

  private async testErrorHandling(): Promise<void> {
    const category = 'Error Handling';

    await this.runTest(category, 'Graceful Error Handling', async () => {
      try {
        await this.debtsService.getDebtById('non-existent-id', 'non-existent-household');
        throw new Error('Should have thrown NotFoundException');
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
          return { errorHandlingWorking: true };
        }
        throw error;
      }
    });
  }

  private async testIntegration(): Promise<void> {
    const category = 'Integration';

    await this.runTest(category, 'End-to-End Debt Lifecycle', async () => {
      const user = await this.testFramework.createTestUser();
      const household = await this.testFramework.createTestHousehold(user.id);

      // Create debt
      const debt = await this.debtsService.createDebt(household.id, {
        type: DebtType.PERSONAL,
        name: 'Integration Test Debt',
        creditor: 'Test Creditor',
        principalAmount: 1000,
        startDate: '2024-01-01',
      }, user.id);

      // Make payment
      await this.debtsService.recordPayment(debt.id, household.id, {
        amount: 500,
        paymentDate: '2024-02-01',
        principalAmount: 500,
        interestAmount: 0,
      });

      // Verify balance update
      const updatedDebt = await this.debtsService.getDebtById(debt.id, household.id);
      if (updatedDebt.currentBalanceCents !== BigInt(50000)) {
        throw new Error('Balance not updated correctly after payment');
      }

      // Generate summary
      const summary = await this.debtsService.getDebtSummary(household.id);
      if (summary.totalDebt <= 0) {
        throw new Error('Summary calculation failed');
      }

      return {
        debtCreated: true,
        paymentRecorded: true,
        balanceUpdated: true,
        summaryGenerated: true,
      };
    });
  }

  private async runTest(
    category: string,
    testName: string,
    testFunction: () => Promise<unknown>
  ): Promise<void> {
    const startTime = Date.now();
    
    try {
      const result = await testFunction();
      const endTime = Date.now();
      
      this.results.push({
        testName,
        category,
        status: 'PASS',
        message: 'Test passed successfully',
        executionTime: endTime - startTime,
        details: result,
      });
    } catch (error) {
      const endTime = Date.now();
      
      this.results.push({
        testName,
        category,
        status: 'FAIL',
        message: error instanceof Error ? error.message : 'Test failed',
        executionTime: endTime - startTime,
        details: { error: error instanceof Error ? error.stack : String(error) },
      });
    }
  }

  private generateReport(): QAReport {
    const categories: { [key: string]: { total: number; passed: number; failed: number; warnings: number } } = {};
    let totalPassed = 0;
    let totalFailed = 0;
    let totalWarnings = 0;

    const executionTimes = this.results.map(r => r.executionTime);
    const avgTime = executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length;
    const maxTime = Math.max(...executionTimes);
    const minTime = Math.min(...executionTimes);

    this.results.forEach(result => {
      if (!categories[result.category]) {
        categories[result.category] = { total: 0, passed: 0, failed: 0, warnings: 0 };
      }
      
      categories[result.category].total++;
      
      switch (result.status) {
        case 'PASS':
          categories[result.category].passed++;
          totalPassed++;
          break;
        case 'FAIL':
          categories[result.category].failed++;
          totalFailed++;
          break;
        case 'WARNING':
          categories[result.category].warnings++;
          totalWarnings++;
          break;
      }
    });

    const overallStatus = totalFailed > 0 ? 'FAIL' : totalWarnings > 0 ? 'WARNING' : 'PASS';

    return {
      timestamp: new Date(),
      totalTests: this.results.length,
      passed: totalPassed,
      failed: totalFailed,
      warnings: totalWarnings,
      overallStatus,
      categories,
      results: this.results,
      performance: {
        averageResponseTime: avgTime,
        maxResponseTime: maxTime,
        minResponseTime: minTime,
      },
      coverage: {
        debtTypes: ['PERSONAL', 'CONVENTIONAL', 'ISLAMIC'],
        businessRules: [
          'Personal debt validation',
          'Conventional interest calculation',
          'Islamic margin calculation',
          'Payment processing',
          'Balance updates',
        ],
        errorScenarios: [
          'Invalid debt types',
          'Boundary conditions',
          'Security violations',
          'Not found errors',
        ],
      },
    };
  }

  async cleanup(): Promise<void> {
    if (this.testFramework) {
      await this.testFramework.cleanup();
    }
  }
}
