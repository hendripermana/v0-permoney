import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Cron, CronExpression } from '@nestjs/schedule';
import { firstValueFrom } from 'rxjs';
import { ExchangeRatesRepository, CreateExchangeRateData } from './exchange-rates.repository';
import { CurrencyService } from './currency.service';
import { CacheService } from '../cache/cache.service';
import { ExchangeRate } from '../../../node_modules/.prisma/client';
import { 
  CurrencyConversionDto, 
  ConversionResultDto,
  HistoricalRatesQueryDto,
  HistoricalRatesResponseDto,
  HistoricalRangePeriod 
} from './dto';

interface ExternalExchangeRateResponse {
  base: string;
  date: string;
  rates: Record<string, number>;
}

@Injectable()
export class ExchangeRatesService {
  private readonly logger = new Logger(ExchangeRatesService.name);
  private readonly exchangeRateApiUrl: string;
  private readonly exchangeRateApiKey: string;
  private readonly exchangeRateApiTimeout: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly exchangeRatesRepository: ExchangeRatesRepository,
    private readonly currencyService: CurrencyService,
    private readonly cacheService: CacheService,
  ) {
    const externalServices = this.configService.get('externalServices') || {};
    const exchangeRateApi = externalServices.exchangeRateApi || {};
    this.exchangeRateApiUrl = exchangeRateApi.url || 'https://api.exchangerate-api.com/v4/latest';
    this.exchangeRateApiKey = exchangeRateApi.apiKey || '';
    this.exchangeRateApiTimeout = exchangeRateApi.timeout || 5000;
  }

  /**
   * Get current exchange rates for a base currency
   */
  async getCurrentRates(baseCurrency: string, targetCurrencies?: string[]): Promise<ExchangeRate[]> {
    this.currencyService.validateCurrency(baseCurrency);
    
    if (targetCurrencies) {
      targetCurrencies.forEach(currency => this.currencyService.validateCurrency(currency));
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Try to get from cache first
    const cacheKey = this.cacheService.buildExchangeRateCacheKey(baseCurrency, 'current');
    const cachedRates = await this.cacheService.get<ExchangeRate[]>(cacheKey);
    
    if (cachedRates && cachedRates.length > 0) {
      this.logger.debug(`Retrieved current rates from cache for ${baseCurrency}`);
      return this.filterTargetCurrencies(cachedRates, targetCurrencies);
    }

    // Try to get from database
    let rates = await this.exchangeRatesRepository.findExchangeRates({
      fromCurrency: baseCurrency,
      date: today,
    });

    // If not found in database or incomplete, fetch from external API
    if (rates.length === 0 || (targetCurrencies && !this.hasAllTargetCurrencies(rates, targetCurrencies))) {
      try {
        await this.fetchAndStoreCurrentRates(baseCurrency);
        rates = await this.exchangeRatesRepository.findExchangeRates({
          fromCurrency: baseCurrency,
          date: today,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Failed to fetch current rates for ${baseCurrency}: ${errorMessage}`);
        // Return whatever we have in database, even if outdated
        rates = await this.exchangeRatesRepository.findExchangeRates({
          fromCurrency: baseCurrency,
        });
      }
    }

    // Cache the results
    await this.cacheService.set(cacheKey, rates, 3600); // Cache for 1 hour

    return this.filterTargetCurrencies(rates, targetCurrencies);
  }

  /**
   * Get historical exchange rate for a specific date
   */
  async getHistoricalRate(
    fromCurrency: string,
    toCurrency: string,
    date: Date,
  ): Promise<ExchangeRate | null> {
    this.currencyService.validateCurrencyPair(fromCurrency, toCurrency);

    // Normalize date to start of day
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    // Try cache first
    const cacheKey = this.cacheService.buildExchangeRateCacheKey(
      fromCurrency,
      toCurrency,
      normalizedDate.toISOString().split('T')[0],
    );
    const cachedRate = await this.cacheService.get<ExchangeRate>(cacheKey);
    
    if (cachedRate) {
      this.logger.debug(`Retrieved historical rate from cache: ${fromCurrency}/${toCurrency} on ${normalizedDate.toISOString().split('T')[0]}`);
      return cachedRate;
    }

    // Try database
    let rate = await this.exchangeRatesRepository.findExchangeRate(
      fromCurrency,
      toCurrency,
      normalizedDate,
    );

    // If not found, try to fetch from external API
    if (!rate) {
      try {
        await this.fetchAndStoreHistoricalRate(fromCurrency, toCurrency, normalizedDate);
        rate = await this.exchangeRatesRepository.findExchangeRate(
          fromCurrency,
          toCurrency,
          normalizedDate,
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.warn(`Failed to fetch historical rate for ${fromCurrency}/${toCurrency} on ${normalizedDate.toISOString().split('T')[0]}: ${errorMessage}`);
        // Try to find the closest available rate
        rate = await this.exchangeRatesRepository.findLatestExchangeRate(fromCurrency, toCurrency);
      }
    }

    // Cache the result
    if (rate) {
      await this.cacheService.set(cacheKey, rate, 86400); // Cache for 24 hours
    }

    return rate;
  }

  /**
   * Convert currency amount
   */
  async convertCurrency(conversionDto: CurrencyConversionDto): Promise<ConversionResultDto> {
    const { amountCents, fromCurrency, toCurrency, date } = conversionDto;

    // If same currency, return as-is
    if (fromCurrency.toUpperCase() === toCurrency.toUpperCase()) {
      return {
        originalAmountCents: amountCents,
        convertedAmountCents: amountCents,
        fromCurrency: fromCurrency.toUpperCase(),
        toCurrency: toCurrency.toUpperCase(),
        exchangeRate: 1,
        rateDate: date || new Date().toISOString().split('T')[0],
        source: 'same-currency',
      };
    }

    const targetDate = date ? new Date(date) : new Date();
    const exchangeRate = await this.getHistoricalRate(fromCurrency, toCurrency, targetDate);

    if (!exchangeRate) {
      throw new BadRequestException(
        `Exchange rate not available for ${fromCurrency}/${toCurrency} on ${targetDate.toISOString().split('T')[0]}`,
      );
    }

    const rate = parseFloat(exchangeRate.rate.toString());
    const convertedAmountCents = Math.round(amountCents * rate);

    return {
      originalAmountCents: amountCents,
      convertedAmountCents,
      fromCurrency: fromCurrency.toUpperCase(),
      toCurrency: toCurrency.toUpperCase(),
      exchangeRate: rate,
      rateDate: exchangeRate.date.toISOString().split('T')[0],
      source: exchangeRate.source || 'unknown',
    };
  }

  /**
   * Get historical exchange rates for a date range
   */
  async getHistoricalRates(queryDto: HistoricalRatesQueryDto): Promise<HistoricalRatesResponseDto> {
    const { baseCurrency, targetCurrency, startDate, endDate, period } = queryDto;
    
    this.currencyService.validateCurrencyPair(baseCurrency, targetCurrency);

    let start: Date;
    let end: Date;

    if (period) {
      const dateRange = this.calculateDateRangeFromPeriod(period);
      start = dateRange.start;
      end = dateRange.end;
    } else {
      start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default to 30 days ago
      end = endDate ? new Date(endDate) : new Date();
    }

    // Normalize dates
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const rates = await this.exchangeRatesRepository.getHistoricalRates(
      baseCurrency,
      targetCurrency,
      start,
      end,
    );

    return {
      baseCurrency: baseCurrency.toUpperCase(),
      targetCurrency: targetCurrency.toUpperCase(),
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      rates: rates.map(rate => ({
        date: rate.date.toISOString().split('T')[0],
        rate: parseFloat(rate.rate.toString()),
        source: rate.source || 'unknown',
      })),
    };
  }

  /**
   * Scheduled job to update daily exchange rates
   */
  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async updateDailyRates(): Promise<void> {
    this.logger.log('Starting daily exchange rates update');

    const baseCurrencies = this.currencyService.getDefaultCurrencies();
    
    for (const baseCurrency of baseCurrencies) {
      try {
        await this.fetchAndStoreCurrentRates(baseCurrency);
        this.logger.debug(`Updated rates for ${baseCurrency}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Failed to update rates for ${baseCurrency}: ${errorMessage}`);
      }
    }

    this.logger.log('Completed daily exchange rates update');
  }

  /**
   * Fetch and store current rates from external API
   */
  private async fetchAndStoreCurrentRates(baseCurrency: string): Promise<void> {
    try {
      const url = `${this.exchangeRateApiUrl}/${baseCurrency}`;
      const headers: Record<string, string> = {};
      
      if (this.exchangeRateApiKey) {
        headers['Authorization'] = `Bearer ${this.exchangeRateApiKey}`;
      }

      const response = await firstValueFrom(
        this.httpService.get<ExternalExchangeRateResponse>(url, {
          headers,
          timeout: this.exchangeRateApiTimeout,
        }),
      );

      const responseData = response.data as ExternalExchangeRateResponse;
      const { base, date, rates } = responseData;
      const rateDate = new Date(date);
      rateDate.setHours(0, 0, 0, 0);

      const exchangeRateData: CreateExchangeRateData[] = [];

      for (const [currency, rate] of Object.entries(rates)) {
        if (this.currencyService.validateCurrency(currency)) {
          exchangeRateData.push({
            fromCurrency: base,
            toCurrency: currency,
            rate,
            date: rateDate,
            source: 'exchangerate-api.com',
          });
        }
      }

      await this.exchangeRatesRepository.bulkUpsertExchangeRates(exchangeRateData);
      
      this.logger.debug(`Fetched and stored ${exchangeRateData.length} rates for ${baseCurrency}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to fetch current rates for ${baseCurrency}: ${errorMessage}`);
      throw new InternalServerErrorException(`Failed to fetch exchange rates for ${baseCurrency}`);
    }
  }

  /**
   * Fetch and store historical rate from external API
   */
  private async fetchAndStoreHistoricalRate(
    fromCurrency: string,
    toCurrency: string,
    date: Date,
  ): Promise<void> {
    try {
      const dateStr = date.toISOString().split('T')[0];
      const url = `${this.exchangeRateApiUrl}/${dateStr}?base=${fromCurrency}&symbols=${toCurrency}`;
      const headers: Record<string, string> = {};
      
      if (this.exchangeRateApiKey) {
        headers['Authorization'] = `Bearer ${this.exchangeRateApiKey}`;
      }

      const response = await firstValueFrom(
        this.httpService.get<ExternalExchangeRateResponse>(url, {
          headers,
          timeout: this.exchangeRateApiTimeout,
        }),
      );

      const responseData = response.data as ExternalExchangeRateResponse;
      const { rates } = responseData;
      const rate = rates[toCurrency];

      if (rate) {
        await this.exchangeRatesRepository.upsertExchangeRate({
          fromCurrency,
          toCurrency,
          rate,
          date,
          source: 'exchangerate-api.com',
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to fetch historical rate for ${fromCurrency}/${toCurrency} on ${date.toISOString().split('T')[0]}: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Filter rates by target currencies
   */
  private filterTargetCurrencies(rates: ExchangeRate[], targetCurrencies?: string[]): ExchangeRate[] {
    if (!targetCurrencies || targetCurrencies.length === 0) {
      return rates;
    }

    const targetSet = new Set(targetCurrencies.map(c => c.toUpperCase()));
    return rates.filter(rate => targetSet.has(rate.toCurrency));
  }

  /**
   * Check if all target currencies are present in rates
   */
  private hasAllTargetCurrencies(rates: ExchangeRate[], targetCurrencies: string[]): boolean {
    const availableCurrencies = new Set(rates.map(rate => rate.toCurrency));
    return targetCurrencies.every(currency => availableCurrencies.has(currency.toUpperCase()));
  }

  /**
   * Calculate date range from period
   */
  private calculateDateRangeFromPeriod(period: HistoricalRangePeriod): { start: Date; end: Date } {
    const end = new Date();
    const start = new Date();

    switch (period) {
      case HistoricalRangePeriod.WEEK:
        start.setDate(end.getDate() - 7);
        break;
      case HistoricalRangePeriod.MONTH:
        start.setMonth(end.getMonth() - 1);
        break;
      case HistoricalRangePeriod.QUARTER:
        start.setMonth(end.getMonth() - 3);
        break;
      case HistoricalRangePeriod.YEAR:
        start.setFullYear(end.getFullYear() - 1);
        break;
    }

    return { start, end };
  }
}
