import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CurrencyService } from './currency.service';

describe('CurrencyService', () => {
  let service: CurrencyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CurrencyService],
    }).compile();

    service = module.get<CurrencyService>(CurrencyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateCurrency', () => {
    it('should validate supported currencies', () => {
      expect(service.validateCurrency('IDR')).toBe(true);
      expect(service.validateCurrency('USD')).toBe(true);
      expect(service.validateCurrency('EUR')).toBe(true);
      expect(service.validateCurrency('SGD')).toBe(true);
    });

    it('should handle case insensitive validation', () => {
      expect(service.validateCurrency('idr')).toBe(true);
      expect(service.validateCurrency('usd')).toBe(true);
      expect(service.validateCurrency('Eur')).toBe(true);
    });

    it('should reject unsupported currencies', () => {
      expect(service.validateCurrency('XYZ')).toBe(false);
      expect(service.validateCurrency('ABC')).toBe(false);
      expect(service.validateCurrency('')).toBe(false);
    });

    it('should reject inactive currencies', () => {
      expect(service.validateCurrency('BTC')).toBe(false);
      expect(service.validateCurrency('ETH')).toBe(false);
    });
  });

  describe('getCurrencyInfo', () => {
    it('should return currency information for valid currencies', () => {
      const idrInfo = service.getCurrencyInfo('IDR');
      expect(idrInfo).toEqual({
        code: 'IDR',
        name: 'Indonesian Rupiah',
        symbol: 'Rp',
        decimalPlaces: 0,
        isActive: true,
        region: 'ID',
      });

      const usdInfo = service.getCurrencyInfo('USD');
      expect(usdInfo).toEqual({
        code: 'USD',
        name: 'US Dollar',
        symbol: '$',
        decimalPlaces: 2,
        isActive: true,
        region: 'US',
      });
    });

    it('should handle case insensitive currency codes', () => {
      const info = service.getCurrencyInfo('idr');
      expect(info.code).toBe('IDR');
    });

    it('should throw error for unsupported currencies', () => {
      expect(() => service.getCurrencyInfo('XYZ')).toThrow(BadRequestException);
      expect(() => service.getCurrencyInfo('XYZ')).toThrow('Unsupported currency: XYZ');
    });
  });

  describe('getSupportedCurrencies', () => {
    it('should return only active currencies', () => {
      const currencies = service.getSupportedCurrencies();
      expect(currencies.length).toBeGreaterThan(0);
      expect(currencies.every(c => c.isActive)).toBe(true);
      expect(currencies.some(c => c.code === 'IDR')).toBe(true);
      expect(currencies.some(c => c.code === 'USD')).toBe(true);
      expect(currencies.some(c => c.code === 'BTC')).toBe(false); // Inactive
    });
  });

  describe('getCurrenciesByRegion', () => {
    it('should return currencies for specific regions', () => {
      const idCurrencies = service.getCurrenciesByRegion('ID');
      expect(idCurrencies).toHaveLength(1);
      expect(idCurrencies[0].code).toBe('IDR');

      const usCurrencies = service.getCurrenciesByRegion('US');
      expect(usCurrencies).toHaveLength(1);
      expect(usCurrencies[0].code).toBe('USD');
    });

    it('should handle case insensitive region codes', () => {
      const currencies = service.getCurrenciesByRegion('id');
      expect(currencies).toHaveLength(1);
      expect(currencies[0].code).toBe('IDR');
    });

    it('should return empty array for unknown regions', () => {
      const currencies = service.getCurrenciesByRegion('XX');
      expect(currencies).toHaveLength(0);
    });
  });

  describe('formatAmount', () => {
    it('should format amounts according to currency rules', () => {
      // IDR has 0 decimal places
      const idrFormatted = service.formatAmount(100000, 'IDR');
      expect(idrFormatted).toContain('100.000'); // Indonesian number format

      // USD has 2 decimal places
      const usdFormatted = service.formatAmount(100000, 'USD');
      expect(usdFormatted).toContain('1.000'); // 100000 cents = 1000.00 USD
    });
  });

  describe('toCents and fromCents', () => {
    it('should convert amounts to and from cents correctly', () => {
      // IDR (0 decimal places)
      expect(service.toCents(1000, 'IDR')).toBe(1000);
      expect(service.fromCents(1000, 'IDR')).toBe(1000);

      // USD (2 decimal places)
      expect(service.toCents(10.50, 'USD')).toBe(1050);
      expect(service.fromCents(1050, 'USD')).toBe(10.5);

      // JPY (0 decimal places)
      expect(service.toCents(100, 'JPY')).toBe(100);
      expect(service.fromCents(100, 'JPY')).toBe(100);
    });
  });

  describe('validateCurrencyPair', () => {
    it('should validate valid currency pairs', () => {
      expect(() => service.validateCurrencyPair('USD', 'IDR')).not.toThrow();
      expect(() => service.validateCurrencyPair('EUR', 'SGD')).not.toThrow();
    });

    it('should reject invalid source currency', () => {
      expect(() => service.validateCurrencyPair('XYZ', 'IDR')).toThrow(BadRequestException);
      expect(() => service.validateCurrencyPair('XYZ', 'IDR')).toThrow('Unsupported source currency: XYZ');
    });

    it('should reject invalid target currency', () => {
      expect(() => service.validateCurrencyPair('USD', 'XYZ')).toThrow(BadRequestException);
      expect(() => service.validateCurrencyPair('USD', 'XYZ')).toThrow('Unsupported target currency: XYZ');
    });

    it('should reject same currency pairs', () => {
      expect(() => service.validateCurrencyPair('USD', 'USD')).toThrow(BadRequestException);
      expect(() => service.validateCurrencyPair('USD', 'USD')).toThrow('Source and target currencies cannot be the same');
    });

    it('should handle case insensitive validation', () => {
      expect(() => service.validateCurrencyPair('usd', 'idr')).not.toThrow();
      expect(() => service.validateCurrencyPair('USD', 'usd')).toThrow(BadRequestException);
    });
  });

  describe('getDefaultCurrencies', () => {
    it('should return default currencies for Indonesian users', () => {
      const defaults = service.getDefaultCurrencies();
      expect(defaults).toContain('IDR');
      expect(defaults).toContain('USD');
      expect(defaults).toContain('EUR');
      expect(defaults).toContain('SGD');
      expect(defaults).toContain('MYR');
    });
  });

  describe('requiresExchangeRate', () => {
    it('should return false for same currency as base', () => {
      expect(service.requiresExchangeRate('IDR', 'IDR')).toBe(false);
      expect(service.requiresExchangeRate('USD', 'USD')).toBe(false);
    });

    it('should return true for different currencies', () => {
      expect(service.requiresExchangeRate('USD', 'IDR')).toBe(true);
      expect(service.requiresExchangeRate('EUR', 'IDR')).toBe(true);
    });

    it('should handle case insensitive comparison', () => {
      expect(service.requiresExchangeRate('idr', 'IDR')).toBe(false);
      expect(service.requiresExchangeRate('usd', 'IDR')).toBe(true);
    });

    it('should use IDR as default base currency', () => {
      expect(service.requiresExchangeRate('IDR')).toBe(false);
      expect(service.requiresExchangeRate('USD')).toBe(true);
    });
  });
});
