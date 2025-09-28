import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '../prisma/prisma.service';
import { BudgetsModule } from './budgets.module';
import { AuthModule } from '../auth/auth.module';
import { HouseholdModule } from '../household/household.module';
import { CacheModule } from '../cache/cache.module';
import { CommonModule } from '../common/common.module';
import { ConfigModule } from '@nestjs/config';
import { BudgetPeriod } from '../../../node_modules/.prisma/client';

describe('BudgetsController (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let householdId: string;
  let categoryId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        CommonModule,
        AuthModule,
        HouseholdModule,
        BudgetsModule,
        CacheModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);

    await app.init();

    // Setup test data
    await setupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await app.close();
  });

  async function setupTestData() {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'budget-test@example.com',
        name: 'Budget Test User',
        passwordHash: 'hashed-password',
      },
    });

    // Create test household
    const household = await prisma.household.create({
      data: {
        name: 'Test Household',
        baseCurrency: 'IDR',
      },
    });

    householdId = household.id;

    // Add user to household
    await prisma.householdMember.create({
      data: {
        userId: user.id,
        householdId: household.id,
        role: 'ADMIN',
      },
    });

    // Create test category
    const category = await prisma.category.create({
      data: {
        name: 'Food',
        slug: 'food',
        type: 'EXPENSE',
        householdId: household.id,
      },
    });

    categoryId = category.id;

    // Mock authentication - in real tests, you'd use proper JWT
    authToken = 'mock-jwt-token';
  }

  async function cleanupTestData() {
    await prisma.budgetCategory.deleteMany();
    await prisma.budget.deleteMany();
    await prisma.category.deleteMany();
    await prisma.householdMember.deleteMany();
    await prisma.household.deleteMany();
    await prisma.user.deleteMany();
  }

  describe('POST /budgets', () => {
    it('should create a new budget', async () => {
      const createBudgetDto = {
        name: 'Monthly Budget',
        period: BudgetPeriod.MONTHLY,
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        categories: [
          {
            categoryId,
            allocatedAmountCents: 200000,
          },
        ],
      };

      const response = await request(app.getHttpServer())
        .post('/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createBudgetDto)
        .expect(201);

      expect(response.body).toMatchObject({
        name: 'Monthly Budget',
        period: 'MONTHLY',
        totalAllocatedCents: 200000,
        householdId,
        categories: [
          {
            categoryId,
            allocatedAmountCents: 200000,
            category: {
              name: 'Food',
            },
          },
        ],
      });
    });

    it('should return 400 for invalid date range', async () => {
      const createBudgetDto = {
        name: 'Invalid Budget',
        period: BudgetPeriod.MONTHLY,
        startDate: '2024-01-31',
        endDate: '2024-01-01', // End before start
        categories: [
          {
            categoryId,
            allocatedAmountCents: 200000,
          },
        ],
      };

      await request(app.getHttpServer())
        .post('/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createBudgetDto)
        .expect(400);
    });
  });

  describe('GET /budgets', () => {
    let budgetId: string;

    beforeEach(async () => {
      const budget = await prisma.budget.create({
        data: {
          householdId,
          name: 'Test Budget',
          period: BudgetPeriod.MONTHLY,
          totalAllocatedCents: 300000,
          startDate: new Date('2024-02-01'),
          endDate: new Date('2024-02-29'),
          categories: {
            create: [
              {
                categoryId,
                allocatedAmountCents: 300000,
              },
            ],
          },
        },
      });
      budgetId = budget.id;
    });

    afterEach(async () => {
      await prisma.budgetCategory.deleteMany({ where: { budgetId } });
      await prisma.budget.deleteMany({ where: { id: budgetId } });
    });

    it('should return all budgets for household', async () => {
      const response = await request(app.getHttpServer())
        .get('/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        name: 'Test Budget',
        householdId,
      });
    });

    it('should filter budgets by active status', async () => {
      const response = await request(app.getHttpServer())
        .get('/budgets?isActive=true')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].isActive).toBe(true);
    });
  });

  describe('GET /budgets/:id/progress', () => {
    let budgetId: string;

    beforeEach(async () => {
      const budget = await prisma.budget.create({
        data: {
          householdId,
          name: 'Progress Test Budget',
          period: BudgetPeriod.MONTHLY,
          totalAllocatedCents: 400000,
          startDate: new Date('2024-03-01'),
          endDate: new Date('2024-03-31'),
          categories: {
            create: [
              {
                categoryId,
                allocatedAmountCents: 400000,
              },
            ],
          },
        },
      });
      budgetId = budget.id;

      // Create test account
      const account = await prisma.account.create({
        data: {
          householdId,
          name: 'Test Account',
          type: 'ASSET',
          subtype: 'BANK',
          balanceCents: 1000000,
        },
      });

      // Create test transaction
      await prisma.transaction.create({
        data: {
          householdId,
          accountId: account.id,
          categoryId,
          amountCents: 150000,
          description: 'Test expense',
          date: new Date('2024-03-15'),
          createdBy: (await prisma.user.findFirst())!.id,
        },
      });
    });

    afterEach(async () => {
      await prisma.transaction.deleteMany({ where: { householdId } });
      await prisma.account.deleteMany({ where: { householdId } });
      await prisma.budgetCategory.deleteMany({ where: { budgetId } });
      await prisma.budget.deleteMany({ where: { id: budgetId } });
    });

    it('should return budget progress with spending data', async () => {
      const response = await request(app.getHttpServer())
        .get(`/budgets/${budgetId}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        budgetId,
        totalAllocatedCents: 400000,
        totalSpentCents: 150000,
        totalRemainingCents: 250000,
        utilizationPercentage: 37.5,
        categories: [
          {
            categoryId,
            categoryName: 'Food',
            allocatedAmountCents: 400000,
            spentAmountCents: 150000,
            remainingAmountCents: 250000,
            utilizationPercentage: 37.5,
            isOverspent: false,
            overspentAmountCents: 0,
          },
        ],
        isOverBudget: false,
        overBudgetAmountCents: 0,
      });
    });
  });

  describe('GET /budgets/recommendations', () => {
    it('should return budget recommendations', async () => {
      const response = await request(app.getHttpServer())
        .get('/budgets/recommendations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      // Recommendations might be empty if no historical data exists
    });
  });

  describe('PUT /budgets/:id', () => {
    let budgetId: string;

    beforeEach(async () => {
      const budget = await prisma.budget.create({
        data: {
          householdId,
          name: 'Update Test Budget',
          period: BudgetPeriod.MONTHLY,
          totalAllocatedCents: 500000,
          startDate: new Date('2024-04-01'),
          endDate: new Date('2024-04-30'),
          categories: {
            create: [
              {
                categoryId,
                allocatedAmountCents: 500000,
              },
            ],
          },
        },
      });
      budgetId = budget.id;
    });

    afterEach(async () => {
      await prisma.budgetCategory.deleteMany({ where: { budgetId } });
      await prisma.budget.deleteMany({ where: { id: budgetId } });
    });

    it('should update budget name', async () => {
      const updateDto = {
        name: 'Updated Budget Name',
      };

      const response = await request(app.getHttpServer())
        .put(`/budgets/${budgetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.name).toBe('Updated Budget Name');
    });
  });

  describe('DELETE /budgets/:id', () => {
    let budgetId: string;

    beforeEach(async () => {
      const budget = await prisma.budget.create({
        data: {
          householdId,
          name: 'Delete Test Budget',
          period: BudgetPeriod.MONTHLY,
          totalAllocatedCents: 600000,
          startDate: new Date('2024-05-01'),
          endDate: new Date('2024-05-31'),
          categories: {
            create: [
              {
                categoryId,
                allocatedAmountCents: 600000,
              },
            ],
          },
        },
      });
      budgetId = budget.id;
    });

    it('should delete budget', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/budgets/${budgetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toBe('Budget deleted successfully');

      // Verify budget is deleted
      const deletedBudget = await prisma.budget.findUnique({
        where: { id: budgetId },
      });
      expect(deletedBudget).toBeNull();
    });
  });
});
