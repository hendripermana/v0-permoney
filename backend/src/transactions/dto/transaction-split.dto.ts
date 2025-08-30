import { IsString, IsNotEmpty, IsOptional, IsUUID, IsNumber, Min } from 'class-validator';

export class TransactionSplitDto {
  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @IsNumber()
  @Min(1)
  amountCents: number;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateTransactionSplitsDto {
  splits: TransactionSplitDto[];
}
