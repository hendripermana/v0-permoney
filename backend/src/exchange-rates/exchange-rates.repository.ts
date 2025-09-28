import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ExchangeRate, Prisma } from '../../../node_modules/.prisma/client';

export interface CreateExchangeRateData {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  date: Date;
  source?: string;
}

export interface ExchangeRateFilter {
  fromCurrency?: string;
  toCurrency?: string;
  date?: Date;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

@Injectable()
export class ExchangeRatesRepository {
  private readonly logger = new Logger(ExchangeRatesRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create or update an exchange rate
   */
  async upsertExchangeRate(data: CreateExchangeRateData): Promise<ExchangeRate> {
    try {
      const exchangeRate = await this.prisma.exchangeRate.upsert({
        where: {
          fromCurrency_toCurrency_date: {
            fromCurrency: data.fromCurrency.toUpperCase(),
            toCurrency: data.toCurrency.toUpperCase(),
            date: data.date,
          },
        },
        update: {
          rate: new Prisma.Decimal(data.rate),
          source: data.source,
        },
        create: {
          fromCurrency: data.fromCurrency.toUpperCase(),
          toCurrency: data.toCurrency.toUpperCase(),
          rate: new Prisma.Decimal(data.rate),
          date: data.date,
          source: data.source,
        },
      });

      this.logger.debug(`Upserted exchange rate: ${data.fromCurrency}/${data.toCurrency} = ${data.rate} on ${data.date.toISOString().split('T')[0]}`);
      return exchangeRate;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to upsert exchange rate: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Bulk upsert exchange rates
   */
  async bulkUpsertExchangeRates(rates: CreateExchangeRateData[]): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        for (const rate of rates) {
          await tx.exchangeRate.upsert({
            where: {
              fromCurrency_toCurrency_date: {
                fromCurrency: rate.fromCurrency.toUpperCase(),
                toCurrency: rate.toCurrency.toUpperCase(),
                date: rate.date,
              },
            },
            update: {
              rate: new Prisma.Decimal(rate.rate),
              source: rate.source,
            },
            create: {
              fromCurrency: rate.fromCurrency.toUpperCase(),
              toCurrency: rate.toCurrency.toUpperCase(),
              rate: new Prisma.Decimal(rate.rate),
              date: rate.date,
              source: rate.source,
            },
          });
        }
      });

      this.logger.debug(`Bulk upserted ${rates.length} exchange rates`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to bulk upsert exchange rates: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Find exchange rate for specific currency pair and date
   */
  async findExchangeRate(
    fromCurrency: string,
    toCurrency: string,
    date: Date,
  ): Promise<ExchangeRate | null> {
    try {
      const exchangeRate = await this.prisma.exchangeRate.findUnique({
        where: {
          fromCurrency_toCurrency_date: {
            fromCurrency: fromCurrency.toUpperCase(),
            toCurrency: toCurrency.toUpperCase(),
            date,
          },
        },
      });

      return exchangeRate;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to find exchange rate: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Find the most recent exchange rate for a currency pair
   */
  async findLatestExchangeRate(
    fromCurrency: string,
    toCurrency: string,
  ): Promise<ExchangeRate | null> {
    try {
      const exchangeRate = await this.prisma.exchangeRate.findFirst({
        where: {
          fromCurrency: fromCurrency.toUpperCase(),
          toCurrency: toCurrency.toUpperCase(),
        },
        orderBy: {
          date: 'desc',
        },
      });

      return exchangeRate;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to find latest exchange rate: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Find exchange rates with filters
   */
  async findExchangeRates(filter: ExchangeRateFilter): Promise<ExchangeRate[]> {
    try {
      const where: Prisma.ExchangeRateWhereInput = {};

      if (filter.fromCurrency) {
        where.fromCurrency = filter.fromCurrency.toUpperCase();
      }

      if (filter.toCurrency) {
        where.toCurrency = filter.toCurrency.toUpperCase();
      }

      if (filter.date) {
        where.date = filter.date;
      }

      if (filter.dateRange) {
        where.date = {
          gte: filter.dateRange.start,
          lte: filter.dateRange.end,
        };
      }

      const exchangeRates = await this.prisma.exchangeRate.findMany({
        where,
        orderBy: [
          { date: 'desc' },
          { fromCurrency: 'asc' },
          { toCurrency: 'asc' },
        ],
      });

      return exchangeRates;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to find exchange rates: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Get historical exchange rates for a currency pair within a date range
   */
  async getHistoricalRates(
    fromCurrency: string,
    toCurrency: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ExchangeRate[]> {
    try {
      const exchangeRates = await this.prisma.exchangeRate.findMany({
        where: {
          fromCurrency: fromCurrency.toUpperCase(),
          toCurrency: toCurrency.toUpperCase(),
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: {
          date: 'asc',
        },
      });

      return exchangeRates;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to get historical rates: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Get all available currency pairs
   */
  async getAvailableCurrencyPairs(): Promise<{ fromCurrency: string; toCurrency: string }[]> {
    try {
      const pairs = await this.prisma.exchangeRate.findMany({
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

      return pairs;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to get available currency pairs: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Delete old exchange rates (for cleanup)
   */
  async deleteOldRates(beforeDate: Date): Promise<number> {
    try {
      const result = await this.prisma.exchangeRate.deleteMany({
        where: {
          date: {
            lt: beforeDate,
          },
        },
      });

      this.logger.debug(`Deleted ${result.count} old exchange rates before ${beforeDate.toISOString().split('T')[0]}`);
      return result.count;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to delete old rates: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Get exchange rate statistics
   */
  async getExchangeRateStats(): Promise<{
    totalRates: number;
    currencyPairs: number;
    oldestDate: Date | null;
    newestDate: Date | null;
  }> {
    try {
      const [totalRates, distinctPairs, dateRange] = await Promise.all([
        this.prisma.exchangeRate.count(),
        this.prisma.exchangeRate.findMany({
          select: {
            fromCurrency: true,
            toCurrency: true,
          },
          distinct: ['fromCurrency', 'toCurrency'],
        }),
        this.prisma.exchangeRate.aggregate({
          _min: {
            date: true,
          },
          _max: {
            date: true,
          },
        }),
      ]);

      return {
        totalRates,
        currencyPairs: distinctPairs.length,
        oldestDate: dateRange._min.date,
        newestDate: dateRange._max.date,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to get exchange rate stats: ${errorMessage}`, errorStack);
      throw error;
    }
  }
}
