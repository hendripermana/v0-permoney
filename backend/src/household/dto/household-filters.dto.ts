import { IsOptional, IsEnum } from 'class-validator';
import { FilterDto } from '../../common/dto/base.dto';

export enum ViewType {
  INDIVIDUAL = 'individual',
  PARTNER_ONLY = 'partner_only',
  COMBINED = 'combined'
}

export class HouseholdFiltersDto extends FilterDto {
  @IsOptional()
  @IsEnum(ViewType)
  viewType?: ViewType;
}
