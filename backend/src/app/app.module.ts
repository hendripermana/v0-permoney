import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
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
import { WishlistModule } from '../wishlist/wishlist.module';
import { GratitudeModule } from '../gratitude/gratitude.module';
import { OcrModule } from '../ocr/ocr.module';
import { IslamicFinanceModule } from '../islamic-finance/islamic-finance.module';
import { EventsModule } from '../events/events.module';
import { AIInsightsModule } from '../ai-insights/ai-insights.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';
import { GraphQLApiModule } from '../graphql/graphql.module';
import { CacheModule } from '../cache/cache.module';
import { CommonModule } from '../common/common.module';
import { ResilienceModule } from '../common/resilience/resilience.module';
import { HealthModule } from '../health/health.module';
import { LoggingModule } from '../common/logging/logging.module';
import { MetricsModule } from '../common/metrics/metrics.module';
import { MonitoringModule as CommonMonitoringModule } from '../common/monitoring/monitoring.module';
import { MonitoringModule } from '../monitoring/monitoring.module';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SecurityModule } from '../security/security.module';
import { SecurityMiddleware } from '../security/middleware/security.middleware';
import { CsrfMiddleware } from '../common/middleware/csrf.middleware';
import { RequestContextMiddleware } from '../common/middleware/request-context.middleware';
import { LoggingMiddleware } from '../common/middleware/logging.middleware';
import { MetricsMiddleware } from '../common/middleware/metrics.middleware';
import configuration from '../config/configuration';
import { configValidationSchema } from '../config/validation.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: configValidationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
      envFilePath: ['.env.local', '.env'],
    }),
    ScheduleModule.forRoot(),
    CommonModule,
    ResilienceModule,
    PrismaModule,
    CacheModule,
    HealthModule,
    LoggingModule,
    MetricsModule,
    CommonMonitoringModule,
    MonitoringModule,
    AuthModule,
    HouseholdModule,
    AccountsModule,
    TransactionsModule,
    ExchangeRatesModule,
    DebtsModule,
    BudgetsModule,
    WishlistModule,
    GratitudeModule,
    OcrModule,
    IslamicFinanceModule,
    EventsModule,
    AIInsightsModule,
    AnalyticsModule,
    NotificationsModule,
    SecurityModule,
    GraphQLApiModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestContextMiddleware)
      .forRoutes('*');

    consumer
      .apply(LoggingMiddleware)
      .forRoutes('*');

    consumer
      .apply(MetricsMiddleware)
      .forRoutes('*');
      
    consumer
      .apply(SecurityMiddleware)
      .forRoutes('*');
    
    consumer
      .apply(CsrfMiddleware)
      .forRoutes('*');
  }
}
