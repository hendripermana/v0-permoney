import { DebtTestFramework, TestUser, TestHousehold } from './debt-test-framework';
import { DebtsService } from '../debts.service';
import { DebtType } from '../dto/create-debt.dto';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('Debt Security Tests', () => {
  let testFramework: DebtTestFramework;
  let debtsService: DebtsService;
  let testUser1: TestUser;
  let testUser2: TestUser;
  let testHousehold1: TestHousehold;
  let testHousehold2: TestHousehold;

  beforeAll(async () => {
    testFramework = new DebtTestFramework();
    await testFramework.initialize();
    
    debtsService = testFramework.getApp().get<DebtsService>(DebtsService);
    
    // Create two separate users and households for isolation testing
    testUser1 = await testFramework.createTestUser();
    testUser2 = await testFramework.createTestUser();
    testHousehold1 = await testFramework.createTestHousehold(testUser1.id);
    testHousehold2 = await testFramework.createTestHousehold(testUser2.id);
  });

  afterAll(async () => {
    await testFramework.cleanup();
  });

  describe('Data Isolation Tests', () => {
    it('should prevent access to debts from different households', async () => {
      // Create debt in household 1
      const debtData = {
        type: DebtType.PERSONAL,
        name: 'Private Debt',
        creditor: 'Private Creditor',
        principalAmount: 1000,
        startDate: '2024-01-01',
      };

      const debt = await debtsService.createDebt(testHousehold1.id, debtData, testUser1.id);

      // Try to access from household 2
      await expect(
        debtsService.getDebtById(debt.id, testHousehold2.id)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should only return debts for the correct household', async () => {
      // Create debts in both households
      const debt1Data = {
        type: DebtType.PERSONAL,
        name: 'Household 1 Debt',
        creditor: 'Creditor 1',
        principalAmount: 1000,
        startDate: '2024-01-01',
      };

      const debt2Data = {
        type: DebtType.PERSONAL,
        name: 'Household 2 Debt',
        creditor: 'Creditor 2',
        principalAmount: 2000,
        startDate: '2024-01-01',
      };

      await debtsService.createDebt(testHousehold1.id, debt1Data, testUser1.id);
      await debtsService.createDebt(testHousehold2.id, debt2Data, testUser2.id);

      // Get debts for household 1
      const household1Debts = await debtsService.getDebtsByHousehold(testHousehold1.id);
      
      // Get debts for household 2
      const household2Debts = await debtsService.getDebtsByHousehold(testHousehold2.id);

      // Verify isolation
      expect(household1Debts.some(d => d.name === 'Household 1 Debt')).toBe(true);
      expect(household1Debts.some(d => d.name === 'Household 2 Debt')).toBe(false);
      
      expect(household2Debts.some(d => d.name === 'Household 2 Debt')).toBe(true);
      expect(household2Debts.some(d => d.name === 'Household 1 Debt')).toBe(false);
    });
  });

  describe('Input Sanitization Tests', () => {
    it('should handle malicious input safely', async () => {
      const maliciousDebtData = {
        type: DebtType.PERSONAL,
        name: '<script>alert("xss")</script>',
        creditor: '"; DROP TABLE debts; --',
        principalAmount: 1000,
        startDate: '2024-01-01',
      };

      const debt = await debtsService.createDebt(
        testHousehold1.id, 
        maliciousDebtData, 
        testUser1.id
      );

      // Verify the malicious content is stored as-is (not executed)
      expect(debt.name).toBe('<script>alert("xss")</script>');
      expect(debt.creditor).toBe('"; DROP TABLE debts; --');
      
      // Verify the debt was created normally
      expect(debt.principalAmountCents).toBe(BigInt(100000));
    });
  });
});
