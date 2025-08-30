import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DocumentType } from '../types/ocr.types';

export class UploadDocumentDto {
  @ApiProperty({
    description: 'Type of document being uploaded',
    enum: DocumentType,
    example: DocumentType.RECEIPT,
  })
  @IsEnum(DocumentType)
  documentType: DocumentType;

  @ApiProperty({
    description: 'Household ID the document belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  householdId: string;

  @ApiProperty({
    description: 'Optional description or notes about the document',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}

export class ProcessDocumentDto {
  @ApiProperty({
    description: 'Document upload ID to process',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  documentId: string;

  @ApiProperty({
    description: 'Force reprocessing even if already processed',
    required: false,
    default: false,
  })
  @IsOptional()
  forceReprocess?: boolean = false;
}

export class ValidateOcrResultDto {
  @ApiProperty({
    description: 'OCR result ID to validate',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  ocrResultId: string;

  @ApiProperty({
    description: 'Manual corrections to apply',
    required: false,
  })
  @IsOptional()
  corrections?: Record<string, any>;
}
