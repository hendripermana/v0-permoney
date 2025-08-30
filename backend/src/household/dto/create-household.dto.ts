import { IsString, IsOptional, Length, IsIn } from 'class-validator';

export class CreateHouseholdDto {
  @IsString()
  @Length(1, 255)
  name: string;

  @IsOptional()
  @IsString()
  @IsIn(['IDR', 'USD', 'EUR', 'SGD', 'MYR'])
  baseCurrency?: string = 'IDR';

  @IsOptional()
  settings?: Record<string, any> = {};
}
