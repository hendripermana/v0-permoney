import { DebtTestFramework, TestUser, TestHousehold } from './debt-test-framework';
import { DebtsService } from '../debts.service';
import { DebtType } from '../dto/create-debt.dto';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';

describe('Debt Business Logic Tests', () => {
  let testFramework: DebtTestFramework;
  let debtsService: DebtsService;
  let testUser: TestUser;
  let testHousehold: TestHousehold;

  beforeAll(async () => {
    testFramework = new DebtTestFramework();
    await testFramework.initialize();
    
    debtsService = testFramework.getApp().get<DebtsService>(DebtsService);
    
    // Create test user and household
    testUser = await testFramework.createTestUser();
    testHousehold = await testFramework.createTestHousehold(testUser.id);
  });

  afterAll(async () => {
    await testFramework.cleanup();
  });

  describe('Debt Creation Business Rules', () => {
    describe('Personal Debt Rules', () => {
      it('should create personal debt without interest or margin', async () => {
        const debtData = {
          type: DebtType.PERSONAL,
          name: 'Loan from friend',
          creditor: 'John Doe',
          principalAmount: 1000,
          startDate: '2024-01-01',
        };

        const debt = await debtsService.createDebt(testHousehold.id, debtData, testUser.id);

        expect(debt).toBeDefined();
        expect(debt.type).toBe(DebtType.PERSONAL);
        expect(debt.interestRate).toBeNull();
        expect(debt.marginRate).toBeNull();
        expect(debt.principalAmountCents).toBe(BigInt(100000));
        expect(debt.currentBalanceCents).toBe(BigInt(100000));
      });

      it('should reject personal debt with interest rate', async () => {
        const debtData = {
          type: DebtType.PERSONAL,
          name: 'Invalid personal loan',
          creditor: 'Someone',
          principalAmount: 1000,
          interestRate: 0.1,
          startDate: '2024-01-01',
        };

        await expect(
          debtsService.createDebt(testHousehold.id, debtData, testUser.id)
        ).rejects.toThrow(BadRequestException);
      });
    });
  });
});
