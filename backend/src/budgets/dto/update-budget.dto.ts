import { PartialType } from '@nestjs/mapped-types';
import { CreateBudgetDto } from './create-budget.dto';
import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateBudgetDto extends PartialType(CreateBudgetDto) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
