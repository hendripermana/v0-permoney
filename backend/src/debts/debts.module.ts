import { Module } from '@nestjs/common';
import { DebtsController } from './debts.controller';
import { DebtsService } from './debts.service';
import { DebtsRepository } from './debts.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { HouseholdModule } from '../household/household.module';

@Module({
  imports: [PrismaModule, AuthModule, HouseholdModule],
  controllers: [DebtsController],
  providers: [DebtsService, DebtsRepository],
  exports: [DebtsService, DebtsRepository],
})
export class DebtsModule {}
