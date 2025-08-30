import { IsString, IsUrl, IsOptional, IsNumber, IsUUID, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateWishlistItemDto {
  @IsString()
  name: string;

  @IsUrl()
  url: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  targetPrice?: number;

  @IsOptional()
  @IsString()
  currency?: string = 'IDR';

  @IsOptional()
  @IsUUID()
  linkedGoalId?: string;
}
