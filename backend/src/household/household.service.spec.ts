import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, ConflictException } from '@nestjs/common';
import { HouseholdRole } from '../../../node_modules/.prisma/client';
import { HouseholdService } from './household.service';
import { HouseholdRepository } from './household.repository';
import { PermissionsService } from './services/permissions.service';
import { PrismaService } from '../prisma/prisma.service';
import { RequestContextService } from '../common/services/request-context.service';
import { CreateHouseholdDto, InviteMemberDto, ViewType } from './dto';

describe('HouseholdService', () => {
  let service: HouseholdService;
  let repository: HouseholdRepository;
  let permissionsService: PermissionsService;
  let prisma: PrismaService;
  let requestContext: RequestContextService;

  const mockHousehold = {
    id: 'household-1',
    name: 'Test Household',
    baseCurrency: 'IDR',
    settings: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    members: [
      {
        id: 'member-1',
        userId: 'user-1',
        householdId: 'household-1',
        role: HouseholdRole.ADMIN,
        permissions: [],
        joinedAt: new Date(),
        user: {
          id: 'user-1',
          name: 'Test User',
          email: 'test@example.com',
          avatarUrl: null,
        },
      },
    ],
  };

  const mockRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findByUserId: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    addMember: jest.fn(),
    updateMember: jest.fn(),
    removeMember: jest.fn(),
    findMember: jest.fn(),
    getMembersByHousehold: jest.fn(),
    getUserRole: jest.fn(),
    hasPermission: jest.fn(),
    getFilteredData: jest.fn(),
  };

  const mockPrisma = {
    $transaction: jest.fn(),
    household: {
      create: jest.fn(),
    },
    householdMember: {
      create: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    account: {
      count: jest.fn(),
    },
    transaction: {
      count: jest.fn(),
    },
  };

  const mockRequestContext = {
    getUserId: jest.fn(),
  };

  const mockPermissionsService = {
    getAllPermissions: jest.fn(),
    getDefaultPermissionsForRole: jest.fn(),
    getPermissionsByCategory: jest.fn(),
    getPermissionDescription: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HouseholdService,
        {
          provide: HouseholdRepository,
          useValue: mockRepository,
        },
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: RequestContextService,
          useValue: mockRequestContext,
        },
        {
          provide: PermissionsService,
          useValue: mockPermissionsService,
        },
      ],
    }).compile();

    service = module.get<HouseholdService>(HouseholdService);
    repository = module.get<HouseholdRepository>(HouseholdRepository);
    permissionsService = module.get<PermissionsService>(PermissionsService);
    prisma = module.get<PrismaService>(PrismaService);
    requestContext = module.get<RequestContextService>(RequestContextService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateHouseholdDto = {
      name: 'Test Household',
      baseCurrency: 'IDR',
    };

    it('should create a household with the user as admin', async () => {
      mockRequestContext.getUserId.mockReturnValue('user-1');
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          household: { create: jest.fn().mockResolvedValue({ id: 'household-1' }) },
          householdMember: { create: jest.fn() },
        });
      });
      mockRepository.findById.mockResolvedValue(mockHousehold);

      const result = await service.create(createDto);

      expect(result).toEqual(mockHousehold);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should throw BadRequestException if no user context', async () => {
      mockRequestContext.getUserId.mockReturnValue(null);

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('inviteMember', () => {
    const inviteDto: InviteMemberDto = {
      email: 'newuser@example.com',
      role: HouseholdRole.PARTNER,
      permissions: [],
    };

    it('should invite a new member successfully', async () => {
      mockRequestContext.getUserId.mockReturnValue('user-1');
      mockRepository.getUserRole.mockResolvedValue(HouseholdRole.ADMIN);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-2',
        email: 'newuser@example.com',
      });
      mockRepository.findMember.mockResolvedValue(null);
      mockRepository.addMember.mockResolvedValue({});

      await service.inviteMember('household-1', inviteDto);

      expect(mockRepository.addMember).toHaveBeenCalledWith(
        'household-1',
        'user-2',
        HouseholdRole.PARTNER,
        expect.any(Array), // Default permissions will be applied
      );
    });

    it('should throw ForbiddenException if user is not admin', async () => {
      mockRequestContext.getUserId.mockReturnValue('user-1');
      mockRepository.getUserRole.mockResolvedValue(HouseholdRole.PARTNER);

      await expect(service.inviteMember('household-1', inviteDto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ConflictException if user is already a member', async () => {
      mockRequestContext.getUserId.mockReturnValue('user-1');
      mockRepository.getUserRole.mockResolvedValue(HouseholdRole.ADMIN);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-2',
        email: 'newuser@example.com',
      });
      mockRepository.findMember.mockResolvedValue({ id: 'existing-member' });

      await expect(service.inviteMember('household-1', inviteDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('getFilteredData', () => {
    it('should return filtered data for individual view', async () => {
      mockRequestContext.getUserId.mockReturnValue('user-1');
      mockRepository.findMember.mockResolvedValue({ id: 'member-1' });
      mockRepository.getFilteredData.mockResolvedValue({
        allowedUserIds: ['user-1'],
        allowedAccountIds: ['account-1'],
      });

      const result = await service.getFilteredData('household-1', ViewType.INDIVIDUAL);

      expect(result).toEqual({
        allowedUserIds: ['user-1'],
        allowedAccountIds: ['account-1'],
      });
      expect(mockRepository.getFilteredData).toHaveBeenCalledWith(
        'household-1',
        'user-1',
        ViewType.INDIVIDUAL,
      );
    });

    it('should throw ForbiddenException if user is not a member', async () => {
      mockRequestContext.getUserId.mockReturnValue('user-1');
      mockRepository.findMember.mockResolvedValue(null);

      await expect(
        service.getFilteredData('household-1', ViewType.INDIVIDUAL),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateMemberRole', () => {
    it('should prevent self-demotion if user is the only admin', async () => {
      mockRequestContext.getUserId.mockReturnValue('user-1');
      mockRepository.getUserRole.mockResolvedValue(HouseholdRole.ADMIN);
      mockPrisma.householdMember.count.mockResolvedValue(1);

      await expect(
        service.updateMemberRole('household-1', 'user-1', { role: HouseholdRole.PARTNER }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('hasPermission', () => {
    it('should return true for admin users', async () => {
      mockRequestContext.getUserId.mockReturnValue('user-1');
      mockRepository.hasPermission.mockResolvedValue(true);

      const result = await service.hasPermission('household-1', 'manage_accounts');

      expect(result).toBe(true);
      expect(mockRepository.hasPermission).toHaveBeenCalledWith(
        'household-1',
        'user-1',
        'manage_accounts',
      );
    });

    it('should return false if no user context', async () => {
      mockRequestContext.getUserId.mockReturnValue(null);

      const result = await service.hasPermission('household-1', 'manage_accounts');

      expect(result).toBe(false);
    });
  });
});
