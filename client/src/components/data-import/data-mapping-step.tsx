/**
 * Data Mapping Step
 * Second step of the import wizard - maps file columns to transaction fields
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  PermoneyCard,
  PermoneyCardHeader,
  PermoneyCardTitle,
  PermoneyCardContent,
  Button,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../index';
import {
  MapPin,
  CheckCircle,
  AlertTriangle,
  Eye,
  RotateCcw,
  Wand2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ImportMapping, ParsedCSVRow } from './types';

interface DataMappingStepProps {
  headers: string[];
  sampleData: ParsedCSVRow[];
  onMappingComplete: (mapping: ImportMapping) => void;
  initialMapping?: Partial<ImportMapping>;
  className?: string;
}

const REQUIRED_FIELDS = [
  {
    key: 'date' as keyof ImportMapping,
    label: 'Date',
    description: 'Transaction date',
    required: true,
    examples: ['2024-01-15', '01/15/2024', '15-Jan-2024'],
  },
  {
    key: 'description' as keyof ImportMapping,
    label: 'Description',
    description: 'Transaction description or payee',
    required: true,
    examples: ['Starbucks Coffee', 'Salary Deposit', 'Grocery Store'],
  },
  {
    key: 'amount' as keyof ImportMapping,
    label: 'Amount',
    description: 'Transaction amount',
    required: true,
    examples: ['-25.50', '1500.00', '$45.99'],
  },
];

const OPTIONAL_FIELDS = [
  {
    key: 'category' as keyof ImportMapping,
    label: 'Category',
    description: 'Transaction category',
    required: false,
    examples: ['Food & Dining', 'Income', 'Transportation'],
  },
  {
    key: 'account' as keyof ImportMapping,
    label: 'Account',
    description: 'Account name or type',
    required: false,
    examples: ['Checking Account', 'Credit Card', 'Savings'],
  },
  {
    key: 'type' as keyof ImportMapping,
    label: 'Type',
    description: 'Transaction type',
    required: false,
    examples: ['expense', 'income', 'transfer'],
  },
  {
    key: 'notes' as keyof ImportMapping,
    label: 'Notes',
    description: 'Additional notes or memo',
    required: false,
    examples: ['Business expense', 'Monthly salary', 'Gift'],
  },
  {
    key: 'tags' as keyof ImportMapping,
    label: 'Tags',
    description: 'Transaction tags',
    required: false,
    examples: ['work', 'personal', 'vacation'],
  },
  {
    key: 'location' as keyof ImportMapping,
    label: 'Location',
    description: 'Transaction location',
    required: false,
    examples: ['New York, NY', 'Online', 'ATM'],
  },
];

const ALL_FIELDS = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS];

export function DataMappingStep({
  headers,
  sampleData,
  onMappingComplete,
  initialMapping = {},
  className,
}: DataMappingStepProps) {
  const [mapping, setMapping] = useState<ImportMapping>({
    date: initialMapping.date || '',
    description: initialMapping.description || '',
    amount: initialMapping.amount || '',
    category: initialMapping.category || '',
    account: initialMapping.account || '',
    type: initialMapping.type || '',
    notes: initialMapping.notes || '',
    tags: initialMapping.tags || '',
    location: initialMapping.location || '',
  });

  const [showPreview, setShowPreview] = useState(false);

  // Auto-detect mapping based on common column names
  const autoDetectMapping = useCallback(() => {
    const newMapping: ImportMapping = { ...mapping };

    headers.forEach(header => {
      const lowerHeader = header.toLowerCase().trim();

      // Date detection
      if (
        !newMapping.date &&
        (lowerHeader.includes('date') ||
          lowerHeader.includes('time') ||
          lowerHeader === 'when')
      ) {
        newMapping.date = header;
      }

      // Description detection
      if (
        !newMapping.description &&
        (lowerHeader.includes('description') ||
          lowerHeader.includes('payee') ||
          lowerHeader.includes('merchant') ||
          lowerHeader.includes('name') ||
          lowerHeader === 'memo')
      ) {
        newMapping.description = header;
      }

      // Amount detection
      if (
        !newMapping.amount &&
        (lowerHeader.includes('amount') ||
          lowerHeader.includes('value') ||
          lowerHeader.includes('total') ||
          lowerHeader === 'sum')
      ) {
        newMapping.amount = header;
      }

      // Category detection
      if (
        !newMapping.category &&
        (lowerHeader.includes('category') ||
          lowerHeader.includes('type') ||
          lowerHeader.includes('class'))
      ) {
        newMapping.category = header;
      }

      // Account detection
      if (
        !newMapping.account &&
        (lowerHeader.includes('account') ||
          lowerHeader.includes('bank') ||
          lowerHeader.includes('card'))
      ) {
        newMapping.account = header;
      }

      // Notes detection
      if (
        !newMapping.notes &&
        (lowerHeader.includes('note') ||
          lowerHeader.includes('memo') ||
          lowerHeader.includes('comment'))
      ) {
        newMapping.notes = header;
      }

      // Tags detection
      if (
        !newMapping.tags &&
        (lowerHeader.includes('tag') || lowerHeader.includes('label'))
      ) {
        newMapping.tags = header;
      }

      // Location detection
      if (
        !newMapping.location &&
        (lowerHeader.includes('location') ||
          lowerHeader.includes('place') ||
          lowerHeader.includes('address'))
      ) {
        newMapping.location = header;
      }
    });

    setMapping(newMapping);
  }, [headers, mapping]);

  // Auto-detect on mount
  useEffect(() => {
    if (
      headers.length > 0 &&
      !mapping.date &&
      !mapping.description &&
      !mapping.amount
    ) {
      autoDetectMapping();
    }
  }, [
    headers,
    mapping.date,
    mapping.description,
    mapping.amount,
    autoDetectMapping,
  ]);

  const updateMapping = useCallback(
    (field: keyof ImportMapping, value: string) => {
      setMapping(prev => ({ ...prev, [field]: value }));
    },
    []
  );

  const resetMapping = useCallback(() => {
    setMapping({
      date: '',
      description: '',
      amount: '',
      category: '',
      account: '',
      type: '',
      notes: '',
      tags: '',
      location: '',
    });
  }, []);

  const isValidMapping = useCallback(() => {
    return REQUIRED_FIELDS.every(field => mapping[field.key]);
  }, [mapping]);

  const handleComplete = useCallback(() => {
    if (isValidMapping()) {
      onMappingComplete(mapping);
    }
  }, [mapping, isValidMapping, onMappingComplete]);

  const getUsedHeaders = useCallback(() => {
    return Object.values(mapping).filter(Boolean);
  }, [mapping]);

  const getAvailableHeaders = useCallback(
    (currentField?: string) => {
      const used = getUsedHeaders();
      return headers.filter(
        header => !used.includes(header) || header === currentField
      );
    },
    [headers, getUsedHeaders]
  );

  const getSampleValue = useCallback(
    (header: string) => {
      if (!header || sampleData.length === 0) return '';
      return sampleData[0][header] || '';
    },
    [sampleData]
  );

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Map Your Data
          </h3>
          <p className="text-sm text-muted-foreground">
            Match your file columns to the required transaction fields
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={autoDetectMapping}
            className="flex items-center gap-2"
          >
            <Wand2 className="h-4 w-4" />
            Auto-detect
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={resetMapping}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            {showPreview ? 'Hide' : 'Show'} Preview
          </Button>
        </div>
      </div>

      {/* Required Fields */}
      <PermoneyCard className="glassmorphism">
        <PermoneyCardHeader>
          <PermoneyCardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Required Fields
          </PermoneyCardTitle>
        </PermoneyCardHeader>
        <PermoneyCardContent className="space-y-4">
          {REQUIRED_FIELDS.map(field => {
            const currentValue = mapping[field.key];
            const availableHeaders = getAvailableHeaders(currentValue);
            const sampleValue = getSampleValue(currentValue || '');

            return (
              <div key={field.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-foreground">
                      {field.label} *
                    </label>
                    <p className="text-xs text-muted-foreground">
                      {field.description}
                    </p>
                  </div>
                  {currentValue && (
                    <Badge variant="secondary" className="text-xs">
                      Mapped
                    </Badge>
                  )}
                </div>

                <Select
                  value={currentValue || ''}
                  onValueChange={value => updateMapping(field.key, value || '')}
                >
                  <SelectTrigger
                    className={cn(
                      'w-full',
                      !currentValue && 'border-orange-500/50'
                    )}
                  >
                    <SelectValue
                      placeholder={`Select column for ${field.label.toLowerCase()}`}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">-- Not mapped --</SelectItem>
                    {availableHeaders.map(header => (
                      <SelectItem key={header} value={header}>
                        {header}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {sampleValue && (
                  <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                    Sample: {sampleValue}
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  Examples: {field.examples.join(', ')}
                </div>
              </div>
            );
          })}
        </PermoneyCardContent>
      </PermoneyCard>

      {/* Optional Fields */}
      <PermoneyCard className="glassmorphism">
        <PermoneyCardHeader>
          <PermoneyCardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-neon-green" />
            Optional Fields
          </PermoneyCardTitle>
        </PermoneyCardHeader>
        <PermoneyCardContent className="space-y-4">
          {OPTIONAL_FIELDS.map(field => {
            const currentValue = mapping[field.key];
            const availableHeaders = getAvailableHeaders(currentValue);
            const sampleValue = getSampleValue(currentValue || '');

            return (
              <div key={field.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-foreground">
                      {field.label}
                    </label>
                    <p className="text-xs text-muted-foreground">
                      {field.description}
                    </p>
                  </div>
                  {currentValue && (
                    <Badge variant="secondary" className="text-xs">
                      Mapped
                    </Badge>
                  )}
                </div>

                <Select
                  value={currentValue || ''}
                  onValueChange={value => updateMapping(field.key, value || '')}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={`Select column for ${field.label.toLowerCase()}`}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">-- Not mapped --</SelectItem>
                    {availableHeaders.map(header => (
                      <SelectItem key={header} value={header}>
                        {header}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {sampleValue && (
                  <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                    Sample: {sampleValue}
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  Examples: {field.examples.join(', ')}
                </div>
              </div>
            );
          })}
        </PermoneyCardContent>
      </PermoneyCard>

      {/* Preview */}
      {showPreview && sampleData.length > 0 && (
        <PermoneyCard className="glassmorphism">
          <PermoneyCardHeader>
            <PermoneyCardTitle>Preview Mapped Data</PermoneyCardTitle>
          </PermoneyCardHeader>
          <PermoneyCardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {ALL_FIELDS.filter(field => mapping[field.key]).map(
                      field => (
                        <th
                          key={field.key}
                          className="text-left p-2 font-medium"
                        >
                          {field.label}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {sampleData.slice(0, 3).map((row, index) => (
                    <tr key={index} className="border-b border-border/50">
                      {ALL_FIELDS.filter(field => mapping[field.key]).map(
                        field => (
                          <td
                            key={field.key}
                            className="p-2 text-muted-foreground"
                          >
                            {mapping[field.key]
                              ? row[mapping[field.key] as string] || '--'
                              : '--'}
                          </td>
                        )
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </PermoneyCardContent>
        </PermoneyCard>
      )}

      {/* Validation Status */}
      <div className="flex items-center justify-between p-4 rounded-lg border border-border">
        <div className="flex items-center gap-3">
          {isValidMapping() ? (
            <CheckCircle className="h-5 w-5 text-neon-green" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-orange-500" />
          )}
          <div>
            <p className="text-sm font-medium text-foreground">
              {isValidMapping() ? 'Mapping Complete' : 'Mapping Incomplete'}
            </p>
            <p className="text-xs text-muted-foreground">
              {isValidMapping()
                ? 'All required fields are mapped and ready to proceed'
                : 'Please map all required fields to continue'}
            </p>
          </div>
        </div>

        <Button
          onClick={handleComplete}
          disabled={!isValidMapping()}
          className="bg-neon-green hover:bg-neon-green/90 text-white"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
