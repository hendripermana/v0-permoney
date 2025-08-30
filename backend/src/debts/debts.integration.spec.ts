import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DebtsModule } from './debts.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { HouseholdModule } from '../household/household.module';
import { DebtType } from '@prisma/client';
import { DebtsService } from './debts.service';
import { CreateDebtDto, CreateDebtPaymentDto } from './dto';

describe('Debts Integration Tests', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let debtsService: DebtsService;
  let householdId: string;
  let userId: string;

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
    await app.init();

    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    debtsService = moduleFixture.get<DebtsService>(DebtsService);

    // Clean up any existing test data
    await prismaService.debtPayment.deleteMany();
    await prismaService.debt.deleteMany();
    await prismaService.householdMember.deleteMany();
    await prismaService.household.deleteMany();
    await prismaService.user.deleteMany();

    // Create test user and household
    const user = await prismaService.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
      },
    });
    userId = user.id;

    const household = await prismaService.household.create({
      data: {
        name: 'Test Household',
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
  });

  afterAll(async () => {
    // Clean up test data
    await prismaService.debtPayment.deleteMany();
    await prismaService.debt.deleteMany();
    await prismaService.householdMember.deleteMany();
    await prismaService.household.deleteMany();
    await prismaService.user.deleteMany();

    await app.close();
  });

  describe('Personal Debt Management', () => {
    let personalDebtId: string;

    it('should create a personal debt', async () => {
      const createDebtDto: CreateDebtDto = {
        type: DebtType.PERSONAL,
        name: 'Loan from Friend',
        creditor: 'John Doe',
        principalAmount: 1000,
        currency: 'IDR',
        startDate: '2024-01-01',
      };

      const debt = await debtsService.createDebt(householdId, createDebtDto, userId);

      expect(debt).toBeDefined();
      expect(debt.type).toBe(DebtType.PERSONAL);
      expect(debt.name).toBe('Loan from Friend');
      expect(debt.creditor).toBe('John Doe');
      expect(debt.principalAmountCents).toBe(BigInt(100000)); // 1000 * 100
      expect(debt.currentBalanceCents).toBe(BigInt(100000));
      expect(debt.interestRate).toBeNull();
      expect(debt.marginRate).toBeNull();

      personalDebtId = debt.id;
    });

    it('should record a payment for personal debt', async () => {
      const paymentDto: CreateDebtPaymentDto = {
        amount: 300,
        paymentDate: '2024-02-01',
        principalAmount: 300,
        interestAmount: 0, // Personal loans have no interest
      };

      const payment = await debtsService.recordPayment(personalDebtId, householdId, paymentDto);

      expect(payment).toBeDefined();
      expect(payment.amountCents).toBe(BigInt(30000)); // 300 * 100
      expect(payment.principalAmountCents).toBe(BigInt(30000));
      expect(payment.interestAmountCents).toBe(BigInt(0));

      // Verify debt balance was updated
      const updatedDebt = await debtsService.getDebtById(personalDebtId, householdId);
      expect(updatedDebt.currentBalanceCents).toBe(BigInt(70000)); // 1000 - 300 = 700
    });

    it('should calculate payment schedule for personal debt', async () => {
      const schedule = await debtsService.calculatePaymentSchedule(personalDebtId, householdId);

      expect(schedule.debtId).toBe(personalDebtId);
      expect(schedule.debtName).toBe('Loan from Friend');
      expect(schedule.summary.totalInterest).toBe(0); // Personal loans have no interest
      expect(schedule.summary.remainingBalance).toBe(700); // After payment
      expect(schedule.schedule.length).toBeGreaterThan(0); // Should have payment history
    });
  });

  describe('Conventional Debt Management', () => {
    let conventionalDebtId: string;

    it('should create a conventional debt with interest', async () => {
      const createDebtDto: CreateDebtDto = {
        type: DebtType.CONVENTIONAL,
        name: 'Credit Card',
        creditor: 'Bank ABC',
        principalAmount: 5000,
        currency: 'IDR',
        interestRate: 0.18, // 18% annual
        startDate: '2024-01-01',
        maturityDate: '2026-01-01',
      };

      const debt = await debtsService.createDebt(householdId, createDebtDto, userId);

      expect(debt).toBeDefined();
      expect(debt.type).toBe(DebtType.CONVENTIONAL);
      expect(debt.interestRate?.toNumber()).toBe(0.18);
      expect(debt.marginRate).toBeNull();

      conventionalDebtId = debt.id;
    });

    it('should calculate payment schedule for conventional debt', async () => {
      const schedule = await debtsService.calculatePaymentSchedule(conventionalDebtId, householdId);

      expect(schedule.debtId).toBe(conventionalDebtId);
      expect(schedule.monthlyPayment).toBeGreaterThan(0);
      expect(schedule.summary.totalInterest).toBeGreaterThan(0);
      expect(schedule.schedule.length).toBeGreaterThan(0);
      
      // Verify first payment has interest component
      const firstPayment = schedule.schedule[0];
      expect(firstPayment.interestAmount).toBeGreaterThan(0);
      expect(firstPayment.principalAmount).toBeGreaterThan(0);
    });

    it('should record a payment with interest for conventional debt', async () => {
      const paymentDto: CreateDebtPaymentDto = {
        amount: 500,
        paymentDate: '2024-02-01',
        principalAmount: 425,
        interestAmount: 75, // Interest portion
      };

      const payment = await debtsService.recordPayment(conventionalDebtId, householdId, paymentDto);

      expect(payment).toBeDefined();
      expect(payment.principalAmountCents).toBe(BigInt(42500));
      expect(payment.interestAmountCents).toBe(BigInt(7500));
    });
  });

  describe('Islamic Debt Management', () => {
    let islamicDebtId: string;

    it('should create an Islamic debt with margin', async () => {
      const createDebtDto: CreateDebtDto = {
        type: DebtType.ISLAMIC,
        name: 'Murabahah Financing',
        creditor: 'Islamic Bank',
        principalAmount: 10000,
        currency: 'IDR',
        marginRate: 0.06, // 6% margin
        startDate: '2024-01-01',
        maturityDate: '2029-01-01',
      };

      const debt = await debtsService.createDebt(householdId, createDebtDto, userId);

      expect(debt).toBeDefined();
      expect(debt.type).toBe(DebtType.ISLAMIC);
      expect(debt.marginRate?.toNumber()).toBe(0.06);
      expect(debt.interestRate).toBeNull();

      islamicDebtId = debt.id;
    });

    it('should calculate payment schedule for Islamic debt', async () => {
      const schedule = await debtsService.calculatePaymentSchedule(islamicDebtId, householdId);

      expect(schedule.debtId).toBe(islamicDebtId);
      expect(schedule.monthlyPayment).toBeGreaterThan(0);
      expect(schedule.summary.totalInterest).toBeGreaterThan(0); // Actually margin
      expect(schedule.schedule.length).toBeGreaterThan(0);
      
      // Verify payments have margin component
      const firstPayment = schedule.schedule[0];
      expect(firstPayment.interestAmount).toBeGreaterThan(0); // Using interestAmount field for margin
      expect(firstPayment.principalAmount).toBeGreaterThan(0);
    });
  });

  describe('Debt Summary and Analytics', () => {
    it('should provide comprehensive debt summary', async () => {
      const summary = await debtsService.getDebtSummary(householdId);

      expect(summary).toBeDefined();
      expect(summary.totalDebt).toBeGreaterThan(0);
      expect(summary.currency).toBe('IDR');
      expect(summary.byType.length).toBeGreaterThan(0);

      // Should have entries for each debt type we created
      const personalDebts = summary.byType.find(t => t.type === DebtType.PERSONAL);
      const conventionalDebts = summary.byType.find(t => t.type === DebtType.CONVENTIONAL);
      const islamicDebts = summary.byType.find(t => t.type === DebtType.ISLAMIC);

      expect(personalDebts).toBeDefined();
      expect(personalDebts?.count).toBe(1);
      expect(personalDebts?.totalBalance).toBe(700); // After payment

      expect(conventionalDebts).toBeDefined();
      expect(conventionalDebts?.count).toBe(1);

      expect(islamicDebts).toBeDefined();
      expect(islamicDebts?.count).toBe(1);
    });

    it('should filter debts by type', async () => {
      const personalDebts = await debtsService.getDebtsByHousehold(householdId, {
        type: DebtType.PERSONAL,
      });

      expect(personalDebts).toHaveLength(1);
      expect(personalDebts[0].type).toBe(DebtType.PERSONAL);
    });

    it('should search debts by name and creditor', async () => {
      const searchResults = await debtsService.getDebtsByHousehold(householdId, {
        search: 'loan',
      });

      expect(searchResults.length).toBeGreaterThan(0);
      expect(
        searchResults.some(debt => 
          debt.name.toLowerCase().includes('loan') || 
          debt.creditor.toLowerCase().includes('loan')
        )
      ).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should reject personal debt with interest rate', async () => {
      const invalidDebtDto: CreateDebtDto = {
        type: DebtType.PERSONAL,
        name: 'Invalid Personal Loan',
        creditor: 'Someone',
        principalAmount: 1000,
        interestRate: 0.1, // This should not be allowed
        startDate: '2024-01-01',
      };

      await expect(
        debtsService.createDebt(householdId, invalidDebtDto, userId)
      ).rejects.toThrow('Personal loans cannot have interest or margin rates');
    });

    it('should reject conventional debt without interest rate', async () => {
      const invalidDebtDto: CreateDebtDto = {
        type: DebtType.CONVENTIONAL,
        name: 'Invalid Credit Card',
        creditor: 'Bank',
        principalAmount: 5000,
        startDate: '2024-01-01',
        // Missing interestRate
      };

      await expect(
        debtsService.createDebt(householdId, invalidDebtDto, userId)
      ).rejects.toThrow('Conventional debt must have an interest rate');
    });

    it('should reject Islamic debt without margin rate', async () => {
      const invalidDebtDto: CreateDebtDto = {
        type: DebtType.ISLAMIC,
        name: 'Invalid Murabahah',
        creditor: 'Islamic Bank',
        principalAmount: 10000,
        startDate: '2024-01-01',
        // Missing marginRate
      };

      await expect(
        debtsService.createDebt(householdId, invalidDebtDto, userId)
      ).rejects.toThrow('Islamic financing must have a margin rate');
    });

    it('should reject payment exceeding debt balance', async () => {
      // Get a debt with known balance
      const debts = await debtsService.getDebtsByHousehold(householdId, {
        type: DebtType.PERSONAL,
      });
      const debt = debts[0];
      const currentBalance = Number(debt.currentBalanceCents) / 100;

      const invalidPaymentDto: CreateDebtPaymentDto = {
        amount: currentBalance + 100, // Exceed balance
        paymentDate: '2024-03-01',
        principalAmount: currentBalance + 100,
        interestAmount: 0,
      };

      await expect(
        debtsService.recordPayment(debt.id, householdId, invalidPaymentDto)
      ).rejects.toThrow('Principal amount');
    });
  });
});
