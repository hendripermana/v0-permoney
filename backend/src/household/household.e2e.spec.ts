import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { HouseholdModule } from './household.module';
import { PrismaService } from '../prisma/prisma.service';
import { RequestContextService } from '../common/services/request-context.service';
import { HouseholdRole } from '../../../node_modules/.prisma/client';
import { ViewType } from './dto';

describe('Household E2E Tests', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  // Mock data
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
  };

  const mockHousehold = {
    id: 'household-123',
    name: 'Test Household',
    baseCurrency: 'IDR',
    settings: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockMember = {
    id: 'member-123',
    userId: mockUser.id,
    householdId: mockHousehold.id,
    role: HouseholdRole.ADMIN,
    permissions: [],
    joinedAt: new Date(),
    user: mockUser,
  };

  // Mock implementations
  const mockPrismaService = {
    $transaction: jest.fn(),
    household: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    householdMember: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    account: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    transaction: {
      count: jest.fn(),
    },
  };

  const mockRequestContextService = {
    getUserId: jest.fn().mockReturnValue(mockUser.id),
    getUser: jest.fn().mockReturnValue(mockUser),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [HouseholdModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .overrideProvider(RequestContextService)
      .useValue(mockRequestContextService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    
    await app.init();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /households', () => {
    it('should create a new household', async () => {
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          household: { create: jest.fn().mockResolvedValue(mockHousehold) },
          householdMember: { create: jest.fn() },
        });
      });

      mockPrismaService.household.findUnique.mockResolvedValue({
        ...mockHousehold,
        members: [mockMember],
      });

      const response = await request(app.getHttpServer())
        .post('/households')
        .send({
          name: 'Test Household',
          baseCurrency: 'IDR',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Test Household');
      expect(response.body.baseCurrency).toBe('IDR');
    });

    it('should validate required fields', async () => {
      await request(app.getHttpServer())
        .post('/households')
        .send({
          baseCurrency: 'IDR',
        })
        .expect(400);
    });

    it('should validate currency format', async () => {
      await request(app.getHttpServer())
        .post('/households')
        .send({
          name: 'Test Household',
          baseCurrency: 'INVALID',
        })
        .expect(400);
    });
  });

  describe('GET /households', () => {
    it('should return user households', async () => {
      mockPrismaService.household.findMany.mockResolvedValue([
        { ...mockHousehold, members: [mockMember] },
      ]);

      const response = await request(app.getHttpServer())
        .get('/households')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('members');
    });
  });

  describe('GET /households/:id', () => {
    it('should return specific household', async () => {
      mockPrismaService.household.findUnique.mockResolvedValue({
        ...mockHousehold,
        members: [mockMember],
      });

      const response = await request(app.getHttpServer())
        .get(`/households/${mockHousehold.id}`)
        .expect(200);

      expect(response.body.id).toBe(mockHousehold.id);
      expect(response.body.name).toBe(mockHousehold.name);
    });

    it('should validate UUID format', async () => {
      await request(app.getHttpServer())
        .get('/households/invalid-uuid')
        .expect(400);
    });
  });

  describe('PUT /households/:id', () => {
    it('should update household', async () => {
      // Mock admin permission check
      mockPrismaService.householdMember.findUnique.mockResolvedValue({
        ...mockMember,
        role: HouseholdRole.ADMIN,
      });

      mockPrismaService.household.update.mockResolvedValue({
        ...mockHousehold,
        name: 'Updated Household',
      });

      mockPrismaService.household.findUnique.mockResolvedValue({
        ...mockHousehold,
        name: 'Updated Household',
        members: [mockMember],
      });

      const response = await request(app.getHttpServer())
        .put(`/households/${mockHousehold.id}`)
        .send({
          name: 'Updated Household',
        })
        .expect(200);

      expect(response.body.name).toBe('Updated Household');
    });
  });

  describe('POST /households/:id/members', () => {
    it('should invite a new member', async () => {
      // Mock admin permission check
      mockPrismaService.householdMember.findUnique.mockResolvedValue({
        ...mockMember,
        role: HouseholdRole.ADMIN,
      });

      // Mock user exists
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'new-user-id',
        email: 'newuser@example.com',
      });

      // Mock member doesn't exist yet
      mockPrismaService.householdMember.findUnique.mockResolvedValueOnce(null);

      // Mock member creation
      mockPrismaService.householdMember.create.mockResolvedValue({});

      const response = await request(app.getHttpServer())
        .post(`/households/${mockHousehold.id}/members`)
        .send({
          email: 'newuser@example.com',
          role: 'PARTNER',
        })
        .expect(201);

      expect(response.body.message).toBe('Member invited successfully');
    });

    it('should validate email format', async () => {
      await request(app.getHttpServer())
        .post(`/households/${mockHousehold.id}/members`)
        .send({
          email: 'invalid-email',
          role: 'PARTNER',
        })
        .expect(400);
    });

    it('should validate role enum', async () => {
      await request(app.getHttpServer())
        .post(`/households/${mockHousehold.id}/members`)
        .send({
          email: 'test@example.com',
          role: 'INVALID_ROLE',
        })
        .expect(400);
    });
  });

  describe('GET /households/:id/members', () => {
    it('should return household members', async () => {
      // Mock membership check
      mockPrismaService.householdMember.findUnique.mockResolvedValue(mockMember);

      // Mock members list
      mockPrismaService.householdMember.findMany.mockResolvedValue([mockMember]);

      const response = await request(app.getHttpServer())
        .get(`/households/${mockHousehold.id}/members`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body[0]).toHaveProperty('user');
      expect(response.body[0]).toHaveProperty('role');
    });
  });

  describe('PUT /households/:id/members/:memberId', () => {
    it('should update member role', async () => {
      // Mock admin permission check
      mockPrismaService.householdMember.findUnique.mockResolvedValue({
        ...mockMember,
        role: HouseholdRole.ADMIN,
      });

      // Mock admin count check
      mockPrismaService.householdMember.count.mockResolvedValue(2);

      // Mock member update
      mockPrismaService.householdMember.update.mockResolvedValue({});

      const response = await request(app.getHttpServer())
        .put(`/households/${mockHousehold.id}/members/${mockUser.id}`)
        .send({
          role: 'PARTNER',
        })
        .expect(200);

      expect(response.body.message).toBe('Member updated successfully');
    });
  });

  describe('DELETE /households/:id/members/:memberId', () => {
    it('should remove member', async () => {
      // Mock admin permission check
      mockPrismaService.householdMember.findUnique
        .mockResolvedValueOnce({ ...mockMember, role: HouseholdRole.ADMIN })
        .mockResolvedValueOnce({ ...mockMember, role: HouseholdRole.PARTNER });

      // Mock admin count check
      mockPrismaService.householdMember.count.mockResolvedValue(2);

      // Mock member deletion
      mockPrismaService.householdMember.delete.mockResolvedValue({});

      await request(app.getHttpServer())
        .delete(`/households/${mockHousehold.id}/members/${mockUser.id}`)
        .expect(204);
    });
  });

  describe('PUT /households/:id/settings', () => {
    it('should update household settings', async () => {
      // Mock admin permission check
      mockPrismaService.householdMember.findUnique.mockResolvedValue({
        ...mockMember,
        role: HouseholdRole.ADMIN,
      });

      mockPrismaService.household.update.mockResolvedValue({
        ...mockHousehold,
        settings: { theme: 'dark' },
      });

      mockPrismaService.household.findUnique.mockResolvedValue({
        ...mockHousehold,
        settings: { theme: 'dark' },
        members: [mockMember],
      });

      const response = await request(app.getHttpServer())
        .put(`/households/${mockHousehold.id}/settings`)
        .send({ theme: 'dark' })
        .expect(200);

      expect(response.body.settings).toHaveProperty('theme', 'dark');
    });
  });

  describe('GET /households/:id/filtered-data', () => {
    it('should return filtered data for individual view', async () => {
      // Mock membership check
      mockPrismaService.householdMember.findUnique.mockResolvedValue(mockMember);

      // Mock household with members
      mockPrismaService.household.findUnique.mockResolvedValue({
        ...mockHousehold,
        members: [mockMember],
      });

      // Mock accounts
      mockPrismaService.account.findMany.mockResolvedValue([
        { id: 'account-1' },
      ]);

      const response = await request(app.getHttpServer())
        .get(`/households/${mockHousehold.id}/filtered-data?viewType=individual`)
        .expect(200);

      expect(response.body).toHaveProperty('allowedUserIds');
      expect(response.body).toHaveProperty('allowedAccountIds');
    });

    it('should validate view type enum', async () => {
      await request(app.getHttpServer())
        .get(`/households/${mockHousehold.id}/filtered-data?viewType=invalid`)
        .expect(400);
    });
  });

  describe('GET /households/:id/permissions/:permission', () => {
    it('should check user permission', async () => {
      // Mock permission check
      mockPrismaService.householdMember.findUnique.mockResolvedValue({
        ...mockMember,
        role: HouseholdRole.ADMIN,
      });

      const response = await request(app.getHttpServer())
        .get(`/households/${mockHousehold.id}/permissions/manage_accounts`)
        .expect(200);

      expect(response.body).toHaveProperty('hasPermission');
      expect(typeof response.body.hasPermission).toBe('boolean');
    });
  });

  describe('GET /households/:id/role', () => {
    it('should return user role', async () => {
      mockPrismaService.householdMember.findUnique.mockResolvedValue({
        ...mockMember,
        role: HouseholdRole.ADMIN,
      });

      const response = await request(app.getHttpServer())
        .get(`/households/${mockHousehold.id}/role`)
        .expect(200);

      expect(response.body).toHaveProperty('role');
      expect(response.body.role).toBe(HouseholdRole.ADMIN);
    });
  });

  describe('GET /households/permissions', () => {
    it('should return available permissions', async () => {
      const response = await request(app.getHttpServer())
        .get('/households/permissions')
        .expect(200);

      expect(response.body).toHaveProperty('permissions');
      expect(response.body).toHaveProperty('permissionsByCategory');
      expect(response.body).toHaveProperty('roleDefaults');
      
      expect(response.body.permissions).toBeInstanceOf(Array);
      expect(response.body.permissions.length).toBeGreaterThan(20);
    });
  });

  describe('GET /households/:id/permissions', () => {
    it('should return user permissions for household', async () => {
      // Mock membership check
      mockPrismaService.householdMember.findUnique.mockResolvedValue({
        ...mockMember,
        permissions: ['manage_accounts', 'view_transactions'],
      });

      const response = await request(app.getHttpServer())
        .get(`/households/${mockHousehold.id}/permissions`)
        .expect(200);

      expect(response.body).toHaveProperty('permissions');
      expect(response.body).toHaveProperty('role');
      expect(response.body).toHaveProperty('permissionDescriptions');
      
      expect(response.body.permissions).toBeInstanceOf(Array);
      expect(response.body.role).toBe(HouseholdRole.ADMIN);
    });
  });

  describe('DELETE /households/:id', () => {
    it('should delete household when user is sole admin', async () => {
      // Mock sole admin check
      mockPrismaService.householdMember.findMany.mockResolvedValue([
        { ...mockMember, role: HouseholdRole.ADMIN },
      ]);

      // Mock no financial data
      mockPrismaService.account.count.mockResolvedValue(0);
      mockPrismaService.transaction.count.mockResolvedValue(0);

      // Mock deletion
      mockPrismaService.household.delete.mockResolvedValue({});

      await request(app.getHttpServer())
        .delete(`/households/${mockHousehold.id}`)
        .expect(204);
    });
  });
});
