import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentStorageService } from './services/document-storage.service';
import { ReceiptProcessingService } from './services/receipt-processing.service';
import { BankStatementProcessingService } from './services/bank-statement-processing.service';
import { TransactionSuggestionService } from './services/transaction-suggestion.service';
import { OCRMetricsService } from './ocr.metrics';
import {
  DocumentUpload,
  DocumentType,
  ProcessingStatus,
  OCRResult,
  TransactionSuggestion,
  ValidationResult,
} from './types/ocr.types';
import { UploadDocumentDto, ProcessDocumentDto, ValidateOcrResultDto } from './dto/upload-document.dto';
import { ApproveTransactionSuggestionDto } from './dto/create-transaction-suggestion.dto';

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
    private readonly documentStorageService: DocumentStorageService,
    private readonly receiptProcessingService: ReceiptProcessingService,
    private readonly bankStatementProcessingService: BankStatementProcessingService,
    private readonly transactionSuggestionService: TransactionSuggestionService,
    private readonly metricsService: OCRMetricsService,
  ) {}

  async uploadDocument(
    file: Express.Multer.File,
    uploadDto: UploadDocumentDto,
    userId: string,
  ): Promise<DocumentUpload> {
    this.logger.log(`Uploading document: ${file.originalname} for household: ${uploadDto.householdId}`);

    try {
      // Verify user has access to this household
      await this.verifyHouseholdAccess(uploadDto.householdId, userId);

      // Validate file type and size
      this.validateFile(file, uploadDto.documentType);

      // Store the file
      const storageUrl = await this.documentStorageService.storeDocument(file, uploadDto.householdId);

      // Create document record in database
      const documentRecord = await this.prismaService.documentUpload.create({
        data: {
          householdId: uploadDto.householdId,
          fileName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype,
          documentType: uploadDto.documentType,
          status: ProcessingStatus.PENDING,
          uploadedBy: userId,
          storageUrl,
          description: uploadDto.description,
        },
      });

      const documentUpload: DocumentUpload = {
        id: documentRecord.id,
        householdId: documentRecord.householdId,
        fileName: documentRecord.fileName,
        fileSize: documentRecord.fileSize,
        mimeType: documentRecord.mimeType,
        documentType: documentRecord.documentType as DocumentType,
        status: documentRecord.status as ProcessingStatus,
        uploadedBy: documentRecord.uploadedBy,
        uploadedAt: documentRecord.uploadedAt,
        storageUrl: documentRecord.storageUrl,
      };

      this.logger.log(`Document uploaded successfully: ${documentUpload.id}`);

      // Record metrics
      this.metricsService.recordDocumentUpload(uploadDto.documentType, file.size);

      // Start processing asynchronously
      this.processDocumentAsync(documentUpload.id);

      return documentUpload;
    } catch (error) {
      this.logger.error(`Failed to upload document: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to upload document: ${error.message}`);
    }
  }

  async processDocument(processDto: ProcessDocumentDto): Promise<OCRResult> {
    this.logger.log(`Processing document: ${processDto.documentId}`);

    const processingTimeout = 30000; // 30 seconds timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Processing timeout')), processingTimeout);
    });

    try {
      const result = await Promise.race([
        this.performDocumentProcessing(processDto),
        timeoutPromise,
      ]);

      return result;
    } catch (error) {
      this.logger.error(`Failed to process document: ${error.message}`, error.stack);
      await this.updateDocumentStatus(processDto.documentId, ProcessingStatus.FAILED);
      throw error;
    }
  }

  private async performDocumentProcessing(processDto: ProcessDocumentDto): Promise<OCRResult> {
    // Get document from storage
    const document = await this.getDocumentById(processDto.documentId);
    
    if (!document) {
      throw new NotFoundException(`Document not found: ${processDto.documentId}`);
    }

    if (document.status === ProcessingStatus.PROCESSING) {
      throw new BadRequestException('Document is already being processed');
    }

    if (document.ocrResult && !processDto.forceReprocess) {
      return document.ocrResult;
    }

    // Record processing start
    this.metricsService.recordProcessingStart(processDto.documentId, document.documentType);

    try {
      // Update status to processing
      await this.updateDocumentStatus(processDto.documentId, ProcessingStatus.PROCESSING);

      let ocrResult: OCRResult;

      // Process based on document type
      switch (document.documentType) {
        case DocumentType.RECEIPT:
          ocrResult = await this.receiptProcessingService.processReceipt(document.storageUrl);
          break;
        case DocumentType.BANK_STATEMENT:
          ocrResult = await this.bankStatementProcessingService.processBankStatement(document.storageUrl);
          break;
        default:
          throw new BadRequestException(`Unsupported document type: ${document.documentType}`);
      }

      // Generate transaction suggestions
      const suggestions = await this.transactionSuggestionService.generateSuggestions(
        ocrResult,
        document.householdId,
      );

      // Update document with results
      await this.updateDocumentWithResults(processDto.documentId, ocrResult, suggestions);

      // Record successful processing
      this.metricsService.recordProcessingEnd(
        processDto.documentId,
        ProcessingStatus.COMPLETED,
        ocrResult.confidence,
      );

      // Record suggestion metrics
      if (suggestions.length > 0) {
        const avgConfidence = suggestions.reduce((sum, s) => sum + s.confidence, 0) / suggestions.length;
        this.metricsService.recordTransactionSuggestion(
          processDto.documentId,
          suggestions.length,
          avgConfidence,
        );
      }

      this.logger.log(`Document processed successfully: ${processDto.documentId}`);
      return ocrResult;
    } catch (error) {
      // Record failed processing
      this.metricsService.recordProcessingEnd(
        processDto.documentId,
        ProcessingStatus.FAILED,
        undefined,
        error.message,
      );
      throw error;
    }
  }

  async validateOcrResult(validateDto: ValidateOcrResultDto): Promise<ValidationResult> {
    this.logger.log(`Validating OCR result: ${validateDto.ocrResultId}`);

    try {
      // Get OCR result
      const ocrResult = await this.getOcrResultById(validateDto.ocrResultId);
      
      if (!ocrResult) {
        throw new NotFoundException(`OCR result not found: ${validateDto.ocrResultId}`);
      }

      // Perform validation
      const validationResult = await this.performValidation(ocrResult, validateDto.corrections);

      this.logger.log(`OCR result validated: ${validateDto.ocrResultId}`);
      return validationResult;
    } catch (error) {
      this.logger.error(`Failed to validate OCR result: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getTransactionSuggestions(documentId: string): Promise<TransactionSuggestion[]> {
    this.logger.log(`Getting transaction suggestions for document: ${documentId}`);

    try {
      const document = await this.getDocumentById(documentId);
      
      if (!document) {
        throw new NotFoundException(`Document not found: ${documentId}`);
      }

      return document.transactionSuggestions || [];
    } catch (error) {
      this.logger.error(`Failed to get transaction suggestions: ${error.message}`, error.stack);
      throw error;
    }
  }

  async approveTransactionSuggestion(approveDto: ApproveTransactionSuggestionDto, userId: string): Promise<any> {
    this.logger.log(`Approving transaction suggestion: ${approveDto.suggestionId}`);

    try {
      // Get suggestion
      const suggestion = await this.getTransactionSuggestionById(approveDto.suggestionId);
      
      if (!suggestion) {
        throw new NotFoundException(`Transaction suggestion not found: ${approveDto.suggestionId}`);
      }

      // Apply corrections if provided
      const finalSuggestion = this.applyCorrections(suggestion, approveDto.corrections);

      // Create transaction using the transactions service
      const transaction = await this.createTransactionFromSuggestion(
        finalSuggestion,
        approveDto.accountId,
        userId,
      );

      this.logger.log(`Transaction created from suggestion: ${transaction.id}`);
      return transaction;
    } catch (error) {
      this.logger.error(`Failed to approve transaction suggestion: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getDocumentsByHousehold(householdId: string, userId: string): Promise<DocumentUpload[]> {
    this.logger.log(`Getting documents for household: ${householdId}`);

    try {
      // Verify user has access to this household
      await this.verifyHouseholdAccess(householdId, userId);

      const documents = await this.prismaService.documentUpload.findMany({
        where: { householdId },
        include: {
          ocrResults: true,
          transactionSuggestions: {
            include: {
              suggestedCategory: true,
            },
          },
        },
        orderBy: { uploadedAt: 'desc' },
      });

      return documents.map(doc => this.mapDocumentToInterface(doc));
    } catch (error) {
      this.logger.error(`Failed to get documents for household: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getDocument(documentId: string, userId: string): Promise<DocumentUpload> {
    this.logger.log(`Getting document: ${documentId}`);

    const document = await this.getDocumentById(documentId);
    if (!document) {
      throw new NotFoundException(`Document not found: ${documentId}`);
    }

    // Verify user has access to this document's household
    await this.verifyHouseholdAccess(document.householdId, userId);

    return document;
  }

  private async processDocumentAsync(documentId: string): Promise<void> {
    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        await this.processDocument({ documentId, forceReprocess: false });
        return; // Success, exit retry loop
      } catch (error) {
        retryCount++;
        this.logger.error(
          `Async processing failed for document: ${documentId} (attempt ${retryCount}/${maxRetries})`,
          error.stack,
        );

        if (retryCount >= maxRetries) {
          // Final failure - mark document as failed
          await this.updateDocumentStatus(documentId, ProcessingStatus.FAILED);
          return;
        }

        // Exponential backoff: wait 2^retryCount seconds
        const delayMs = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  private validateFile(file: Express.Multer.File, documentType: DocumentType): void {
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (!file || !file.buffer) {
      throw new BadRequestException('Invalid file: No file data received');
    }

    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 10MB limit');
    }

    if (file.size === 0) {
      throw new BadRequestException('File is empty');
    }

    // Validate filename for path traversal attacks
    if (file.originalname.includes('..') || file.originalname.includes('/') || file.originalname.includes('\\')) {
      throw new BadRequestException('Invalid filename: Path traversal detected');
    }

    // Validate filename length
    if (file.originalname.length > 255) {
      throw new BadRequestException('Filename too long');
    }

    const allowedMimeTypes = {
      [DocumentType.RECEIPT]: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
      [DocumentType.BANK_STATEMENT]: ['application/pdf'],
      [DocumentType.INVOICE]: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
      [DocumentType.OTHER]: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    };

    if (!allowedMimeTypes[documentType].includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type for ${documentType}. Allowed types: ${allowedMimeTypes[documentType].join(', ')}`,
      );
    }

    // Additional file signature validation for security
    this.validateFileSignature(file.buffer, file.mimetype);
  }

  private validateFileSignature(buffer: Buffer, mimeType: string): void {
    const signatures = {
      'image/jpeg': [0xFF, 0xD8, 0xFF],
      'image/png': [0x89, 0x50, 0x4E, 0x47],
      'image/webp': [0x52, 0x49, 0x46, 0x46], // RIFF header
      'application/pdf': [0x25, 0x50, 0x44, 0x46], // %PDF
    };

    const signature = signatures[mimeType];
    if (!signature) return; // Skip validation for unknown types

    const fileHeader = Array.from(buffer.slice(0, signature.length));
    const isValid = signature.every((byte, index) => fileHeader[index] === byte);

    if (!isValid) {
      throw new BadRequestException('File signature does not match declared MIME type');
    }
  }

  private generateId(): string {
    return `ocr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Database interaction methods
  private async getDocumentById(documentId: string): Promise<DocumentUpload | null> {
    try {
      const document = await this.prismaService.documentUpload.findUnique({
        where: { id: documentId },
        include: {
          ocrResults: true,
          transactionSuggestions: {
            include: {
              suggestedCategory: true,
            },
          },
        },
      });

      if (!document) return null;

      // Convert to our interface format
      const documentUpload: DocumentUpload = {
        id: document.id,
        householdId: document.householdId,
        fileName: document.fileName,
        fileSize: document.fileSize,
        mimeType: document.mimeType,
        documentType: document.documentType as DocumentType,
        status: document.status as ProcessingStatus,
        uploadedBy: document.uploadedBy,
        uploadedAt: document.uploadedAt,
        processedAt: document.processedAt || undefined,
        storageUrl: document.storageUrl,
      };

      // Add OCR result if available
      if (document.ocrResults.length > 0) {
        const ocrResult = document.ocrResults[0]; // Get the latest OCR result
        documentUpload.ocrResult = {
          id: ocrResult.id,
          documentType: ocrResult.documentType as DocumentType,
          confidence: parseFloat(ocrResult.confidence.toString()),
          extractedData: ocrResult.extractedData as ExtractedData,
          rawText: ocrResult.rawText,
          processedAt: ocrResult.processedAt,
          metadata: ocrResult.metadata as any,
        };
      }

      // Add transaction suggestions if available
      if (document.transactionSuggestions.length > 0) {
        documentUpload.transactionSuggestions = document.transactionSuggestions.map(suggestion => ({
          id: suggestion.id,
          description: suggestion.description,
          amount: Number(suggestion.amountCents) / 100,
          currency: suggestion.currency,
          date: suggestion.date,
          merchant: suggestion.merchant || undefined,
          suggestedCategoryId: suggestion.suggestedCategoryId || undefined,
          suggestedCategoryName: suggestion.suggestedCategory?.name || undefined,
          confidence: parseFloat(suggestion.confidence.toString()),
          source: suggestion.source as 'RECEIPT' | 'BANK_STATEMENT',
          metadata: {
            ocrResultId: suggestion.ocrResultId || '',
            originalText: suggestion.metadata ? (suggestion.metadata as any).originalText : undefined,
            lineItemIndex: suggestion.metadata ? (suggestion.metadata as any).lineItemIndex : undefined,
          },
        }));
      }

      return documentUpload;
    } catch (error) {
      this.logger.error(`Failed to get document by ID: ${error.message}`, error.stack);
      return null;
    }
  }

  private async updateDocumentStatus(documentId: string, status: ProcessingStatus): Promise<void> {
    try {
      await this.prismaService.documentUpload.update({
        where: { id: documentId },
        data: { 
          status,
          processedAt: status === ProcessingStatus.COMPLETED ? new Date() : undefined,
        },
      });
      this.logger.log(`Updated document ${documentId} status to ${status}`);
    } catch (error) {
      this.logger.error(`Failed to update document status: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async updateDocumentWithResults(
    documentId: string,
    ocrResult: OCRResult,
    suggestions: TransactionSuggestion[],
  ): Promise<void> {
    try {
      // Create OCR result record
      const ocrResultRecord = await this.prismaService.ocrResult.create({
        data: {
          documentId,
          documentType: ocrResult.documentType,
          confidence: ocrResult.confidence,
          extractedData: ocrResult.extractedData,
          rawText: ocrResult.rawText,
          metadata: ocrResult.metadata,
          processedAt: ocrResult.processedAt,
        },
      });

      // Create transaction suggestions
      if (suggestions.length > 0) {
        await this.prismaService.transactionSuggestion.createMany({
          data: suggestions.map(suggestion => ({
            documentId,
            ocrResultId: ocrResultRecord.id,
            description: suggestion.description,
            amountCents: BigInt(Math.round(suggestion.amount * 100)),
            currency: suggestion.currency,
            date: suggestion.date,
            merchant: suggestion.merchant,
            suggestedCategoryId: suggestion.suggestedCategoryId,
            confidence: suggestion.confidence,
            source: suggestion.source,
            metadata: suggestion.metadata,
          })),
        });
      }

      // Update document status to completed
      await this.updateDocumentStatus(documentId, ProcessingStatus.COMPLETED);

      this.logger.log(`Updated document ${documentId} with OCR results and ${suggestions.length} suggestions`);
    } catch (error) {
      this.logger.error(`Failed to update document with results: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async getOcrResultById(ocrResultId: string): Promise<OCRResult | null> {
    try {
      const ocrResult = await this.prismaService.ocrResult.findUnique({
        where: { id: ocrResultId },
      });

      if (!ocrResult) return null;

      return {
        id: ocrResult.id,
        documentType: ocrResult.documentType as DocumentType,
        confidence: parseFloat(ocrResult.confidence.toString()),
        extractedData: ocrResult.extractedData as ExtractedData,
        rawText: ocrResult.rawText,
        processedAt: ocrResult.processedAt,
        metadata: ocrResult.metadata as any,
      };
    } catch (error) {
      this.logger.error(`Failed to get OCR result by ID: ${error.message}`, error.stack);
      return null;
    }
  }

  private async performValidation(
    ocrResult: OCRResult,
    corrections?: Record<string, any>,
  ): Promise<ValidationResult> {
    const errors: any[] = [];
    const warnings: any[] = [];
    const suggestions: any[] = [];

    // Validate extracted data quality
    if (ocrResult.confidence < 0.7) {
      warnings.push({
        field: 'confidence',
        message: 'Low confidence score detected',
        suggestion: 'Please review and correct the extracted data',
      });
    }

    // Validate amount if present
    if (ocrResult.extractedData.amount) {
      const amount = ocrResult.extractedData.amount;
      if (amount.total <= 0) {
        errors.push({
          field: 'amount.total',
          message: 'Amount must be greater than zero',
          severity: 'ERROR',
        });
      }
      if (amount.confidence < 0.8) {
        warnings.push({
          field: 'amount',
          message: 'Low confidence in amount extraction',
          suggestion: 'Please verify the amount is correct',
        });
      }
    }

    // Validate date if present
    if (ocrResult.extractedData.date) {
      const date = ocrResult.extractedData.date;
      const now = new Date();
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      const oneMonthFromNow = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

      if (date.date < oneYearAgo || date.date > oneMonthFromNow) {
        warnings.push({
          field: 'date',
          message: 'Date seems unusual (too old or in the future)',
          suggestion: 'Please verify the transaction date',
        });
      }
    }

    // Validate merchant if present
    if (ocrResult.extractedData.merchant) {
      const merchant = ocrResult.extractedData.merchant;
      if (merchant.confidence < 0.7) {
        warnings.push({
          field: 'merchant',
          message: 'Low confidence in merchant name extraction',
          suggestion: 'Please verify the merchant name is correct',
        });
      }
    }

    // Apply corrections if provided
    if (corrections) {
      for (const [field, value] of Object.entries(corrections)) {
        suggestions.push({
          field,
          originalValue: this.getFieldValue(ocrResult.extractedData, field),
          suggestedValue: value,
          reason: 'User correction',
          confidence: 1.0,
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }

  private async getTransactionSuggestionById(suggestionId: string): Promise<TransactionSuggestion | null> {
    try {
      const suggestion = await this.prismaService.transactionSuggestion.findUnique({
        where: { id: suggestionId },
        include: {
          suggestedCategory: true,
        },
      });

      if (!suggestion) return null;

      return {
        id: suggestion.id,
        description: suggestion.description,
        amount: Number(suggestion.amountCents) / 100,
        currency: suggestion.currency,
        date: suggestion.date,
        merchant: suggestion.merchant || undefined,
        suggestedCategoryId: suggestion.suggestedCategoryId || undefined,
        suggestedCategoryName: suggestion.suggestedCategory?.name || undefined,
        confidence: parseFloat(suggestion.confidence.toString()),
        source: suggestion.source as 'RECEIPT' | 'BANK_STATEMENT',
        metadata: {
          ocrResultId: suggestion.ocrResultId || '',
          originalText: suggestion.metadata ? (suggestion.metadata as any).originalText : undefined,
          lineItemIndex: suggestion.metadata ? (suggestion.metadata as any).lineItemIndex : undefined,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get transaction suggestion by ID: ${error.message}`, error.stack);
      return null;
    }
  }

  private applyCorrections(
    suggestion: TransactionSuggestion,
    corrections?: any,
  ): TransactionSuggestion {
    if (!corrections) return suggestion;

    return {
      ...suggestion,
      ...corrections,
      date: corrections.date ? new Date(corrections.date) : suggestion.date,
    };
  }

  private async createTransactionFromSuggestion(
    suggestion: TransactionSuggestion,
    accountId: string,
    userId: string,
  ): Promise<any> {
    // Use database transaction for atomicity
    return await this.prismaService.$transaction(async (prisma) => {
      try {
        // Validate account exists and get household
        const account = await prisma.account.findUnique({
          where: { id: accountId },
          select: { householdId: true, isActive: true },
        });

        if (!account) {
          throw new NotFoundException(`Account not found: ${accountId}`);
        }

        if (!account.isActive) {
          throw new BadRequestException('Cannot create transaction for inactive account');
        }

        // Verify user has access to this account's household
        await this.verifyHouseholdAccess(account.householdId, userId);

        // Validate suggestion hasn't been used already
        const existingSuggestion = await prisma.transactionSuggestion.findUnique({
          where: { id: suggestion.id },
          select: { isApproved: true, createdTransactionId: true },
        });

        if (existingSuggestion?.isApproved) {
          throw new BadRequestException('Transaction suggestion has already been approved');
        }

        // Validate amount
        if (!suggestion.amount || suggestion.amount === 0) {
          throw new BadRequestException('Invalid transaction amount');
        }

        // Create transaction
        const transaction = await prisma.transaction.create({
          data: {
            householdId: account.householdId,
            amountCents: BigInt(Math.round(Math.abs(suggestion.amount) * 100)),
            currency: suggestion.currency,
            description: suggestion.description,
            date: suggestion.date,
            accountId,
            merchant: suggestion.merchant,
            categoryId: suggestion.suggestedCategoryId,
            createdBy: userId,
            metadata: {
              source: 'OCR_SUGGESTION',
              suggestionId: suggestion.id,
              ocrResultId: suggestion.metadata.ocrResultId,
            },
          },
        });

        // Create ledger entries for double-entry accounting
        const isExpense = suggestion.amount < 0;
        await prisma.ledgerEntry.createMany({
          data: [
            {
              transactionId: transaction.id,
              accountId,
              type: isExpense ? 'CREDIT' : 'DEBIT',
              amountCents: BigInt(Math.round(Math.abs(suggestion.amount) * 100)),
              currency: suggestion.currency,
            },
          ],
        });

        // Update the suggestion to mark it as used
        await prisma.transactionSuggestion.update({
          where: { id: suggestion.id },
          data: {
            createdTransactionId: transaction.id,
            isApproved: true,
            approvedAt: new Date(),
            status: 'APPROVED',
          },
        });

        this.logger.log(`Transaction created from suggestion: ${transaction.id}`);
        return transaction;
      } catch (error) {
        this.logger.error(`Failed to create transaction from suggestion: ${error.message}`, error.stack);
        throw error;
      }
    });
  }

  private getFieldValue(extractedData: ExtractedData, field: string): any {
    const fieldParts = field.split('.');
    let value: any = extractedData;
    
    for (const part of fieldParts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  private async verifyHouseholdAccess(householdId: string, userId: string): Promise<void> {
    const membership = await this.prismaService.householdMember.findUnique({
      where: {
        userId_householdId: {
          userId,
          householdId,
        },
      },
    });

    if (!membership) {
      throw new NotFoundException('Access denied: User is not a member of this household');
    }
  }

  private mapDocumentToInterface(document: any): DocumentUpload {
    const documentUpload: DocumentUpload = {
      id: document.id,
      householdId: document.householdId,
      fileName: document.fileName,
      fileSize: document.fileSize,
      mimeType: document.mimeType,
      documentType: document.documentType as DocumentType,
      status: document.status as ProcessingStatus,
      uploadedBy: document.uploadedBy,
      uploadedAt: document.uploadedAt,
      processedAt: document.processedAt || undefined,
      storageUrl: document.storageUrl,
    };

    // Add OCR result if available
    if (document.ocrResults && document.ocrResults.length > 0) {
      const ocrResult = document.ocrResults[0]; // Get the latest OCR result
      documentUpload.ocrResult = {
        id: ocrResult.id,
        documentType: ocrResult.documentType as DocumentType,
        confidence: parseFloat(ocrResult.confidence.toString()),
        extractedData: ocrResult.extractedData as ExtractedData,
        rawText: ocrResult.rawText,
        processedAt: ocrResult.processedAt,
        metadata: ocrResult.metadata as any,
      };
    }

    // Add transaction suggestions if available
    if (document.transactionSuggestions && document.transactionSuggestions.length > 0) {
      documentUpload.transactionSuggestions = document.transactionSuggestions.map((suggestion: any) => ({
        id: suggestion.id,
        description: suggestion.description,
        amount: Number(suggestion.amountCents) / 100,
        currency: suggestion.currency,
        date: suggestion.date,
        merchant: suggestion.merchant || undefined,
        suggestedCategoryId: suggestion.suggestedCategoryId || undefined,
        suggestedCategoryName: suggestion.suggestedCategory?.name || undefined,
        confidence: parseFloat(suggestion.confidence.toString()),
        source: suggestion.source as 'RECEIPT' | 'BANK_STATEMENT',
        metadata: {
          ocrResultId: suggestion.ocrResultId || '',
          originalText: suggestion.metadata ? (suggestion.metadata as unknown).originalText : undefined,
          lineItemIndex: suggestion.metadata ? (suggestion.metadata as unknown).lineItemIndex : undefined,
        },
      }));
    }

    return documentUpload;
  }
}
