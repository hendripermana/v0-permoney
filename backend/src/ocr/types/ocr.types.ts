export interface OCRResult {
  id: string;
  documentType: DocumentType;
  confidence: number;
  extractedData: ExtractedData;
  rawText: string;
  processedAt: Date;
  metadata: OCRMetadata;
}

export interface ExtractedData {
  merchant?: MerchantInfo;
  amount?: AmountInfo;
  date?: DateInfo;
  items?: LineItem[];
  transactionInfo?: TransactionInfo;
  bankStatementInfo?: BankStatementInfo;
}

export interface MerchantInfo {
  name: string;
  address?: string;
  phone?: string;
  confidence: number;
}

export interface AmountInfo {
  total: number;
  currency: string;
  subtotal?: number;
  tax?: number;
  tip?: number;
  confidence: number;
}

export interface DateInfo {
  date: Date;
  confidence: number;
}

export interface LineItem {
  description: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice: number;
  confidence: number;
}

export interface TransactionInfo {
  type: 'DEBIT' | 'CREDIT';
  reference?: string;
  description?: string;
}

export interface BankStatementInfo {
  accountNumber: string;
  bankName: string;
  statementPeriod: {
    startDate: Date;
    endDate: Date;
  };
  transactions: BankStatementTransaction[];
}

export interface BankStatementTransaction {
  date: Date;
  description: string;
  amount: number;
  balance?: number;
  type: 'DEBIT' | 'CREDIT';
  reference?: string;
}

export interface OCRMetadata {
  processingTime: number;
  ocrEngine: string;
  imageQuality?: number;
  documentFormat: string;
  pageCount?: number;
}

export interface TransactionSuggestion {
  id: string;
  description: string;
  amount: number;
  currency: string;
  date: Date;
  merchant?: string;
  suggestedCategoryId?: string;
  suggestedCategoryName?: string;
  confidence: number;
  source: 'RECEIPT' | 'BANK_STATEMENT';
  metadata: {
    ocrResultId: string;
    originalText?: string;
    lineItemIndex?: number;
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: CorrectionSuggestion[];
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'ERROR' | 'WARNING';
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

export interface CorrectionSuggestion {
  field: string;
  originalValue: any;
  suggestedValue: any;
  reason: string;
  confidence: number;
}

export enum DocumentType {
  RECEIPT = 'RECEIPT',
  BANK_STATEMENT = 'BANK_STATEMENT',
  INVOICE = 'INVOICE',
  OTHER = 'OTHER',
}

export enum ProcessingStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REQUIRES_REVIEW = 'REQUIRES_REVIEW',
}

export interface DocumentUpload {
  id: string;
  householdId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  documentType: DocumentType;
  status: ProcessingStatus;
  uploadedBy: string;
  uploadedAt: Date;
  processedAt?: Date;
  storageUrl: string;
  ocrResult?: OCRResult;
  transactionSuggestions?: TransactionSuggestion[];
  validationResult?: ValidationResult;
}
