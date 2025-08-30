/**
 * File Upload Step
 * First step of the import wizard - handles file selection and format detection
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  PermoneyCard,
  PermoneyCardContent,
  Button,
  Badge,
  Progress,
} from '../index';
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  X,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SupportedFileFormat } from './types';

interface FileUploadStepProps {
  onFileSelect: (file: File, format: SupportedFileFormat) => void;
  maxFileSize?: number;
  allowedFormats?: SupportedFileFormat[];
  className?: string;
}

const FILE_FORMAT_INFO: Record<
  SupportedFileFormat,
  {
    name: string;
    description: string;
    extensions: string[];
    icon: string;
    popular: boolean;
  }
> = {
  csv: {
    name: 'CSV',
    description: 'Comma-separated values file',
    extensions: ['.csv'],
    icon: '📊',
    popular: true,
  },
  json: {
    name: 'JSON',
    description: 'JavaScript Object Notation',
    extensions: ['.json'],
    icon: '📄',
    popular: false,
  },
  ofx: {
    name: 'OFX',
    description: 'Open Financial Exchange',
    extensions: ['.ofx', '.qfx'],
    icon: '🏦',
    popular: true,
  },
  qif: {
    name: 'QIF',
    description: 'Quicken Interchange Format',
    extensions: ['.qif'],
    icon: '💰',
    popular: true,
  },
  xlsx: {
    name: 'Excel',
    description: 'Microsoft Excel spreadsheet',
    extensions: ['.xlsx', '.xls'],
    icon: '📈',
    popular: true,
  },
  mint: {
    name: 'Mint',
    description: 'Mint.com export file',
    extensions: ['.csv'],
    icon: '🌿',
    popular: true,
  },
  ynab: {
    name: 'YNAB',
    description: 'You Need A Budget export',
    extensions: ['.csv'],
    icon: '💡',
    popular: true,
  },
  quicken: {
    name: 'Quicken',
    description: 'Quicken export file',
    extensions: ['.qif', '.csv'],
    icon: '🔢',
    popular: true,
  },
  'personal-capital': {
    name: 'Personal Capital',
    description: 'Personal Capital export',
    extensions: ['.csv'],
    icon: '💼',
    popular: false,
  },
  tiller: {
    name: 'Tiller',
    description: 'Tiller spreadsheet export',
    extensions: ['.csv', '.xlsx'],
    icon: '🌱',
    popular: false,
  },
};

export function FileUploadStep({
  onFileSelect,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  allowedFormats = [
    'csv',
    'json',
    'ofx',
    'qif',
    'xlsx',
    'mint',
    'ynab',
    'quicken',
  ],
  className,
}: FileUploadStepProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const detectFileFormat = useCallback(
    (file: File): SupportedFileFormat | null => {
      const extension = file.name.toLowerCase().split('.').pop();

      // Check for specific app exports based on filename patterns
      const fileName = file.name.toLowerCase();
      if (fileName.includes('mint')) return 'mint';
      if (fileName.includes('ynab')) return 'ynab';
      if (fileName.includes('quicken')) return 'quicken';
      if (
        fileName.includes('personal-capital') ||
        fileName.includes('personalcapital')
      )
        return 'personal-capital';
      if (fileName.includes('tiller')) return 'tiller';

      // Check by extension
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
          return null;
      }
    },
    []
  );

  const validateFile = useCallback(
    (file: File): string | null => {
      if (file.size > maxFileSize) {
        return `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds maximum allowed size (${(maxFileSize / 1024 / 1024).toFixed(1)}MB)`;
      }

      const format = detectFileFormat(file);
      if (!format || !allowedFormats.includes(format)) {
        return 'Unsupported file format. Please select a supported file type.';
      }

      return null;
    },
    [maxFileSize, allowedFormats, detectFileFormat]
  );

  const handleFileSelect = useCallback(
    (file: File) => {
      setError(null);

      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      const format = detectFileFormat(file)!;
      setSelectedFile(file);

      // Simulate upload progress
      setUploadProgress(0);
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            onFileSelect(file, format);
            return 100;
          }
          return prev + 10;
        });
      }, 100);
    },
    [validateFile, detectFileFormat, onFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect]
  );

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedFile(null);
    setUploadProgress(0);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const popularFormats = allowedFormats.filter(
    format => FILE_FORMAT_INFO[format]?.popular
  );
  const otherFormats = allowedFormats.filter(
    format => !FILE_FORMAT_INFO[format]?.popular
  );

  return (
    <div className={cn('space-y-6', className)}>
      {/* File Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
          isDragOver
            ? 'border-neon-green bg-neon-green/5'
            : 'border-border hover:border-neon-green/50',
          selectedFile && 'border-neon-green bg-neon-green/5'
        )}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={allowedFormats
            .flatMap(format => FILE_FORMAT_INFO[format]?.extensions || [])
            .join(',')}
          onChange={handleFileInputChange}
        />

        {selectedFile ? (
          <div className="space-y-4">
            <CheckCircle className="h-12 w-12 text-neon-green mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                File Selected
              </h3>
              <p className="text-muted-foreground">
                {selectedFile.name} (
                {(selectedFile.size / 1024 / 1024).toFixed(1)}MB)
              </p>
            </div>

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="max-w-xs mx-auto">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-sm text-muted-foreground mt-2">
                  Processing... {uploadProgress}%
                </p>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={e => {
                e.stopPropagation();
                clearSelection();
              }}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Clear
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Drop your file here
              </h3>
              <p className="text-muted-foreground">
                or click to browse your computer
              </p>
            </div>
            <Button className="bg-neon-green hover:bg-neon-green/90 text-white">
              Choose File
            </Button>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <PermoneyCard className="border-red-500/50 bg-red-500/5">
          <PermoneyCardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </PermoneyCardContent>
        </PermoneyCard>
      )}

      {/* Supported Formats */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-foreground">
          Popular Formats
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {popularFormats.map(format => {
            const info = FILE_FORMAT_INFO[format];
            return (
              <div
                key={format}
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-neon-green/50 transition-colors"
              >
                <span className="text-2xl">{info.icon}</span>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {info.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {info.extensions.join(', ')}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {otherFormats.length > 0 && (
          <>
            <h4 className="text-sm font-semibold text-foreground">
              Other Supported Formats
            </h4>
            <div className="flex flex-wrap gap-2">
              {otherFormats.map(format => {
                const info = FILE_FORMAT_INFO[format];
                return (
                  <Badge key={format} variant="secondary" className="text-xs">
                    {info.icon} {info.name}
                  </Badge>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Sample Files */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground">
          Need a sample file?
        </h4>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download CSV Template
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download Sample Data
          </Button>
        </div>
      </div>
    </div>
  );
}
