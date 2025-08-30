/**
 * Data Import Utilities
 * Helper functions for parsing and processing import files
 */

import type {
  FileParseResult,
  SupportedFileFormat,
  ImportedTransaction,
  ParsedCSVRow,
  ParsedJSONData,
  OFXTransaction,
  QIFTransaction,
  ImportMapping,
} from './types';

/**
 * Detect file format based on file extension and content
 */
export function detectFileFormat(file: File): SupportedFileFormat {
  const extension = file.name.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'csv':
      return 'csv';
    case 'json':
      return 'json';
    case 'ofx':
    case 'qfx':
      return 'ofx';
    case 'qif':
      return 'qif';
    case 'xlsx':
    case 'xls':
      return 'xlsx';
    default:
      // Try to detect based on filename patterns
      const filename = file.name.toLowerCase();
      if (filename.includes('mint')) return 'mint';
      if (filename.includes('ynab')) return 'ynab';
      if (filename.includes('quicken')) return 'quicken';
      if (filename.includes('personal-capital')) return 'personal-capital';
      if (filename.includes('tiller')) return 'tiller';

      return 'csv'; // Default fallback
  }
}

/**
 * Parse CSV file content
 */
export async function parseCSV(file: File): Promise<FileParseResult> {
  try {
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());

    if (lines.length === 0) {
      return {
        success: false,
        data: [],
        rowCount: 0,
        errors: ['File is empty'],
        warnings: [],
        format: 'csv',
      };
    }

    // Parse headers
    const headers = parseCSVLine(lines[0]);
    const data: ParsedCSVRow[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = parseCSVLine(lines[i]);
        if (values.length !== headers.length) {
          warnings.push(
            `Row ${i + 1}: Column count mismatch (expected ${headers.length}, got ${values.length})`
          );
        }

        const row: ParsedCSVRow = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        data.push(row);
      } catch (error) {
        errors.push(
          `Row ${i + 1}: ${error instanceof Error ? error.message : 'Parse error'}`
        );
      }
    }

    return {
      success: true,
      data,
      headers,
      rowCount: data.length,
      errors,
      warnings,
      format: 'csv',
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      rowCount: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      warnings: [],
      format: 'csv',
    };
  }
}

/**
 * Parse JSON file content
 */
export async function parseJSON(file: File): Promise<FileParseResult> {
  try {
    const text = await file.text();
    const jsonData = JSON.parse(text) as ParsedJSONData;

    let data: any[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    // Handle different JSON structures
    if (Array.isArray(jsonData)) {
      data = jsonData;
    } else if (jsonData.transactions && Array.isArray(jsonData.transactions)) {
      data = jsonData.transactions;
    } else if (jsonData.data && Array.isArray(jsonData.data)) {
      data = jsonData.data;
    } else {
      // Try to find any array property
      const arrayProps = Object.keys(jsonData).filter(key =>
        Array.isArray(jsonData[key])
      );
      if (arrayProps.length > 0) {
        data = jsonData[arrayProps[0]];
        warnings.push(`Using '${arrayProps[0]}' property as transaction data`);
      } else {
        errors.push('No transaction array found in JSON file');
      }
    }

    return {
      success: errors.length === 0,
      data,
      rowCount: data.length,
      errors,
      warnings,
      format: 'json',
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      rowCount: 0,
      errors: [error instanceof Error ? error.message : 'Invalid JSON format'],
      warnings: [],
      format: 'json',
    };
  }
}

/**
 * Parse OFX file content (simplified)
 */
export async function parseOFX(file: File): Promise<FileParseResult> {
  try {
    const text = await file.text();
    const data: OFXTransaction[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    // Simple OFX parsing - look for STMTTRN blocks
    const transactionBlocks = text.match(/<STMTTRN>[\s\S]*?<\/STMTTRN>/g) || [];

    transactionBlocks.forEach((block, index) => {
      try {
        const transaction: Partial<OFXTransaction> = {};

        // Extract common fields
        const dtposted = block.match(/<DTPOSTED>([^<]+)/)?.[1];
        const trnamt = block.match(/<TRNAMT>([^<]+)/)?.[1];
        const fitid = block.match(/<FITID>([^<]+)/)?.[1];
        const name = block.match(/<NAME>([^<]+)/)?.[1];
        const memo = block.match(/<MEMO>([^<]+)/)?.[1];
        const trntype = block.match(/<TRNTYPE>([^<]+)/)?.[1];

        if (dtposted) transaction.DTPOSTED = dtposted;
        if (trnamt) transaction.TRNAMT = trnamt;
        if (fitid) transaction.FITID = fitid;
        if (name) transaction.NAME = name;
        if (memo) transaction.MEMO = memo;
        if (trntype) transaction.TRNTYPE = trntype;

        data.push(transaction as OFXTransaction);
      } catch (error) {
        errors.push(
          `Transaction ${index + 1}: ${error instanceof Error ? error.message : 'Parse error'}`
        );
      }
    });

    if (transactionBlocks.length === 0) {
      warnings.push('No transaction blocks found in OFX file');
    }

    return {
      success: true,
      data,
      rowCount: data.length,
      errors,
      warnings,
      format: 'ofx',
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      rowCount: 0,
      errors: [error instanceof Error ? error.message : 'OFX parse error'],
      warnings: [],
      format: 'ofx',
    };
  }
}

/**
 * Parse QIF file content (simplified)
 */
export async function parseQIF(file: File): Promise<FileParseResult> {
  try {
    const text = await file.text();
    const lines = text.split('\n');
    const data: QIFTransaction[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    let currentTransaction: Partial<QIFTransaction> = {};

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;

      const code = trimmedLine.charAt(0);
      const value = trimmedLine.substring(1);

      switch (code) {
        case 'D': // Date
          currentTransaction.date = value;
          break;
        case 'T': // Amount
          currentTransaction.amount = value;
          break;
        case 'P': // Payee
          currentTransaction.payee = value;
          break;
        case 'M': // Memo
          currentTransaction.memo = value;
          break;
        case 'L': // Category
          currentTransaction.category = value;
          break;
        case 'C': // Cleared status
          currentTransaction.cleared = value;
          break;
        case '^': // End of transaction
          if (currentTransaction.date && currentTransaction.amount) {
            data.push(currentTransaction as QIFTransaction);
          } else {
            warnings.push(
              `Transaction at line ${index + 1}: Missing required fields`
            );
          }
          currentTransaction = {};
          break;
        default:
          // Ignore unknown codes
          break;
      }
    });

    // Handle last transaction if file doesn't end with ^
    if (Object.keys(currentTransaction).length > 0) {
      if (currentTransaction.date && currentTransaction.amount) {
        data.push(currentTransaction as QIFTransaction);
      }
    }

    return {
      success: true,
      data,
      rowCount: data.length,
      errors,
      warnings,
      format: 'qif',
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      rowCount: 0,
      errors: [error instanceof Error ? error.message : 'QIF parse error'],
      warnings: [],
      format: 'qif',
    };
  }
}

/**
 * Parse file based on detected format
 */
export async function parseFile(file: File): Promise<FileParseResult> {
  const format = detectFileFormat(file);

  switch (format) {
    case 'csv':
    case 'mint':
    case 'ynab':
    case 'quicken':
    case 'personal-capital':
    case 'tiller':
      return parseCSV(file);
    case 'json':
      return parseJSON(file);
    case 'ofx':
      return parseOFX(file);
    case 'qif':
      return parseQIF(file);
    case 'xlsx':
      // For now, treat Excel files as CSV (would need additional library for full support)
      return {
        success: false,
        data: [],
        rowCount: 0,
        errors: ['Excel files not yet supported. Please export as CSV.'],
        warnings: [],
        format: 'xlsx',
      };
    default:
      return {
        success: false,
        data: [],
        rowCount: 0,
        errors: [`Unsupported file format: ${format}`],
        warnings: [],
        format,
      };
  }
}

/**
 * Convert parsed data to ImportedTransaction format
 */
export function convertToTransactions(
  data: any[],
  mapping: ImportMapping,
  format: SupportedFileFormat
): ImportedTransaction[] {
  return data.map((row, index) => {
    const transaction: Partial<ImportedTransaction> = {
      id: `import_${index}`,
    };

    // Map fields based on format
    if (format === 'ofx') {
      const ofxRow = row as OFXTransaction;
      transaction.date = formatOFXDate(ofxRow.DTPOSTED);
      transaction.amount = parseFloat(ofxRow.TRNAMT);
      transaction.description = ofxRow.NAME || ofxRow.MEMO || 'Unknown';
      transaction.type = parseFloat(ofxRow.TRNAMT) >= 0 ? 'income' : 'expense';
    } else if (format === 'qif') {
      const qifRow = row as QIFTransaction;
      transaction.date = qifRow.date;
      transaction.amount = parseFloat(qifRow.amount || '0');
      transaction.description = qifRow.payee || qifRow.memo || 'Unknown';
      transaction.category = qifRow.category;
      transaction.type =
        parseFloat(qifRow.amount || '0') >= 0 ? 'income' : 'expense';
    } else {
      // CSV/JSON format using mapping
      if (mapping.date && row[mapping.date]) {
        transaction.date = row[mapping.date];
      }
      if (mapping.description && row[mapping.description]) {
        transaction.description = row[mapping.description];
      }
      if (mapping.amount && row[mapping.amount]) {
        transaction.amount = parseFloat(row[mapping.amount]) || 0;
      }
      if (mapping.category && row[mapping.category]) {
        transaction.category = row[mapping.category];
      }
      if (mapping.account && row[mapping.account]) {
        transaction.account = row[mapping.account];
      }
      if (mapping.type && row[mapping.type]) {
        transaction.type = normalizeTransactionType(row[mapping.type]);
      } else {
        // Infer type from amount
        transaction.type =
          (transaction.amount || 0) >= 0 ? 'income' : 'expense';
      }
      if (mapping.notes && row[mapping.notes]) {
        transaction.notes = row[mapping.notes];
      }
      if (mapping.tags && row[mapping.tags]) {
        transaction.tags = row[mapping.tags]
          .split(',')
          .map((tag: string) => tag.trim());
      }
      if (mapping.location && row[mapping.location]) {
        transaction.location = row[mapping.location];
      }
    }

    // Store original data for reference
    transaction.originalData = row;

    return transaction as ImportedTransaction;
  });
}

/**
 * Auto-detect field mapping based on column headers
 */
export function autoDetectMapping(headers: string[]): Partial<ImportMapping> {
  const mapping: Partial<ImportMapping> = {};

  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());

  // Date field detection
  const datePatterns = [
    'date',
    'transaction date',
    'posted date',
    'trans date',
    'dt',
  ];
  const dateHeader = normalizedHeaders.find(h =>
    datePatterns.some(pattern => h.includes(pattern))
  );
  if (dateHeader) {
    mapping.date = headers[normalizedHeaders.indexOf(dateHeader)];
  }

  // Description field detection
  const descPatterns = [
    'description',
    'memo',
    'payee',
    'merchant',
    'name',
    'details',
  ];
  const descHeader = normalizedHeaders.find(h =>
    descPatterns.some(pattern => h.includes(pattern))
  );
  if (descHeader) {
    mapping.description = headers[normalizedHeaders.indexOf(descHeader)];
  }

  // Amount field detection
  const amountPatterns = [
    'amount',
    'total',
    'value',
    'sum',
    'transaction amount',
  ];
  const amountHeader = normalizedHeaders.find(h =>
    amountPatterns.some(pattern => h.includes(pattern))
  );
  if (amountHeader) {
    mapping.amount = headers[normalizedHeaders.indexOf(amountHeader)];
  }

  // Category field detection
  const categoryPatterns = ['category', 'type', 'class', 'group'];
  const categoryHeader = normalizedHeaders.find(h =>
    categoryPatterns.some(pattern => h.includes(pattern))
  );
  if (categoryHeader) {
    mapping.category = headers[normalizedHeaders.indexOf(categoryHeader)];
  }

  // Account field detection
  const accountPatterns = ['account', 'bank', 'source'];
  const accountHeader = normalizedHeaders.find(h =>
    accountPatterns.some(pattern => h.includes(pattern))
  );
  if (accountHeader) {
    mapping.account = headers[normalizedHeaders.indexOf(accountHeader)];
  }

  return mapping;
}

/**
 * Validate file before processing
 */
export function validateFile(file: File): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check file size (10MB limit)
  if (file.size > 10 * 1024 * 1024) {
    errors.push('File size exceeds 10MB limit');
  }

  // Check file type
  const allowedTypes = [
    'text/csv',
    'application/json',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
  ];

  if (
    !allowedTypes.includes(file.type) &&
    !file.name.match(/\.(csv|json|ofx|qif|xlsx|xls)$/i)
  ) {
    errors.push(
      'Unsupported file type. Please use CSV, JSON, OFX, QIF, or Excel files.'
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Helper functions

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function formatOFXDate(dateString: string): string {
  // OFX dates are typically in YYYYMMDD format
  if (dateString.length === 8) {
    const year = dateString.substring(0, 4);
    const month = dateString.substring(4, 6);
    const day = dateString.substring(6, 8);
    return `${year}-${month}-${day}`;
  }
  return dateString;
}

function normalizeTransactionType(
  type: string
): 'income' | 'expense' | 'transfer' {
  const normalized = type.toLowerCase().trim();

  if (
    normalized.includes('income') ||
    normalized.includes('deposit') ||
    normalized.includes('credit')
  ) {
    return 'income';
  }
  if (
    normalized.includes('expense') ||
    normalized.includes('debit') ||
    normalized.includes('withdrawal')
  ) {
    return 'expense';
  }
  if (normalized.includes('transfer')) {
    return 'transfer';
  }

  return 'expense'; // Default
}
