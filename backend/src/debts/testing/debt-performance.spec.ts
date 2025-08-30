import { DebtTestFramework, TestUser, TestHousehold } from './debt-test-framework';
import { DebtsService } from '../debts.service';
import { DebtType } from '../dto/create-debt.dto';

describe('Debt Performance Tests', () => {
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

  describe('Large Dataset Performance', () => {
    it('should handle multiple debts efficiently', async () => {
      const startTime = Date.now();
      const debtPromises = [];

      // Create 100 debts concurrently
      for (let i = 0; i < 100; i++) {
        const debtData = {
          type: DebtType.PERSONAL,
          name: `Test Debt ${i}`,
          creditor: `Creditor ${i}`,
          principalAmount: 1000 + i,
          startDate: '2024-01-01',
        };

        debtPromises.push(
          debtsService.createDebt(testHousehold.id, debtData, testUser.id)
        );
      }

      const debts = await Promise.all(debtPromises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(debts).toHaveLength(100);
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
      
      console.log(`Created 100 debts in ${duration}ms (${duration/100}ms per debt)`);
    });

    it('should retrieve debt summary efficiently with many debts', async () => {
      const startTime = Date.now();
      
      const summary = await debtsService.getDebtSummary(testHousehold.id);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(summary).toBeDefined();
      expect(summary.totalDebt).toBeGreaterThan(0);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
      
      console.log(`Retrieved debt summary in ${duration}ms`);
    });
  });
});
