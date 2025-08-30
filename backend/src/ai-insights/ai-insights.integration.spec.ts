import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '../prisma/prisma.service';
import { AIInsightsModule } from './ai-insights.module';
import { AuthModule } from '../auth/auth.module';
import { HouseholdModule } from '../household/household.module';
import { CacheModule } from '../cache/cache.module';
import { CommonModule } from '../common/common.module';

describe('AIInsightsController (Integration)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AIInsightsModule,
        AuthModule,
        HouseholdModule,
        CacheModule,
        CommonModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up database before each test
    await prismaService.financialInsight.deleteMany();
    await prismaService.spendingPattern.deleteMany();
    await prismaService.transaction.deleteMany();
    await prismaService.account.deleteMany();
    await prismaService.budget.deleteMany();
    await prismaService.debt.deleteMany();
    await prismaService.householdMember.deleteMany();
    await prismaService.household.deleteMany();
    await prismaService.user.deleteMany();
  });

  describe('POST /ai-insights/:householdId/generate', () => {
    it('should generate AI insights for a household', async () => {
      // Create test data
      const user = await prismaService.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
          passwordHash: 'hashed-password',
        },
      });

      const household = await prismaService.household.create({
        data: {
          name: 'Test Household',
          baseCurrency: 'IDR',
        },
      });

      await prismaService.householdMember.create({
        data: {
          userId: user.id,
          householdId: household.id,
          role: 'ADMIN',
        },
      });

      // Create some transactions for analysis
      const account = await prismaService.account.create({
        data: {
          householdId: household.id,
          name: 'Test Account',
          type: 'ASSET',
          subtype: 'BANK',
          currency: 'IDR',
          balanceCents: 1000000,
        },
      });

      const category = await prismaService.category.create({
        data: {
          householdId: household.id,
          name: 'Food',
          isSystem: false,
        },
      });

      // Create transactions for the last 30 days
      const transactions = [];
      for (let i = 0; i < 10; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        transactions.push({
          householdId: household.id,
          accountId: account.id,
          categoryId: category.id,
          amountCents: 50000 + (i * 1000), // Varying amounts
          currency: 'IDR',
          description: `Transaction ${i}`,
          date,
          createdBy: user.id,
        });
      }

      await prismaService.transaction.createMany({
        data: transactions,
      });

      // Mock JWT token (in real test, you'd get this from login)
      const mockToken = 'mock-jwt-token';

      const response = await request(app.getHttpServer())
        .post(`/ai-insights/${household.id}/generate`)
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(201);

      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return 401 without authentication', async () => {
      const householdId = 'test-household-id';

      await request(app.getHttpServer())
        .post(`/ai-insights/${householdId}/generate`)
        .expect(401);
    });

    it('should return 400 for invalid household ID', async () => {
      const mockToken = 'mock-jwt-token';

      await request(app.getHttpServer())
        .post('/ai-insights/invalid-uuid/generate')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(400);
    });
  });

  describe('GET /ai-insights/:householdId/insights', () => {
    it('should retrieve stored insights', async () => {
      // Create test data
      const user = await prismaService.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
          passwordHash: 'hashed-password',
        },
      });

      const household = await prismaService.household.create({
        data: {
          name: 'Test Household',
          baseCurrency: 'IDR',
        },
      });

      await prismaService.householdMember.create({
        data: {
          userId: user.id,
          householdId: household.id,
          role: 'ADMIN',
        },
      });

      // Create test insight
      await prismaService.financialInsight.create({
        data: {
          householdId: household.id,
          insightType: 'SPENDING_PATTERN',
          title: 'Test Insight',
          description: 'Test description',
          data: { test: 'data' },
          priority: 'HIGH',
          isActionable: true,
        },
      });

      const mockToken = 'mock-jwt-token';

      const response = await request(app.getHttpServer())
        .get(`/ai-insights/${household.id}/insights`)
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].title).toBe('Test Insight');
    });
  });

  describe('POST /ai-insights/:householdId/monthly-report/:year/:month', () => {
    it('should generate monthly report', async () => {
      // Create test data
      const user = await prismaService.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
          passwordHash: 'hashed-password',
        },
      });

      const household = await prismaService.household.create({
        data: {
          name: 'Test Household',
          baseCurrency: 'IDR',
        },
      });

      await prismaService.householdMember.create({
        data: {
          userId: user.id,
          householdId: household.id,
          role: 'ADMIN',
        },
      });

      const mockToken = 'mock-jwt-token';

      const response = await request(app.getHttpServer())
        .post(`/ai-insights/${household.id}/monthly-report/2024/1`)
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(201);

      expect(response.body).toBeDefined();
      expect(response.body.title).toContain('January 2024');
      expect(response.body.householdId).toBe(household.id);
      expect(response.body.year).toBe(2024);
      expect(response.body.month).toBe(1);
    });

    it('should return 400 for invalid year/month', async () => {
      const householdId = 'test-household-id';
      const mockToken = 'mock-jwt-token';

      await request(app.getHttpServer())
        .post(`/ai-insights/${householdId}/monthly-report/invalid/month`)
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(400);
    });
  });

  describe('GET /ai-insights/:householdId/spending-patterns', () => {
    it('should get spending patterns', async () => {
      // Create test data
      const user = await prismaService.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
          passwordHash: 'hashed-password',
        },
      });

      const household = await prismaService.household.create({
        data: {
          name: 'Test Household',
          baseCurrency: 'IDR',
        },
      });

      await prismaService.householdMember.create({
        data: {
          userId: user.id,
          householdId: household.id,
          role: 'ADMIN',
        },
      });

      const mockToken = 'mock-jwt-token';

      const response = await request(app.getHttpServer())
        .get(`/ai-insights/${household.id}/spending-patterns`)
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /ai-insights/:householdId/anomalies', () => {
    it('should detect anomalies', async () => {
      // Create test data
      const user = await prismaService.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
          passwordHash: 'hashed-password',
        },
      });

      const household = await prismaService.household.create({
        data: {
          name: 'Test Household',
          baseCurrency: 'IDR',
        },
      });

      await prismaService.householdMember.create({
        data: {
          userId: user.id,
          householdId: household.id,
          role: 'ADMIN',
        },
      });

      const mockToken = 'mock-jwt-token';

      const response = await request(app.getHttpServer())
        .get(`/ai-insights/${household.id}/anomalies`)
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /ai-insights/:householdId/recommendations', () => {
    it('should get recommendations', async () => {
      // Create test data
      const user = await prismaService.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
          passwordHash: 'hashed-password',
        },
      });

      const household = await prismaService.household.create({
        data: {
          name: 'Test Household',
          baseCurrency: 'IDR',
        },
      });

      await prismaService.householdMember.create({
        data: {
          userId: user.id,
          householdId: household.id,
          role: 'ADMIN',
        },
      });

      const mockToken = 'mock-jwt-token';

      const response = await request(app.getHttpServer())
        .get(`/ai-insights/${household.id}/recommendations`)
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('DELETE /ai-insights/insights/:insightId', () => {
    it('should dismiss an insight', async () => {
      // Create test data
      const user = await prismaService.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
          passwordHash: 'hashed-password',
        },
      });

      const household = await prismaService.household.create({
        data: {
          name: 'Test Household',
          baseCurrency: 'IDR',
        },
      });

      await prismaService.householdMember.create({
        data: {
          userId: user.id,
          householdId: household.id,
          role: 'ADMIN',
        },
      });

      const insight = await prismaService.financialInsight.create({
        data: {
          householdId: household.id,
          insightType: 'SPENDING_PATTERN',
          title: 'Test Insight',
          description: 'Test description',
          data: { test: 'data' },
          priority: 'HIGH',
          isActionable: true,
        },
      });

      const mockToken = 'mock-jwt-token';

      await request(app.getHttpServer())
        .delete(`/ai-insights/insights/${insight.id}`)
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      // Verify insight was dismissed
      const updatedInsight = await prismaService.financialInsight.findUnique({
        where: { id: insight.id },
      });

      expect(updatedInsight?.isDismissed).toBe(true);
    });

    it('should return 400 for invalid insight ID', async () => {
      const mockToken = 'mock-jwt-token';

      await request(app.getHttpServer())
        .delete('/ai-insights/insights/invalid-uuid')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(400);
    });
  });
});
