/**
 * Data Import Types
 * TypeScript interfaces and types for the data import system
 */

export interface ImportWizardState {
  currentStep: number;
  totalSteps: number;
  file: File | null;
  fileFormat: SupportedFileFormat | null;
  parsedData: any[];
  mappedData: ImportedTransaction[];
  mapping: ImportMapping;
  progress: ImportProgress;
  errors: string[];
  warnings: string[];
}

export interface ImportedTransaction {
  id?: string;
  date: string;
  description: string;
  amount: number;
  category?: string;
  account?: string;
  type: 'income' | 'expense' | 'transfer';
  notes?: string;
  tags?: string[];
  location?: string;
  originalData?: any;
}

export interface ImportMapping {
  date: string;
  description: string;
  amount: string;
  category?: string;
  account?: string;
  type?: string;
  notes?: string;
  tags?: string;
  location?: string;
}

export interface FileParseResult {
  success: boolean;
  data: any[];
  headers?: string[];
  rowCount: number;
  errors: string[];
  warnings: string[];
  format: SupportedFileFormat;
}

export type SupportedFileFormat =
  | 'csv'
  | 'json'
  | 'ofx'
  | 'qif'
  | 'xlsx'
  | 'mint'
  | 'ynab'
  | 'quicken'
  | 'personal-capital'
  | 'tiller';

export interface ImportProgress {
  stage:
    | 'uploading'
    | 'parsing'
    | 'mapping'
    | 'validating'
    | 'importing'
    | 'complete';
  percentage: number;
  processedRows: number;
  totalRows: number;
  currentOperation: string;
  estimatedTimeRemaining?: number;
}

export interface DataImportConfig {
  allowedFormats: SupportedFileFormat[];
  maxFileSize: number; // in bytes
  maxRows: number;
  requireMapping: boolean;
  autoDetectFormat: boolean;
  validateData: boolean;
  duplicateHandling: 'skip' | 'merge' | 'import';
}

export interface ImportPreset {
  id: string;
  name: string;
  description: string;
  format: SupportedFileFormat;
  mapping: ImportMapping;
  dateFormat?: string;
  amountFormat?: 'positive-negative' | 'separate-columns' | 'credit-debit';
  categoryMapping?: Record<string, string>;
  icon?: string;
}

export interface ValidationRule {
  field: keyof ImportedTransaction;
  required: boolean;
  type: 'string' | 'number' | 'date' | 'email' | 'url';
  pattern?: RegExp;
  min?: number;
  max?: number;
  customValidator?: (value: any) => boolean | string;
}

export interface ImportSummary {
  totalRows: number;
  successfulImports: number;
  skippedRows: number;
  errorRows: number;
  duplicatesFound: number;
  categoriesCreated: string[];
  accountsCreated: string[];
  dateRange: {
    start: string;
    end: string;
  };
  totalAmount: {
    income: number;
    expenses: number;
    net: number;
  };
}

export interface ParsedCSVRow {
  [key: string]: string;
}

export interface ParsedJSONData {
  transactions?: any[];
  accounts?: any[];
  categories?: any[];
  [key: string]: any;
}

export interface OFXTransaction {
  DTPOSTED: string;
  TRNAMT: string;
  FITID: string;
  NAME?: string;
  MEMO?: string;
  TRNTYPE?: string;
}

export interface QIFTransaction {
  date: string;
  amount: string;
  payee?: string;
  memo?: string;
  category?: string;
  cleared?: string;
}
