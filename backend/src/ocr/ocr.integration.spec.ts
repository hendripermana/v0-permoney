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

describe('OCR Integration Tests', () => {
  let service: OcrService;
  let prismaService: PrismaService;

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-value'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OcrService,
        { provide: ConfigService, useValue: mockConfigService },
        {
          provide: PrismaService,
          useValue: {
            documentUpload: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
            },
            ocrResult: {
              create: jest.fn(),
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
          },
        },
        DocumentStorageService,
        ReceiptProcessingService,
        BankStatementProcessingService,
        TransactionSuggestionService,
      ],
    }).compile();

    service = module.get<OcrService>(OcrService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('End-to-End OCR Processing', () => {
    it('should process a receipt from upload to transaction suggestions', async () => {
      const mockFile = {
        originalname: 'receipt.jpg',
        size: 1024,
        mimetype: 'image/jpeg',
        buffer: Buffer.from('mock-image-data'),
      } as Express.Multer.File;

      const uploadDto = {
        documentType: DocumentType.RECEIPT,
        householdId: 'household-123',
        description: 'Starbucks receipt',
      };

      const userId = 'user-123';

      // Mock database responses
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
        storageUrl: 'documents/household-123/receipt.jpg',
        description: 'Starbucks receipt',
      };

      const mockOcrResultRecord = {
        id: 'ocr-123',
        documentId: 'doc-123',
        documentType: DocumentType.RECEIPT,
        confidence: 0.85,
        extractedData: {},
        rawText: 'STARBUCKS COFFEE...',
        processedAt: new Date(),
        metadata: {},
      };

      // Setup mocks
      (prismaService.documentUpload.create as jest.Mock).mockResolvedValue(mockDocumentRecord);
      (prismaService.documentUpload.findUnique as jest.Mock).mockResolvedValue({
        ...mockDocumentRecord,
        ocrResults: [],
        transactionSuggestions: [],
      });
      (prismaService.ocrResult.create as jest.Mock).mockResolvedValue(mockOcrResultRecord);
      (prismaService.transactionSuggestion.createMany as jest.Mock).mockResolvedValue({ count: 1 });
      (prismaService.documentUpload.update as jest.Mock).mockResolvedValue(mockDocumentRecord);

      // Test upload
      const uploadResult = await service.uploadDocument(mockFile, uploadDto, userId);

      expect(uploadResult).toBeDefined();
      expect(uploadResult.fileName).toBe('receipt.jpg');
      expect(uploadResult.documentType).toBe(DocumentType.RECEIPT);
      expect(uploadResult.status).toBe(ProcessingStatus.PENDING);
      expect(prismaService.documentUpload.create).toHaveBeenCalledWith({
        data: {
          householdId: 'household-123',
          fileName: 'receipt.jpg',
          fileSize: 1024,
          mimeType: 'image/jpeg',
          documentType: DocumentType.RECEIPT,
          status: ProcessingStatus.PENDING,
          uploadedBy: userId,
          storageUrl: expect.any(String),
          description: 'Starbucks receipt',
        },
      });

      // Test processing
      const processResult = await service.processDocument({
        documentId: 'doc-123',
        forceReprocess: false,
      });

      expect(processResult).toBeDefined();
      expect(processResult.documentType).toBe(DocumentType.RECEIPT);
      expect(processResult.confidence).toBeGreaterThan(0);
      expect(processResult.extractedData).toBeDefined();
      expect(processResult.rawText).toBeDefined();
    });

    it('should handle bank statement processing', async () => {
      const mockFile = {
        originalname: 'statement.pdf',
        size: 2048,
        mimetype: 'application/pdf',
        buffer: Buffer.from('mock-pdf-data'),
      } as Express.Multer.File;

      const uploadDto = {
        documentType: DocumentType.BANK_STATEMENT,
        householdId: 'household-123',
      };

      const userId = 'user-123';

      // Mock database responses
      const mockDocumentRecord = {
        id: 'doc-456',
        householdId: 'household-123',
        fileName: 'statement.pdf',
        fileSize: 2048,
        mimeType: 'application/pdf',
        documentType: DocumentType.BANK_STATEMENT,
        status: ProcessingStatus.PENDING,
        uploadedBy: userId,
        uploadedAt: new Date(),
        storageUrl: 'documents/household-123/statement.pdf',
      };

      // Setup mocks
      (prismaService.documentUpload.create as jest.Mock).mockResolvedValue(mockDocumentRecord);
      (prismaService.documentUpload.findUnique as jest.Mock).mockResolvedValue({
        ...mockDocumentRecord,
        ocrResults: [],
        transactionSuggestions: [],
      });
      (prismaService.ocrResult.create as jest.Mock).mockResolvedValue({
        id: 'ocr-456',
        documentId: 'doc-456',
        documentType: DocumentType.BANK_STATEMENT,
        confidence: 0.9,
        extractedData: {},
        rawText: 'BANK CENTRAL ASIA...',
        processedAt: new Date(),
        metadata: {},
      });
      (prismaService.transactionSuggestion.createMany as jest.Mock).mockResolvedValue({ count: 5 });
      (prismaService.documentUpload.update as jest.Mock).mockResolvedValue(mockDocumentRecord);

      // Test upload
      const uploadResult = await service.uploadDocument(mockFile, uploadDto, userId);

      expect(uploadResult).toBeDefined();
      expect(uploadResult.documentType).toBe(DocumentType.BANK_STATEMENT);

      // Test processing
      const processResult = await service.processDocument({
        documentId: 'doc-456',
        forceReprocess: false,
      });

      expect(processResult).toBeDefined();
      expect(processResult.documentType).toBe(DocumentType.BANK_STATEMENT);
      expect(processResult.extractedData.bankStatementInfo).toBeDefined();
    });

    it('should handle transaction suggestion approval', async () => {
      const mockSuggestion = {
        id: 'suggestion-123',
        description: 'Purchase at Starbucks',
        amountCents: BigInt(-4500000), // -45000.00 IDR in cents
        currency: 'IDR',
        date: new Date(),
        merchant: 'Starbucks',
        suggestedCategoryId: 'category-123',
        confidence: 0.85,
        source: 'RECEIPT',
        metadata: { ocrResultId: 'ocr-123' },
        suggestedCategory: { name: 'Food & Dining' },
      };

      const mockTransaction = {
        id: 'transaction-123',
        householdId: 'household-123',
        amountCents: BigInt(4500000),
        currency: 'IDR',
        description: 'Purchase at Starbucks',
        date: new Date(),
        accountId: 'account-123',
        merchant: 'Starbucks',
        categoryId: 'category-123',
        createdBy: 'user-123',
        metadata: {},
      };

      const mockAccount = {
        householdId: 'household-123',
      };

      // Setup mocks
      (prismaService.transactionSuggestion.findUnique as jest.Mock).mockResolvedValue(mockSuggestion);
      (prismaService.account.findUnique as jest.Mock).mockResolvedValue(mockAccount);
      (prismaService.transaction.create as jest.Mock).mockResolvedValue(mockTransaction);
      (prismaService.ledgerEntry.createMany as jest.Mock).mockResolvedValue({ count: 1 });
      (prismaService.transactionSuggestion.update as jest.Mock).mockResolvedValue({
        ...mockSuggestion,
        isApproved: true,
        approvedAt: new Date(),
        createdTransactionId: 'transaction-123',
      });

      // Test approval
      const approveResult = await service.approveTransactionSuggestion(
        {
          suggestionId: 'suggestion-123',
          accountId: 'account-123',
          corrections: {
            description: 'Coffee at Starbucks',
            amount: -50000, // Corrected amount
          },
        },
        'user-123',
      );

      expect(approveResult).toBeDefined();
      expect(approveResult.id).toBe('transaction-123');
      expect(prismaService.transaction.create).toHaveBeenCalled();
      expect(prismaService.ledgerEntry.createMany).toHaveBeenCalled();
      expect(prismaService.transactionSuggestion.update).toHaveBeenCalledWith({
        where: { id: 'suggestion-123' },
        data: {
          createdTransactionId: 'transaction-123',
          isApproved: true,
          approvedAt: expect.any(Date),
        },
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle file validation errors', async () => {
      const invalidFile = {
        originalname: 'document.txt',
        size: 1024,
        mimetype: 'text/plain',
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      const uploadDto = {
        documentType: DocumentType.RECEIPT,
        householdId: 'household-123',
      };

      await expect(service.uploadDocument(invalidFile, uploadDto, 'user-123')).rejects.toThrow(
        'Invalid file type for RECEIPT',
      );
    });

    it('should handle large file errors', async () => {
      const largeFile = {
        originalname: 'large-receipt.jpg',
        size: 15 * 1024 * 1024, // 15MB
        mimetype: 'image/jpeg',
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      const uploadDto = {
        documentType: DocumentType.RECEIPT,
        householdId: 'household-123',
      };

      await expect(service.uploadDocument(largeFile, uploadDto, 'user-123')).rejects.toThrow(
        'File size exceeds 10MB limit',
      );
    });

    it('should handle document not found errors', async () => {
      (prismaService.documentUpload.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.processDocument({
          documentId: 'non-existent-doc',
          forceReprocess: false,
        }),
      ).rejects.toThrow('Document not found: non-existent-doc');
    });
  });
});
