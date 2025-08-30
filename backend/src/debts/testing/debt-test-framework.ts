import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DebtsModule } from '../debts.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../../auth/auth.module';
import { HouseholdModule } from '../../household/household.module';
import { DebtType } from '../dto/create-debt.dto';

export interface TestUser {
  id: string;
  email: string;
  name: string;
}

export interface TestHousehold {
  id: string;
  name: string;
  baseCurrency: string;
}

export interface TestDebt {
  id: string;
  type: DebtType;
  name: string;
  creditor: string;
  principalAmountCents: bigint;
  currentBalanceCents: bigint;
  currency: string;
  interestRate?: number;
  marginRate?: number;
  startDate: Date;
  maturityDate?: Date;
  isActive: boolean;
  householdId: string;
}

export interface TestPayment {
  id: string;
  debtId: string;
  amountCents: bigint;
  principalAmountCents: bigint;
  interestAmountCents: bigint;
  paymentDate: Date;
  currency: string;
}

/**
 * Comprehensive testing framework for debt management system
 * Provides utilities for setting up test data, validation, and cleanup
 */
export class DebtTestFramework {
  private app: INestApplication;
  private prismaService: PrismaService;
  private testUsers: TestUser[] = [];
  private testHouseholds: TestHousehold[] = [];
  private testDebts: TestDebt[] = [];
  private testPayments: TestPayment[] = [];

  async initialize(): Promise<void> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        PrismaModule,
        AuthModule,
        HouseholdModule,
        DebtsModule,
      ],
    }).compile();

    this.app = moduleFixture.createNestApplication();
    
    // Apply the same validation pipe as production
    this.app.useGlobalPipes(new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }));

    await this.app.init();
    this.prismaService = moduleFixture.get<PrismaService>(PrismaService);
  }

  async cleanup(): Promise<void> {
    // Clean up in reverse order of dependencies
    await this.cleanupPayments();
    await this.cleanupDebts();
    await this.cleanupHouseholds();
    await this.cleanupUsers();
    
    if (this.app) {
      await this.app.close();
    }
  }

  async createTestUser(userData?: Partial<TestUser>): Promise<TestUser> {
    const defaultUser = {
      email: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`,
      name: `Test User ${Date.now()}`,
    };

    const user = await this.prismaService.user.create({
      data: {
        ...defaultUser,
        ...userData,
      },
    });

    const testUser: TestUser = {
      id: user.id,
      email: user.email,
      name: user.name,
    };

    this.testUsers.push(testUser);
    return testUser;
  }

  async createTestHousehold(
    userId: string, 
    householdData?: Partial<TestHousehold>
  ): Promise<TestHousehold> {
    const defaultHousehold = {
      name: `Test Household ${Date.now()}`,
      baseCurrency: 'IDR',
    };

    const household = await this.prismaService.household.create({
      data: {
        ...defaultHousehold,
        ...householdData,
      },
    });

    // Create household membership
    await this.prismaService.householdMember.create({
      data: {
        userId,
        householdId: household.id,
        role: 'ADMIN',
        permissions: [],
      },
    });

    const testHousehold: TestHousehold = {
      id: household.id,
      name: household.name,
      baseCurrency: household.baseCurrency,
    };

    this.testHouseholds.push(testHousehold);
    return testHousehold;
  }

  async createTestDebt(
    householdId: string,
    debtData: Partial<TestDebt> & { type: DebtType }
  ): Promise<TestDebt> {
    const defaultDebt = {
      name: `Test Debt ${Date.now()}`,
      creditor: `Test Creditor ${Date.now()}`,
      principalAmountCents: BigInt(100000), // 1000.00
      currentBalanceCents: BigInt(100000),
      currency: 'IDR',
      startDate: new Date(),
      isActive: true,
    };

    const debtCreateData = {
      ...defaultDebt,
      ...debtData,
      householdId,
    };

    const debt = await this.prismaService.debt.create({
      data: debtCreateData,
    });

    const testDebt: TestDebt = {
      id: debt.id,
      type: debt.type as DebtType,
      name: debt.name,
      creditor: debt.creditor,
      principalAmountCents: debt.principalAmountCents,
      currentBalanceCents: debt.currentBalanceCents,
      currency: debt.currency,
      interestRate: debt.interestRate ? Number(debt.interestRate) : undefined,
      marginRate: debt.marginRate ? Number(debt.marginRate) : undefined,
      startDate: debt.startDate,
      maturityDate: debt.maturityDate || undefined,
      isActive: debt.isActive,
      householdId: debt.householdId,
    };

    this.testDebts.push(testDebt);
    return testDebt;
  }

  async createTestPayment(
    debtId: string,
    paymentData: Partial<TestPayment>
  ): Promise<TestPayment> {
    const defaultPayment = {
      amountCents: BigInt(50000), // 500.00
      principalAmountCents: BigInt(45000), // 450.00
      interestAmountCents: BigInt(5000), // 50.00
      paymentDate: new Date(),
      currency: 'IDR',
    };

    const payment = await this.prismaService.debtPayment.create({
      data: {
        ...defaultPayment,
        ...paymentData,
        debtId,
      },
    });

    // Update debt balance
    await this.prismaService.debt.update({
      where: { id: debtId },
      data: {
        currentBalanceCents: {
          decrement: paymentData.principalAmountCents || defaultPayment.principalAmountCents,
        },
      },
    });

    const testPayment: TestPayment = {
      id: payment.id,
      debtId: payment.debtId,
      amountCents: payment.amountCents,
      principalAmountCents: payment.principalAmountCents,
      interestAmountCents: payment.interestAmountCents,
      paymentDate: payment.paymentDate,
      currency: payment.currency,
    };

    this.testPayments.push(testPayment);
    return testPayment;
  }

  private async cleanupPayments(): Promise<void> {
    if (this.testPayments.length > 0) {
      const paymentIds = this.testPayments.map(p => p.id);
      await this.prismaService.debtPayment.deleteMany({
        where: { id: { in: paymentIds } },
      });
      this.testPayments = [];
    }
  }

  private async cleanupDebts(): Promise<void> {
    if (this.testDebts.length > 0) {
      const debtIds = this.testDebts.map(d => d.id);
      await this.prismaService.debt.deleteMany({
        where: { id: { in: debtIds } },
      });
      this.testDebts = [];
    }
  }

  private async cleanupHouseholds(): Promise<void> {
    if (this.testHouseholds.length > 0) {
      const householdIds = this.testHouseholds.map(h => h.id);
      await this.prismaService.householdMember.deleteMany({
        where: { householdId: { in: householdIds } },
      });
      await this.prismaService.household.deleteMany({
        where: { id: { in: householdIds } },
      });
      this.testHouseholds = [];
    }
  }

  private async cleanupUsers(): Promise<void> {
    if (this.testUsers.length > 0) {
      const userIds = this.testUsers.map(u => u.id);
      await this.prismaService.user.deleteMany({
        where: { id: { in: userIds } },
      });
      this.testUsers = [];
    }
  }

  getApp(): INestApplication {
    return this.app;
  }

  getPrismaService(): PrismaService {
    return this.prismaService;
  }

  getTestUsers(): TestUser[] {
    return [...this.testUsers];
  }

  getTestHouseholds(): TestHousehold[] {
    return [...this.testHouseholds];
  }

  getTestDebts(): TestDebt[] {
    return [...this.testDebts];
  }

  getTestPayments(): TestPayment[] {
    return [...this.testPayments];
  }
}
