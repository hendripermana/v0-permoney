import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Request,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';

import { OcrService } from './ocr.service';
import { UploadDocumentDto, ProcessDocumentDto, ValidateOcrResultDto } from './dto/upload-document.dto';
import { ApproveTransactionSuggestionDto } from './dto/create-transaction-suggestion.dto';
import { DocumentUpload, OCRResult, TransactionSuggestion, ValidationResult } from './types/ocr.types';
import type { Express } from 'express';

@ApiTags('OCR & Document Processing')
@ApiBearerAuth()
@Controller('ocr')
export class OcrController {
  private readonly logger = new Logger(OcrController.name);

  constructor(private readonly ocrService: OcrService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload document for OCR processing' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 201,
    description: 'Document uploaded successfully',
    type: Object, // DocumentUpload type would be defined in swagger
  })
  @ApiResponse({ status: 400, description: 'Invalid file or request data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: UploadDocumentDto,
    @Request() req: any,
  ): Promise<DocumentUpload> {
    this.logger.log(`Upload document request from user: ${req.user?.userId ?? req.user?.sub ?? req.user?.id}`);

    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    return this.ocrService.uploadDocument(file, uploadDto, (req.user?.userId ?? req.user?.sub ?? req.user?.id));
  }

  @Post('process')
  @ApiOperation({ summary: 'Process uploaded document with OCR' })
  @ApiResponse({
    status: 200,
    description: 'Document processed successfully',
    type: Object, // OCRResult type
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async processDocument(@Body() processDto: ProcessDocumentDto): Promise<OCRResult> {
    this.logger.log(`Process document request: ${processDto.documentId}`);
    return this.ocrService.processDocument(processDto);
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validate and correct OCR results' })
  @ApiResponse({
    status: 200,
    description: 'OCR result validated successfully',
    type: Object, // ValidationResult type
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 404, description: 'OCR result not found' })
  async validateOcrResult(@Body() validateDto: ValidateOcrResultDto): Promise<ValidationResult> {
    this.logger.log(`Validate OCR result request: ${validateDto.ocrResultId}`);
    return this.ocrService.validateOcrResult(validateDto);
  }

  @Get('documents/:documentId/suggestions')
  @ApiOperation({ summary: 'Get transaction suggestions for a document' })
  @ApiResponse({
    status: 200,
    description: 'Transaction suggestions retrieved successfully',
    type: [Object], // TransactionSuggestion[] type
  })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async getTransactionSuggestions(
    @Param('documentId') documentId: string,
  ): Promise<TransactionSuggestion[]> {
    this.logger.log(`Get transaction suggestions request: ${documentId}`);
    return this.ocrService.getTransactionSuggestions(documentId);
  }

  @Post('suggestions/approve')
  @ApiOperation({ summary: 'Approve transaction suggestion and create transaction' })
  @ApiResponse({
    status: 201,
    description: 'Transaction created successfully from suggestion',
    type: Object, // Transaction type
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 404, description: 'Transaction suggestion not found' })
  async approveTransactionSuggestion(
    @Body() approveDto: ApproveTransactionSuggestionDto,
    @Request() req: any,
  ): Promise<any> {
    this.logger.log(`Approve transaction suggestion request: ${approveDto.suggestionId}`);
    return this.ocrService.approveTransactionSuggestion(approveDto, (req.user?.userId ?? req.user?.sub ?? req.user?.id));
  }

  @Get('documents/:householdId')
  @ApiOperation({ summary: 'Get all documents for a household' })
  @ApiResponse({
    status: 200,
    description: 'Documents retrieved successfully',
    type: [Object], // DocumentUpload[] type
  })
  async getDocumentsByHousehold(
    @Param('householdId') householdId: string,
    @Request() req: any,
  ): Promise<DocumentUpload[]> {
    this.logger.log(`Get documents request for household: ${householdId}`);
    return this.ocrService.getDocumentsByHousehold(householdId, (req.user?.userId ?? req.user?.sub ?? req.user?.id));
  }

  @Get('documents/:documentId')
  @ApiOperation({ summary: 'Get document details by ID' })
  @ApiResponse({
    status: 200,
    description: 'Document retrieved successfully',
    type: Object, // DocumentUpload type
  })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async getDocumentById(
    @Param('documentId') documentId: string,
    @Request() req: any,
  ): Promise<DocumentUpload> {
    this.logger.log(`Get document request: ${documentId}`);
    return this.ocrService.getDocument(documentId, (req.user?.userId ?? req.user?.sub ?? req.user?.id));
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check for OCR service' })
  @ApiResponse({ status: 200, description: 'OCR service is healthy' })
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  }
}
