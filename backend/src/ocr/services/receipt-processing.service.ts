import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentStorageService } from './document-storage.service';
import {
  OCRResult,
  DocumentType,
  ExtractedData,
  MerchantInfo,
  AmountInfo,
  DateInfo,
  LineItem,
  OCRMetadata,
} from '../types/ocr.types';

@Injectable()
export class ReceiptProcessingService {
  private readonly logger = new Logger(ReceiptProcessingService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly documentStorageService: DocumentStorageService,
  ) {}

  async processReceipt(storageUrl: string): Promise<OCRResult> {
    this.logger.log(`Processing receipt: ${storageUrl}`);

    const startTime = Date.now();

    try {
      // Get document from storage
      const documentBuffer = await this.documentStorageService.getDocument(storageUrl);
      const metadata = await this.documentStorageService.getDocumentMetadata(storageUrl);

      // Perform OCR processing
      const rawText = await this.performOCR(documentBuffer, metadata.mimeType);
      
      // Extract structured data from raw text
      const extractedData = await this.extractReceiptData(rawText);

      // Calculate confidence score
      const confidence = this.calculateConfidence(extractedData, rawText);

      const processingTime = Date.now() - startTime;

      const ocrResult: OCRResult = {
        id: this.generateOCRResultId(),
        documentType: DocumentType.RECEIPT,
        confidence,
        extractedData,
        rawText,
        processedAt: new Date(),
        metadata: {
          processingTime,
          ocrEngine: 'tesseract', // or whatever OCR engine is used
          imageQuality: this.assessImageQuality(documentBuffer),
          documentFormat: metadata.mimeType,
        },
      };

      this.logger.log(`Receipt processed successfully: ${ocrResult.id} (${processingTime}ms)`);
      return ocrResult;
    } catch (error) {
      this.logger.error(`Failed to process receipt: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async performOCR(documentBuffer: Buffer, mimeType: string): Promise<string> {
    // This is a placeholder implementation
    // In a real implementation, you would integrate with an OCR service like:
    // - Google Cloud Vision API
    // - AWS Textract
    // - Azure Computer Vision
    // - Tesseract.js
    // - Or other OCR providers

    this.logger.log(`Performing OCR on document (${mimeType})`);

    // Validate buffer
    if (!documentBuffer || documentBuffer.length === 0) {
      throw new Error('Invalid document buffer');
    }

    // For different file types, you might use different OCR approaches
    if (mimeType === 'application/pdf') {
      // For PDFs, you might need to convert to images first
      this.logger.log('Processing PDF document');
    } else if (mimeType.startsWith('image/')) {
      // For images, direct OCR processing
      this.logger.log('Processing image document');
    }

    // Simulate OCR processing with mock data based on file type
    const mockReceiptTexts = [
      `
        STARBUCKS COFFEE
        Jl. Sudirman No. 123
        Jakarta Selatan 12190
        Tel: (021) 123-4567
        
        Date: 15/01/2024
        Time: 14:30:25
        
        Cashier: Sarah
        Receipt: #12345
        
        1x Americano Large        45,000
        1x Croissant             25,000
        1x Bottled Water         15,000
        
        Subtotal                 85,000
        Tax (10%)                 8,500
        
        TOTAL                    93,500
        
        Payment: Credit Card
        Card: ****1234
        
        Thank you for visiting!
        Visit us again soon.
      `,
      `
        INDOMARET
        Jl. Kebon Jeruk No. 45
        Jakarta Barat 11530
        
        Date: 16/01/2024
        Time: 09:15:30
        
        Cashier: Budi
        
        Indomie Goreng           3,500
        Teh Botol Sosro          4,000
        Roti Tawar               8,500
        Susu Ultra               12,000
        
        Total                    28,000
        
        Cash                     30,000
        Change                    2,000
        
        Terima kasih!
      `,
      `
        KFC
        Mall Taman Anggrek
        Jakarta Barat
        
        Date: 17/01/2024
        Time: 19:45:12
        
        Order #: 789456
        
        2x Paket Komplit         78,000
        1x Hot & Crispy          25,000
        2x Pepsi Regular         16,000
        
        Subtotal                119,000
        Tax 10%                  11,900
        
        TOTAL                   130,900
        
        Debit Card Payment
        Thank you!
      `,
    ];

    // Randomly select one of the mock receipts to simulate variety
    const selectedReceipt = mockReceiptTexts[Math.floor(Math.random() * mockReceiptTexts.length)];

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    // In production, replace this with actual OCR API call
    return selectedReceipt.trim();
  }

  private async extractReceiptData(rawText: string): Promise<ExtractedData> {
    this.logger.log('Extracting structured data from OCR text');

    // This is a simplified extraction logic
    // In production, you would use more sophisticated NLP/ML techniques
    
    const lines = rawText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    // Extract merchant information
    const merchant = this.extractMerchantInfo(lines);
    
    // Extract date information
    const date = this.extractDateInfo(lines);
    
    // Extract amount information
    const amount = this.extractAmountInfo(lines);
    
    // Extract line items
    const items = this.extractLineItems(lines);

    return {
      merchant,
      date,
      amount,
      items,
    };
  }

  private extractMerchantInfo(lines: string[]): MerchantInfo {
    // Look for merchant name (usually first non-empty line)
    const merchantName = lines[0] || 'Unknown Merchant';
    
    // Look for address (lines containing street indicators)
    const addressLine = lines.find(line => 
      line.toLowerCase().includes('jl.') || 
      line.toLowerCase().includes('jalan') ||
      line.toLowerCase().includes('street') ||
      line.toLowerCase().includes('road')
    );

    // Look for phone number
    const phoneLine = lines.find(line => 
      line.toLowerCase().includes('tel:') ||
      line.toLowerCase().includes('phone:') ||
      /\(\d{3}\)\s*\d{3}-\d{4}/.test(line) ||
      /\d{4}-\d{4}/.test(line)
    );

    return {
      name: merchantName,
      address: addressLine,
      phone: phoneLine,
      confidence: 0.8, // Simplified confidence calculation
    };
  }

  private extractDateInfo(lines: string[]): DateInfo {
    // Look for date patterns
    const datePatterns = [
      /Date:\s*(\d{1,2}\/\d{1,2}\/\d{4})/i,
      /(\d{1,2}\/\d{1,2}\/\d{4})/,
      /(\d{4}-\d{2}-\d{2})/,
      /(\d{1,2}-\d{1,2}-\d{4})/,
    ];

    for (const line of lines) {
      for (const pattern of datePatterns) {
        const match = line.match(pattern);
        if (match) {
          const dateStr = match[1];
          const date = this.parseDate(dateStr);
          if (date) {
            return {
              date,
              confidence: 0.9,
            };
          }
        }
      }
    }

    // Default to current date if no date found
    return {
      date: new Date(),
      confidence: 0.3,
    };
  }

  private extractAmountInfo(lines: string[]): AmountInfo {
    // Look for total amount
    const totalPattern = /TOTAL\s*:?\s*([\d,]+\.?\d*)/i;
    const subtotalPattern = /Subtotal\s*:?\s*([\d,]+\.?\d*)/i;
    const taxPattern = /Tax\s*\([^)]+\)\s*:?\s*([\d,]+\.?\d*)/i;

    let total = 0;
    let subtotal = 0;
    let tax = 0;

    for (const line of lines) {
      const totalMatch = line.match(totalPattern);
      if (totalMatch) {
        total = this.parseAmount(totalMatch[1]);
      }

      const subtotalMatch = line.match(subtotalPattern);
      if (subtotalMatch) {
        subtotal = this.parseAmount(subtotalMatch[1]);
      }

      const taxMatch = line.match(taxPattern);
      if (taxMatch) {
        tax = this.parseAmount(taxMatch[1]);
      }
    }

    return {
      total,
      currency: 'IDR', // Default to IDR for Indonesian receipts
      subtotal: subtotal > 0 ? subtotal : undefined,
      tax: tax > 0 ? tax : undefined,
      confidence: total > 0 ? 0.9 : 0.3,
    };
  }

  private extractLineItems(lines: string[]): LineItem[] {
    const items: LineItem[] = [];
    
    // Look for lines that match item patterns
    const itemPattern = /(\d+)x?\s+(.+?)\s+([\d,]+\.?\d*)/;

    for (const line of lines) {
      const match = line.match(itemPattern);
      if (match) {
        const quantity = parseInt(match[1]) || 1;
        const description = match[2].trim();
        const totalPrice = this.parseAmount(match[3]);

        if (totalPrice > 0) {
          items.push({
            description,
            quantity,
            unitPrice: totalPrice / quantity,
            totalPrice,
            confidence: 0.8,
          });
        }
      }
    }

    return items;
  }

  private parseDate(dateStr: string): Date | null {
    // Handle different date formats
    const formats = [
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // DD/MM/YYYY or MM/DD/YYYY
      /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
      /(\d{1,2})-(\d{1,2})-(\d{4})/, // DD-MM-YYYY
    ];

    for (const format of formats) {
      const match = dateStr.match(format);
      if (match) {
        // Assume DD/MM/YYYY format for Indonesian receipts
        const day = parseInt(match[1]);
        const month = parseInt(match[2]);
        const year = parseInt(match[3]);

        if (year > 1900 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
          return new Date(year, month - 1, day);
        }
      }
    }

    return null;
  }

  private parseAmount(amountStr: string): number {
    // Remove commas and convert to number
    const cleanAmount = amountStr.replace(/,/g, '');
    const amount = parseFloat(cleanAmount);
    return isNaN(amount) ? 0 : amount;
  }

  private calculateConfidence(extractedData: ExtractedData, rawText: string): number {
    let totalConfidence = 0;
    let factors = 0;

    if (extractedData.merchant) {
      totalConfidence += extractedData.merchant.confidence;
      factors++;
    }

    if (extractedData.date) {
      totalConfidence += extractedData.date.confidence;
      factors++;
    }

    if (extractedData.amount) {
      totalConfidence += extractedData.amount.confidence;
      factors++;
    }

    if (extractedData.items && extractedData.items.length > 0) {
      const itemsConfidence = extractedData.items.reduce((sum, item) => sum + item.confidence, 0) / extractedData.items.length;
      totalConfidence += itemsConfidence;
      factors++;
    }

    // Text quality factor
    const textQuality = this.assessTextQuality(rawText);
    totalConfidence += textQuality;
    factors++;

    return factors > 0 ? totalConfidence / factors : 0.5;
  }

  private assessImageQuality(documentBuffer: Buffer): number {
    // Simplified image quality assessment
    // In production, you might analyze image resolution, clarity, etc.
    return 0.8;
  }

  private assessTextQuality(rawText: string): number {
    // Simple text quality assessment based on:
    // - Length of text
    // - Presence of common receipt elements
    // - Character recognition quality

    if (rawText.length < 50) return 0.3;
    if (rawText.length < 200) return 0.6;
    
    const commonElements = ['total', 'date', 'receipt', 'tax', 'subtotal'];
    const foundElements = commonElements.filter(element => 
      rawText.toLowerCase().includes(element)
    ).length;

    return Math.min(0.5 + (foundElements / commonElements.length) * 0.5, 1.0);
  }

  private generateOCRResultId(): string {
    return `ocr_receipt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
