import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  OCRResult,
  TransactionSuggestion,
  DocumentType,
  ExtractedData,
  BankStatementTransaction,
  LineItem,
} from '../types/ocr.types';

@Injectable()
export class TransactionSuggestionService {
  private readonly logger = new Logger(TransactionSuggestionService.name);

  constructor(private readonly prismaService: PrismaService) {}

  async generateSuggestions(ocrResult: OCRResult, householdId: string): Promise<TransactionSuggestion[]> {
    this.logger.log(`Generating transaction suggestions for OCR result: ${ocrResult.id}`);

    try {
      const suggestions: TransactionSuggestion[] = [];

      switch (ocrResult.documentType) {
        case DocumentType.RECEIPT:
          suggestions.push(...await this.generateReceiptSuggestions(ocrResult, householdId));
          break;
        case DocumentType.BANK_STATEMENT:
          suggestions.push(...await this.generateBankStatementSuggestions(ocrResult, householdId));
          break;
        default:
          this.logger.warn(`Unsupported document type for suggestions: ${ocrResult.documentType}`);
      }

      this.logger.log(`Generated ${suggestions.length} transaction suggestions`);
      return suggestions;
    } catch (error) {
      this.logger.error(`Failed to generate transaction suggestions: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async generateReceiptSuggestions(
    ocrResult: OCRResult,
    householdId: string,
  ): Promise<TransactionSuggestion[]> {
    const suggestions: TransactionSuggestion[] = [];
    const extractedData = ocrResult.extractedData;

    // Generate main transaction suggestion from receipt total
    if (extractedData.amount && extractedData.amount.total > 0) {
      const mainSuggestion = await this.createReceiptMainSuggestion(
        ocrResult,
        extractedData,
        householdId,
      );
      suggestions.push(mainSuggestion);
    }

    // Generate individual item suggestions if line items are available
    if (extractedData.items && extractedData.items.length > 0) {
      const itemSuggestions = await this.createReceiptItemSuggestions(
        ocrResult,
        extractedData,
        householdId,
      );
      suggestions.push(...itemSuggestions);
    }

    return suggestions;
  }

  private async generateBankStatementSuggestions(
    ocrResult: OCRResult,
    householdId: string,
  ): Promise<TransactionSuggestion[]> {
    const suggestions: TransactionSuggestion[] = [];
    const bankStatementInfo = ocrResult.extractedData.bankStatementInfo;

    if (!bankStatementInfo || !bankStatementInfo.transactions) {
      return suggestions;
    }

    // Generate suggestion for each bank statement transaction
    for (const [index, transaction] of bankStatementInfo.transactions.entries()) {
      const suggestion = await this.createBankStatementSuggestion(
        ocrResult,
        transaction,
        index,
        householdId,
      );
      suggestions.push(suggestion);
    }

    return suggestions;
  }

  private async createReceiptMainSuggestion(
    ocrResult: OCRResult,
    extractedData: ExtractedData,
    householdId: string,
  ): Promise<TransactionSuggestion> {
    const merchantName = extractedData.merchant?.name || 'Unknown Merchant';
    const amount = extractedData.amount!.total;
    const currency = extractedData.amount!.currency;
    const date = extractedData.date?.date || new Date();

    // Suggest category based on merchant name
    const suggestedCategory = await this.suggestCategoryFromMerchant(merchantName, householdId);

    return {
      id: this.generateSuggestionId(),
      description: `Purchase at ${merchantName}`,
      amount: -Math.abs(amount), // Negative for expense
      currency,
      date,
      merchant: merchantName,
      suggestedCategoryId: suggestedCategory?.id,
      suggestedCategoryName: suggestedCategory?.name,
      confidence: this.calculateSuggestionConfidence(extractedData),
      source: 'RECEIPT',
      metadata: {
        ocrResultId: ocrResult.id,
        originalText: ocrResult.rawText,
      },
    };
  }

  private async createReceiptItemSuggestions(
    ocrResult: OCRResult,
    extractedData: ExtractedData,
    householdId: string,
  ): Promise<TransactionSuggestion[]> {
    const suggestions: TransactionSuggestion[] = [];
    const merchantName = extractedData.merchant?.name || 'Unknown Merchant';
    const date = extractedData.date?.date || new Date();
    const currency = extractedData.amount?.currency || 'IDR';

    for (const [index, item] of extractedData.items!.entries()) {
      const suggestedCategory = await this.suggestCategoryFromItem(item.description, householdId);

      suggestions.push({
        id: this.generateSuggestionId(),
        description: `${item.description} at ${merchantName}`,
        amount: -Math.abs(item.totalPrice), // Negative for expense
        currency,
        date,
        merchant: merchantName,
        suggestedCategoryId: suggestedCategory?.id,
        suggestedCategoryName: suggestedCategory?.name,
        confidence: item.confidence,
        source: 'RECEIPT',
        metadata: {
          ocrResultId: ocrResult.id,
          lineItemIndex: index,
          originalText: item.description,
        },
      });
    }

    return suggestions;
  }

  private async createBankStatementSuggestion(
    ocrResult: OCRResult,
    transaction: BankStatementTransaction,
    index: number,
    householdId: string,
  ): Promise<TransactionSuggestion> {
    // Suggest category based on transaction description
    const suggestedCategory = await this.suggestCategoryFromDescription(
      transaction.description,
      householdId,
    );

    // Extract merchant name from description
    const merchant = this.extractMerchantFromDescription(transaction.description);

    return {
      id: this.generateSuggestionId(),
      description: transaction.description,
      amount: transaction.amount,
      currency: 'IDR', // Assume IDR for Indonesian bank statements
      date: transaction.date,
      merchant,
      suggestedCategoryId: suggestedCategory?.id,
      suggestedCategoryName: suggestedCategory?.name,
      confidence: 0.8, // Bank statements are generally reliable
      source: 'BANK_STATEMENT',
      metadata: {
        ocrResultId: ocrResult.id,
        lineItemIndex: index,
        originalText: transaction.description,
      },
    };
  }

  private async suggestCategoryFromMerchant(
    merchantName: string,
    householdId: string,
  ): Promise<{ id: string; name: string } | null> {
    try {
      // First, try to find existing transactions with similar merchant
      const existingTransaction = await this.prismaService.transaction.findFirst({
        where: {
          householdId,
          OR: [
            { merchant: { contains: merchantName, mode: 'insensitive' } },
            { merchantName: { contains: merchantName, mode: 'insensitive' } },
          ],
          categoryId: { not: null },
        },
        include: {
          category: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (existingTransaction?.category) {
        return {
          id: existingTransaction.category.id,
          name: existingTransaction.category.name,
        };
      }

      // Fallback to rule-based category suggestion
      return this.suggestCategoryByRules(merchantName, householdId);
    } catch (error) {
      this.logger.error(`Failed to suggest category from merchant: ${error.message}`);
      return null;
    }
  }

  private async suggestCategoryFromItem(
    itemDescription: string,
    householdId: string,
  ): Promise<{ id: string; name: string } | null> {
    // Use rule-based approach for item categorization
    return this.suggestCategoryByRules(itemDescription, householdId);
  }

  private async suggestCategoryFromDescription(
    description: string,
    householdId: string,
  ): Promise<{ id: string; name: string } | null> {
    try {
      // Look for similar transaction descriptions
      const existingTransaction = await this.prismaService.transaction.findFirst({
        where: {
          householdId,
          description: { contains: description, mode: 'insensitive' },
          categoryId: { not: null },
        },
        include: {
          category: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (existingTransaction?.category) {
        return {
          id: existingTransaction.category.id,
          name: existingTransaction.category.name,
        };
      }

      // Fallback to rule-based suggestion
      return this.suggestCategoryByRules(description, householdId);
    } catch (error) {
      this.logger.error(`Failed to suggest category from description: ${error.message}`);
      return null;
    }
  }

  private async suggestCategoryByRules(
    text: string,
    householdId: string,
  ): Promise<{ id: string; name: string } | null> {
    const lowerText = text.toLowerCase();

    // Define category mapping rules
    const categoryRules = [
      { keywords: ['starbucks', 'coffee', 'cafe', 'kopi'], categoryName: 'Food & Dining' },
      { keywords: ['indomaret', 'alfamart', 'supermarket', 'grocery'], categoryName: 'Groceries' },
      { keywords: ['gas', 'petrol', 'shell', 'pertamina'], categoryName: 'Transportation' },
      { keywords: ['gojek', 'grab', 'taxi', 'uber'], categoryName: 'Transportation' },
      { keywords: ['listrik', 'pln', 'electricity'], categoryName: 'Utilities' },
      { keywords: ['internet', 'telkom', 'indihome'], categoryName: 'Utilities' },
      { keywords: ['hospital', 'doctor', 'pharmacy', 'apotek'], categoryName: 'Healthcare' },
      { keywords: ['shopee', 'tokopedia', 'lazada', 'blibli'], categoryName: 'Shopping' },
      { keywords: ['atm', 'tarik tunai', 'cash withdrawal'], categoryName: 'Cash & ATM' },
      { keywords: ['transfer', 'kirim uang'], categoryName: 'Transfer' },
      { keywords: ['gaji', 'salary', 'payroll'], categoryName: 'Income' },
      { keywords: ['bunga', 'interest'], categoryName: 'Income' },
      { keywords: ['biaya admin', 'admin fee'], categoryName: 'Bank Fees' },
    ];

    // Find matching rule
    for (const rule of categoryRules) {
      if (rule.keywords.some(keyword => lowerText.includes(keyword))) {
        try {
          // Find or create category
          const category = await this.prismaService.category.findFirst({
            where: {
              householdId,
              name: { equals: rule.categoryName, mode: 'insensitive' },
            },
          });

          if (category) {
            return { id: category.id, name: category.name };
          }

          // If category doesn't exist, return the suggested name without ID
          return { id: '', name: rule.categoryName };
        } catch (error) {
          this.logger.error(`Failed to find category: ${error.message}`);
        }
      }
    }

    return null;
  }

  private extractMerchantFromDescription(description: string): string | undefined {
    // Extract merchant names from common bank statement patterns
    const merchantPatterns = [
      /BELANJA\s+(.+)/i,
      /BAYAR\s+(.+)/i,
      /TRANSFER\s+KE\s+(.+)/i,
      /TRF\s+DARI\s+(.+)/i,
    ];

    for (const pattern of merchantPatterns) {
      const match = description.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return undefined;
  }

  private calculateSuggestionConfidence(extractedData: ExtractedData): number {
    let confidence = 0.5; // Base confidence

    // Merchant confidence
    if (extractedData.merchant && extractedData.merchant.confidence > 0.7) {
      confidence += 0.2;
    }

    // Amount confidence
    if (extractedData.amount && extractedData.amount.confidence > 0.8) {
      confidence += 0.2;
    }

    // Date confidence
    if (extractedData.date && extractedData.date.confidence > 0.8) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  private generateSuggestionId(): string {
    return `suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
