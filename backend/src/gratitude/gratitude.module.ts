import { Module } from '@nestjs/common';
import { GratitudeService } from './gratitude.service';
import { GratitudeController } from './gratitude.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GratitudeController],
  providers: [GratitudeService],
  exports: [GratitudeService],
})
export class GratitudeModule {}
