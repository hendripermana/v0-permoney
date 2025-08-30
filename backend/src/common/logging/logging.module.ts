import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StructuredLoggerService } from './logger.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [StructuredLoggerService],
  exports: [StructuredLoggerService],
})
export class LoggingModule {}
