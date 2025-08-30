/**
 * Data Import System
 * Comprehensive data import functionality for financial data
 */

// Core Components
export { DataImportWizard } from './data-import-wizard';
export { FileUploadStep } from './file-upload-step';
export { DataMappingStep } from './data-mapping-step';
export { DataPreviewStep } from './data-preview-step';
export { ConfirmationStep } from './confirmation-step';
export { DataImportDemo } from './data-import-demo';

// Utilities
export {
  parseFile,
  parseCSV,
  parseJSON,
  parseOFX,
  parseQIF,
  convertToTransactions,
  autoDetectMapping,
  detectFileFormat,
  validateFile,
} from './utils';

// Types
export type {
  ImportWizardState,
  ImportedTransaction,
  ImportMapping,
  FileParseResult,
  SupportedFileFormat,
  ImportProgress,
  DataImportConfig,
  ImportPreset,
  ValidationRule,
  ImportSummary,
  ParsedCSVRow,
  ParsedJSONData,
  OFXTransaction,
  QIFTransaction,
} from './types';

// Import the type for internal use
import type { SupportedFileFormat } from './types';

// Default Configuration
export const DEFAULT_IMPORT_CONFIG = {
  allowedFormats: [
    'csv',
    'json',
    'ofx',
    'qif',
    'xlsx',
    'mint',
    'ynab',
    'quicken',
  ] as SupportedFileFormat[],
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxRows: 10000,
  requireMapping: true,
  autoDetectFormat: true,
  validateData: true,
  duplicateHandling: 'skip' as const,
};
