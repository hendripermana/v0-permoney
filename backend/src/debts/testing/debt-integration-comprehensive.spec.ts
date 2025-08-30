import { DebtTestFramework, TestUser, TestHousehold } from './debt-test-framework';
import { DebtsService } from '../debts.service';
import { DebtType } from '../dto/create-debt.dto';

describe('Comprehensive Debt Integration Tests', () => {
  let testFramework: DebtTestFramework;
  let debtsService: DebtsService;
  let testUser: TestUser;
  let testHousehold: TestHousehold;

  beforeAll(async () => {
    testFramework = new DebtTestFramework();
    await testFramework.initialize();
    
    debtsService = testFramework.getApp().get<DebtsService>(DebtsService);
    
    testUser = await testFramework.createTestUser();
    testHousehold = await testFramework.createTestHousehold(testUser.id);
  });

  afterAll(async () => {
    await testFramework.cleanup();
  });

  describe('Complete Debt Lifecycle Tests', () => {
    it('should handle complete personal debt lifecycle', async () => {
      // 1. Create personal debt
      const debtData = {
        type: DebtType.PERSONAL,
        name: 'Loan from friend',
        creditor: 'John Doe',
        principalAmount: 1000,
        startDate: '2024-01-01',
      };

      const debt = await debtsService.createDebt(testHousehold.id, debtData, testUser.id);
      expect(debt.currentBalanceCents).toBe(BigInt(100000));

      // 2. Make partial payment
      const payment1 = await debtsService.recordPayment(debt.id, testHousehold.id, {
        amount: 300,
        paymentDate: '2024-02-01',
        principalAmount: 300,
        interestAmount: 0,
      });

      expect(payment1.principalAmountCents).toBe(BigInt(30000));
      expect(payment1.interestAmountCents).toBe(BigInt(0));

      // 3. Verify updated balance
      const updatedDebt = await debtsService.getDebtById(debt.id, testHousehold.id);
      expect(updatedDebt.currentBalanceCents).toBe(BigInt(70000));

      // 4. Make final payment
      await debtsService.recordPayment(debt.id, testHousehold.id, {
        amount: 700,
        paymentDate: '2024-03-01',
        principalAmount: 700,
        interestAmount: 0,
      });

      // 5. Verify debt is fully paid
      const finalDebt = await debtsService.getDebtById(debt.id, testHousehold.id);
      expect(finalDebt.currentBalanceCents).toBe(BigInt(0));

      // 6. Generate payment schedule
      const schedule = await debtsService.calculatePaymentSchedule(debt.id, testHousehold.id);
      expect(schedule.summary.remainingBalance).toBe(0);
      expect(schedule.summary.totalInterest).toBe(0);
    });

    it('should handle complete conventional debt lifecycle', async () => {
      // 1. Create conventional debt
      const debtData = {
        type: DebtType.CONVENTIONAL,
        name: 'Credit Card',
        creditor: 'Bank ABC',
        principalAmount: 5000,
        interestRate: 0.18,
        startDate: '2024-01-01',
        maturityDate: '2026-01-01',
      };

      const debt = await debtsService.createDebt(testHousehold.id, debtData, testUser.id);
      expect(debt.interestRate?.toString()).toBe('0.18');

      // 2. Make payment with interest
      await debtsService.recordPayment(debt.id, testHousehold.id, {
        amount: 600,
        paymentDate: '2024-02-01',
        principalAmount: 525,
        interestAmount: 75,
      });

      // 3. Generate payment schedule
      const schedule = await debtsService.calculatePaymentSchedule(debt.id, testHousehold.id);
      expect(schedule.monthlyPayment).toBeGreaterThan(0);
      expect(schedule.summary.totalInterest).toBeGreaterThan(0);
      expect(schedule.schedule.length).toBeGreaterThan(0);
    });
  });
});
