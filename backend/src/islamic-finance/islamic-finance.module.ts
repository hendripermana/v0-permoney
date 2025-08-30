import { Module } from '@nestjs/common';
import { IslamicFinanceController } from './islamic-finance.controller';
import { IslamicFinanceService } from './islamic-finance.service';
import { ZakatCalculationService } from './services/zakat-calculation.service';
import { ZakatReminderService } from './services/zakat-reminder.service';
import { ShariaComplianceService } from './services/sharia-compliance.service';
import { IslamicReportingService } from './services/islamic-reporting.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [IslamicFinanceController],
  providers: [
    IslamicFinanceService,
    ZakatCalculationService,
    ZakatReminderService,
    ShariaComplianceService,
    IslamicReportingService,
  ],
  exports: [
    IslamicFinanceService,
    ZakatCalculationService,
    ZakatReminderService,
    ShariaComplianceService,
    IslamicReportingService,
  ],
})
export class IslamicFinanceModule {}
