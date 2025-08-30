import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { GratitudeService } from './gratitude.service';
import { PrismaService } from '../prisma/prisma.service';
import { GratitudeType } from '@prisma/client';
import { CreateGratitudeEntryDto, GratitudeFiltersDto } from './dto';

describe('GratitudeService', () => {
  let service: GratitudeService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    householdMember: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    category: {
      findFirst: jest.fn(),
    },
    transaction: {
      findFirst: jest.fn(),
    },
    gratitudeEntry: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
    $queryRaw: jest.fn(),
  };

  const mockHouseholdId = 'household-123';
  const mockUserId = 'user-123';
  const mockGratitudeId = 'gratitude-123';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GratitudeService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<GratitudeService>(GratitudeService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateGratitudeEntryDto = {
      giver: 'John Doe',
      type: GratitudeType.TREAT,
      description: 'Bought me coffee',
      date: '2024-01-15',
      estimatedValueCents: 5000,
      currency: 'IDR',
    };

    it('should create a gratitude entry successfully', async () => {
      const mockCreatedEntry = {
        id: mockGratitudeId,
        ...createDto,
        householdId: mockHouseholdId,
        createdBy: mockUserId,
        date: new Date(createDto.date),
        category: null,
        transaction: null,
        creator: {
          id: mockUserId,
          name: 'Test User',
          email: 'test@example.com',
        },
      };

      mockPrismaService.householdMember.findFirst.mockResolvedValue({
        id: 'member-123',
        userId: mockUserId,
        householdId: mockHouseholdId,
      });
      mockPrismaService.gratitudeEntry.create.mockResolvedValue(mockCreatedEntry);

      const result = await service.create(mockHouseholdId, mockUserId, createDto);

      expect(result).toEqual(mockCreatedEntry);
      expect(mockPrismaService.gratitudeEntry.create).toHaveBeenCalledWith({
        data: {
          ...createDto,
          householdId: mockHouseholdId,
          createdBy: mockUserId,
          date: new Date(createDto.date),
        },
        include: {
          category: true,
          transaction: true,
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    });

    it('should throw ForbiddenException if user does not have access to household', async () => {
      mockPrismaService.householdMember.findFirst.mockResolvedValue(null);

      await expect(
        service.create(mockHouseholdId, mockUserId, createDto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should validate category access if categoryId is provided', async () => {
      const createDtoWithCategory = {
        ...createDto,
        categoryId: 'category-123',
      };

      mockPrismaService.householdMember.findFirst.mockResolvedValue({
        id: 'member-123',
        userId: mockUserId,
        householdId: mockHouseholdId,
      });
      mockPrismaService.category.findFirst.mockResolvedValue(null);

      await expect(
        service.create(mockHouseholdId, mockUserId, createDtoWithCategory),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    const filters: GratitudeFiltersDto = {
      type: GratitudeType.TREAT,
      giver: 'John',
    };

    it('should return paginated gratitude entries', async () => {
      const mockEntries = [
        {
          id: 'gratitude-1',
          giver: 'John Doe',
          type: GratitudeType.TREAT,
          description: 'Coffee',
          date: new Date(),
        },
      ];

      mockPrismaService.householdMember.findFirst.mockResolvedValue({
        id: 'member-123',
        userId: mockUserId,
        householdId: mockHouseholdId,
      });
      mockPrismaService.gratitudeEntry.findMany.mockResolvedValue(mockEntries);
      mockPrismaService.gratitudeEntry.count.mockResolvedValue(1);

      const result = await service.findAll(mockHouseholdId, mockUserId, filters, 1, 20);

      expect(result).toEqual({
        entries: mockEntries,
        total: 1,
        totalPages: 1,
      });
    });
  });

  describe('getSummary', () => {
    it('should return gratitude summary with statistics', async () => {
      mockPrismaService.householdMember.findFirst.mockResolvedValue({
        id: 'member-123',
        userId: mockUserId,
        householdId: mockHouseholdId,
      });
      mockPrismaService.gratitudeEntry.count.mockResolvedValue(10);
      mockPrismaService.gratitudeEntry.aggregate.mockResolvedValue({
        _sum: { estimatedValueCents: 50000 },
      });
      mockPrismaService.gratitudeEntry.groupBy
        .mockResolvedValueOnce([
          {
            type: GratitudeType.TREAT,
            _count: { type: 5 },
            _sum: { estimatedValueCents: 25000 },
            _avg: { estimatedValueCents: 5000 },
          },
        ])
        .mockResolvedValueOnce([
          {
            giver: 'John Doe',
            _count: { giver: 3 },
            _sum: { estimatedValueCents: 15000 },
            _max: { date: new Date() },
          },
        ]);
      mockPrismaService.$queryRaw.mockResolvedValue([
        {
          month: '2024-01',
          count: BigInt(5),
          total_value_cents: BigInt(25000),
        },
      ]);

      const result = await service.getSummary(mockHouseholdId, mockUserId);

      expect(result.totalEntries).toBe(10);
      expect(result.totalValueCents).toBe(50000);
      expect(result.byType).toHaveLength(1);
      expect(result.topGivers).toHaveLength(1);
      expect(result.monthlyTrend).toHaveLength(1);
    });
  });

  describe('getRelationshipInsights', () => {
    it('should return relationship insights', async () => {
      mockPrismaService.householdMember.findFirst.mockResolvedValue({
        id: 'member-123',
        userId: mockUserId,
        householdId: mockHouseholdId,
      });
      mockPrismaService.householdMember.findMany.mockResolvedValue([
        {
          userId: 'user-1',
          user: { name: 'User 1' },
        },
        {
          userId: 'user-2',
          user: { name: 'User 2' },
        },
      ]);
      
      // Mock multiple calls to groupBy for different insights
      mockPrismaService.gratitudeEntry.groupBy
        .mockResolvedValueOnce([]) // Top giver query
        .mockResolvedValueOnce([]) // Top type query
        .mockResolvedValueOnce([]); // Giver analysis query
      
      mockPrismaService.gratitudeEntry.count
        .mockResolvedValueOnce(0) // Recent entries
        .mockResolvedValueOnce(0) // Previous entries
        .mockResolvedValueOnce(0) // Reciprocity analysis
        .mockResolvedValueOnce(0); // Reciprocity analysis

      const result = await service.getRelationshipInsights(mockHouseholdId, mockUserId);

      expect(result).toHaveProperty('insights');
      expect(result).toHaveProperty('giverAnalysis');
      expect(result).toHaveProperty('reciprocityAnalysis');
      expect(Array.isArray(result.insights)).toBe(true);
      expect(Array.isArray(result.giverAnalysis)).toBe(true);
      expect(Array.isArray(result.reciprocityAnalysis)).toBe(true);
    });
  });

  describe('findOne', () => {
    it('should return a specific gratitude entry', async () => {
      const mockEntry = {
        id: mockGratitudeId,
        giver: 'John Doe',
        type: GratitudeType.TREAT,
        description: 'Coffee',
        householdId: mockHouseholdId,
      };

      mockPrismaService.householdMember.findFirst.mockResolvedValue({
        id: 'member-123',
        userId: mockUserId,
        householdId: mockHouseholdId,
      });
      mockPrismaService.gratitudeEntry.findFirst.mockResolvedValue(mockEntry);

      const result = await service.findOne(mockHouseholdId, mockUserId, mockGratitudeId);

      expect(result).toEqual(mockEntry);
    });

    it('should throw NotFoundException if entry not found', async () => {
      mockPrismaService.householdMember.findFirst.mockResolvedValue({
        id: 'member-123',
        userId: mockUserId,
        householdId: mockHouseholdId,
      });
      mockPrismaService.gratitudeEntry.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne(mockHouseholdId, mockUserId, mockGratitudeId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto = {
      description: 'Updated description',
      estimatedValueCents: 7500,
    };

    it('should update a gratitude entry successfully', async () => {
      const mockUpdatedEntry = {
        id: mockGratitudeId,
        ...updateDto,
        householdId: mockHouseholdId,
      };

      mockPrismaService.householdMember.findFirst.mockResolvedValue({
        id: 'member-123',
        userId: mockUserId,
        householdId: mockHouseholdId,
      });
      mockPrismaService.gratitudeEntry.findFirst.mockResolvedValue({
        id: mockGratitudeId,
        householdId: mockHouseholdId,
      });
      mockPrismaService.gratitudeEntry.update.mockResolvedValue(mockUpdatedEntry);

      const result = await service.update(mockHouseholdId, mockUserId, mockGratitudeId, updateDto);

      expect(result).toEqual(mockUpdatedEntry);
    });

    it('should throw NotFoundException if entry not found', async () => {
      mockPrismaService.householdMember.findFirst.mockResolvedValue({
        id: 'member-123',
        userId: mockUserId,
        householdId: mockHouseholdId,
      });
      mockPrismaService.gratitudeEntry.findFirst.mockResolvedValue(null);

      await expect(
        service.update(mockHouseholdId, mockUserId, mockGratitudeId, updateDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a gratitude entry successfully', async () => {
      mockPrismaService.householdMember.findFirst.mockResolvedValue({
        id: 'member-123',
        userId: mockUserId,
        householdId: mockHouseholdId,
      });
      mockPrismaService.gratitudeEntry.findFirst.mockResolvedValue({
        id: mockGratitudeId,
        householdId: mockHouseholdId,
      });
      mockPrismaService.gratitudeEntry.delete.mockResolvedValue({});

      await service.remove(mockHouseholdId, mockUserId, mockGratitudeId);

      expect(mockPrismaService.gratitudeEntry.delete).toHaveBeenCalledWith({
        where: { id: mockGratitudeId },
      });
    });

    it('should throw NotFoundException if entry not found', async () => {
      mockPrismaService.householdMember.findFirst.mockResolvedValue({
        id: 'member-123',
        userId: mockUserId,
        householdId: mockHouseholdId,
      });
      mockPrismaService.gratitudeEntry.findFirst.mockResolvedValue(null);

      await expect(
        service.remove(mockHouseholdId, mockUserId, mockGratitudeId),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
