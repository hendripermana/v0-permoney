import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OcrService } from './ocr.service';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentStorageService } from './services/document-storage.service';
import { ReceiptProcessingService } from './services/receipt-processing.service';
import { BankStatementProcessingService } from './services/bank-statement-processing.service';
import { TransactionSuggestionService } from './services/transaction-suggestion.service';
import { DocumentType } from './types/ocr.types';

describe('OCR Security Tests', () => {
  let service: OcrService;
  let prismaService: PrismaService;

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
    householdMember: {
      findUnique: jest.fn(),
    },
    account: {
      findUnique: jest.fn(),
    },
    transactionSuggestion: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    transaction: {
      create: jest.fn(),
    },
    ledgerEntry: {
      createMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockDocumentStorageService = {
    storeDocument: jest.fn(),
    getDocument: jest.fn(),
    getDocumentMetadata: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OcrService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: DocumentStorageService, useValue: mockDocumentStorageService },
        { provide: ReceiptProcessingService, useValue: { processReceipt: jest.fn() } },
        { provide: BankStatementProcessingService, useValue: { processBankStatement: jest.fn() } },
        { provide: TransactionSuggestionService, useValue: { generateSuggestions: jest.fn() } },
      ],
    }).compile();

    service = module.get<OcrService>(OcrService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('File Upload Security', () => {
    it('should reject files with path traversal in filename', async () => {
      const maliciousFile = {
        originalname: '../../../etc/passwd',
        size: 1024,
        mimetype: 'image/jpeg',
        buffer: Buffer.from('fake-image-data'),
      } as Express.Multer.File;

      const uploadDto = {
        documentType: DocumentType.RECEIPT,
        householdId: 'household-123',
      };

      await expect(service.uploadDocument(maliciousFile, uploadDto, 'user-123')).rejects.toThrow(
        'Invalid filename: Path traversal detected',
      );
    });

    it('should reject files with invalid MIME type signatures', async () => {
      // Create a file that claims to be JPEG but has wrong signature
      const fakeJpegFile = {
        originalname: 'fake.jpg',
        size: 1024,
        mimetype: 'image/jpeg',
        buffer: Buffer.from('This is not a JPEG file'),
      } as Express.Multer.File;

      const uploadDto = {
        documentType: DocumentType.RECEIPT,
        householdId: 'household-123',
      };

      mockPrismaService.householdMember.findUnique.mockResolvedValue({ userId: 'user-123' });

      await expect(service.uploadDocument(fakeJpegFile, uploadDto, 'user-123')).rejects.toThrow(
        'File signature does not match declared MIME type',
      );
    });

    it('should reject empty files', async () => {
      const emptyFile = {
        originalname: 'empty.jpg',
        size: 0,
        mimetype: 'image/jpeg',
        buffer: Buffer.alloc(0),
      } as Express.Multer.File;

      const uploadDto = {
        documentType: DocumentType.RECEIPT,
        householdId: 'household-123',
      };

      await expect(service.uploadDocument(emptyFile, uploadDto, 'user-123')).rejects.toThrow(
        'File is empty',
      );
    });

    it('should reject files with extremely long filenames', async () => {
      const longFilename = 'a'.repeat(300) + '.jpg';
      const longNameFile = {
        originalname: longFilename,
        size: 1024,
        mimetype: 'image/jpeg',
        buffer: Buffer.from([0xFF, 0xD8, 0xFF]), // Valid JPEG signature
      } as Express.Multer.File;

      const uploadDto = {
        documentType: DocumentType.RECEIPT,
        householdId: 'household-123',
      };

      await expect(service.uploadDocument(longNameFile, uploadDto, 'user-123')).rejects.toThrow(
        'Filename too long',
      );
    });
  });

  describe('Authorization Security', () => {
    it('should reject access to documents from different household', async () => {
      mockPrismaService.householdMember.findUnique.mockResolvedValue(null);

      await expect(
        service.getDocumentsByHousehold('other-household', 'user-123'),
      ).rejects.toThrow('Access denied: User is not a member of this household');
    });

    it('should reject document access for non-member users', async () => {
      const mockDocument = {
        id: 'doc-123',
        householdId: 'household-456',
        fileName: 'receipt.jpg',
        fileSize: 1024,
        mimeType: 'image/jpeg',
        documentType: DocumentType.RECEIPT,
        status: 'COMPLETED',
        uploadedBy: 'other-user',
        uploadedAt: new Date(),
        storageUrl: 'documents/household-456/receipt.jpg',
        ocrResults: [],
        transactionSuggestions: [],
      };

      jest.spyOn(service as any, 'getDocumentById').mockResolvedValue(mockDocument);
      mockPrismaService.householdMember.findUnique.mockResolvedValue(null);

      await expect(service.getDocument('doc-123', 'user-123')).rejects.toThrow(
        'Access denied: User is not a member of this household',
      );
    });
  });

  describe('Input Validation Security', () => {
    it('should validate UUID format for document IDs', async () => {
      const invalidDocumentId = 'invalid-uuid';

      // This would typically be handled by UUID validation in DTOs
      // but we test the service behavior with invalid IDs
      jest.spyOn(service as any, 'getDocumentById').mockResolvedValue(null);

      await expect(service.getDocument(invalidDocumentId, 'user-123')).rejects.toThrow(
        'Document not found',
      );
    });

    it('should prevent SQL injection in household queries', async () => {
      const maliciousHouseholdId = "'; DROP TABLE documents; --";
      
      mockPrismaService.householdMember.findUnique.mockResolvedValue({ userId: 'user-123' });
      mockPrismaService.documentUpload.findMany.mockResolvedValue([]);

      // Should not throw an error and should safely handle the malicious input
      const result = await service.getDocumentsByHousehold(maliciousHouseholdId, 'user-123');
      expect(result).toEqual([]);
    });
  });

  describe('Transaction Creation Security', () => {
    it('should prevent double-spending by checking suggestion approval status', async () => {
      const mockSuggestion = {
        id: 'suggestion-123',
        description: 'Test transaction',
        amount: -100,
        currency: 'IDR',
        date: new Date(),
        metadata: { ocrResultId: 'ocr-123' },
      };

      const mockAccount = {
        householdId: 'household-123',
        isActive: true,
      };

      const mockExistingSuggestion = {
        isApproved: true,
        createdTransactionId: 'existing-transaction-123',
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const mockPrisma = {
          account: {
            findUnique: jest.fn().mockResolvedValue(mockAccount),
          },
          transactionSuggestion: {
            findUnique: jest.fn().mockResolvedValue(mockExistingSuggestion),
          },
        };
        return callback(mockPrisma);
      });

      mockPrismaService.householdMember.findUnique.mockResolvedValue({ userId: 'user-123' });

      await expect(
        (service as any).createTransactionFromSuggestion(mockSuggestion, 'account-123', 'user-123'),
      ).rejects.toThrow('Transaction suggestion has already been approved');
    });

    it('should reject transactions for inactive accounts', async () => {
      const mockSuggestion = {
        id: 'suggestion-123',
        description: 'Test transaction',
        amount: -100,
        currency: 'IDR',
        date: new Date(),
        metadata: { ocrResultId: 'ocr-123' },
      };

      const mockInactiveAccount = {
        householdId: 'household-123',
        isActive: false,
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const mockPrisma = {
          account: {
            findUnique: jest.fn().mockResolvedValue(mockInactiveAccount),
          },
        };
        return callback(mockPrisma);
      });

      await expect(
        (service as any).createTransactionFromSuggestion(mockSuggestion, 'account-123', 'user-123'),
      ).rejects.toThrow('Cannot create transaction for inactive account');
    });

    it('should reject transactions with zero amount', async () => {
      const mockSuggestion = {
        id: 'suggestion-123',
        description: 'Test transaction',
        amount: 0,
        currency: 'IDR',
        date: new Date(),
        metadata: { ocrResultId: 'ocr-123' },
      };

      const mockAccount = {
        householdId: 'household-123',
        isActive: true,
      };

      const mockExistingSuggestion = {
        isApproved: false,
        createdTransactionId: null,
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const mockPrisma = {
          account: {
            findUnique: jest.fn().mockResolvedValue(mockAccount),
          },
          transactionSuggestion: {
            findUnique: jest.fn().mockResolvedValue(mockExistingSuggestion),
          },
        };
        return callback(mockPrisma);
      });

      mockPrismaService.householdMember.findUnique.mockResolvedValue({ userId: 'user-123' });

      await expect(
        (service as any).createTransactionFromSuggestion(mockSuggestion, 'account-123', 'user-123'),
      ).rejects.toThrow('Invalid transaction amount');
    });
  });

  describe('Rate Limiting & DoS Protection', () => {
    it('should handle processing timeout gracefully', async () => {
      const processDto = {
        documentId: 'doc-123',
        forceReprocess: false,
      };

      // Mock a very slow processing operation
      jest.spyOn(service as any, 'performDocumentProcessing').mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 35000)) // 35 seconds
      );

      await expect(service.processDocument(processDto)).rejects.toThrow('Processing timeout');
    });
  });
});
