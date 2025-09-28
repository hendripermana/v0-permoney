import { PartialType, PickType } from '@nestjs/mapped-types';
import { CreateTransactionDto } from './create-transaction.dto';

export class UpdateTransactionDto extends PartialType(
  PickType(CreateTransactionDto, ['amountCents', 'currency', 'originalAmountCents', 'originalCurrency', 'exchangeRate', 'description', 'categoryId', 'merchant', 'merchantName', 'merchantId', 'date', 'transferAccountId', 'receiptUrl', 'tags', 'splits', 'metadata'] as const)
) {
  // All fields from CreateTransactionDto are optional except accountId
  // accountId cannot be changed after creation to maintain ledger integrity
}
