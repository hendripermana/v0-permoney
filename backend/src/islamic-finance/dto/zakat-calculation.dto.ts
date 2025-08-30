import { IsString, IsOptional, IsDateString, IsNumber, IsBoolean, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ZakatAssetType, ZakatReminderType, ShariaComplianceStatus, IslamicReportType } from '../types/islamic-finance.types';

export class CalculateZakatDto {
  @ApiProperty({ description: 'Household ID for zakat calculation' })
  @IsString()
  householdId: string;

  @ApiPropertyOptional({ description: 'Specific calculation date (defaults to current date)' })
  @IsOptional()
  @IsDateString()
  calculationDate?: string;

  @ApiPropertyOptional({ description: 'Include specific asset types only' })
  @IsOptional()
  @IsArray()
  @IsEnum(ZakatAssetType, { each: true })
  assetTypes?: ZakatAssetType[];
}

export class ZakatAssetBreakdownDto {
  @ApiProperty({ enum: ZakatAssetType })
  @IsEnum(ZakatAssetType)
  assetType: ZakatAssetType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accountId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accountName?: string;

  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsString()
  currency: string;

  @ApiProperty()
  @IsNumber()
  zakatRate: number;

  @ApiProperty()
  @IsNumber()
  zakatAmount: number;

  @ApiProperty()
  @IsBoolean()
  haulCompleted: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  haulStartDate?: string;
}

export class CreateZakatReminderDto {
  @ApiProperty()
  @IsString()
  householdId: string;

  @ApiProperty({ enum: ZakatReminderType })
  @IsEnum(ZakatReminderType)
  reminderType: ZakatReminderType;

  @ApiProperty()
  @IsDateString()
  scheduledDate: string;

  @ApiProperty()
  @IsString()
  hijriDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  zakatAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  zakatCurrency?: string;

  @ApiProperty()
  @IsString()
  message: string;
}

export class UpdateZakatReminderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateShariaComplianceDto {
  @ApiProperty()
  @IsString()
  accountId: string;

  @ApiProperty({ enum: ShariaComplianceStatus })
  @IsEnum(ShariaComplianceStatus)
  complianceStatus: ShariaComplianceStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  complianceNotes?: string;
}

export class GenerateIslamicReportDto {
  @ApiProperty()
  @IsString()
  householdId: string;

  @ApiProperty({ enum: IslamicReportType })
  @IsEnum(IslamicReportType)
  reportType: IslamicReportType;

  @ApiProperty()
  @IsDateString()
  startDate: string;

  @ApiProperty()
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  periodType?: 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'HIJRI_YEAR';
}

export class RecordZakatPaymentDto {
  @ApiProperty()
  @IsString()
  householdId: string;

  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsString()
  currency: string;

  @ApiProperty()
  @IsDateString()
  paymentDate: string;

  @ApiProperty()
  @IsString()
  hijriDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ZakatCalculationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  householdId: string;

  @ApiProperty()
  calculationDate: string;

  @ApiProperty()
  hijriYear: number;

  @ApiProperty()
  nisabThreshold: {
    amount: number;
    currency: string;
  };

  @ApiProperty()
  totalZakatableAssets: {
    amount: number;
    currency: string;
  };

  @ApiProperty()
  zakatAmount: {
    amount: number;
    currency: string;
  };

  @ApiProperty({ type: [ZakatAssetBreakdownDto] })
  @ValidateNested({ each: true })
  @Type(() => ZakatAssetBreakdownDto)
  assetBreakdown: ZakatAssetBreakdownDto[];

  @ApiProperty()
  isZakatDue: boolean;

  @ApiProperty()
  nextCalculationDate: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}
