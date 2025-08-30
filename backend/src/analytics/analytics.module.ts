import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CacheModule } from '../cache/cache.module';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { SpendingAnalyticsService } from './services/spending-analytics.service';
import { CashflowAnalyticsService } from './services/cashflow-analytics.service';
import { NetWorthAnalyticsService } from './services/net-worth-analytics.service';
import { CategoryAnalyticsService } from './services/category-analytics.service';
import { TrendAnalyticsService } from './services/trend-analytics.service';
import { ReportExportService } from './services/report-export.service';
import { MaterializedViewService } from './services/materialized-view.service';

@Module({
  imports: [PrismaModule, CacheModule],
  controllers: [AnalyticsController],
  providers: [
    AnalyticsService,
    SpendingAnalyticsService,
    CashflowAnalyticsService,
    NetWorthAnalyticsService,
    CategoryAnalyticsService,
    TrendAnalyticsService,
    ReportExportService,
    MaterializedViewService,
  ],
  exports: [
    AnalyticsService,
    SpendingAnalyticsService,
    CashflowAnalyticsService,
    NetWorthAnalyticsService,
    CategoryAnalyticsService,
    TrendAnalyticsService,
    ReportExportService,
  ],
})
export class AnalyticsModule {}
