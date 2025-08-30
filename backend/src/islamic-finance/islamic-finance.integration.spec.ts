import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { IslamicFinanceModule } from './islamic-finance.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

describe('Islamic Finance Integration', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  const mockJwtAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [IslamicFinanceModule, PrismaModule, CommonModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockJwtAuthGuard.canActivate.mockReturnValue(true);
  });

  describe('POST /islamic-finance/zakat/calculate', () => {
    it('should calculate zakat successfully', async () => {
      const calculateZakatDto = {
        householdId: 'household-1',
        calculationDate: '2024-01-01',
      };

      // Mock the request context
      const mockRequest = {
        user: { id: 'user-1' },
      };

      const response = await request(app.getHttpServer())
        .post('/islamic-finance/zakat/calculate')
        .send(calculateZakatDto)
        .expect(201);

      expect(response.body).toBeDefined();
      expect(response.body.householdId).toBe(calculateZakatDto.householdId);
    });

    it('should validate required fields', async () => {
      const invalidDto = {
        // Missing householdId
        calculationDate: '2024-01-01',
      };

      await request(app.getHttpServer())
        .post('/islamic-finance/zakat/calculate')
        .send(invalidDto)
        .expect(400);
    });
  });

  describe('GET /islamic-finance/zakat/calculations/:householdId', () => {
    it('should get zakat calculations for a household', async () => {
      const householdId = 'household-1';

      const response = await request(app.getHttpServer())
        .get(`/islamic-finance/zakat/calculations/${householdId}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should support limit query parameter', async () => {
      const householdId = 'household-1';
      const limit = 5;

      const response = await request(app.getHttpServer())
        .get(`/islamic-finance/zakat/calculations/${householdId}?limit=${limit}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /islamic-finance/zakat/payments', () => {
    it('should record zakat payment successfully', async () => {
      const paymentDto = {
        householdId: 'household-1',
        amount: 1000,
        currency: 'IDR',
        paymentDate: '2024-01-01',
        hijriDate: '1/5/1445 AH',
        notes: 'Annual zakat payment',
      };

      const response = await request(app.getHttpServer())
        .post('/islamic-finance/zakat/payments')
        .send(paymentDto)
        .expect(201);

      expect(response.body.message).toBe('Zakat payment recorded successfully');
    });
  });

  describe('POST /islamic-finance/zakat/reminders', () => {
    it('should create zakat reminder successfully', async () => {
      const reminderDto = {
        householdId: 'household-1',
        reminderType: 'ANNUAL_CALCULATION',
        scheduledDate: '2024-12-01',
        hijriDate: '1/5/1446 AH',
        message: 'Time to calculate your annual zakat',
      };

      const response = await request(app.getHttpServer())
        .post('/islamic-finance/zakat/reminders')
        .send(reminderDto)
        .expect(201);

      expect(response.body).toBeDefined();
      expect(response.body.householdId).toBe(reminderDto.householdId);
      expect(response.body.reminderType).toBe(reminderDto.reminderType);
    });
  });

  describe('PUT /islamic-finance/compliance/accounts', () => {
    it('should update account compliance status', async () => {
      const complianceDto = {
        accountId: 'account-1',
        complianceStatus: 'COMPLIANT',
        complianceNotes: 'Islamic savings account',
      };

      const response = await request(app.getHttpServer())
        .put('/islamic-finance/compliance/accounts')
        .send(complianceDto)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.accountId).toBe(complianceDto.accountId);
      expect(response.body.complianceStatus).toBe(complianceDto.complianceStatus);
    });
  });

  describe('GET /islamic-finance/compliance/households/:householdId/summary', () => {
    it('should get compliance summary for household', async () => {
      const householdId = 'household-1';

      const response = await request(app.getHttpServer())
        .get(`/islamic-finance/compliance/households/${householdId}/summary`)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body).toHaveProperty('totalAccounts');
      expect(response.body).toHaveProperty('compliantAccounts');
      expect(response.body).toHaveProperty('compliancePercentage');
    });
  });

  describe('POST /islamic-finance/reports', () => {
    it('should generate Islamic finance report', async () => {
      const reportDto = {
        householdId: 'household-1',
        reportType: 'ZAKAT_CALCULATION',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        periodType: 'YEARLY',
      };

      const response = await request(app.getHttpServer())
        .post('/islamic-finance/reports')
        .send(reportDto)
        .expect(201);

      expect(response.body).toBeDefined();
      expect(response.body.householdId).toBe(reportDto.householdId);
      expect(response.body.reportType).toBe(reportDto.reportType);
    });
  });

  describe('GET /islamic-finance/dashboard/:householdId', () => {
    it('should get Islamic finance dashboard', async () => {
      const householdId = 'household-1';

      const response = await request(app.getHttpServer())
        .get(`/islamic-finance/dashboard/${householdId}`)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body).toHaveProperty('zakatSummary');
      expect(response.body).toHaveProperty('complianceSummary');
      expect(response.body).toHaveProperty('upcomingReminders');
      expect(response.body).toHaveProperty('recentReports');
    });
  });

  describe('POST /islamic-finance/initialize/:householdId', () => {
    it('should initialize Islamic finance features', async () => {
      const householdId = 'household-1';

      const response = await request(app.getHttpServer())
        .post(`/islamic-finance/initialize/${householdId}`)
        .expect(202);

      expect(response.body.message).toBe('Islamic finance initialization completed');
    });
  });

  describe('GET /islamic-finance/constants/*', () => {
    it('should get zakat asset types', async () => {
      const response = await request(app.getHttpServer())
        .get('/islamic-finance/constants/zakat-asset-types')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toContain('CASH');
      expect(response.body).toContain('GOLD');
      expect(response.body).toContain('SAVINGS');
    });

    it('should get reminder types', async () => {
      const response = await request(app.getHttpServer())
        .get('/islamic-finance/constants/reminder-types')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toContain('ANNUAL_CALCULATION');
      expect(response.body).toContain('PAYMENT_DUE');
    });

    it('should get report types', async () => {
      const response = await request(app.getHttpServer())
        .get('/islamic-finance/constants/report-types')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toContain('ZAKAT_CALCULATION');
      expect(response.body).toContain('SHARIA_COMPLIANCE');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid household ID', async () => {
      const invalidHouseholdId = 'invalid-household';

      await request(app.getHttpServer())
        .get(`/islamic-finance/zakat/calculations/${invalidHouseholdId}`)
        .expect(200); // Should return empty array, not error
    });

    it('should handle invalid account ID for compliance', async () => {
      const complianceDto = {
        accountId: 'invalid-account',
        complianceStatus: 'COMPLIANT',
      };

      await request(app.getHttpServer())
        .put('/islamic-finance/compliance/accounts')
        .send(complianceDto)
        .expect(500); // Should handle database error gracefully
    });
  });

  describe('Authentication', () => {
    it('should require authentication for protected endpoints', async () => {
      mockJwtAuthGuard.canActivate.mockReturnValue(false);

      await request(app.getHttpServer())
        .get('/islamic-finance/dashboard/household-1')
        .expect(403);
    });
  });
});
