import { Test, TestingModule } from '@nestjs/testing';
import { ExchangeRatesRepository, CreateExchangeRateData } from './exchange-rates.repository';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

describe('ExchangeRatesRepository', () => {
  let repository: ExchangeRatesRepository;
  let prismaService: PrismaService;

  const mockPrismaService = {
    exchangeRate: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExchangeRatesRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<ExchangeRatesRepository>(ExchangeRatesRepository);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('upsertExchangeRate', () => {
    it('should create or update an exchange rate', async () => {
      const exchangeRateData: CreateExchangeRateData = {
        fromCurrency: 'USD',
        toCurrency: 'IDR',
        rate: 15700,
        date: new Date('2024-01-15'),
        source: 'test-api',
      };

      const expectedResult = {
        id: 'test-id',
        fromCurrency: 'USD',
        toCurrency: 'IDR',
        rate: new Prisma.Decimal(15700),
        date: new Date('2024-01-15'),
        source: 'test-api',
        createdAt: new Date(),
      };

      mockPrismaService.exchangeRate.upsert.mockResolvedValue(expectedResult);

      const result = await repository.upsertExchangeRate(exchangeRateData);

      expect(mockPrismaService.exchangeRate.upsert).toHaveBeenCalledWith({
        where: {
          fromCurrency_toCurrency_date: {
            fromCurrency: 'USD',
            toCurrency: 'IDR',
            date: exchangeRateData.date,
          },
        },
        update: {
          rate: new Prisma.Decimal(15700),
          source: 'test-api',
        },
        create: {
          fromCurrency: 'USD',
          toCurrency: 'IDR',
          rate: new Prisma.Decimal(15700),
          date: exchangeRateData.date,
          source: 'test-api',
        },
      });

      expect(result).toEqual(expectedResult);
    });

    it('should normalize currency codes to uppercase', async () => {
      const exchangeRateData: CreateExchangeRateData = {
        fromCurrency: 'usd',
        toCurrency: 'idr',
        rate: 15700,
        date: new Date('2024-01-15'),
      };

      mockPrismaService.exchangeRate.upsert.mockResolvedValue({});

      await repository.upsertExchangeRate(exchangeRateData);

      expect(mockPrismaService.exchangeRate.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            fromCurrency_toCurrency_date: {
              fromCurrency: 'USD',
              toCurrency: 'IDR',
              date: exchangeRateData.date,
            },
          },
        }),
      );
    });
  });

  describe('bulkUpsertExchangeRates', () => {
    it('should bulk upsert multiple exchange rates in a transaction', async () => {
      const exchangeRates: CreateExchangeRateData[] = [
        {
          fromCurrency: 'USD',
          toCurrency: 'IDR',
          rate: 15700,
          date: new Date('2024-01-15'),
          source: 'test-api',
        },
        {
          fromCurrency: 'USD',
          toCurrency: 'EUR',
          rate: 0.92,
          date: new Date('2024-01-15'),
          source: 'test-api',
        },
      ];

      const mockTransaction = {
        exchangeRate: {
          upsert: jest.fn().mockResolvedValue({}),
        },
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback(mockTransaction);
      });

      await repository.bulkUpsertExchangeRates(exchangeRates);

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(mockTransaction.exchangeRate.upsert).toHaveBeenCalledTimes(2);
    });
  });

  describe('findExchangeRate', () => {
    it('should find exchange rate for specific currency pair and date', async () => {
      const expectedResult = {
        id: 'test-id',
        fromCurrency: 'USD',
        toCurrency: 'IDR',
        rate: new Prisma.Decimal(15700),
        date: new Date('2024-01-15'),
        source: 'test-api',
        createdAt: new Date(),
      };

      mockPrismaService.exchangeRate.findUnique.mockResolvedValue(expectedResult);

      const result = await repository.findExchangeRate('USD', 'IDR', new Date('2024-01-15'));

      expect(mockPrismaService.exchangeRate.findUnique).toHaveBeenCalledWith({
        where: {
          fromCurrency_toCurrency_date: {
            fromCurrency: 'USD',
            toCurrency: 'IDR',
            date: new Date('2024-01-15'),
          },
        },
      });

      expect(result).toEqual(expectedResult);
    });

    it('should return null if exchange rate not found', async () => {
      mockPrismaService.exchangeRate.findUnique.mockResolvedValue(null);

      const result = await repository.findExchangeRate('USD', 'IDR', new Date('2024-01-15'));

      expect(result).toBeNull();
    });
  });

  describe('findLatestExchangeRate', () => {
    it('should find the most recent exchange rate for a currency pair', async () => {
      const expectedResult = {
        id: 'test-id',
        fromCurrency: 'USD',
        toCurrency: 'IDR',
        rate: new Prisma.Decimal(15700),
        date: new Date('2024-01-15'),
        source: 'test-api',
        createdAt: new Date(),
      };

      mockPrismaService.exchangeRate.findFirst.mockResolvedValue(expectedResult);

      const result = await repository.findLatestExchangeRate('USD', 'IDR');

      expect(mockPrismaService.exchangeRate.findFirst).toHaveBeenCalledWith({
        where: {
          fromCurrency: 'USD',
          toCurrency: 'IDR',
        },
        orderBy: {
          date: 'desc',
        },
      });

      expect(result).toEqual(expectedResult);
    });
  });

  describe('getHistoricalRates', () => {
    it('should get historical rates for a date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const expectedResults = [
        {
          id: 'test-id-1',
          fromCurrency: 'USD',
          toCurrency: 'IDR',
          rate: new Prisma.Decimal(15700),
          date: new Date('2024-01-15'),
          source: 'test-api',
          createdAt: new Date(),
        },
        {
          id: 'test-id-2',
          fromCurrency: 'USD',
          toCurrency: 'IDR',
          rate: new Prisma.Decimal(15750),
          date: new Date('2024-01-16'),
          source: 'test-api',
          createdAt: new Date(),
        },
      ];

      mockPrismaService.exchangeRate.findMany.mockResolvedValue(expectedResults);

      const result = await repository.getHistoricalRates('USD', 'IDR', startDate, endDate);

      expect(mockPrismaService.exchangeRate.findMany).toHaveBeenCalledWith({
        where: {
          fromCurrency: 'USD',
          toCurrency: 'IDR',
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: {
          date: 'asc',
        },
      });

      expect(result).toEqual(expectedResults);
    });
  });

  describe('getAvailableCurrencyPairs', () => {
    it('should get all available currency pairs', async () => {
      const expectedPairs = [
        { fromCurrency: 'USD', toCurrency: 'IDR' },
        { fromCurrency: 'EUR', toCurrency: 'IDR' },
        { fromCurrency: 'USD', toCurrency: 'EUR' },
      ];

      mockPrismaService.exchangeRate.findMany.mockResolvedValue(expectedPairs);

      const result = await repository.getAvailableCurrencyPairs();

      expect(mockPrismaService.exchangeRate.findMany).toHaveBeenCalledWith({
        select: {
          fromCurrency: true,
          toCurrency: true,
        },
        distinct: ['fromCurrency', 'toCurrency'],
        orderBy: [
          { fromCurrency: 'asc' },
          { toCurrency: 'asc' },
        ],
      });

      expect(result).toEqual(expectedPairs);
    });
  });

  describe('deleteOldRates', () => {
    it('should delete rates older than specified date', async () => {
      const beforeDate = new Date('2023-01-01');
      const deleteResult = { count: 100 };

      mockPrismaService.exchangeRate.deleteMany.mockResolvedValue(deleteResult);

      const result = await repository.deleteOldRates(beforeDate);

      expect(mockPrismaService.exchangeRate.deleteMany).toHaveBeenCalledWith({
        where: {
          date: {
            lt: beforeDate,
          },
        },
      });

      expect(result).toBe(100);
    });
  });

  describe('getExchangeRateStats', () => {
    it('should return exchange rate statistics', async () => {
      const mockStats = {
        totalRates: 1000,
        distinctPairs: [
          { fromCurrency: 'USD', toCurrency: 'IDR' },
          { fromCurrency: 'EUR', toCurrency: 'IDR' },
        ],
        dateRange: {
          _min: { date: new Date('2023-01-01') },
          _max: { date: new Date('2024-01-15') },
        },
      };

      mockPrismaService.exchangeRate.count.mockResolvedValue(mockStats.totalRates);
      mockPrismaService.exchangeRate.findMany.mockResolvedValue(mockStats.distinctPairs);
      mockPrismaService.exchangeRate.aggregate.mockResolvedValue(mockStats.dateRange);

      const result = await repository.getExchangeRateStats();

      expect(result).toEqual({
        totalRates: 1000,
        currencyPairs: 2,
        oldestDate: new Date('2023-01-01'),
        newestDate: new Date('2024-01-15'),
      });
    });
  });
});
