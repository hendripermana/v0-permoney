import { IsString, IsUUID, IsOptional, IsObject, IsIP } from 'class-validator';

export class CreateEventDto {
  @IsString()
  eventType: string;

  @IsObject()
  @IsOptional()
  eventData?: Record<string, any>;

  @IsString()
  @IsOptional()
  resourceType?: string;

  @IsUUID()
  @IsOptional()
  resourceId?: string;

  @IsString()
  @IsOptional()
  sessionId?: string;

  @IsIP()
  @IsOptional()
  ipAddress?: string;

  @IsString()
  @IsOptional()
  userAgent?: string;
}
