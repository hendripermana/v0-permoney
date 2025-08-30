import { Injectable, Logger } from '@nestjs/common';
import { DocumentType, ProcessingStatus } from './types/ocr.types';

export interface OCRMetrics {
  documentsProcessed: number;
  averageProcessingTime: number;
  successRate: number;
  errorRate: number;
  confidenceScores: number[];
  documentTypeBreakdown: Record<DocumentType, number>;
  processingTimeByType: Record<DocumentType, number[]>;
}

@Injectable()
export class OCRMetricsService {
  private readonly logger = new Logger(OCRMetricsService.name);
  private metrics: Map<string, any> = new Map();

  recordDocumentUpload(documentType: DocumentType, fileSize: number): void {
    const key = `upload_${documentType}`;
    const uploads = this.metrics.get(key) || [];
    uploads.push({
      timestamp: Date.now(),
      fileSize,
    });
    this.metrics.set(key, uploads);
  }

  recordProcessingStart(documentId: string, documentType: DocumentType): void {
    this.metrics.set(`processing_start_${documentId}`, {
      timestamp: Date.now(),
      documentType,
    });
  }

  recordProcessingEnd(
    documentId: string,
    status: ProcessingStatus,
    confidence?: number,
    errorMessage?: string,
  ): void {
    const startData = this.metrics.get(`processing_start_${documentId}`);
    if (!startData) return;

    const processingTime = Date.now() - startData.timestamp;
    
    const endData = {
      documentId,
      documentType: startData.documentType,
      processingTime,
      status,
      confidence,
      errorMessage,
      timestamp: Date.now(),
    };

    // Store processing result
    const results = this.metrics.get('processing_results') || [];
    results.push(endData);
    this.metrics.set('processing_results', results);

    // Clean up start data
    this.metrics.delete(`processing_start_${documentId}`);

    // Log performance metrics
    this.logger.log(
      `Document ${documentId} processed in ${processingTime}ms with status ${status}` +
      (confidence ? ` and confidence ${confidence}` : ''),
    );
  }

  recordTransactionSuggestion(
    documentId: string,
    suggestionsCount: number,
    averageConfidence: number,
  ): void {
    const suggestions = this.metrics.get('transaction_suggestions') || [];
    suggestions.push({
      documentId,
      suggestionsCount,
      averageConfidence,
      timestamp: Date.now(),
    });
    this.metrics.set('transaction_suggestions', suggestions);
  }

  recordSuggestionApproval(suggestionId: string, approved: boolean): void {
    const approvals = this.metrics.get('suggestion_approvals') || [];
    approvals.push({
      suggestionId,
      approved,
      timestamp: Date.now(),
    });
    this.metrics.set('suggestion_approvals', approvals);
  }

  getMetrics(timeRangeHours = 24): OCRMetrics {
    const cutoffTime = Date.now() - (timeRangeHours * 60 * 60 * 1000);
    const results = (this.metrics.get('processing_results') || [])
      .filter((result: any) => result.timestamp > cutoffTime);

    if (results.length === 0) {
      return {
        documentsProcessed: 0,
        averageProcessingTime: 0,
        successRate: 0,
        errorRate: 0,
        confidenceScores: [],
        documentTypeBreakdown: {} as Record<DocumentType, number>,
        processingTimeByType: {} as Record<DocumentType, number[]>,
      };
    }

    const successfulResults = results.filter((r: any) => r.status === ProcessingStatus.COMPLETED);
    const failedResults = results.filter((r: any) => r.status === ProcessingStatus.FAILED);

    const documentTypeBreakdown: Record<DocumentType, number> = {} as Record<DocumentType, number>;
    const processingTimeByType: Record<DocumentType, number[]> = {} as Record<DocumentType, number[]>;
    const confidenceScores: number[] = [];

    results.forEach((result: any) => {
      // Document type breakdown
      documentTypeBreakdown[result.documentType] = 
        (documentTypeBreakdown[result.documentType] || 0) + 1;

      // Processing time by type
      if (!processingTimeByType[result.documentType]) {
        processingTimeByType[result.documentType] = [];
      }
      processingTimeByType[result.documentType].push(result.processingTime);

      // Confidence scores
      if (result.confidence !== undefined) {
        confidenceScores.push(result.confidence);
      }
    });

    const totalProcessingTime = results.reduce((sum: number, r: any) => sum + r.processingTime, 0);

    return {
      documentsProcessed: results.length,
      averageProcessingTime: totalProcessingTime / results.length,
      successRate: successfulResults.length / results.length,
      errorRate: failedResults.length / results.length,
      confidenceScores,
      documentTypeBreakdown,
      processingTimeByType,
    };
  }

  getSuggestionMetrics(timeRangeHours = 24): {
    totalSuggestions: number;
    averageSuggestionsPerDocument: number;
    averageConfidence: number;
    approvalRate: number;
  } {
    const cutoffTime = Date.now() - (timeRangeHours * 60 * 60 * 1000);
    
    const suggestions = (this.metrics.get('transaction_suggestions') || [])
      .filter((s: any) => s.timestamp > cutoffTime);
    
    const approvals = (this.metrics.get('suggestion_approvals') || [])
      .filter((a: any) => a.timestamp > cutoffTime);

    if (suggestions.length === 0) {
      return {
        totalSuggestions: 0,
        averageSuggestionsPerDocument: 0,
        averageConfidence: 0,
        approvalRate: 0,
      };
    }

    const totalSuggestions = suggestions.reduce((sum: number, s: any) => sum + s.suggestionsCount, 0);
    const totalConfidence = suggestions.reduce((sum: number, s: any) => sum + s.averageConfidence, 0);
    const approvedCount = approvals.filter((a: any) => a.approved).length;

    return {
      totalSuggestions,
      averageSuggestionsPerDocument: totalSuggestions / suggestions.length,
      averageConfidence: totalConfidence / suggestions.length,
      approvalRate: approvals.length > 0 ? approvedCount / approvals.length : 0,
    };
  }

  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    issues: string[];
    metrics: any;
  } {
    const metrics = this.getMetrics(1); // Last hour
    const issues: string[] = [];
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    // Check error rate
    if (metrics.errorRate > 0.1) { // More than 10% errors
      issues.push(`High error rate: ${(metrics.errorRate * 100).toFixed(1)}%`);
      status = 'degraded';
    }

    if (metrics.errorRate > 0.3) { // More than 30% errors
      status = 'unhealthy';
    }

    // Check average processing time
    if (metrics.averageProcessingTime > 10000) { // More than 10 seconds
      issues.push(`Slow processing: ${(metrics.averageProcessingTime / 1000).toFixed(1)}s average`);
      if (status === 'healthy') status = 'degraded';
    }

    // Check confidence scores
    const avgConfidence = metrics.confidenceScores.length > 0 
      ? metrics.confidenceScores.reduce((sum, c) => sum + c, 0) / metrics.confidenceScores.length
      : 0;

    if (avgConfidence < 0.7) { // Less than 70% average confidence
      issues.push(`Low confidence: ${(avgConfidence * 100).toFixed(1)}% average`);
      if (status === 'healthy') status = 'degraded';
    }

    return {
      status,
      issues,
      metrics: {
        ...metrics,
        averageConfidence: avgConfidence,
      },
    };
  }

  clearMetrics(): void {
    this.metrics.clear();
    this.logger.log('OCR metrics cleared');
  }

  // Clean up old metrics (call this periodically)
  cleanupOldMetrics(maxAgeHours = 168): void { // 7 days default
    const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);
    
    ['processing_results', 'transaction_suggestions', 'suggestion_approvals'].forEach(key => {
      const data = this.metrics.get(key) || [];
      const filtered = data.filter((item: any) => item.timestamp > cutoffTime);
      this.metrics.set(key, filtered);
    });

    // Clean up upload metrics by document type
    Object.values(DocumentType).forEach(docType => {
      const key = `upload_${docType}`;
      const uploads = this.metrics.get(key) || [];
      const filtered = uploads.filter((item: any) => item.timestamp > cutoffTime);
      this.metrics.set(key, filtered);
    });

    this.logger.log(`Cleaned up OCR metrics older than ${maxAgeHours} hours`);
  }
}
