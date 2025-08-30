import { Injectable, BadRequestException } from '@nestjs/common';

// Comprehensive list of supported currencies with their details
export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  decimalPlaces: number;
  isActive: boolean;
  region: string;
}

@Injectable()
export class CurrencyService {
  private readonly supportedCurrencies: Map<string, CurrencyInfo> = new Map([
    // Major Indonesian currencies and commonly used ones
    ['IDR', { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', decimalPlaces: 0, isActive: true, region: 'ID' }],
    
    // Major international currencies
    ['USD', { code: 'USD', name: 'US Dollar', symbol: '$', decimalPlaces: 2, isActive: true, region: 'US' }],
    ['EUR', { code: 'EUR', name: 'Euro', symbol: '€', decimalPlaces: 2, isActive: true, region: 'EU' }],
    ['GBP', { code: 'GBP', name: 'British Pound', symbol: '£', decimalPlaces: 2, isActive: true, region: 'GB' }],
    ['JPY', { code: 'JPY', name: 'Japanese Yen', symbol: '¥', decimalPlaces: 0, isActive: true, region: 'JP' }],
    
    // Southeast Asian currencies
    ['SGD', { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', decimalPlaces: 2, isActive: true, region: 'SG' }],
    ['MYR', { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', decimalPlaces: 2, isActive: true, region: 'MY' }],
    ['THB', { code: 'THB', name: 'Thai Baht', symbol: '฿', decimalPlaces: 2, isActive: true, region: 'TH' }],
    ['PHP', { code: 'PHP', name: 'Philippine Peso', symbol: '₱', decimalPlaces: 2, isActive: true, region: 'PH' }],
    ['VND', { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', decimalPlaces: 0, isActive: true, region: 'VN' }],
    
    // Other major currencies
    ['CNY', { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', decimalPlaces: 2, isActive: true, region: 'CN' }],
    ['HKD', { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', decimalPlaces: 2, isActive: true, region: 'HK' }],
    ['KRW', { code: 'KRW', name: 'South Korean Won', symbol: '₩', decimalPlaces: 0, isActive: true, region: 'KR' }],
    ['AUD', { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', decimalPlaces: 2, isActive: true, region: 'AU' }],
    ['CAD', { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', decimalPlaces: 2, isActive: true, region: 'CA' }],
    ['CHF', { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimalPlaces: 2, isActive: true, region: 'CH' }],
    ['NZD', { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', decimalPlaces: 2, isActive: true, region: 'NZ' }],
    
    // Cryptocurrencies (for future support)
    ['BTC', { code: 'BTC', name: 'Bitcoin', symbol: '₿', decimalPlaces: 8, isActive: false, region: 'CRYPTO' }],
    ['ETH', { code: 'ETH', name: 'Ethereum', symbol: 'Ξ', decimalPlaces: 8, isActive: false, region: 'CRYPTO' }],
  ]);

  /**
   * Validate if a currency code is supported
   */
  validateCurrency(currencyCode: string): boolean {
    const currency = this.supportedCurrencies.get(currencyCode.toUpperCase());
    return currency !== undefined && currency.isActive;
  }

  /**
   * Get currency information
   */
  getCurrencyInfo(currencyCode: string): CurrencyInfo {
    const currency = this.supportedCurrencies.get(currencyCode.toUpperCase());
    if (!currency) {
      throw new BadRequestException(`Unsupported currency: ${currencyCode}`);
    }
    return currency;
  }

  /**
   * Get all supported currencies
   */
  getSupportedCurrencies(): CurrencyInfo[] {
    return Array.from(this.supportedCurrencies.values()).filter(currency => currency.isActive);
  }

  /**
   * Get currencies by region
   */
  getCurrenciesByRegion(region: string): CurrencyInfo[] {
    return Array.from(this.supportedCurrencies.values())
      .filter(currency => currency.isActive && currency.region === region.toUpperCase());
  }

  /**
   * Format amount according to currency rules
   */
  formatAmount(amountCents: number, currencyCode: string): string {
    const currency = this.getCurrencyInfo(currencyCode);
    const amount = amountCents / Math.pow(10, currency.decimalPlaces);
    
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: currency.decimalPlaces,
      maximumFractionDigits: currency.decimalPlaces,
    }).format(amount);
  }

  /**
   * Convert amount to cents based on currency decimal places
   */
  toCents(amount: number, currencyCode: string): number {
    const currency = this.getCurrencyInfo(currencyCode);
    return Math.round(amount * Math.pow(10, currency.decimalPlaces));
  }

  /**
   * Convert cents to amount based on currency decimal places
   */
  fromCents(amountCents: number, currencyCode: string): number {
    const currency = this.getCurrencyInfo(currencyCode);
    return amountCents / Math.pow(10, currency.decimalPlaces);
  }

  /**
   * Validate currency pair for exchange rate operations
   */
  validateCurrencyPair(fromCurrency: string, toCurrency: string): void {
    if (!this.validateCurrency(fromCurrency)) {
      throw new BadRequestException(`Unsupported source currency: ${fromCurrency}`);
    }
    if (!this.validateCurrency(toCurrency)) {
      throw new BadRequestException(`Unsupported target currency: ${toCurrency}`);
    }
    if (fromCurrency.toUpperCase() === toCurrency.toUpperCase()) {
      throw new BadRequestException('Source and target currencies cannot be the same');
    }
  }

  /**
   * Get default currencies for Indonesian users
   */
  getDefaultCurrencies(): string[] {
    return ['IDR', 'USD', 'EUR', 'SGD', 'MYR'];
  }

  /**
   * Check if currency requires exchange rate for IDR base
   */
  requiresExchangeRate(currency: string, baseCurrency = 'IDR'): boolean {
    return currency.toUpperCase() !== baseCurrency.toUpperCase();
  }
}
