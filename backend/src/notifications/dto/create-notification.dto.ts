import { IsEnum, IsString, IsOptional, IsObject, IsArray, IsDateString, IsBoolean, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationType, NotificationChannel, NotificationPriority } from '../types/notification.types';

export class CreateNotificationDto {
  @IsString()
  userId: string;

  @IsString()
  householdId: string;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  actionUrl?: string;

  @IsOptional()
  @IsString()
  actionText?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  channels: NotificationChannel[];

  @IsEnum(NotificationPriority)
  priority: NotificationPriority;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}

export class UpdateNotificationPreferencesDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => BudgetAlertsPreferenceDto)
  budgetAlerts?: BudgetAlertsPreferenceDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DebtRemindersPreferenceDto)
  debtReminders?: DebtRemindersPreferenceDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ZakatRemindersPreferenceDto)
  zakatReminders?: ZakatRemindersPreferenceDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TransactionAlertsPreferenceDto)
  transactionAlerts?: TransactionAlertsPreferenceDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => MonthlyReportsPreferenceDto)
  monthlyReports?: MonthlyReportsPreferenceDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => SecurityAlertsPreferenceDto)
  securityAlerts?: SecurityAlertsPreferenceDto;
}

export class BudgetAlertsPreferenceDto {
  @IsBoolean()
  enabled: boolean;

  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  channels: NotificationChannel[];

  @IsNumber()
  threshold: number;
}

export class DebtRemindersPreferenceDto {
  @IsBoolean()
  enabled: boolean;

  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  channels: NotificationChannel[];

  @IsNumber()
  daysBefore: number;
}

export class ZakatRemindersPreferenceDto {
  @IsBoolean()
  enabled: boolean;

  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  channels: NotificationChannel[];

  @IsNumber()
  daysBefore: number;
}

export class TransactionAlertsPreferenceDto {
  @IsBoolean()
  enabled: boolean;

  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  channels: NotificationChannel[];

  @IsNumber()
  largeAmountThreshold: number;
}

export class MonthlyReportsPreferenceDto {
  @IsBoolean()
  enabled: boolean;

  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  channels: NotificationChannel[];

  @IsNumber()
  dayOfMonth: number;
}

export class SecurityAlertsPreferenceDto {
  @IsBoolean()
  enabled: boolean;

  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  channels: NotificationChannel[];
}

export class MarkNotificationReadDto {
  @IsString()
  notificationId: string;
}

export class SendTestNotificationDto {
  @IsEnum(NotificationType)
  type: NotificationType;

  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  channels: NotificationChannel[];
}
