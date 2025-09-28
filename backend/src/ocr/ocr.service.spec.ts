import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { OcrService } from './ocr.service';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentStorageService } from './services/document-storage.service';
import { ReceiptProcessingService } from './services/receipt-processing.service';
import { BankStatementProcessingService } from './services/bank-statement-processing.service';
import { TransactionSuggestionService } from './services/transaction-suggestion.service';
import { DocumentType, ProcessingStatus } from './types/ocr.types';
import type { Express } from 'express';

describe('OcrService', () => {
  let service: OcrService;
  let documentStorageService: DocumentStorageService;
  let receiptProcessingService: ReceiptProcessingService;
  let bankStatementProcessingService: BankStatementProcessingService;
  let transactionSuggestionService: TransactionSuggestionService;

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-value'),
  };

  const mockPrismaService = {
    documentUpload: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    ocrResult: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    transactionSuggestion: {
      createMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    transaction: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    category: {
      findFirst: jest.fn(),
    },
    account: {
      findUnique: jest.fn(),
    },
    ledgerEntry: {
      createMany: jest.fn(),
    },
  };

  const mockDocumentStorageService = {
    storeDocument: jest.fn(),
    getDocument: jest.fn(),
    getDocumentMetadata: jest.fn(),
  };

  const mockReceiptProcessingService = {
    processReceipt: jest.fn(),
  };

  const mockBankStatementProcessingService = {
    processBankStatement: jest.fn(),
  };

  const mockTransactionSuggestionService = {
    generateSuggestions: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OcrService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: DocumentStorageService, useValue: mockDocumentStorageService },
        { provide: ReceiptProcessingService, useValue: mockReceiptProcessingService },
        { provide: BankStatementProcessingService, useValue: mockBankStatementProcessingService },
        { provide: TransactionSuggestionService, useValue: mockTransactionSuggestionService },
      ],
    }).compile();

    service = module.get<OcrService>(OcrService);
    documentStorageService = module.get<DocumentStorageService>(DocumentStorageService);
    receiptProcessingService = module.get<ReceiptProcessingService>(ReceiptProcessingService);
    bankStatementProcessingService = module.get<BankStatementProcessingService>(BankStatementProcessingService);
    transactionSuggestionService = module.get<TransactionSuggestionService>(TransactionSuggestionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadDocument', () => {
    it('should upload a receipt document successfully', async () => {
      const mockFile = {
        originalname: 'receipt.jpg',
        size: 1024,
        mimetype: 'image/jpeg',
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      const uploadDto = {
        documentType: DocumentType.RECEIPT,
        householdId: 'household-123',
      };

      const userId = 'user-123';
      const storageUrl = 'documents/household-123/receipt.jpg';

      const mockDocumentRecord = {
        id: 'doc-123',
        householdId: 'household-123',
        fileName: 'receipt.jpg',
        fileSize: 1024,
        mimeType: 'image/jpeg',
        documentType: DocumentType.RECEIPT,
        status: ProcessingStatus.PENDING,
        uploadedBy: userId,
        uploadedAt: new Date(),
        storageUrl,
        description: undefined,
      };

      mockDocumentStorageService.storeDocument.mockResolvedValue(storageUrl);
      mockPrismaService.documentUpload.create.mockResolvedValue(mockDocumentRecord);

      const result = await service.uploadDocument(mockFile, uploadDto, userId);

      expect(result).toBeDefined();
      expect(result.fileName).toBe('receipt.jpg');
      expect(result.documentType).toBe(DocumentType.RECEIPT);
      expect(result.status).toBe(ProcessingStatus.PENDING);
      expect(result.householdId).toBe('household-123');
      expect(result.uploadedBy).toBe(userId);
      expect(result.storageUrl).toBe(storageUrl);
      expect(documentStorageService.storeDocument).toHaveBeenCalledWith(mockFile, 'household-123');
      expect(mockPrismaService.documentUpload.create).toHaveBeenCalledWith({
        data: {
          householdId: 'household-123',
          fileName: 'receipt.jpg',
          fileSize: 1024,
          mimeType: 'image/jpeg',
          documentType: DocumentType.RECEIPT,
          status: ProcessingStatus.PENDING,
          uploadedBy: userId,
          storageUrl,
          description: undefined,
        },
      });
    });

    it('should reject files that are too large', async () => {
      const mockFile = {
        originalname: 'large-file.jpg',
        size: 15 * 1024 * 1024, // 15MB
        mimetype: 'image/jpeg',
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      const uploadDto = {
        documentType: DocumentType.RECEIPT,
        householdId: 'household-123',
      };

      await expect(service.uploadDocument(mockFile, uploadDto, 'user-123')).rejects.toThrow(
        'File size exceeds 10MB limit',
      );
    });

    it('should reject invalid file types for receipts', async () => {
      const mockFile = {
        originalname: 'document.txt',
        size: 1024,
        mimetype: 'text/plain',
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      const uploadDto = {
        documentType: DocumentType.RECEIPT,
        householdId: 'household-123',
      };

      await expect(service.uploadDocument(mockFile, uploadDto, 'user-123')).rejects.toThrow(
        'Invalid file type for RECEIPT',
      );
    });
  });

  describe('processDocument', () => {
    it('should process a receipt document successfully', async () => {
      const processDto = {
        documentId: 'doc-123',
        forceReprocess: false,
      };

      const mockDocument = {
        id: 'doc-123',
        documentType: DocumentType.RECEIPT,
        status: ProcessingStatus.PENDING,
        storageUrl: 'documents/household-123/receipt.jpg',
        householdId: 'household-123',
      };

      const mockOcrResult = {
        id: 'ocr-123',
        documentType: DocumentType.RECEIPT,
        confidence: 0.85,
        extractedData: {
          merchant: { name: 'Starbucks', confidence: 0.9 },
          amount: { total: 45000, currency: 'IDR', confidence: 0.95 },
          date: { date: new Date(), confidence: 0.8 },
        },
        rawText: 'STARBUCKS COFFEE...',
        processedAt: new Date(),
        metadata: { processingTime: 1500, ocrEngine: 'tesseract' },
      };

      const mockSuggestions = [
        {
          id: 'suggestion-123',
          description: 'Purchase at Starbucks',
          amount: -45000,
          currency: 'IDR',
          date: new Date(),
          merchant: 'Starbucks',
          confidence: 0.85,
          source: 'RECEIPT',
          metadata: { ocrResultId: 'ocr-123' },
        },
      ];

      // Mock the private methods by spying on the service
      jest.spyOn(service as any, 'getDocumentById').mockResolvedValue(mockDocument);
      jest.spyOn(service as any, 'updateDocumentStatus').mockResolvedValue(undefined);
      jest.spyOn(service as any, 'updateDocumentWithResults').mockResolvedValue(undefined);

      mockReceiptProcessingService.processReceipt.mockResolvedValue(mockOcrResult);
      mockTransactionSuggestionService.generateSuggestions.mockResolvedValue(mockSuggestions);

      const result = await service.processDocument(processDto);

      expect(result).toEqual(mockOcrResult);
      expect(receiptProcessingService.processReceipt).toHaveBeenCalledWith(mockDocument.storageUrl);
      expect(transactionSuggestionService.generateSuggestions).toHaveBeenCalledWith(
        mockOcrResult,
        mockDocument.householdId,
      );
    });

    it('should process a bank statement document successfully', async () => {
      const processDto = {
        documentId: 'doc-123',
        forceReprocess: false,
      };

      const mockDocument = {
        id: 'doc-123',
        documentType: DocumentType.BANK_STATEMENT,
        status: ProcessingStatus.PENDING,
        storageUrl: 'documents/household-123/statement.pdf',
        householdId: 'household-123',
      };

      const mockOcrResult = {
        id: 'ocr-123',
        documentType: DocumentType.BANK_STATEMENT,
        confidence: 0.9,
        extractedData: {
          bankStatementInfo: {
            accountNumber: '1234567890',
            bankName: 'BCA',
            statementPeriod: {
              startDate: new Date('2024-01-01'),
              endDate: new Date('2024-01-31'),
            },
            transactions: [
              {
                date: new Date('2024-01-02'),
                description: 'BELANJA INDOMARET',
                amount: -125000,
                type: 'DEBIT',
              },
            ],
          },
        },
        rawText: 'BANK CENTRAL ASIA...',
        processedAt: new Date(),
        metadata: { processingTime: 2500, ocrEngine: 'pdf-parse' },
      };

      jest.spyOn(service as any, 'getDocumentById').mockResolvedValue(mockDocument);
      jest.spyOn(service as any, 'updateDocumentStatus').mockResolvedValue(undefined);
      jest.spyOn(service as any, 'updateDocumentWithResults').mockResolvedValue(undefined);

      mockBankStatementProcessingService.processBankStatement.mockResolvedValue(mockOcrResult);
      mockTransactionSuggestionService.generateSuggestions.mockResolvedValue([]);

      const result = await service.processDocument(processDto);

      expect(result).toEqual(mockOcrResult);
      expect(bankStatementProcessingService.processBankStatement).toHaveBeenCalledWith(
        mockDocument.storageUrl,
      );
    });

    it('should throw error for unsupported document type', async () => {
      const processDto = {
        documentId: 'doc-123',
        forceReprocess: false,
      };

      const mockDocument = {
        id: 'doc-123',
        documentType: 'UNSUPPORTED' as DocumentType,
        status: ProcessingStatus.PENDING,
        storageUrl: 'documents/household-123/unknown.pdf',
        householdId: 'household-123',
      };

      jest.spyOn(service as any, 'getDocumentById').mockResolvedValue(mockDocument);
      jest.spyOn(service as any, 'updateDocumentStatus').mockResolvedValue(undefined);

      await expect(service.processDocument(processDto)).rejects.toThrow(
        'Unsupported document type: UNSUPPORTED',
      );
    });
  });

  describe('validateOcrResult', () => {
    it('should validate OCR result successfully', async () => {
      const validateDto = {
        ocrResultId: 'ocr-123',
        corrections: {
          amount: 50000,
          merchant: 'Corrected Merchant',
        },
      };

      const mockOcrResult = {
        id: 'ocr-123',
        extractedData: {
          merchant: { name: 'Original Merchant', confidence: 0.7 },
          amount: { total: 45000, currency: 'IDR', confidence: 0.8 },
        },
      };

      const mockValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        suggestions: [],
      };

      jest.spyOn(service as any, 'getOcrResultById').mockResolvedValue(mockOcrResult);
      jest.spyOn(service as any, 'performValidation').mockResolvedValue(mockValidationResult);

      const result = await service.validateOcrResult(validateDto);

      expect(result).toEqual(mockValidationResult);
    });
  });
});
