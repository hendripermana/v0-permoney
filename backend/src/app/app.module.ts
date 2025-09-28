import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from '../auth/auth.module';
import { HouseholdModule } from '../household/household.module';
import { AccountsModule } from '../accounts/accounts.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { ExchangeRatesModule } from '../exchange-rates/exchange-rates.module';
import { DebtsModule } from '../debts/debts.module';
import { BudgetsModule } from '../budgets/budgets.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { CommonModule } from '../common/common.module';
import { PrismaService } from '../prisma/prisma.service';
import { RequestContextService } from '../common/services/request-context.service';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { UserContextInterceptor } from '../auth/interceptors/user-context.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    PrismaModule,
    CommonModule,
    AuthModule,
    HouseholdModule,
    AccountsModule,
    TransactionsModule,
    ExchangeRatesModule,
    DebtsModule,
    BudgetsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ClerkAuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: UserContextInterceptor,
    },
  ],
})
export class AppModule {}
