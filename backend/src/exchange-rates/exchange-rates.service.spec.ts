import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { ExchangeRatesService } from './exchange-rates.service';
import { ExchangeRatesRepository } from './exchange-rates.repository';
import { CurrencyService } from './currency.service';
import { CacheService } from '../cache/cache.service';
import { CurrencyConversionDto, HistoricalRatesQueryDto, HistoricalRangePeriod } from './dto';
import { Prisma } from '@prisma/client';

describe('ExchangeRatesService', () => {
  let service: ExchangeRatesService;
  let exchangeRatesRepository: ExchangeRatesRepository;
  let currencyService: CurrencyService;
  let cacheService: CacheService;
  let httpService: HttpService;
  let configService: ConfigService;

  const mockExchangeRatesRepository = {
    findExchangeRates: jest.fn(),
    findExchangeRate: jest.fn(),
    findLatestExchangeRate: jest.fn(),
    getHistoricalRates: jest.fn(),
    upsertExchangeRate: jest.fn(),
    bulkUpsertExchangeRates: jest.fn(),
  };

  const mockCurrencyService = {
    validateCurrency: jest.fn(),
    validateCurrencyPair: jest.fn(),
    getDefaultCurrencies: jest.fn(),
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    buildExchangeRateCacheKey: jest.fn(),
  };

  const mockHttpService = {
    get: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExchangeRatesService,
        {
          provide: ExchangeRatesRepository,
          useValue: mockExchangeRatesRepository,
        },
        {
          provide: CurrencyService,
          useValue: mockCurrencyService,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<ExchangeRatesService>(ExchangeRatesService);
    exchangeRatesRepository = module.get<ExchangeRatesRepository>(ExchangeRatesRepository);
    currencyService = module.get<CurrencyService>(CurrencyService);
    cacheService = module.get<CacheService>(CacheService);
    httpService = module.get<HttpService>(HttpService);
    configService = module.get<ConfigService>(ConfigService);

    // Setup default config mock
    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'externalServices') {
        return {
          exchangeRateApi: {
            url: 'https://api.test.com/v4/latest',
            apiKey: 'test-key',
            timeout: 5000,
          },
        };
      }
      return undefined;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCurrentRates', () => {
    it('should return cached rates if available', async () => {
      const baseCurrency = 'USD';
      const cachedRates = [
        {
          id: 'test-id',
          fromCurrency: 'USD',
          toCurrency: 'IDR',
          rate: new Prisma.Decimal(15700),
          date: new Date('2024-01-15'),
          source: 'test-api',
          createdAt: new Date(),
        },
      ];

      mockCurrencyService.validateCurrency.mockReturnValue(true);
      mockCacheService.buildExchangeRateCacheKey.mockReturnValue('cache-key');
      mockCacheService.get.mockResolvedValue(cachedRates);

      const result = await service.getCurrentRates(baseCurrency);

      expect(mockCurrencyService.validateCurrency).toHaveBeenCalledWith(baseCurrency);
      expect(mockCacheService.get).toHaveBeenCalledWith('cache-key');
      expect(result).toEqual(cachedRates);
    });

    it('should fetch from database if not cached', async () => {
      const baseCurrency = 'USD';
      const dbRates = [
        {
          id: 'test-id',
          fromCurrency: 'USD',
          toCurrency: 'IDR',
          rate: new Prisma.Decimal(15700),
          date: new Date('2024-01-15'),
          source: 'test-api',
          createdAt: new Date(),
        },
      ];

      mockCurrencyService.validateCurrency.mockReturnValue(true);
      mockCacheService.buildExchangeRateCacheKey.mockReturnValue('cache-key');
      mockCacheService.get.mockResolvedValue(null);
      mockExchangeRatesRepository.findExchangeRates.mockResolvedValue(dbRates);
      mockCacheService.set.mockResolvedValue(undefined);

      const result = await service.getCurrentRates(baseCurrency);

      expect(mockExchangeRatesRepository.findExchangeRates).toHaveBeenCalled();
      expect(mockCacheService.set).toHaveBeenCalledWith('cache-key', dbRates, 3600);
      expect(result).toEqual(dbRates);
    });

    it('should validate target currencies if provided', async () => {
      const baseCurrency = 'USD';
      const targetCurrencies = ['IDR', 'EUR'];

      mockCurrencyService.validateCurrency.mockReturnValue(true);
      mockCacheService.buildExchangeRateCacheKey.mockReturnValue('cache-key');
      mockCacheService.get.mockResolvedValue([]);
      mockExchangeRatesRepository.findExchangeRates.mockResolvedValue([]);

      await service.getCurrentRates(baseCurrency, targetCurrencies);

      expect(mockCurrencyService.validateCurrency).toHaveBeenCalledWith(baseCurrency);
      expect(mockCurrencyService.validateCurrency).toHaveBeenCalledWith('IDR');
      expect(mockCurrencyService.validateCurrency).toHaveBeenCalledWith('EUR');
    });
  });

  describe('getHistoricalRate', () => {
    it('should return cached historical rate if available', async () => {
      const fromCurrency = 'USD';
      const toCurrency = 'IDR';
      const date = new Date('2024-01-15');
      const cachedRate = {
        id: 'test-id',
        fromCurrency: 'USD',
        toCurrency: 'IDR',
        rate: new Prisma.Decimal(15700),
        date: new Date('2024-01-15'),
        source: 'test-api',
        createdAt: new Date(),
      };

      mockCurrencyService.validateCurrencyPair.mockReturnValue(undefined);
      mockCacheService.buildExchangeRateCacheKey.mockReturnValue('cache-key');
      mockCacheService.get.mockResolvedValue(cachedRate);

      const result = await service.getHistoricalRate(fromCurrency, toCurrency, date);

      expect(mockCurrencyService.validateCurrencyPair).toHaveBeenCalledWith(fromCurrency, toCurrency);
      expect(mockCacheService.get).toHaveBeenCalledWith('cache-key');
      expect(result).toEqual(cachedRate);
    });

    it('should fetch from database if not cached', async () => {
      const fromCurrency = 'USD';
      const toCurrency = 'IDR';
      const date = new Date('2024-01-15');
      const dbRate = {
        id: 'test-id',
        fromCurrency: 'USD',
        toCurrency: 'IDR',
        rate: new Prisma.Decimal(15700),
        date: new Date('2024-01-15'),
        source: 'test-api',
        createdAt: new Date(),
      };

      mockCurrencyService.validateCurrencyPair.mockReturnValue(undefined);
      mockCacheService.buildExchangeRateCacheKey.mockReturnValue('cache-key');
      mockCacheService.get.mockResolvedValue(null);
      mockExchangeRatesRepository.findExchangeRate.mockResolvedValue(dbRate);
      mockCacheService.set.mockResolvedValue(undefined);

      const result = await service.getHistoricalRate(fromCurrency, toCurrency, date);

      expect(mockExchangeRatesRepository.findExchangeRate).toHaveBeenCalledWith(
        fromCurrency,
        toCurrency,
        expect.any(Date),
      );
      expect(mockCacheService.set).toHaveBeenCalledWith('cache-key', dbRate, 86400);
      expect(result).toEqual(dbRate);
    });

    it('should return null if rate not found', async () => {
      const fromCurrency = 'USD';
      const toCurrency = 'IDR';
      const date = new Date('2024-01-15');

      mockCurrencyService.validateCurrencyPair.mockReturnValue(undefined);
      mockCacheService.buildExchangeRateCacheKey.mockReturnValue('cache-key');
      mockCacheService.get.mockResolvedValue(null);
      mockExchangeRatesRepository.findExchangeRate.mockResolvedValue(null);
      mockExchangeRatesRepository.findLatestExchangeRate.mockResolvedValue(null);

      const result = await service.getHistoricalRate(fromCurrency, toCurrency, date);

      expect(result).toBeNull();
    });
  });

  describe('convertCurrency', () => {
    it('should return same amount for same currency conversion', async () => {
      const conversionDto: CurrencyConversionDto = {
        amountCents: 100000,
        fromCurrency: 'USD',
        toCurrency: 'USD',
      };

      const result = await service.convertCurrency(conversionDto);

      expect(result).toEqual({
        originalAmountCents: 100000,
        convertedAmountCents: 100000,
        fromCurrency: 'USD',
        toCurrency: 'USD',
        exchangeRate: 1,
        rateDate: expect.any(String),
        source: 'same-currency',
      });
    });

    it('should convert currency using exchange rate', async () => {
      const conversionDto: CurrencyConversionDto = {
        amountCents: 100000,
        fromCurrency: 'USD',
        toCurrency: 'IDR',
        date: '2024-01-15',
      };

      const exchangeRate = {
        id: 'test-id',
        fromCurrency: 'USD',
        toCurrency: 'IDR',
        rate: new Prisma.Decimal(15700),
        date: new Date('2024-01-15'),
        source: 'test-api',
        createdAt: new Date(),
      };

      mockCurrencyService.validateCurrencyPair.mockReturnValue(undefined);
      mockCacheService.buildExchangeRateCacheKey.mockReturnValue('cache-key');
      mockCacheService.get.mockResolvedValue(null);
      mockExchangeRatesRepository.findExchangeRate.mockResolvedValue(exchangeRate);

      const result = await service.convertCurrency(conversionDto);

      expect(result).toEqual({
        originalAmountCents: 100000,
        convertedAmountCents: 1570000000, // 100000 * 15700
        fromCurrency: 'USD',
        toCurrency: 'IDR',
        exchangeRate: 15700,
        rateDate: '2024-01-15',
        source: 'test-api',
      });
    });

    it('should throw error if exchange rate not available', async () => {
      const conversionDto: CurrencyConversionDto = {
        amountCents: 100000,
        fromCurrency: 'USD',
        toCurrency: 'IDR',
      };

      mockCurrencyService.validateCurrencyPair.mockReturnValue(undefined);
      mockCacheService.buildExchangeRateCacheKey.mockReturnValue('cache-key');
      mockCacheService.get.mockResolvedValue(null);
      mockExchangeRatesRepository.findExchangeRate.mockResolvedValue(null);
      mockExchangeRatesRepository.findLatestExchangeRate.mockResolvedValue(null);

      await expect(service.convertCurrency(conversionDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getHistoricalRates', () => {
    it('should get historical rates for date range', async () => {
      const queryDto: HistoricalRatesQueryDto = {
        baseCurrency: 'USD',
        targetCurrency: 'IDR',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };

      const historicalRates = [
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

      mockCurrencyService.validateCurrencyPair.mockReturnValue(undefined);
      mockExchangeRatesRepository.getHistoricalRates.mockResolvedValue(historicalRates);

      const result = await service.getHistoricalRates(queryDto);

      expect(mockCurrencyService.validateCurrencyPair).toHaveBeenCalledWith('USD', 'IDR');
      expect(mockExchangeRatesRepository.getHistoricalRates).toHaveBeenCalledWith(
        'USD',
        'IDR',
        expect.any(Date),
        expect.any(Date),
      );
      expect(result.baseCurrency).toBe('USD');
      expect(result.targetCurrency).toBe('IDR');
      expect(result.rates).toEqual([
        {
          date: '2024-01-15',
          rate: 15700,
          source: 'test-api',
        },
        {
          date: '2024-01-16',
          rate: 15750,
          source: 'test-api',
        },
      ]);
    });

    it('should use predefined period if provided', async () => {
      const queryDto: HistoricalRatesQueryDto = {
        baseCurrency: 'USD',
        targetCurrency: 'IDR',
        period: HistoricalRangePeriod.MONTH,
      };

      mockCurrencyService.validateCurrencyPair.mockReturnValue(undefined);
      mockExchangeRatesRepository.getHistoricalRates.mockResolvedValue([]);

      await service.getHistoricalRates(queryDto);

      expect(mockExchangeRatesRepository.getHistoricalRates).toHaveBeenCalledWith(
        'USD',
        'IDR',
        expect.any(Date),
        expect.any(Date),
      );
    });
  });

  describe('updateDailyRates', () => {
    it('should update rates for default currencies', async () => {
      const defaultCurrencies = ['IDR', 'USD', 'EUR'];
      const mockResponse = {
        data: {
          base: 'IDR',
          date: '2024-01-15',
          rates: {
            USD: 0.000064,
            EUR: 0.000059,
          },
        },
      };

      mockCurrencyService.getDefaultCurrencies.mockReturnValue(defaultCurrencies);
      mockCurrencyService.validateCurrency.mockReturnValue(true);
      mockHttpService.get.mockReturnValue(of(mockResponse));
      mockExchangeRatesRepository.bulkUpsertExchangeRates.mockResolvedValue(undefined);

      await service.updateDailyRates();

      expect(mockCurrencyService.getDefaultCurrencies).toHaveBeenCalled();
      expect(mockHttpService.get).toHaveBeenCalledTimes(defaultCurrencies.length);
      expect(mockExchangeRatesRepository.bulkUpsertExchangeRates).toHaveBeenCalledTimes(defaultCurrencies.length);
    });

    it('should handle API errors gracefully', async () => {
      const defaultCurrencies = ['IDR'];

      mockCurrencyService.getDefaultCurrencies.mockReturnValue(defaultCurrencies);
      mockHttpService.get.mockReturnValue(throwError(() => new Error('API Error')));

      // Should not throw, just log the error
      await expect(service.updateDailyRates()).resolves.not.toThrow();
    });
  });
});
