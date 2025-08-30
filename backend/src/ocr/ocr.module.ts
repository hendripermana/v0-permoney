import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OcrController } from './ocr.controller';
import { OcrService } from './ocr.service';
import { DocumentStorageService } from './services/document-storage.service';
import { ReceiptProcessingService } from './services/receipt-processing.service';
import { BankStatementProcessingService } from './services/bank-statement-processing.service';
import { TransactionSuggestionService } from './services/transaction-suggestion.service';
import { OCRMetricsService } from './ocr.metrics';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [OcrController],
  providers: [
    OcrService,
    DocumentStorageService,
    ReceiptProcessingService,
    BankStatementProcessingService,
    TransactionSuggestionService,
    OCRMetricsService,
  ],
  exports: [OcrService, OCRMetricsService],
})
export class OcrModule {}
