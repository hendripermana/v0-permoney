import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DebtsModule } from './debts.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { HouseholdModule } from '../household/household.module';
import { DebtType } from '../../../node_modules/.prisma/client';
import { DebtsService } from './debts.service';
import { CreateDebtDto, CreateDebtPaymentDto } from './dto';
import * as request from 'supertest';

describe('Debts E2E Testing', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let debtsService: DebtsService;
  let householdId: string;
  let userId: string;
  let authToken: string;
  let islamicDebtId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        PrismaModule,
        AuthModule,
        HouseholdModule,
        DebtsModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Apply the same validation pipe as in production
    app.useGlobalPipes(new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }));

    await app.init();

    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    debtsService = moduleFixture.get<DebtsService>(DebtsService);

    // Setup test data
    await setupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await app.close();
  });

  async function setupTestData() {
    // Clean up any existing test data
    await prismaService.debtPayment.deleteMany();
    await prismaService.debt.deleteMany();
    await prismaService.householdMember.deleteMany();
    await prismaService.household.deleteMany();
    await prismaService.user.deleteMany();

    // Create test user and household
    const user = await prismaService.user.create({
      data: {
        email: 'e2e-test@example.com',
        name: 'E2E Test User',
      },
    });
    userId = user.id;

    const household = await prismaService.household.create({
      data: {
        name: 'E2E Test Household',
        baseCurrency: 'IDR',
      },
    });
    householdId = household.id;

    await prismaService.householdMember.create({
      data: {
        userId,
        householdId,
        role: 'ADMIN',
      },
    });

    // Mock auth token (in real E2E tests, you'd get this from auth service)
    authToken = 'mock-jwt-token';
  }

  async function cleanupTestData() {
    await prismaService.debtPayment.deleteMany();
    await prismaService.debt.deleteMany();
    await prismaService.householdMember.deleteMany();
    await prismaService.household.deleteMany();
    await prismaService.user.deleteMany();
  }

  describe('Complete Debt Lifecycle Testing', () => {
    let personalDebtId: string;
    let conventionalDebtId: string;

    describe('Debt Creation Workflow', () => {
      it('should create personal debt with complete validation', async () => {
        const createDebtDto: CreateDebtDto = {
          type: DebtType.PERSONAL,
          name: 'E2E Personal Loan',
          creditor: 'Friend John',
          principalAmount: 5000,
          currency: 'IDR',
          startDate: '2024-01-01',
          metadata: {
            purpose: 'Emergency fund',
            agreement: 'Verbal agreement',
          },
        };

        const debt = await debtsService.createDebt(householdId, createDebtDto, userId);

        expect(debt).toBeDefined();
        expect(debt.type).toBe(DebtType.PERSONAL);
        expect(debt.name).toBe('E2E Personal Loan');
        expect(debt.creditor).toBe('Friend John');
        expect(debt.principalAmountCents).toBe(BigInt(500000)); // 5000 * 100
        expect(debt.currentBalanceCents).toBe(BigInt(500000));
        expect(debt.currency).toBe('IDR');
        expect(debt.interestRate).toBeNull();
        expect(debt.marginRate).toBeNull();
        expect(debt.isActive).toBe(true);

        personalDebtId = debt.id;

        // Verify in database
        const dbDebt = await prismaService.debt.findUnique({
          where: { id: personalDebtId },
        });
        expect(dbDebt).toBeDefined();
        expect(dbDebt?.householdId).toBe(householdId);
      });

      it('should create conventional debt with interest rate', async () => {
        const createDebtDto: CreateDebtDto = {
          type: DebtType.CONVENTIONAL,
          name: 'E2E Credit Card',
          creditor: 'Bank ABC',
          principalAmount: 15000,
          currency: 'IDR',
          interestRate: 0.18, // 18% annual
          startDate: '2024-01-01',
          maturityDate: '2027-01-01',
          metadata: {
            cardNumber: '****1234',
            creditLimit: 20000,
          },
        };

        const debt = await debtsService.createDebt(householdId, createDebtDto, userId);

        expect(debt).toBeDefined();
        expect(debt.type).toBe(DebtType.CONVENTIONAL);
        expect(debt.interestRate?.toNumber()).toBe(0.18);
        expect(debt.maturityDate).toEqual(new Date('2027-01-01'));

        conventionalDebtId = debt.id;
      });

      it('should create Islamic financing with margin rate', async () => {
        const createDebtDto: CreateDebtDto = {
          type: DebtType.ISLAMIC,
          name: 'E2E Home Financing',
          creditor: 'Islamic Bank XYZ',
          principalAmount: 200000,
          currency: 'IDR',
          marginRate: 0.06, // 6% margin
          startDate: '2024-01-01',
          maturityDate: '2044-01-01', // 20 years
          metadata: {
            propertyAddress: '123 Test Street',
            contractType: 'Murabahah',
          },
        };

        const debt = await debtsService.createDebt(householdId, createDebtDto, userId);

        expect(debt).toBeDefined();
        expect(debt.type).toBe(DebtType.ISLAMIC);
        expect(debt.marginRate?.toNumber()).toBe(0.06);
        expect(debt.interestRate).toBeNull();

        islamicDebtId = debt.id;
      });
    });

    describe('Payment Recording Workflow', () => {
      it('should record payment for personal debt', async () => {
        const paymentDto: CreateDebtPaymentDto = {
          amount: 1000,
          paymentDate: '2024-02-01',
          principalAmount: 1000,
          interestAmount: 0, // No interest for personal loans
        };

        const payment = await debtsService.recordPayment(
          personalDebtId,
          householdId,
          paymentDto
        );

        expect(payment).toBeDefined();
        expect(payment.amountCents).toBe(BigInt(100000)); // 1000 * 100
        expect(payment.principalAmountCents).toBe(BigInt(100000));
        expect(payment.interestAmountCents).toBe(BigInt(0));

        // Verify debt balance was updated
        const updatedDebt = await debtsService.getDebtById(personalDebtId, householdId);
        expect(updatedDebt.currentBalanceCents).toBe(BigInt(400000)); // 5000 - 1000 = 4000
      });

      it('should record payment for conventional debt with interest', async () => {
        const paymentDto: CreateDebtPaymentDto = {
          amount: 2000,
          paymentDate: '2024-02-01',
          principalAmount: 1775,
          interestAmount: 225, // Interest portion
        };

        const payment = await debtsService.recordPayment(
          conventionalDebtId,
          householdId,
          paymentDto
        );

        expect(payment).toBeDefined();
        expect(payment.principalAmountCents).toBe(BigInt(177500));
        expect(payment.interestAmountCents).toBe(BigInt(22500));

        // Verify debt balance was updated
        const updatedDebt = await debtsService.getDebtById(conventionalDebtId, householdId);
        expect(updatedDebt.currentBalanceCents).toBe(BigInt(1322500)); // 15000 - 1775 = 13225
      });

      it('should record payment for Islamic financing with margin', async () => {
        const paymentDto: CreateDebtPaymentDto = {
          amount: 5000,
          paymentDate: '2024-02-01',
          principalAmount: 4500,
          interestAmount: 500, // Margin portion
        };

        const payment = await debtsService.recordPayment(
          islamicDebtId,
          householdId,
          paymentDto
        );

        expect(payment).toBeDefined();
        expect(payment.principalAmountCents).toBe(BigInt(450000));
        expect(payment.interestAmountCents).toBe(BigInt(50000)); // Margin stored in interestAmount field

        // Verify debt balance was updated
        const updatedDebt = await debtsService.getDebtById(islamicDebtId, householdId);
        expect(updatedDebt.currentBalanceCents).toBe(BigInt(19550000)); // 200000 - 4500 = 195500
      });
    });

    describe('Payment Schedule Calculation', () => {
      it('should calculate accurate schedule for conventional debt', async () => {
        const schedule = await debtsService.calculatePaymentSchedule(
          conventionalDebtId,
          householdId
        );

        expect(schedule.debtId).toBe(conventionalDebtId);
        expect(schedule.debtName).toBe('E2E Credit Card');
        expect(schedule.monthlyPayment).toBeGreaterThan(0);
        expect(schedule.schedule.length).toBeGreaterThan(0);

        // Verify amortization logic
        const futurePayments = schedule.schedule.filter(s => !s.isPaid);
        expect(futurePayments.length).toBeGreaterThan(0);

        // Check that interest decreases over time
        if (futurePayments.length > 1) {
          const firstPayment = futurePayments[0];
          const lastPayment = futurePayments[futurePayments.length - 1];
          expect(firstPayment.interestAmount).toBeGreaterThan(lastPayment.interestAmount);
        }

        // Verify total amounts
        expect(schedule.summary.remainingBalance).toBeCloseTo(13225, 2);
        expect(schedule.summary.totalInterest).toBeGreaterThan(0);
      });

      it('should calculate accurate schedule for Islamic financing', async () => {
        const schedule = await debtsService.calculatePaymentSchedule(
          islamicDebtId,
          householdId
        );

        expect(schedule.debtId).toBe(islamicDebtId);
        expect(schedule.debtName).toBe('E2E Home Financing');
        expect(schedule.monthlyPayment).toBeGreaterThan(0);

        // Verify Murabahah principles (fixed total amount)
        const totalMargin = schedule.summary.totalInterest; // Margin stored as interest
        expect(totalMargin).toBeGreaterThan(0);

        // Verify equal monthly payments (characteristic of Murabahah)
        const futurePayments = schedule.schedule.filter(s => !s.isPaid);
        if (futurePayments.length > 2) {
          const payment1 = futurePayments[0].paymentAmount;
          const payment2 = futurePayments[1].paymentAmount;
          expect(Math.abs(payment1 - payment2)).toBeLessThan(1); // Should be nearly equal
        }
      });

      it('should handle personal loan schedule (flexible)', async () => {
        const schedule = await debtsService.calculatePaymentSchedule(
          personalDebtId,
          householdId
        );

        expect(schedule.debtId).toBe(personalDebtId);
        expect(schedule.debtName).toBe('E2E Personal Loan');
        expect(schedule.summary.totalInterest).toBe(0); // No interest for personal loans
        expect(schedule.summary.remainingBalance).toBe(4000); // After payment

        // All payments should have zero interest
        expect(schedule.schedule.every(s => s.interestAmount === 0)).toBe(true);
      });
    });

    describe('Debt Summary and Analytics', () => {
      it('should provide comprehensive debt summary', async () => {
        const summary = await debtsService.getDebtSummary(householdId);

        expect(summary).toBeDefined();
        expect(summary.totalDebt).toBeGreaterThan(0);
        expect(summary.currency).toBe('IDR');
        expect(summary.byType.length).toBeGreaterThan(0);

        // Verify each debt type is represented
        const personalSummary = summary.byType.find(t => t.type === DebtType.PERSONAL);
        const conventionalSummary = summary.byType.find(t => t.type === DebtType.CONVENTIONAL);
        const islamicSummary = summary.byType.find(t => t.type === DebtType.ISLAMIC);

        expect(personalSummary).toBeDefined();
        expect(personalSummary?.count).toBe(1);
        expect(personalSummary?.totalBalance).toBe(4000); // After payment

        expect(conventionalSummary).toBeDefined();
        expect(conventionalSummary?.count).toBe(1);
        expect(conventionalSummary?.totalBalance).toBeCloseTo(13225, 2); // After payment

        expect(islamicSummary).toBeDefined();
        expect(islamicSummary?.count).toBe(1);
        expect(islamicSummary?.totalBalance).toBe(195500); // After payment

        // Verify total matches sum of individual types
        const calculatedTotal = summary.byType.reduce((sum, type) => sum + type.totalBalance, 0);
        expect(Math.abs(summary.totalDebt - calculatedTotal)).toBeLessThan(1);
      });
    });

    describe('Debt Filtering and Search', () => {
      it('should filter debts by type', async () => {
        const personalDebts = await debtsService.getDebtsByHousehold(householdId, {
          type: DebtType.PERSONAL,
        });

        expect(personalDebts).toHaveLength(1);
        expect(personalDebts[0].type).toBe(DebtType.PERSONAL);
        expect(personalDebts[0].id).toBe(personalDebtId);
      });

      it('should filter debts by active status', async () => {
        const activeDebts = await debtsService.getDebtsByHousehold(householdId, {
          isActive: true,
        });

        expect(activeDebts.length).toBeGreaterThan(0);
        expect(activeDebts.every(debt => debt.isActive)).toBe(true);
      });

      it('should search debts by name and creditor', async () => {
        const searchResults = await debtsService.getDebtsByHousehold(householdId, {
          search: 'bank',
        });

        expect(searchResults.length).toBeGreaterThan(0);
        expect(
          searchResults.some(debt => 
            debt.name.toLowerCase().includes('bank') || 
            debt.creditor.toLowerCase().includes('bank')
          )
        ).toBe(true);
      });

      it('should filter by creditor', async () => {
        const bankDebts = await debtsService.getDebtsByHousehold(householdId, {
          creditor: 'Bank',
        });

        expect(bankDebts.length).toBeGreaterThan(0);
        expect(
          bankDebts.every(debt => 
            debt.creditor.toLowerCase().includes('bank')
          )
        ).toBe(true);
      });
    });

    describe('Debt Update and Deletion', () => {
      it('should update debt information', async () => {
        const updateData = {
          name: 'Updated E2E Personal Loan',
          creditor: 'Updated Friend John',
          metadata: {
            purpose: 'Updated emergency fund',
            notes: 'Payment plan adjusted',
          },
        };

        const updatedDebt = await debtsService.updateDebt(
          personalDebtId,
          householdId,
          updateData
        );

        expect(updatedDebt.name).toBe('Updated E2E Personal Loan');
        expect(updatedDebt.creditor).toBe('Updated Friend John');

        // Verify in database
        const dbDebt = await prismaService.debt.findUnique({
          where: { id: personalDebtId },
        });
        expect(dbDebt?.name).toBe('Updated E2E Personal Loan');
      });

      it('should deactivate debt', async () => {
        const deactivatedDebt = await debtsService.updateDebt(
          personalDebtId,
          householdId,
          { isActive: false }
        );

        expect(deactivatedDebt.isActive).toBe(false);

        // Verify it doesn't appear in active debt summary
        const summary = await debtsService.getDebtSummary(householdId);
        const personalSummary = summary.byType.find(t => t.type === DebtType.PERSONAL);
        expect(personalSummary).toBeUndefined(); // Should not appear in active summary
      });

      it('should delete debt and all related payments', async () => {
        // First, verify debt exists with payments
        const debtWithPayments = await debtsService.getDebtById(conventionalDebtId, householdId);
        expect(debtWithPayments.payments.length).toBeGreaterThan(0);

        // Delete the debt
        await debtsService.deleteDebt(conventionalDebtId, householdId);

        // Verify debt is deleted
        await expect(
          debtsService.getDebtById(conventionalDebtId, householdId)
        ).rejects.toThrow();

        // Verify payments are also deleted (cascade)
        const remainingPayments = await prismaService.debtPayment.findMany({
          where: { debtId: conventionalDebtId },
        });
        expect(remainingPayments).toHaveLength(0);
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    describe('Validation Error Testing', () => {
      it('should reject invalid debt type combinations', async () => {
        const invalidDebtDto: CreateDebtDto = {
          type: DebtType.PERSONAL,
          name: 'Invalid Personal Loan',
          creditor: 'Someone',
          principalAmount: 1000,
          interestRate: 0.1, // Should not be allowed for personal loans
          startDate: '2024-01-01',
        };

        await expect(
          debtsService.createDebt(householdId, invalidDebtDto, userId)
        ).rejects.toThrow();
      });

      it('should reject payments exceeding debt balance', async () => {
        // Get current balance of Islamic debt
        const debt = await debtsService.getDebtById(islamicDebtId, householdId);
        const currentBalance = Number(debt.currentBalanceCents) / 100;

        const invalidPaymentDto: CreateDebtPaymentDto = {
          amount: currentBalance + 1000, // Exceed balance
          paymentDate: '2024-03-01',
          principalAmount: currentBalance + 1000,
          interestAmount: 0,
        };

        await expect(
          debtsService.recordPayment(islamicDebtId, householdId, invalidPaymentDto)
        ).rejects.toThrow();
      });

      it('should reject payments with incorrect amount calculations', async () => {
        const invalidPaymentDto: CreateDebtPaymentDto = {
          amount: 1000, // Total doesn't match principal + interest
          paymentDate: '2024-03-01',
          principalAmount: 800,
          interestAmount: 300, // 800 + 300 = 1100, not 1000
        };

        await expect(
          debtsService.recordPayment(islamicDebtId, householdId, invalidPaymentDto)
        ).rejects.toThrow();
      });
    });

    describe('Security Testing', () => {
      it('should prevent cross-household access', async () => {
        // Create another household
        const otherHousehold = await prismaService.household.create({
          data: {
            name: 'Other Household',
            baseCurrency: 'IDR',
          },
        });

        // Try to access debt from different household
        await expect(
          debtsService.getDebtById(islamicDebtId, otherHousehold.id)
        ).rejects.toThrow();

        // Cleanup
        await prismaService.household.delete({
          where: { id: otherHousehold.id },
        });
      });

      it('should prevent access to non-existent debts', async () => {
        const fakeDebtId = '00000000-0000-0000-0000-000000000000';

        await expect(
          debtsService.getDebtById(fakeDebtId, householdId)
        ).rejects.toThrow();
      });
    });

    describe('Data Integrity Testing', () => {
      it('should handle concurrent payment attempts', async () => {
        // This test would require more sophisticated setup to truly test concurrency
        // For now, we'll test sequential payments that could cause race conditions
        
        const debt = await debtsService.getDebtById(islamicDebtId, householdId);
        const currentBalance = Number(debt.currentBalanceCents) / 100;
        const halfBalance = Math.floor(currentBalance / 2);

        const payment1: CreateDebtPaymentDto = {
          amount: halfBalance,
          paymentDate: '2024-03-15',
          principalAmount: halfBalance,
          interestAmount: 0,
        };

        const payment2: CreateDebtPaymentDto = {
          amount: halfBalance,
          paymentDate: '2024-03-16',
          principalAmount: halfBalance,
          interestAmount: 0,
        };

        // Record both payments
        await debtsService.recordPayment(islamicDebtId, householdId, payment1);
        await debtsService.recordPayment(islamicDebtId, householdId, payment2);

        // Verify final balance
        const finalDebt = await debtsService.getDebtById(islamicDebtId, householdId);
        const expectedBalance = currentBalance - (halfBalance * 2);
        const actualBalance = Number(finalDebt.currentBalanceCents) / 100;
        
        expect(Math.abs(actualBalance - expectedBalance)).toBeLessThan(1);
      });

      it('should handle zero balance debt correctly', async () => {
        // Pay off remaining balance
        const debt = await debtsService.getDebtById(islamicDebtId, householdId);
        const remainingBalance = Number(debt.currentBalanceCents) / 100;

        if (remainingBalance > 0) {
          const finalPayment: CreateDebtPaymentDto = {
            amount: remainingBalance,
            paymentDate: '2024-03-20',
            principalAmount: remainingBalance,
            interestAmount: 0,
          };

          await debtsService.recordPayment(islamicDebtId, householdId, finalPayment);

          // Verify debt is fully paid
          const paidDebt = await debtsService.getDebtById(islamicDebtId, householdId);
          expect(paidDebt.currentBalanceCents).toBe(BigInt(0));
          
          // Verify metadata was updated
          expect(paidDebt.metadata).toHaveProperty('paidOffDate');
        }
      });
    });
  });

  describe('Performance and Scalability Testing', () => {
    it('should handle large number of debts efficiently', async () => {
      const startTime = Date.now();

      // Create multiple debts
      const debtPromises = Array.from({ length: 50 }, (_, i) => {
        const createDebtDto: CreateDebtDto = {
          type: DebtType.PERSONAL,
          name: `Performance Test Debt ${i}`,
          creditor: `Creditor ${i}`,
          principalAmount: 1000 + i,
          startDate: '2024-01-01',
        };
        return debtsService.createDebt(householdId, createDebtDto, userId);
      });

      await Promise.all(debtPromises);

      const creationTime = Date.now() - startTime;
      expect(creationTime).toBeLessThan(5000); // Should complete within 5 seconds

      // Test retrieval performance
      const retrievalStartTime = Date.now();
      const allDebts = await debtsService.getDebtsByHousehold(householdId);
      const retrievalTime = Date.now() - retrievalStartTime;

      expect(allDebts.length).toBeGreaterThanOrEqual(50);
      expect(retrievalTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle complex filtering efficiently', async () => {
      const startTime = Date.now();

      const filteredDebts = await debtsService.getDebtsByHousehold(householdId, {
        type: DebtType.PERSONAL,
        isActive: true,
        search: 'performance',
      });

      const filterTime = Date.now() - startTime;
      expect(filterTime).toBeLessThan(500); // Should complete within 500ms
      expect(filteredDebts.length).toBeGreaterThan(0);
    });
  });
});
