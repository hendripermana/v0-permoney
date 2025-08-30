import { Test, TestingModule } from '@nestjs/testing';
import { GratitudeService } from './gratitude.service';
import { PrismaService } from '../prisma/prisma.service';
import { GratitudeType } from '@prisma/client';
import { CreateGratitudeEntryDto } from './dto';

describe('GratitudeService (Integration)', () => {
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

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [
        GratitudeService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = moduleFixture.get<GratitudeService>(GratitudeService);
    prismaService = moduleFixture.get<PrismaService>(PrismaService);

  });

  const mockHouseholdId = 'household-123';
  const mockUserId = 'user-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });



  describe('create', () => {
    it('should create a new gratitude entry', async () => {
      const createDto: CreateGratitudeEntryDto = {
        giver: 'John Doe',
        type: GratitudeType.TREAT,
        description: 'Bought me coffee',
        date: '2024-01-15',
        estimatedValueCents: 5000,
        currency: 'IDR',
      };

      const mockResult = {
        id: 'gratitude-123',
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
      mockPrismaService.gratitudeEntry.create.mockResolvedValue(mockResult);

      const result = await service.create(mockHouseholdId, mockUserId, createDto);

      expect(result).toEqual(mockResult);
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
  });

  describe('findAll', () => {
    it('should return paginated gratitude entries', async () => {
      const mockEntries = [
        {
          id: 'gratitude-1',
          giver: 'Jane Doe',
          type: GratitudeType.HELP,
          description: 'Helped with groceries',
          date: new Date('2024-01-10'),
        },
      ];

      mockPrismaService.householdMember.findFirst.mockResolvedValue({
        id: 'member-123',
        userId: mockUserId,
        householdId: mockHouseholdId,
      });
      mockPrismaService.gratitudeEntry.findMany.mockResolvedValue(mockEntries);
      mockPrismaService.gratitudeEntry.count.mockResolvedValue(1);

      const result = await service.findAll(mockHouseholdId, mockUserId, {}, 1, 20);

      expect(result).toEqual({
        entries: mockEntries,
        total: 1,
        totalPages: 1,
      });
    });

    it('should filter gratitude entries by type', async () => {
      const mockEntries = [
        {
          id: 'gratitude-1',
          giver: 'Jane Doe',
          type: GratitudeType.HELP,
          description: 'Helped with groceries',
          date: new Date('2024-01-10'),
        },
      ];

      mockPrismaService.householdMember.findFirst.mockResolvedValue({
        id: 'member-123',
        userId: mockUserId,
        householdId: mockHouseholdId,
      });
      mockPrismaService.gratitudeEntry.findMany.mockResolvedValue(mockEntries);
      mockPrismaService.gratitudeEntry.count.mockResolvedValue(1);

      const result = await service.findAll(mockHouseholdId, mockUserId, { type: GratitudeType.HELP }, 1, 20);

      expect(result.entries).toEqual(mockEntries);
    });
  });

  describe('getSummary', () => {
    it('should return gratitude summary', async () => {
      mockPrismaService.householdMember.findFirst.mockResolvedValue({
        id: 'member-123',
        userId: mockUserId,
        householdId: mockHouseholdId,
      });
      mockPrismaService.gratitudeEntry.count.mockResolvedValue(5);
      mockPrismaService.gratitudeEntry.aggregate.mockResolvedValue({
        _sum: { estimatedValueCents: 25000 },
      });
      mockPrismaService.gratitudeEntry.groupBy
        .mockResolvedValueOnce([
          {
            type: GratitudeType.TREAT,
            _count: { type: 3 },
            _sum: { estimatedValueCents: 15000 },
            _avg: { estimatedValueCents: 5000 },
          },
        ])
        .mockResolvedValueOnce([
          {
            giver: 'John Doe',
            _count: { giver: 2 },
            _sum: { estimatedValueCents: 10000 },
            _max: { date: new Date() },
          },
        ]);
      mockPrismaService.$queryRaw.mockResolvedValue([
        {
          month: '2024-01',
          count: BigInt(3),
          total_value_cents: BigInt(15000),
        },
      ]);

      const result = await service.getSummary(mockHouseholdId, mockUserId);

      expect(result).toHaveProperty('totalEntries');
      expect(result).toHaveProperty('totalValueCents');
      expect(result).toHaveProperty('currency');
      expect(result).toHaveProperty('byType');
      expect(result).toHaveProperty('topGivers');
      expect(result).toHaveProperty('monthlyTrend');
      expect(Array.isArray(result.byType)).toBe(true);
      expect(Array.isArray(result.topGivers)).toBe(true);
      expect(Array.isArray(result.monthlyTrend)).toBe(true);
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
      
      // Mock multiple calls for insights generation
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
});
