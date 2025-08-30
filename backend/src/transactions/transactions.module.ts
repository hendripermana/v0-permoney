import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { TransactionsRepository } from './transactions.repository';
import { RecurringTransactionController } from './recurring-transaction.controller';
import { RecurringTransactionService } from './recurring-transaction.service';
import { RecurringTransactionRepository } from './recurring-transaction.repository';
import { RecurringTransactionScheduler } from './recurring-transaction.scheduler';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { HouseholdModule } from '../household/household.module';
import { ExchangeRatesModule } from '../exchange-rates/exchange-rates.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    HouseholdModule,
    ExchangeRatesModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [TransactionsController, RecurringTransactionController],
  providers: [
    TransactionsService,
    TransactionsRepository,
    RecurringTransactionService,
    RecurringTransactionRepository,
    RecurringTransactionScheduler,
  ],
  exports: [
    TransactionsService,
    TransactionsRepository,
    RecurringTransactionService,
    RecurringTransactionRepository,
  ],
})
export class TransactionsModule {}
