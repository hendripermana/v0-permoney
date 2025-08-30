import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentStorageService } from './document-storage.service';
import {
  OCRResult,
  DocumentType,
  ExtractedData,
  BankStatementInfo,
  BankStatementTransaction,
  OCRMetadata,
} from '../types/ocr.types';

@Injectable()
export class BankStatementProcessingService {
  private readonly logger = new Logger(BankStatementProcessingService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly documentStorageService: DocumentStorageService,
  ) {}

  async processBankStatement(storageUrl: string): Promise<OCRResult> {
    this.logger.log(`Processing bank statement: ${storageUrl}`);

    const startTime = Date.now();

    try {
      // Get document from storage
      const documentBuffer = await this.documentStorageService.getDocument(storageUrl);
      const metadata = await this.documentStorageService.getDocumentMetadata(storageUrl);

      // Perform OCR processing on PDF
      const rawText = await this.performPDFOCR(documentBuffer);
      
      // Extract structured data from raw text
      const extractedData = await this.extractBankStatementData(rawText);

      // Calculate confidence score
      const confidence = this.calculateConfidence(extractedData, rawText);

      const processingTime = Date.now() - startTime;

      const ocrResult: OCRResult = {
        id: this.generateOCRResultId(),
        documentType: DocumentType.BANK_STATEMENT,
        confidence,
        extractedData,
        rawText,
        processedAt: new Date(),
        metadata: {
          processingTime,
          ocrEngine: 'pdf-parse', // or whatever PDF processing engine is used
          documentFormat: metadata.mimeType,
          pageCount: this.estimatePageCount(rawText),
        },
      };

      this.logger.log(`Bank statement processed successfully: ${ocrResult.id} (${processingTime}ms)`);
      return ocrResult;
    } catch (error) {
      this.logger.error(`Failed to process bank statement: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async performPDFOCR(documentBuffer: Buffer): Promise<string> {
    // This is a placeholder implementation
    // In a real implementation, you would integrate with PDF processing libraries like:
    // - pdf-parse
    // - pdf2pic + tesseract for scanned PDFs
    // - AWS Textract for advanced PDF processing
    // - Google Cloud Document AI

    this.logger.log('Performing PDF OCR on bank statement');

    // Simulate PDF processing with mock data
    const mockBankStatementText = `
      BANK CENTRAL ASIA
      PT Bank Central Asia Tbk
      
      REKENING KORAN / ACCOUNT STATEMENT
      
      Nama Nasabah: JOHN DOE
      No. Rekening: 1234567890
      Periode: 01 Jan 2024 - 31 Jan 2024
      
      Saldo Awal: IDR 5,000,000.00
      
      TANGGAL    KETERANGAN                           DEBET        KREDIT       SALDO
      01/01/24   SALDO AWAL                                                    5,000,000.00
      02/01/24   TRF DARI 9876543210                              1,000,000.00 6,000,000.00
      03/01/24   TARIK TUNAI ATM BCA                 500,000.00                5,500,000.00
      05/01/24   BAYAR LISTRIK PLN                   250,000.00                5,250,000.00
      07/01/24   GAJI BULANAN                                     8,000,000.00 13,250,000.00
      10/01/24   BELANJA INDOMARET                   125,000.00                13,125,000.00
      12/01/24   TRANSFER KE 5555666677              2,000,000.00              11,125,000.00
      15/01/24   BUNGA TABUNGAN                                   25,000.00    11,150,000.00
      18/01/24   BIAYA ADMIN BULANAN                 15,000.00                 11,135,000.00
      20/01/24   BELANJA SHOPEE                      350,000.00                10,785,000.00
      25/01/24   CASHBACK SHOPEE                                  35,000.00    10,820,000.00
      28/01/24   BAYAR KARTU KREDIT                  1,500,000.00              9,320,000.00
      31/01/24   SALDO AKHIR                                                   9,320,000.00
      
      Total Debet: IDR 4,740,000.00
      Total Kredit: IDR 9,060,000.00
      
      Saldo Akhir: IDR 9,320,000.00
    `;

    // In production, replace this with actual PDF parsing
    return mockBankStatementText.trim();
  }

  private async extractBankStatementData(rawText: string): Promise<ExtractedData> {
    this.logger.log('Extracting structured data from bank statement');

    const lines = rawText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    // Extract bank statement information
    const bankStatementInfo = this.extractBankStatementInfo(lines);

    return {
      bankStatementInfo,
    };
  }

  private extractBankStatementInfo(lines: string[]): BankStatementInfo {
    // Extract account number
    const accountNumber = this.extractAccountNumber(lines);
    
    // Extract bank name
    const bankName = this.extractBankName(lines);
    
    // Extract statement period
    const statementPeriod = this.extractStatementPeriod(lines);
    
    // Extract transactions
    const transactions = this.extractTransactions(lines);

    return {
      accountNumber,
      bankName,
      statementPeriod,
      transactions,
    };
  }

  private extractAccountNumber(lines: string[]): string {
    const accountPattern = /No\.?\s*Rekening\s*:?\s*(\d+)/i;
    
    for (const line of lines) {
      const match = line.match(accountPattern);
      if (match) {
        return match[1];
      }
    }

    return 'Unknown';
  }

  private extractBankName(lines: string[]): string {
    // Look for bank name in first few lines
    const bankPatterns = [
      /BANK\s+CENTRAL\s+ASIA/i,
      /BCA/i,
      /BANK\s+MANDIRI/i,
      /BANK\s+BNI/i,
      /BANK\s+BRI/i,
      /BANK\s+DANAMON/i,
      /BANK\s+CIMB/i,
    ];

    for (const line of lines.slice(0, 10)) {
      for (const pattern of bankPatterns) {
        if (pattern.test(line)) {
          return line;
        }
      }
    }

    return 'Unknown Bank';
  }

  private extractStatementPeriod(lines: string[]): { startDate: Date; endDate: Date } {
    const periodPattern = /Periode\s*:?\s*(\d{1,2}\s+\w+\s+\d{4})\s*-\s*(\d{1,2}\s+\w+\s+\d{4})/i;
    
    for (const line of lines) {
      const match = line.match(periodPattern);
      if (match) {
        const startDate = this.parseIndonesianDate(match[1]);
        const endDate = this.parseIndonesianDate(match[2]);
        
        if (startDate && endDate) {
          return { startDate, endDate };
        }
      }
    }

    // Default to current month if no period found
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    return { startDate, endDate };
  }

  private extractTransactions(lines: string[]): BankStatementTransaction[] {
    const transactions: BankStatementTransaction[] = [];
    
    // Find the start of transaction data (after header)
    const headerEndIndex = lines.findIndex(line => 
      line.toLowerCase().includes('tanggal') && 
      line.toLowerCase().includes('keterangan')
    );

    if (headerEndIndex === -1) {
      return transactions;
    }

    // Process transaction lines
    for (let i = headerEndIndex + 1; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip summary lines
      if (line.toLowerCase().includes('total') || 
          line.toLowerCase().includes('saldo akhir')) {
        break;
      }

      const transaction = this.parseTransactionLine(line);
      if (transaction) {
        transactions.push(transaction);
      }
    }

    return transactions;
  }

  private parseTransactionLine(line: string): BankStatementTransaction | null {
    // Pattern for Indonesian bank statement transaction line
    // Format: DATE DESCRIPTION DEBIT CREDIT BALANCE
    const transactionPattern = /(\d{2}\/\d{2}\/\d{2,4})\s+(.+?)\s+([\d,]+\.?\d*)\s*([\d,]+\.?\d*)?\s+([\d,]+\.?\d*)/;
    
    const match = line.match(transactionPattern);
    if (!match) {
      return null;
    }

    const dateStr = match[1];
    const description = match[2].trim();
    const debitStr = match[3];
    const creditStr = match[4];
    const balanceStr = match[5];

    const date = this.parseDate(dateStr);
    if (!date) {
      return null;
    }

    // Determine if it's debit or credit based on which field has value
    const debitAmount = this.parseAmount(debitStr);
    const creditAmount = creditStr ? this.parseAmount(creditStr) : 0;
    const balance = this.parseAmount(balanceStr);

    const isDebit = debitAmount > 0;
    const amount = isDebit ? -debitAmount : creditAmount;

    return {
      date,
      description,
      amount,
      balance,
      type: isDebit ? 'DEBIT' : 'CREDIT',
      reference: this.extractReference(description),
    };
  }

  private parseIndonesianDate(dateStr: string): Date | null {
    // Handle Indonesian month names
    const monthMap: Record<string, number> = {
      'jan': 0, 'januari': 0,
      'feb': 1, 'februari': 1,
      'mar': 2, 'maret': 2,
      'apr': 3, 'april': 3,
      'mei': 4, 'may': 4,
      'jun': 5, 'juni': 5,
      'jul': 6, 'juli': 6,
      'agu': 7, 'agustus': 7,
      'sep': 8, 'september': 8,
      'okt': 9, 'oktober': 9,
      'nov': 10, 'november': 10,
      'des': 11, 'desember': 11,
    };

    const parts = dateStr.toLowerCase().split(/\s+/);
    if (parts.length !== 3) {
      return null;
    }

    const day = parseInt(parts[0]);
    const monthName = parts[1];
    const year = parseInt(parts[2]);

    const month = monthMap[monthName];
    if (month === undefined) {
      return null;
    }

    return new Date(year, month, day);
  }

  private parseDate(dateStr: string): Date | null {
    // Handle DD/MM/YY or DD/MM/YYYY format
    const parts = dateStr.split('/');
    if (parts.length !== 3) {
      return null;
    }

    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1; // Month is 0-indexed
    let year = parseInt(parts[2]);

    // Handle 2-digit years
    if (year < 100) {
      year += year < 50 ? 2000 : 1900;
    }

    return new Date(year, month, day);
  }

  private parseAmount(amountStr: string): number {
    if (!amountStr) return 0;
    
    // Remove commas and convert to number
    const cleanAmount = amountStr.replace(/,/g, '');
    const amount = parseFloat(cleanAmount);
    return isNaN(amount) ? 0 : amount;
  }

  private extractReference(description: string): string | undefined {
    // Look for reference numbers in transaction descriptions
    const refPatterns = [
      /REF\s*:?\s*(\w+)/i,
      /TRX\s*:?\s*(\w+)/i,
      /NO\s*:?\s*(\w+)/i,
    ];

    for (const pattern of refPatterns) {
      const match = description.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return undefined;
  }

  private calculateConfidence(extractedData: ExtractedData, rawText: string): number {
    let confidence = 0.5; // Base confidence

    if (extractedData.bankStatementInfo) {
      const info = extractedData.bankStatementInfo;
      
      // Account number found
      if (info.accountNumber && info.accountNumber !== 'Unknown') {
        confidence += 0.2;
      }

      // Bank name found
      if (info.bankName && info.bankName !== 'Unknown Bank') {
        confidence += 0.1;
      }

      // Transactions found
      if (info.transactions && info.transactions.length > 0) {
        confidence += 0.2;
      }

      // Statement period found
      if (info.statementPeriod) {
        confidence += 0.1;
      }
    }

    return Math.min(confidence, 1.0);
  }

  private estimatePageCount(rawText: string): number {
    // Rough estimation based on text length
    const avgCharsPerPage = 2000;
    return Math.max(1, Math.ceil(rawText.length / avgCharsPerPage));
  }

  private generateOCRResultId(): string {
    return `ocr_statement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
