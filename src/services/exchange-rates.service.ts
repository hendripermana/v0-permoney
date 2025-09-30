import { Prisma, ExchangeRate } from '@prisma/client';
import { BaseService } from './base.service';
import { CACHE_KEYS, CACHE_TTL } from '@/lib/redis';

export interface CreateExchangeRateData {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  date: Date;
  source?: string;
}

export class ExchangeRatesService extends BaseService {
  async createExchangeRate(data: CreateExchangeRateData): Promise<ExchangeRate> {
    try {
      this.validateRequired(data, ['fromCurrency', 'toCurrency', 'rate', 'date']);

      const rate = await this.prisma.exchangeRate.create({
        data: {
          fromCurrency: data.fromCurrency,
          toCurrency: data.toCurrency,
          rate: data.rate,
          date: data.date,
          source: data.source,
        },
      });

      const dateStr = data.date.toISOString().split('T')[0];
      await this.invalidateCachePatterns(
        `exchange-rates:${dateStr}`,
        `exchange-rates:${data.fromCurrency}:${data.toCurrency}:*`
      );

      return rate;
    } catch (error) {
      return this.handleError(error, 'Failed to create exchange rate');
    }
  }

  async getExchangeRate(
    fromCurrency: string,
    toCurrency: string,
    date?: Date
  ): Promise<ExchangeRate | null> {
    try {
      const targetDate = date || new Date();
      const dateStr = targetDate.toISOString().split('T')[0];
      const cacheKey = `exchange-rates:${fromCurrency}:${toCurrency}:${dateStr}`;

      return this.getCachedOrFetch(
        cacheKey,
        async () => {
          const rate = await this.prisma.exchangeRate.findFirst({
            where: {
              fromCurrency,
              toCurrency,
              date: targetDate,
            },
            orderBy: { createdAt: 'desc' },
          });

          return rate;
        },
        CACHE_TTL.DAY
      );
    } catch (error) {
      console.error('Failed to fetch exchange rate:', error);
      return null;
    }
  }

  async getLatestExchangeRate(
    fromCurrency: string,
    toCurrency: string
  ): Promise<ExchangeRate | null> {
    try {
      const cacheKey = `exchange-rates:${fromCurrency}:${toCurrency}:latest`;

      return this.getCachedOrFetch(
        cacheKey,
        async () => {
          const rate = await this.prisma.exchangeRate.findFirst({
            where: {
              fromCurrency,
              toCurrency,
            },
            orderBy: { date: 'desc' },
          });

          return rate;
        },
        CACHE_TTL.MEDIUM
      );
    } catch (error) {
      console.error('Failed to fetch latest exchange rate:', error);
      return null;
    }
  }

  async getExchangeRatesForDate(date: Date): Promise<ExchangeRate[]> {
    try {
      const dateStr = date.toISOString().split('T')[0];
      const cacheKey = CACHE_KEYS.exchangeRates(dateStr);

      return this.getCachedOrFetch(
        cacheKey,
        async () => {
          const rates = await this.prisma.exchangeRate.findMany({
            where: { date },
            orderBy: [
              { fromCurrency: 'asc' },
              { toCurrency: 'asc' },
            ],
          });

          return rates;
        },
        CACHE_TTL.DAY
      );
    } catch (error) {
      return this.handleError(error, 'Failed to fetch exchange rates');
    }
  }

  async convertAmount(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    date?: Date
  ): Promise<number> {
    try {
      if (fromCurrency === toCurrency) {
        return amount;
      }

      const rate = await this.getExchangeRate(fromCurrency, toCurrency, date);
      
      if (!rate) {
        // Try reverse rate
        const reverseRate = await this.getExchangeRate(toCurrency, fromCurrency, date);
        if (reverseRate) {
          return amount / Number(reverseRate.rate);
        }
        
        throw new Error(`Exchange rate not found for ${fromCurrency} to ${toCurrency}`);
      }

      return amount * Number(rate.rate);
    } catch (error) {
      return this.handleError(error, 'Failed to convert amount');
    }
  }

  async updateDailyRates(date: Date = new Date()): Promise<void> {
    try {
      // This would call external API to get latest rates
      // For now, placeholder for the cron job implementation
      console.log(`Updating exchange rates for ${date.toISOString()}`);
      
      // Example: Update IDR to USD
      // const response = await fetch('https://api.exchangerate-api.com/v4/latest/IDR');
      // const data = await response.json();
      // await this.createExchangeRate({
      //   fromCurrency: 'IDR',
      //   toCurrency: 'USD',
      //   rate: data.rates.USD,
      //   date,
      //   source: 'exchangerate-api.com'
      // });
    } catch (error) {
      console.error('Failed to update daily rates:', error);
    }
  }
}

export const exchangeRatesService = new ExchangeRatesService();
