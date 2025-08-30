/**
 * Data Import Wizard
 * Multi-step wizard for importing financial data from other apps
 */

import React, { useState, useCallback } from 'react';
import {
  PermoneyCard,
  PermoneyCardHeader,
  PermoneyCardTitle,
  PermoneyCardContent,
  Button,
  Progress,
  Badge,
} from '../index';
import {
  Upload,
  FileText,
  MapPin,
  Eye,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  ImportWizardState,
  SupportedFileFormat,
  ImportedTransaction,
  ImportSummary,
  ImportMapping,
} from './types';
import { FileUploadStep } from './file-upload-step';
import { DataMappingStep } from './data-mapping-step';
import { DataPreviewStep } from './data-preview-step';
import { ConfirmationStep } from './confirmation-step';
import { parseFile, convertToTransactions, autoDetectMapping } from './utils';

interface DataImportWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (summary: ImportSummary) => void;
  className?: string;
}

const STEPS = [
  {
    id: 'upload',
    title: 'Upload File',
    description: 'Select your financial data file',
    icon: Upload,
  },
  {
    id: 'mapping',
    title: 'Map Fields',
    description: 'Match your data columns',
    icon: MapPin,
  },
  {
    id: 'preview',
    title: 'Preview Data',
    description: 'Review imported transactions',
    icon: Eye,
  },
  {
    id: 'confirm',
    title: 'Import',
    description: 'Complete the import process',
    icon: CheckCircle,
  },
];

export function DataImportWizard({
  isOpen,
  onClose,
  onComplete,
  className,
}: DataImportWizardProps) {
  const [wizardState, setWizardState] = useState<ImportWizardState>({
    currentStep: 0,
    totalSteps: STEPS.length,
    file: null,
    fileFormat: null,
    parsedData: [],
    mappedData: [],
    mapping: {
      date: '',
      description: '',
      amount: '',
    },
    progress: {
      stage: 'uploading',
      percentage: 0,
      processedRows: 0,
      totalRows: 0,
      currentOperation: 'Ready to start',
    },
    errors: [],
    warnings: [],
  });

  const updateWizardState = useCallback(
    (updates: Partial<ImportWizardState>) => {
      setWizardState(prev => ({ ...prev, ...updates }));
    },
    []
  );

  const nextStep = useCallback(() => {
    if (wizardState.currentStep < STEPS.length - 1) {
      updateWizardState({ currentStep: wizardState.currentStep + 1 });
    }
  }, [wizardState.currentStep, updateWizardState]);

  const prevStep = useCallback(() => {
    if (wizardState.currentStep > 0) {
      updateWizardState({ currentStep: wizardState.currentStep - 1 });
    }
  }, [wizardState.currentStep, updateWizardState]);

  const handleFileUpload = useCallback(
    async (file: File, format: SupportedFileFormat) => {
      try {
        updateWizardState({
          file,
          fileFormat: format,
          progress: {
            ...wizardState.progress,
            stage: 'parsing',
            currentOperation: 'Parsing file...',
          },
        });

        const parseResult = await parseFile(file);

        if (!parseResult.success) {
          updateWizardState({
            errors: parseResult.errors,
            warnings: parseResult.warnings,
          });
          return;
        }

        // Auto-detect mapping if headers are available
        const autoMapping = parseResult.headers
          ? autoDetectMapping(parseResult.headers)
          : {};

        updateWizardState({
          parsedData: parseResult.data,
          mapping: { ...wizardState.mapping, ...autoMapping },
          errors: parseResult.errors,
          warnings: parseResult.warnings,
          progress: {
            ...wizardState.progress,
            stage: 'mapping',
            currentOperation: 'Ready for mapping',
          },
        });

        nextStep();
      } catch (error) {
        updateWizardState({
          errors: [
            error instanceof Error ? error.message : 'Unknown error occurred',
          ],
        });
      }
    },
    [wizardState.progress, wizardState.mapping, updateWizardState, nextStep]
  );

  const handleMappingComplete = useCallback(
    (mapping: ImportMapping) => {
      try {
        const transactions = convertToTransactions(
          wizardState.parsedData,
          mapping,
          wizardState.fileFormat!
        );

        updateWizardState({
          mapping,
          mappedData: transactions,
          progress: {
            ...wizardState.progress,
            stage: 'validating',
            currentOperation: 'Validating data...',
          },
        });

        nextStep();
      } catch (error) {
        updateWizardState({
          errors: [error instanceof Error ? error.message : 'Mapping failed'],
        });
      }
    },
    [
      wizardState.parsedData,
      wizardState.fileFormat,
      wizardState.progress,
      updateWizardState,
      nextStep,
    ]
  );

  const handlePreviewConfirm = useCallback(
    (selectedTransactions: ImportedTransaction[]) => {
      updateWizardState({
        mappedData: selectedTransactions,
        progress: {
          ...wizardState.progress,
          stage: 'importing',
          currentOperation: 'Ready to import',
        },
      });

      nextStep();
    },
    [wizardState.progress, updateWizardState, nextStep]
  );

  const handleImportComplete = useCallback(
    (summary: ImportSummary) => {
      updateWizardState({
        progress: {
          ...wizardState.progress,
          stage: 'complete',
          percentage: 100,
          currentOperation: 'Import completed',
        },
      });

      onComplete(summary);
    },
    [wizardState.progress, updateWizardState, onComplete]
  );

  const handleStartOver = useCallback(() => {
    setWizardState({
      currentStep: 0,
      totalSteps: STEPS.length,
      file: null,
      fileFormat: null,
      parsedData: [],
      mappedData: [],
      mapping: {
        date: '',
        description: '',
        amount: '',
      },
      progress: {
        stage: 'uploading',
        percentage: 0,
        processedRows: 0,
        totalRows: 0,
        currentOperation: 'Ready to start',
      },
      errors: [],
      warnings: [],
    });
  }, []);

  const currentStep = STEPS[wizardState.currentStep];
  const progressPercentage =
    ((wizardState.currentStep + 1) / STEPS.length) * 100;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          'relative w-full max-w-4xl max-h-[90vh] overflow-hidden',
          className
        )}
      >
        <PermoneyCard className="glassmorphism">
          {/* Header */}
          <PermoneyCardHeader className="border-b border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <PermoneyCardTitle className="text-2xl font-bold text-foreground">
                  Import Financial Data
                </PermoneyCardTitle>
                <p className="text-muted-foreground mt-1">
                  Import your transactions from other personal finance apps
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="hover:bg-accent"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Progress */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">
                  Step {wizardState.currentStep + 1} of {STEPS.length}
                </span>
                <span className="text-sm text-muted-foreground">
                  {Math.round(progressPercentage)}% Complete
                </span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>

            {/* Step Indicators */}
            <div className="flex items-center justify-between mt-4">
              {STEPS.map((step, index) => {
                const isActive = index === wizardState.currentStep;
                const isCompleted = index < wizardState.currentStep;
                const Icon = step.icon;

                return (
                  <div key={step.id} className="flex items-center">
                    <div
                      className={cn(
                        'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors',
                        isActive &&
                          'border-neon-green bg-neon-green/10 text-neon-green',
                        isCompleted &&
                          'border-neon-green bg-neon-green text-white',
                        !isActive &&
                          !isCompleted &&
                          'border-border text-muted-foreground'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="ml-3 hidden sm:block">
                      <p
                        className={cn(
                          'text-sm font-medium',
                          isActive && 'text-neon-green',
                          isCompleted && 'text-foreground',
                          !isActive && !isCompleted && 'text-muted-foreground'
                        )}
                      >
                        {step.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                    {index < STEPS.length - 1 && (
                      <div
                        className={cn(
                          'w-12 h-0.5 mx-4 transition-colors',
                          isCompleted ? 'bg-neon-green' : 'bg-border'
                        )}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </PermoneyCardHeader>

          {/* Content */}
          <PermoneyCardContent className="p-6">
            <div className="min-h-[400px]">
              {wizardState.currentStep === 0 && (
                <FileUploadStep onFileSelect={handleFileUpload} />
              )}

              {wizardState.currentStep === 1 && (
                <DataMappingStep
                  headers={
                    wizardState.parsedData.length > 0
                      ? Object.keys(wizardState.parsedData[0])
                      : []
                  }
                  sampleData={wizardState.parsedData.slice(0, 5)}
                  onMappingComplete={handleMappingComplete}
                  initialMapping={wizardState.mapping}
                />
              )}

              {wizardState.currentStep === 2 && (
                <DataPreviewStep
                  transactions={wizardState.mappedData}
                  onConfirm={handlePreviewConfirm}
                />
              )}

              {wizardState.currentStep === 3 && (
                <ConfirmationStep
                  transactions={wizardState.mappedData}
                  onComplete={handleImportComplete}
                  onStartOver={handleStartOver}
                />
              )}
            </div>
          </PermoneyCardContent>

          {/* Footer */}
          {wizardState.currentStep < 3 && (
            <div className="border-t border-border/50 p-6">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={wizardState.currentStep === 0}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Previous
                </Button>

                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </PermoneyCard>
      </div>
    </div>
  );
}
