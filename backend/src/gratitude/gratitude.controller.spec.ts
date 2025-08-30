import { Test, TestingModule } from '@nestjs/testing';
import { GratitudeController } from './gratitude.controller';
import { GratitudeService } from './gratitude.service';
import { GratitudeType } from '@prisma/client';
import { CreateGratitudeEntryDto, GratitudeFiltersDto } from './dto';

describe('GratitudeController', () => {
  let controller: GratitudeController;
  let service: GratitudeService;

  const mockGratitudeService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getSummary: jest.fn(),
    getRelationshipInsights: jest.fn(),
  };

  const mockHouseholdId = 'household-123';
  const mockUserId = 'user-123';
  const mockGratitudeId = 'gratitude-123';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GratitudeController],
      providers: [
        {
          provide: GratitudeService,
          useValue: mockGratitudeService,
        },
      ],
    }).compile();

    controller = module.get<GratitudeController>(GratitudeController);
    service = module.get<GratitudeService>(GratitudeService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a gratitude entry', async () => {
      const createDto: CreateGratitudeEntryDto = {
        giver: 'John Doe',
        type: GratitudeType.TREAT,
        description: 'Bought me coffee',
        date: '2024-01-15',
        estimatedValueCents: 5000,
        currency: 'IDR',
      };

      const mockResult = {
        id: mockGratitudeId,
        ...createDto,
        householdId: mockHouseholdId,
        createdBy: mockUserId,
      };

      mockGratitudeService.create.mockResolvedValue(mockResult);

      const result = await controller.create(mockHouseholdId, mockUserId, createDto);

      expect(result).toEqual(mockResult);
      expect(mockGratitudeService.create).toHaveBeenCalledWith(
        mockHouseholdId,
        mockUserId,
        createDto,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated gratitude entries', async () => {
      const filters: GratitudeFiltersDto = {
        type: GratitudeType.TREAT,
        giver: 'John',
      };

      const mockResult = {
        entries: [
          {
            id: 'gratitude-1',
            giver: 'John Doe',
            type: GratitudeType.TREAT,
            description: 'Coffee',
          },
        ],
        total: 1,
        totalPages: 1,
      };

      mockGratitudeService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(mockHouseholdId, mockUserId, filters, 1, 20);

      expect(result).toEqual(mockResult);
      expect(mockGratitudeService.findAll).toHaveBeenCalledWith(
        mockHouseholdId,
        mockUserId,
        filters,
        1,
        20,
      );
    });
  });

  describe('getSummary', () => {
    it('should return gratitude summary', async () => {
      const mockSummary = {
        totalEntries: 10,
        totalValueCents: 50000,
        currency: 'IDR',
        byType: [],
        topGivers: [],
        monthlyTrend: [],
      };

      mockGratitudeService.getSummary.mockResolvedValue(mockSummary);

      const result = await controller.getSummary(mockHouseholdId, mockUserId);

      expect(result).toEqual(mockSummary);
      expect(mockGratitudeService.getSummary).toHaveBeenCalledWith(
        mockHouseholdId,
        mockUserId,
        undefined,
        undefined,
      );
    });

    it('should return gratitude summary with date filters', async () => {
      const fromDate = '2024-01-01';
      const toDate = '2024-01-31';
      const mockSummary = {
        totalEntries: 5,
        totalValueCents: 25000,
        currency: 'IDR',
        byType: [],
        topGivers: [],
        monthlyTrend: [],
      };

      mockGratitudeService.getSummary.mockResolvedValue(mockSummary);

      const result = await controller.getSummary(mockHouseholdId, mockUserId, fromDate, toDate);

      expect(result).toEqual(mockSummary);
      expect(mockGratitudeService.getSummary).toHaveBeenCalledWith(
        mockHouseholdId,
        mockUserId,
        fromDate,
        toDate,
      );
    });
  });

  describe('getRelationshipInsights', () => {
    it('should return relationship insights', async () => {
      const mockInsights = {
        insights: [
          {
            type: 'TOP_GIVER',
            title: 'Most Generous Person',
            description: 'John has shown the most gratitude',
            data: {},
            confidence: 0.9,
          },
        ],
        giverAnalysis: [],
        reciprocityAnalysis: [],
      };

      mockGratitudeService.getRelationshipInsights.mockResolvedValue(mockInsights);

      const result = await controller.getRelationshipInsights(mockHouseholdId, mockUserId);

      expect(result).toEqual(mockInsights);
      expect(mockGratitudeService.getRelationshipInsights).toHaveBeenCalledWith(
        mockHouseholdId,
        mockUserId,
      );
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

      mockGratitudeService.findOne.mockResolvedValue(mockEntry);

      const result = await controller.findOne(mockHouseholdId, mockUserId, mockGratitudeId);

      expect(result).toEqual(mockEntry);
      expect(mockGratitudeService.findOne).toHaveBeenCalledWith(
        mockHouseholdId,
        mockUserId,
        mockGratitudeId,
      );
    });
  });

  describe('update', () => {
    it('should update a gratitude entry', async () => {
      const updateDto = {
        description: 'Updated description',
        estimatedValueCents: 7500,
      };

      const mockUpdatedEntry = {
        id: mockGratitudeId,
        ...updateDto,
        householdId: mockHouseholdId,
      };

      mockGratitudeService.update.mockResolvedValue(mockUpdatedEntry);

      const result = await controller.update(
        mockHouseholdId,
        mockUserId,
        mockGratitudeId,
        updateDto,
      );

      expect(result).toEqual(mockUpdatedEntry);
      expect(mockGratitudeService.update).toHaveBeenCalledWith(
        mockHouseholdId,
        mockUserId,
        mockGratitudeId,
        updateDto,
      );
    });
  });

  describe('remove', () => {
    it('should delete a gratitude entry', async () => {
      mockGratitudeService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(mockHouseholdId, mockUserId, mockGratitudeId);

      expect(result).toEqual({ message: 'Gratitude entry deleted successfully' });
      expect(mockGratitudeService.remove).toHaveBeenCalledWith(
        mockHouseholdId,
        mockUserId,
        mockGratitudeId,
      );
    });
  });
});
