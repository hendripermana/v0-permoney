import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { HouseholdModule } from './household.module';
import { HouseholdService } from './household.service';
import { HouseholdRepository } from './household.repository';
import { PermissionsService } from './services/permissions.service';
import { PrismaService } from '../prisma/prisma.service';
import { RequestContextService } from '../common/services/request-context.service';
import { HouseholdRole } from '../../../node_modules/.prisma/client';
import { HOUSEHOLD_PERMISSIONS, DEFAULT_ROLE_PERMISSIONS } from './constants/permissions';

describe('Household Integration Tests', () => {
  let app: INestApplication;
  let householdService: HouseholdService;
  let householdRepository: HouseholdRepository;
  let permissionsService: PermissionsService;
  let prismaService: PrismaService;
  let requestContextService: RequestContextService;

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
    getUserId: jest.fn(),
    getUser: jest.fn(),
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
    await app.init();

    householdService = moduleFixture.get<HouseholdService>(HouseholdService);
    householdRepository = moduleFixture.get<HouseholdRepository>(HouseholdRepository);
    permissionsService = moduleFixture.get<PermissionsService>(PermissionsService);
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    requestContextService = moduleFixture.get<RequestContextService>(RequestContextService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Permissions System Integration', () => {
    it('should have all required permissions defined', () => {
      const permissions = permissionsService.getAllPermissions();
      
      expect(permissions).toContain(HOUSEHOLD_PERMISSIONS.MANAGE_ACCOUNTS);
      expect(permissions).toContain(HOUSEHOLD_PERMISSIONS.VIEW_ALL_ACCOUNTS);
      expect(permissions).toContain(HOUSEHOLD_PERMISSIONS.MANAGE_TRANSACTIONS);
      expect(permissions).toContain(HOUSEHOLD_PERMISSIONS.MANAGE_BUDGETS);
      expect(permissions).toContain(HOUSEHOLD_PERMISSIONS.MANAGE_MEMBERS);
      expect(permissions).toContain(HOUSEHOLD_PERMISSIONS.MANAGE_SETTINGS);
      
      expect(permissions.length).toBeGreaterThanOrEqual(24);
    });

    it('should have proper role-based default permissions', () => {
      const adminPermissions = permissionsService.getDefaultPermissionsForRole(HouseholdRole.ADMIN);
      const partnerPermissions = permissionsService.getDefaultPermissionsForRole(HouseholdRole.PARTNER);
      const staffPermissions = permissionsService.getDefaultPermissionsForRole(HouseholdRole.FINANCE_STAFF);

      // Admin should have all permissions
      expect(adminPermissions.length).toBeGreaterThan(20);
      expect(adminPermissions).toContain(HOUSEHOLD_PERMISSIONS.MANAGE_MEMBERS);
      expect(adminPermissions).toContain(HOUSEHOLD_PERMISSIONS.MANAGE_SETTINGS);

      // Partner should have most permissions but not member management
      expect(partnerPermissions.length).toBeGreaterThan(15);
      expect(partnerPermissions).toContain(HOUSEHOLD_PERMISSIONS.MANAGE_TRANSACTIONS);
      expect(partnerPermissions).toContain(HOUSEHOLD_PERMISSIONS.MANAGE_BUDGETS);

      // Finance staff should have limited permissions
      expect(staffPermissions.length).toBeLessThan(partnerPermissions.length);
      expect(staffPermissions).toContain(HOUSEHOLD_PERMISSIONS.VIEW_ALL_TRANSACTIONS);
      expect(staffPermissions).not.toContain(HOUSEHOLD_PERMISSIONS.MANAGE_MEMBERS);
    });

    it('should categorize permissions properly', () => {
      const categorizedPermissions = permissionsService.getPermissionsByCategory();
      
      expect(categorizedPermissions).toHaveProperty('Account Management');
      expect(categorizedPermissions).toHaveProperty('Transaction Management');
      expect(categorizedPermissions).toHaveProperty('Budget Management');
      expect(categorizedPermissions).toHaveProperty('Household Management');
      
      expect(categorizedPermissions['Account Management']).toContain(HOUSEHOLD_PERMISSIONS.MANAGE_ACCOUNTS);
      expect(categorizedPermissions['Transaction Management']).toContain(HOUSEHOLD_PERMISSIONS.MANAGE_TRANSACTIONS);
      expect(categorizedPermissions['Household Management']).toContain(HOUSEHOLD_PERMISSIONS.MANAGE_MEMBERS);
    });

    it('should provide permission descriptions', () => {
      const description = permissionsService.getPermissionDescription(HOUSEHOLD_PERMISSIONS.MANAGE_ACCOUNTS);
      
      expect(description).toBeDefined();
      expect(description.length).toBeGreaterThan(10);
      expect(description.toLowerCase()).toContain('account');
    });

    it('should validate permissions correctly', () => {
      const validPermissions = [
        HOUSEHOLD_PERMISSIONS.MANAGE_ACCOUNTS,
        HOUSEHOLD_PERMISSIONS.VIEW_ALL_TRANSACTIONS,
      ];
      const invalidPermissions = ['invalid_permission', 'another_invalid'];
      
      expect(permissionsService.validatePermissions(validPermissions)).toBe(true);
      expect(permissionsService.validatePermissions(invalidPermissions)).toBe(false);
      expect(permissionsService.validatePermissions([...validPermissions, ...invalidPermissions])).toBe(false);
    });
  });

  describe('Service Integration', () => {
    it('should integrate permissions service with household service', async () => {
      const availablePermissions = await householdService.getAvailablePermissions();
      
      expect(availablePermissions).toHaveProperty('permissions');
      expect(availablePermissions).toHaveProperty('permissionsByCategory');
      expect(availablePermissions).toHaveProperty('roleDefaults');
      
      expect(availablePermissions.permissions.length).toBeGreaterThan(20);
      expect(availablePermissions.roleDefaults).toHaveProperty('ADMIN');
      expect(availablePermissions.roleDefaults).toHaveProperty('PARTNER');
      expect(availablePermissions.roleDefaults).toHaveProperty('FINANCE_STAFF');
    });

    it('should handle household permissions retrieval', async () => {
      const householdId = 'test-household-id';
      const userId = 'test-user-id';
      
      mockRequestContextService.getUserId.mockReturnValue(userId);
      
      // Mock repository responses
      jest.spyOn(householdRepository, 'findMember').mockResolvedValue({
        id: 'member-id',
        userId,
        householdId,
        role: HouseholdRole.PARTNER,
        permissions: [HOUSEHOLD_PERMISSIONS.MANAGE_TRANSACTIONS, HOUSEHOLD_PERMISSIONS.VIEW_BUDGETS],
        joinedAt: new Date(),
      });

      const result = await householdService.getHouseholdPermissions(householdId);
      
      expect(result).toHaveProperty('permissions');
      expect(result).toHaveProperty('role');
      expect(result).toHaveProperty('permissionDescriptions');
      
      expect(result.role).toBe(HouseholdRole.PARTNER);
      expect(result.permissions).toContain(HOUSEHOLD_PERMISSIONS.MANAGE_TRANSACTIONS);
      expect(result.permissionDescriptions).toHaveProperty(HOUSEHOLD_PERMISSIONS.MANAGE_TRANSACTIONS);
    });
  });

  describe('Data Consistency', () => {
    it('should maintain consistency between constants and service', () => {
      const servicePermissions = permissionsService.getAllPermissions();
      const constantPermissions = Object.values(HOUSEHOLD_PERMISSIONS);
      
      // All constant permissions should be available in service
      constantPermissions.forEach(permission => {
        expect(servicePermissions).toContain(permission);
      });
      
      // Service should not have extra permissions not defined in constants
      expect(servicePermissions.length).toBe(constantPermissions.length);
    });

    it('should have consistent role defaults', () => {
      const adminDefaults = DEFAULT_ROLE_PERMISSIONS.ADMIN;
      const partnerDefaults = DEFAULT_ROLE_PERMISSIONS.PARTNER;
      const staffDefaults = DEFAULT_ROLE_PERMISSIONS.FINANCE_STAFF;
      
      // Admin should have all permissions
      const allPermissions = Object.values(HOUSEHOLD_PERMISSIONS);
      expect(adminDefaults.length).toBe(allPermissions.length);
      
      // Partner should have fewer permissions than admin
      expect(partnerDefaults.length).toBeLessThan(adminDefaults.length);
      
      // Staff should have fewer permissions than partner
      expect(staffDefaults.length).toBeLessThan(partnerDefaults.length);
      
      // All role permissions should be valid
      expect(permissionsService.validatePermissions(adminDefaults)).toBe(true);
      expect(permissionsService.validatePermissions(partnerDefaults)).toBe(true);
      expect(permissionsService.validatePermissions(staffDefaults)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid permission requests gracefully', () => {
      expect(() => {
        permissionsService.getPermissionDescription('invalid_permission' as any);
      }).not.toThrow();
      
      const description = permissionsService.getPermissionDescription('invalid_permission' as any);
      expect(description).toContain('Unknown permission');
    });

    it('should handle missing user context in service methods', async () => {
      mockRequestContextService.getUserId.mockReturnValue(null);
      
      await expect(householdService.getHouseholdPermissions('test-id')).rejects.toThrow('User context required');
      
      const hasPermission = await householdService.hasPermission('test-id', 'test-permission');
      expect(hasPermission).toBe(false);
      
      const userRole = await householdService.getUserRole('test-id');
      expect(userRole).toBeNull();
    });
  });

  describe('Module Dependencies', () => {
    it('should have all required providers', () => {
      expect(householdService).toBeDefined();
      expect(householdRepository).toBeDefined();
      expect(permissionsService).toBeDefined();
      expect(prismaService).toBeDefined();
      expect(requestContextService).toBeDefined();
    });

    it('should have proper service dependencies', () => {
      // Test that services are properly injected
      expect(householdService).toBeInstanceOf(HouseholdService);
      expect(permissionsService).toBeInstanceOf(PermissionsService);
    });
  });
});
