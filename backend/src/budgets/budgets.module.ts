import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { BudgetsController } from './budgets.controller';
import { BudgetsService } from './budgets.service';
import { BudgetsRepository } from './budgets.repository';
import { BudgetValidators } from './validators/budget.validators';
import { BudgetEventListener } from './listeners/budget-event.listener';
import { BudgetScheduler } from './schedulers/budget.scheduler';
import { BudgetTransactionService } from './services/budget-transaction.service';
import { BudgetAnalyticsService } from './services/budget-analytics.service';
import { BudgetDomainService } from './domain/budget-domain.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CacheModule } from '../cache/cache.module';
import { AuthModule } from '../auth/auth.module';
import { 
  IsValidBudgetPeriodConstraint, 
  IsValidBudgetAllocationConstraint, 
  IsFutureOrCurrentDateConstraint 
} from './validators';

@Module({
  imports: [
    PrismaModule,
    CacheModule,
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 10,
      verboseMemoryLeak: false,
      ignoreErrors: false,
    }),
    AuthModule,
  ],
  controllers: [BudgetsController],
  providers: [
    BudgetsService, 
    BudgetsRepository,
    BudgetDomainService,
    BudgetValidators,
    BudgetEventListener,
    BudgetScheduler,
    BudgetTransactionService,
    BudgetAnalyticsService,
    IsValidBudgetPeriodConstraint,
    IsValidBudgetAllocationConstraint,
    IsFutureOrCurrentDateConstraint,
  ],
  exports: [BudgetsService, BudgetsRepository, BudgetTransactionService, BudgetAnalyticsService],
})
export class BudgetsModule {}
