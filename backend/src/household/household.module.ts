import { Module } from '@nestjs/common';
import { HouseholdController } from './household.controller';
import { HouseholdService } from './household.service';
import { HouseholdRepository } from './household.repository';
import { PermissionsService } from './services/permissions.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [HouseholdController],
  providers: [HouseholdService, HouseholdRepository, PermissionsService],
  exports: [HouseholdService, HouseholdRepository, PermissionsService],
})
export class HouseholdModule {}
