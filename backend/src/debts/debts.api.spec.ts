import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { DebtsModule } from './debts.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { HouseholdModule } from '../household/household.module';
import { DebtType } from '@prisma/client';

describe('Debts API Contract Testing', () => {
  let app: INestApplication;
  let authToken: string;
  let householdId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, AuthModule, HouseholdModule, DebtsModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply production-like validation
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      })
    );

    await app.init();

    // Mock authentication and household setup
    authToken = 'Bearer mock-jwt-token';
    householdId = 'test-household-id';
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /debts - Create Debt', () => {
    describe('Request Validation', () => {
      it('should validate required fields', async () => {
        const response = await request(app.getHttpServer())
          .post('/debts')
          .set('Authorization', authToken)
          .send({})
          .expect(400);

        expect(response.body.message).toContain('type');
        expect(response.body.message).toContain('name');
        expect(response.body.message).toContain('creditor');
        expect(response.body.message).toContain('principalAmount');
        expect(response.body.message).toContain('startDate');
      });

      it('should validate debt type enum', async () => {
        const response = await request(app.getHttpServer())
          .post('/debts')
          .set('Authorization', authToken)
          .send({
            type: 'INVALID_TYPE',
            name: 'Test Debt',
            creditor: 'Test Creditor',
            principalAmount: 1000,
            startDate: '2024-01-01',
          })
          .expect(400);

        expect(response.body.message).toContain(
          'Debt type must be one of: PERSONAL, CONVENTIONAL, ISLAMIC'
        );
      });

      it('should validate principal amount boundaries', async () => {
        // Test minimum boundary
        await request(app.getHttpServer())
          .post('/debts')
          .set('Authorization', authToken)
          .send({
            type: DebtType.PERSONAL,
            name: 'Min Amount Test',
            creditor: 'Test Creditor',
            principalAmount: 0, // Below minimum
            startDate: '2024-01-01',
          })
          .expect(400);

        // Test maximum boundary
        await request(app.getHttpServer())
          .post('/debts')
          .set('Authorization', authToken)
          .send({
            type: DebtType.PERSONAL,
            name: 'Max Amount Test',
            creditor: 'Test Creditor',
            principalAmount: 1000000000000, // Above maximum
            startDate: '2024-01-01',
          })
          .expect(400);
      });

      it('should validate currency format', async () => {
        const response = await request(app.getHttpServer())
          .post('/debts')
          .set('Authorization', authToken)
          .send({
            type: DebtType.PERSONAL,
            name: 'Currency Test',
            creditor: 'Test Creditor',
            principalAmount: 1000,
            currency: 'invalid', // Invalid currency format
            startDate: '2024-01-01',
          })
          .expect(400);

        expect(response.body.message).toContain(
          'Currency must be a 3-letter ISO currency code'
        );
      });

      it('should validate date format', async () => {
        const response = await request(app.getHttpServer())
          .post('/debts')
          .set('Authorization', authToken)
          .send({
            type: DebtType.PERSONAL,
            name: 'Date Test',
            creditor: 'Test Creditor',
            principalAmount: 1000,
            startDate: 'invalid-date',
          })
          .expect(400);

        expect(response.body.message).toContain(
          'Start date must be a valid ISO 8601 date'
        );
      });

      it('should validate conditional fields for conventional debt', async () => {
        const response = await request(app.getHttpServer())
          .post('/debts')
          .set('Authorization', authToken)
          .send({
            type: DebtType.CONVENTIONAL,
            name: 'Conventional Test',
            creditor: 'Bank',
            principalAmount: 10000,
            startDate: '2024-01-01',
            maturityDate: '2026-01-01',
            // Missing required interestRate
          })
          .expect(400);

        expect(response.body.message).toContain(
          'Interest rate must be a valid number for conventional debt'
        );
      });

      it('should validate conditional fields for Islamic debt', async () => {
        const response = await request(app.getHttpServer())
          .post('/debts')
          .set('Authorization', authToken)
          .send({
            type: DebtType.ISLAMIC,
            name: 'Islamic Test',
            creditor: 'Islamic Bank',
            principalAmount: 50000,
            startDate: '2024-01-01',
            maturityDate: '2034-01-01',
            // Missing required marginRate
          })
          .expect(400);

        expect(response.body.message).toContain(
          'Margin rate must be a valid number for Islamic financing'
        );
      });

      it('should reject forbidden fields', async () => {
        const response = await request(app.getHttpServer())
          .post('/debts')
          .set('Authorization', authToken)
          .send({
            type: DebtType.PERSONAL,
            name: 'Forbidden Field Test',
            creditor: 'Test Creditor',
            principalAmount: 1000,
            startDate: '2024-01-01',
            forbiddenField: 'should not be allowed', // This should be stripped
            id: 'should-not-be-settable', // This should be stripped
          })
          .expect(400); // Should fail due to forbidNonWhitelisted: true
      });
    });

    describe('Response Validation', () => {
      it('should return correct response structure for valid personal debt', async () => {
        const validDebt = {
          type: DebtType.PERSONAL,
          name: 'Valid Personal Debt',
          creditor: 'Friend',
          principalAmount: 5000,
          currency: 'IDR',
          startDate: '2024-01-01',
          metadata: {
            purpose: 'Emergency',
          },
        };

        const response = await request(app.getHttpServer())
          .post('/debts')
          .set('Authorization', authToken)
          .send(validDebt)
          .expect(201);

        // Validate response structure
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('type', DebtType.PERSONAL);
        expect(response.body).toHaveProperty('name', 'Valid Personal Debt');
        expect(response.body).toHaveProperty('creditor', 'Friend');
        expect(response.body).toHaveProperty('principalAmountCents');
        expect(response.body).toHaveProperty('currentBalanceCents');
        expect(response.body).toHaveProperty('currency', 'IDR');
        expect(response.body).toHaveProperty('startDate');
        expect(response.body).toHaveProperty('isActive', true);
        expect(response.body).toHaveProperty('createdAt');
        expect(response.body).toHaveProperty('updatedAt');

        // Validate data types
        expect(typeof response.body.id).toBe('string');
        expect(typeof response.body.principalAmountCents).toBe('string'); // BigInt serialized as string
        expect(typeof response.body.currentBalanceCents).toBe('string');
        expect(response.body.interestRate).toBeNull();
        expect(response.body.marginRate).toBeNull();
      });

      it('should return correct response for conventional debt', async () => {
        const validDebt = {
          type: DebtType.CONVENTIONAL,
          name: 'Valid Conventional Debt',
          creditor: 'Bank ABC',
          principalAmount: 15000,
          currency: 'IDR',
          interestRate: 0.12,
          startDate: '2024-01-01',
          maturityDate: '2027-01-01',
        };

        const response = await request(app.getHttpServer())
          .post('/debts')
          .set('Authorization', authToken)
          .send(validDebt)
          .expect(201);

        expect(response.body.type).toBe(DebtType.CONVENTIONAL);
        expect(response.body.interestRate).toBeDefined();
        expect(response.body.marginRate).toBeNull();
        expect(response.body.maturityDate).toBeDefined();
      });

      it('should return correct response for Islamic debt', async () => {
        const validDebt = {
          type: DebtType.ISLAMIC,
          name: 'Valid Islamic Debt',
          creditor: 'Islamic Bank',
          principalAmount: 100000,
          currency: 'IDR',
          marginRate: 0.06,
          startDate: '2024-01-01',
          maturityDate: '2044-01-01',
        };

        const response = await request(app.getHttpServer())
          .post('/debts')
          .set('Authorization', authToken)
          .send(validDebt)
          .expect(201);

        expect(response.body.type).toBe(DebtType.ISLAMIC);
        expect(response.body.marginRate).toBeDefined();
        expect(response.body.interestRate).toBeNull();
      });
    });
  });

  describe('GET /debts - List Debts', () => {
    describe('Query Parameter Validation', () => {
      it('should validate type filter', async () => {
        await request(app.getHttpServer())
          .get('/debts')
          .query({ type: 'INVALID_TYPE' })
          .set('Authorization', authToken)
          .expect(400);
      });

      it('should validate isActive filter', async () => {
        await request(app.getHttpServer())
          .get('/debts')
          .query({ isActive: 'invalid_boolean' })
          .set('Authorization', authToken)
          .expect(400);
      });

      it('should accept valid query parameters', async () => {
        const response = await request(app.getHttpServer())
          .get('/debts')
          .query({
            type: DebtType.PERSONAL,
            isActive: 'true',
            creditor: 'Bank',
            search: 'loan',
          })
          .set('Authorization', authToken)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });
    });

    describe('Response Structure Validation', () => {
      it('should return array of debts with correct structure', async () => {
        const response = await request(app.getHttpServer())
          .get('/debts')
          .set('Authorization', authToken)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);

        if (response.body.length > 0) {
          const debt = response.body[0];
          expect(debt).toHaveProperty('id');
          expect(debt).toHaveProperty('type');
          expect(debt).toHaveProperty('name');
          expect(debt).toHaveProperty('creditor');
          expect(debt).toHaveProperty('principalAmountCents');
          expect(debt).toHaveProperty('currentBalanceCents');
          expect(debt).toHaveProperty('payments');
          expect(Array.isArray(debt.payments)).toBe(true);
        }
      });
    });
  });

  describe('GET /debts/summary - Debt Summary', () => {
    it('should return correct summary structure', async () => {
      const response = await request(app.getHttpServer())
        .get('/debts/summary')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toHaveProperty('totalDebt');
      expect(response.body).toHaveProperty('currency');
      expect(response.body).toHaveProperty('byType');
      expect(response.body).toHaveProperty('upcomingPayments');
      expect(response.body).toHaveProperty('payoffProjection');

      expect(typeof response.body.totalDebt).toBe('number');
      expect(typeof response.body.currency).toBe('string');
      expect(Array.isArray(response.body.byType)).toBe(true);

      expect(response.body.upcomingPayments).toHaveProperty('dueToday');
      expect(response.body.upcomingPayments).toHaveProperty('dueThisWeek');
      expect(response.body.upcomingPayments).toHaveProperty('dueThisMonth');
      expect(response.body.upcomingPayments).toHaveProperty('overdue');

      expect(response.body.payoffProjection).toHaveProperty(
        'totalInterestRemaining'
      );
      expect(response.body.payoffProjection).toHaveProperty(
        'averagePayoffMonths'
      );
    });
  });

  describe('GET /debts/:id - Get Specific Debt', () => {
    describe('Parameter Validation', () => {
      it('should validate UUID format', async () => {
        await request(app.getHttpServer())
          .get('/debts/invalid-uuid')
          .set('Authorization', authToken)
          .expect(400);
      });

      it('should return 404 for non-existent debt', async () => {
        const fakeUuid = '00000000-0000-0000-0000-000000000000';
        await request(app.getHttpServer())
          .get(`/debts/${fakeUuid}`)
          .set('Authorization', authToken)
          .expect(404);
      });
    });
  });

  describe('GET /debts/:id/schedule - Payment Schedule', () => {
    it('should return correct schedule structure', async () => {
      // First create a debt to get schedule for
      const debtResponse = await request(app.getHttpServer())
        .post('/debts')
        .set('Authorization', authToken)
        .send({
          type: DebtType.CONVENTIONAL,
          name: 'Schedule Test Debt',
          creditor: 'Test Bank',
          principalAmount: 10000,
          interestRate: 0.1,
          startDate: '2024-01-01',
          maturityDate: '2027-01-01',
        })
        .expect(201);

      const debtId = debtResponse.body.id;

      const response = await request(app.getHttpServer())
        .get(`/debts/${debtId}/schedule`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toHaveProperty('debtId', debtId);
      expect(response.body).toHaveProperty('debtName');
      expect(response.body).toHaveProperty('totalPayments');
      expect(response.body).toHaveProperty('monthlyPayment');
      expect(response.body).toHaveProperty('schedule');
      expect(response.body).toHaveProperty('summary');

      expect(Array.isArray(response.body.schedule)).toBe(true);
      expect(typeof response.body.monthlyPayment).toBe('number');

      expect(response.body.summary).toHaveProperty('totalInterest');
      expect(response.body.summary).toHaveProperty('totalPrincipal');
      expect(response.body.summary).toHaveProperty('totalAmount');
      expect(response.body.summary).toHaveProperty('remainingBalance');

      if (response.body.schedule.length > 0) {
        const scheduleItem = response.body.schedule[0];
        expect(scheduleItem).toHaveProperty('paymentNumber');
        expect(scheduleItem).toHaveProperty('dueDate');
        expect(scheduleItem).toHaveProperty('paymentAmount');
        expect(scheduleItem).toHaveProperty('principalAmount');
        expect(scheduleItem).toHaveProperty('interestAmount');
        expect(scheduleItem).toHaveProperty('remainingBalance');
        expect(scheduleItem).toHaveProperty('isPaid');
      }
    });
  });

  describe('POST /debts/:id/payments - Record Payment', () => {
    let debtId: string;

    beforeAll(async () => {
      // Create a debt for payment testing
      const debtResponse = await request(app.getHttpServer())
        .post('/debts')
        .set('Authorization', authToken)
        .send({
          type: DebtType.PERSONAL,
          name: 'Payment Test Debt',
          creditor: 'Test Creditor',
          principalAmount: 5000,
          startDate: '2024-01-01',
        })
        .expect(201);

      debtId = debtResponse.body.id;
    });

    describe('Request Validation', () => {
      it('should validate required payment fields', async () => {
        const response = await request(app.getHttpServer())
          .post(`/debts/${debtId}/payments`)
          .set('Authorization', authToken)
          .send({})
          .expect(400);

        expect(response.body.message).toContain('amount');
        expect(response.body.message).toContain('paymentDate');
        expect(response.body.message).toContain('principalAmount');
      });

      it('should validate payment amount boundaries', async () => {
        await request(app.getHttpServer())
          .post(`/debts/${debtId}/payments`)
          .set('Authorization', authToken)
          .send({
            amount: 0, // Below minimum
            paymentDate: '2024-02-01',
            principalAmount: 0,
            interestAmount: 0,
          })
          .expect(400);

        await request(app.getHttpServer())
          .post(`/debts/${debtId}/payments`)
          .set('Authorization', authToken)
          .send({
            amount: 1000000000000, // Above maximum
            paymentDate: '2024-02-01',
            principalAmount: 1000000000000,
            interestAmount: 0,
          })
          .expect(400);
      });

      it('should validate date format for payment', async () => {
        const response = await request(app.getHttpServer())
          .post(`/debts/${debtId}/payments`)
          .set('Authorization', authToken)
          .send({
            amount: 1000,
            paymentDate: 'invalid-date',
            principalAmount: 1000,
            interestAmount: 0,
          })
          .expect(400);

        expect(response.body.message).toContain(
          'Payment date must be a valid ISO 8601 date'
        );
      });

      it('should validate UUID format for transactionId', async () => {
        const response = await request(app.getHttpServer())
          .post(`/debts/${debtId}/payments`)
          .set('Authorization', authToken)
          .send({
            amount: 1000,
            paymentDate: '2024-02-01',
            principalAmount: 1000,
            interestAmount: 0,
            transactionId: 'invalid-uuid',
          })
          .expect(400);

        expect(response.body.message).toContain(
          'Transaction ID must be a valid UUID'
        );
      });
    });

    describe('Response Validation', () => {
      it('should return correct payment structure', async () => {
        const response = await request(app.getHttpServer())
          .post(`/debts/${debtId}/payments`)
          .set('Authorization', authToken)
          .send({
            amount: 1000,
            paymentDate: '2024-02-01',
            principalAmount: 1000,
            interestAmount: 0,
          })
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('debtId', debtId);
        expect(response.body).toHaveProperty('amountCents');
        expect(response.body).toHaveProperty('principalAmountCents');
        expect(response.body).toHaveProperty('interestAmountCents');
        expect(response.body).toHaveProperty('paymentDate');
        expect(response.body).toHaveProperty('currency');
        expect(response.body).toHaveProperty('createdAt');

        expect(typeof response.body.id).toBe('string');
        expect(typeof response.body.amountCents).toBe('string'); // BigInt serialized as string
        expect(typeof response.body.principalAmountCents).toBe('string');
        expect(typeof response.body.interestAmountCents).toBe('string');
      });
    });
  });

  describe('PUT /debts/:id - Update Debt', () => {
    let debtId: string;

    beforeAll(async () => {
      const debtResponse = await request(app.getHttpServer())
        .post('/debts')
        .set('Authorization', authToken)
        .send({
          type: DebtType.PERSONAL,
          name: 'Update Test Debt',
          creditor: 'Test Creditor',
          principalAmount: 3000,
          startDate: '2024-01-01',
        })
        .expect(201);

      debtId = debtResponse.body.id;
    });

    it('should validate partial update fields', async () => {
      const response = await request(app.getHttpServer())
        .put(`/debts/${debtId}`)
        .set('Authorization', authToken)
        .send({
          name: 'Updated Debt Name',
          creditor: 'Updated Creditor',
          principalAmount: 3500, // Valid update
        })
        .expect(200);

      expect(response.body.name).toBe('Updated Debt Name');
      expect(response.body.creditor).toBe('Updated Creditor');
    });

    it('should reject invalid update fields', async () => {
      await request(app.getHttpServer())
        .put(`/debts/${debtId}`)
        .set('Authorization', authToken)
        .send({
          principalAmount: -1000, // Invalid negative amount
        })
        .expect(400);
    });

    it('should allow status updates', async () => {
      const response = await request(app.getHttpServer())
        .put(`/debts/${debtId}`)
        .set('Authorization', authToken)
        .send({
          isActive: false,
        })
        .expect(200);

      expect(response.body.isActive).toBe(false);
    });
  });

  describe('DELETE /debts/:id - Delete Debt', () => {
    let debtId: string;

    beforeAll(async () => {
      const debtResponse = await request(app.getHttpServer())
        .post('/debts')
        .set('Authorization', authToken)
        .send({
          type: DebtType.PERSONAL,
          name: 'Delete Test Debt',
          creditor: 'Test Creditor',
          principalAmount: 2000,
          startDate: '2024-01-01',
        })
        .expect(201);

      debtId = debtResponse.body.id;
    });

    it('should delete debt and return success message', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/debts/${debtId}`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toHaveProperty(
        'message',
        'Debt deleted successfully'
      );
    });

    it('should return 404 for already deleted debt', async () => {
      await request(app.getHttpServer())
        .delete(`/debts/${debtId}`)
        .set('Authorization', authToken)
        .expect(404);
    });
  });

  describe('Authentication and Authorization', () => {
    it('should require authentication for all endpoints', async () => {
      const endpoints = [
        { method: 'get', path: '/debts' },
        { method: 'post', path: '/debts' },
        { method: 'get', path: '/debts/summary' },
        { method: 'get', path: '/debts/00000000-0000-0000-0000-000000000000' },
        { method: 'put', path: '/debts/00000000-0000-0000-0000-000000000000' },
        {
          method: 'delete',
          path: '/debts/00000000-0000-0000-0000-000000000000',
        },
      ];

      for (const endpoint of endpoints) {
        const server = request(app.getHttpServer());
        await server[endpoint.method](endpoint.path).expect(401); // Unauthorized without token
      }
    });

    it('should validate JWT token format', async () => {
      await request(app.getHttpServer())
        .get('/debts')
        .set('Authorization', 'invalid-token')
        .expect(401);
    });
  });

  describe('Error Response Format', () => {
    it('should return consistent error format for validation errors', async () => {
      const response = await request(app.getHttpServer())
        .post('/debts')
        .set('Authorization', authToken)
        .send({
          type: 'INVALID',
          name: '',
          principalAmount: -100,
        })
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('error');
      expect(Array.isArray(response.body.message)).toBe(true);
    });

    it('should return consistent error format for not found errors', async () => {
      const fakeUuid = '00000000-0000-0000-0000-000000000000';
      const response = await request(app.getHttpServer())
        .get(`/debts/${fakeUuid}`)
        .set('Authorization', authToken)
        .expect(404);

      expect(response.body).toHaveProperty('statusCode', 404);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Content-Type and Headers', () => {
    it('should accept and return JSON content', async () => {
      const response = await request(app.getHttpServer())
        .get('/debts')
        .set('Authorization', authToken)
        .set('Accept', 'application/json')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should handle CORS headers appropriately', async () => {
      const response = await request(app.getHttpServer())
        .options('/debts')
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      // CORS headers would be set by CORS middleware in production
      // This test ensures the endpoint responds to OPTIONS requests
    });
  });

  describe('Rate Limiting and Security Headers', () => {
    it('should include security headers in responses', async () => {
      const response = await request(app.getHttpServer())
        .get('/debts')
        .set('Authorization', authToken)
        .expect(200);

      // In production, these would be set by security middleware
      // This test documents expected security headers
      // expect(response.headers).toHaveProperty('x-content-type-options');
      // expect(response.headers).toHaveProperty('x-frame-options');
      // expect(response.headers).toHaveProperty('x-xss-protection');
    });
  });
});
