import { ObjectType, Field, ID, InputType, Int, Float } from '@nestjs/graphql';
import { Money, GraphQLDateTime, PaginationInfo, GraphQLBigInt } from './common.types';
import { Account } from './account.types';

// Category type
@ObjectType()
export class Category {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  slug: string;

  @Field({ nullable: true })
  icon?: string;

  @Field({ nullable: true })
  color?: string;

  @Field()
  type: string;

  @Field(() => ID, { nullable: true })
  parentId?: string;

  @Field(() => Category, { nullable: true })
  parent?: Category;

  @Field(() => [Category])
  children: Category[];

  @Field()
  isActive: boolean;

  @Field()
  isEditable: boolean;

  @Field(() => GraphQLDateTime)
  createdAt: Date;
}

// Merchant type
@ObjectType()
export class Merchant {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  slug: string;

  @Field({ nullable: true })
  logoUrl?: string;

  @Field({ nullable: true })
  color?: string;

  @Field(() => GraphQLDateTime)
  createdAt: Date;
}

// Transaction tag
@ObjectType()
export class TransactionTag {
  @Field()
  tag: string;
}

// Transaction split
@ObjectType()
export class TransactionSplit {
  @Field(() => ID)
  id: string;

  @Field(() => Category)
  category: Category;

  @Field(() => Money)
  amount: Money;

  @Field({ nullable: true })
  description?: string;

  @Field(() => GraphQLDateTime)
  createdAt: Date;
}

// Ledger entry
@ObjectType()
export class LedgerEntry {
  @Field(() => ID)
  id: string;

  @Field(() => Account)
  account: Account;

  @Field()
  type: string; // DEBIT or CREDIT

  @Field(() => Money)
  amount: Money;

  @Field(() => GraphQLDateTime)
  createdAt: Date;
}

// Transaction type
@ObjectType()
export class Transaction {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  householdId: string;

  @Field(() => Money)
  amount: Money;

  @Field(() => Money, { nullable: true })
  originalAmount?: Money;

  @Field(() => Float, { nullable: true })
  exchangeRate?: number;

  @Field()
  description: string;

  @Field(() => Category, { nullable: true })
  category?: Category;

  @Field({ nullable: true })
  merchant?: string;

  @Field(() => Merchant, { nullable: true })
  merchantData?: Merchant;

  @Field({ nullable: true })
  merchantName?: string;

  @Field({ nullable: true })
  merchantLogoUrl?: string;

  @Field({ nullable: true })
  merchantColor?: string;

  @Field(() => GraphQLDateTime)
  date: Date;

  @Field(() => Account)
  account: Account;

  @Field(() => Account, { nullable: true })
  transferAccount?: Account;

  @Field({ nullable: true })
  receiptUrl?: string;

  @Field(() => [TransactionTag])
  tags: TransactionTag[];

  @Field(() => [TransactionSplit])
  splits: TransactionSplit[];

  @Field(() => [LedgerEntry])
  ledgerEntries: LedgerEntry[];

  @Field(() => ID)
  createdBy: string;

  @Field(() => GraphQLDateTime)
  createdAt: Date;

  @Field(() => GraphQLDateTime)
  updatedAt: Date;
}

// Transaction connection for pagination
@ObjectType()
export class TransactionConnection {
  @Field(() => [Transaction])
  transactions: Transaction[];

  @Field(() => PaginationInfo)
  pagination: PaginationInfo;

  @Field(() => Int)
  totalCount: number;
}

// Transaction statistics
@ObjectType()
export class TransactionStats {
  @Field(() => Int)
  totalTransactions: number;

  @Field(() => Money)
  totalIncome: Money;

  @Field(() => Money)
  totalExpenses: Money;

  @Field(() => Int)
  totalTransfers: number;

  @Field(() => Money)
  averageTransactionAmount: Money;

  @Field(() => Int)
  categoriesUsed: number;

  @Field(() => Int)
  merchantsUsed: number;
}

// Category breakdown
@ObjectType()
export class CategoryBreakdown {
  @Field(() => ID)
  categoryId: string;

  @Field()
  categoryName: string;

  @Field(() => Money)
  totalAmount: Money;

  @Field(() => Int)
  transactionCount: number;

  @Field(() => Float)
  percentage: number;
}

// Input types
@InputType()
export class TransactionFilters {
  @Field(() => GraphQLDateTime, { nullable: true })
  startDate?: Date;

  @Field(() => GraphQLDateTime, { nullable: true })
  endDate?: Date;

  @Field(() => ID, { nullable: true })
  accountId?: string;

  @Field(() => ID, { nullable: true })
  categoryId?: string;

  @Field({ nullable: true })
  merchant?: string;

  @Field(() => GraphQLBigInt, { nullable: true })
  minAmount?: bigint;

  @Field(() => GraphQLBigInt, { nullable: true })
  maxAmount?: bigint;

  @Field({ nullable: true })
  currency?: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => [String], { nullable: true })
  tags?: string[];

  @Field({ nullable: true })
  isTransfer?: boolean;

  @Field(() => Int, { nullable: true })
  page?: number;

  @Field(() => Int, { nullable: true })
  limit?: number;
}

@InputType()
export class TransactionSplitInput {
  @Field(() => ID)
  categoryId: string;

  @Field(() => GraphQLBigInt)
  amountCents: bigint;

  @Field({ nullable: true })
  description?: string;
}

@InputType()
export class CreateTransactionInput {
  @Field(() => GraphQLBigInt)
  amountCents: bigint;

  @Field()
  currency: string;

  @Field(() => GraphQLBigInt, { nullable: true })
  originalAmountCents?: bigint;

  @Field({ nullable: true })
  originalCurrency?: string;

  @Field(() => Float, { nullable: true })
  exchangeRate?: number;

  @Field()
  description: string;

  @Field(() => ID, { nullable: true })
  categoryId?: string;

  @Field({ nullable: true })
  merchant?: string;

  @Field(() => GraphQLDateTime)
  date: Date;

  @Field(() => ID)
  accountId: string;

  @Field(() => ID, { nullable: true })
  transferAccountId?: string;

  @Field({ nullable: true })
  receiptUrl?: string;

  @Field(() => [String], { nullable: true })
  tags?: string[];

  @Field(() => [TransactionSplitInput], { nullable: true })
  splits?: TransactionSplitInput[];
}

@InputType()
export class UpdateTransactionInput {
  @Field(() => GraphQLBigInt, { nullable: true })
  amountCents?: bigint;

  @Field({ nullable: true })
  currency?: string;

  @Field(() => GraphQLBigInt, { nullable: true })
  originalAmountCents?: bigint;

  @Field({ nullable: true })
  originalCurrency?: string;

  @Field(() => Float, { nullable: true })
  exchangeRate?: number;

  @Field({ nullable: true })
  description?: string;

  @Field(() => ID, { nullable: true })
  categoryId?: string;

  @Field({ nullable: true })
  merchant?: string;

  @Field(() => GraphQLDateTime, { nullable: true })
  date?: Date;

  @Field(() => ID, { nullable: true })
  accountId?: string;

  @Field(() => ID, { nullable: true })
  transferAccountId?: string;

  @Field({ nullable: true })
  receiptUrl?: string;

  @Field(() => [String], { nullable: true })
  tags?: string[];

  @Field(() => [TransactionSplitInput], { nullable: true })
  splits?: TransactionSplitInput[];
}

@InputType()
export class Pagination {
  @Field(() => Int, { defaultValue: 1 })
  page: number;

  @Field(() => Int, { defaultValue: 20 })
  limit: number;
}
