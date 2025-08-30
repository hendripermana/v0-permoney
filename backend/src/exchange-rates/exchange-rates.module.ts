import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';
import { ExchangeRatesController } from './exchange-rates.controller';
import { ExchangeRatesService } from './exchange-rates.service';
import { ExchangeRatesRepository } from './exchange-rates.repository';
import { CurrencyService } from './currency.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [
    PrismaModule,
    CacheModule,
    HttpModule,
    ScheduleModule,
  ],
  controllers: [ExchangeRatesController],
  providers: [
    ExchangeRatesService,
    ExchangeRatesRepository,
    CurrencyService,
  ],
  exports: [
    ExchangeRatesService,
    CurrencyService,
  ],
})
export class ExchangeRatesModule {}
