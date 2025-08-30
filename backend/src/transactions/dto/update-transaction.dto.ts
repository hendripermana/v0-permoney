import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateTransactionDto } from './create-transaction.dto';

export class UpdateTransactionDto extends PartialType(
  OmitType(CreateTransactionDto, ['accountId'] as const)
) {
  // All fields from CreateTransactionDto are optional except accountId
  // accountId cannot be changed after creation to maintain ledger integrity
}
