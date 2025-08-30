import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(private configService: ConfigService) {
    super({
      datasources: {
        db: {
          url: configService.get<string>('DATABASE_URL'),
        },
      },
      log: configService.get<string>('NODE_ENV') === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async cleanDb() {
    if (this.configService.get<string>('NODE_ENV') === 'production') {
      throw new Error('Cannot clean database in production');
    }

    // Delete in reverse order of dependencies
    const models = [
      'userEvent',
      'spendingPattern',
      'financialInsight',
      'priceHistory',
      'wishlistItem',
      'gratitudeEntry',
      'budgetCategory',
      'budget',
      'debtPayment',
      'debt',
      'ledgerEntry',
      'transactionSplit',
      'transactionTag',
      'transaction',
      'category',
      'account',
      'institution',
      'exchangeRate',
      'session',
      'passkey',
      'householdMember',
      'household',
      'user',
    ];

    for (const model of models) {
      await (this as any)[model].deleteMany();
    }
  }
}
