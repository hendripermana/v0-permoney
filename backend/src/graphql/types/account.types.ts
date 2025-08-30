import { ObjectType, Field, ID, registerEnumType, InputType, Int } from '@nestjs/graphql';
import { Money, GraphQLDateTime, PaginationInfo } from './common.types';

// Enums
export enum AccountType {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
}

export enum InstitutionType {
  BANK = 'BANK',
  FINTECH = 'FINTECH',
  INVESTMENT = 'INVESTMENT',
  CRYPTO = 'CRYPTO',
}

registerEnumType(AccountType, { name: 'AccountType' });
registerEnumType(InstitutionType, { name: 'InstitutionType' });

// Institution type
@ObjectType()
export class Institution {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  code?: string;

  @Field({ nullable: true })
  logoUrl?: string;

  @Field()
  country: string;

  @Field(() => InstitutionType)
  type: InstitutionType;

  @Field(() => GraphQLDateTime)
  createdAt: Date;
}

// Account type
@ObjectType()
export class Account {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  householdId: string;

  @Field()
  name: string;

  @Field(() => AccountType)
  type: AccountType;

  @Field()
  subtype: string;

  @Field()
  currency: string;

  @Field(() => Institution, { nullable: true })
  institution?: Institution;

  @Field({ nullable: true })
  accountNumber?: string;

  @Field(() => Money)
  balance: Money;

  @Field(() => Money)
  calculatedBalance: Money;

  @Field()
  isActive: boolean;

  @Field(() => ID, { nullable: true })
  ownerId?: string;

  @Field(() => GraphQLDateTime)
  createdAt: Date;

  @Field(() => GraphQLDateTime)
  updatedAt: Date;
}

// Balance history point
@ObjectType()
export class BalanceHistoryPoint {
  @Field(() => GraphQLDateTime)
  date: Date;

  @Field(() => Money)
  balance: Money;

  @Field(() => Money)
  runningBalance: Money;
}

// Net worth summary
@ObjectType()
export class NetWorthSummary {
  @Field(() => Money)
  totalAssets: Money;

  @Field(() => Money)
  totalLiabilities: Money;

  @Field(() => Money)
  netWorth: Money;

  @Field(() => [AssetBreakdown])
  assetsByType: AssetBreakdown[];

  @Field(() => [LiabilityBreakdown])
  liabilitiesByType: LiabilityBreakdown[];

  @Field()
  currency: string;
}

@ObjectType()
export class AssetBreakdown {
  @Field()
  subtype: string;

  @Field(() => Money)
  amount: Money;

  @Field(() => [Account])
  accounts: Account[];
}

@ObjectType()
export class LiabilityBreakdown {
  @Field()
  subtype: string;

  @Field(() => Money)
  amount: Money;

  @Field(() => [Account])
  accounts: Account[];
}

// Account statistics
@ObjectType()
export class AccountStats {
  @Field(() => Int)
  totalAccounts: number;

  @Field(() => Int)
  activeAccounts: number;

  @Field(() => Int)
  assetAccounts: number;

  @Field(() => Int)
  liabilityAccounts: number;

  @Field(() => [String])
  currenciesUsed: string[];
}

// Net worth history point
@ObjectType()
export class NetWorthPoint {
  @Field(() => GraphQLDateTime)
  date: Date;

  @Field(() => Money)
  netWorth: Money;

  @Field(() => Money)
  totalAssets: Money;

  @Field(() => Money)
  totalLiabilities: Money;
}

// Input types
@InputType()
export class AccountFilters {
  @Field(() => AccountType, { nullable: true })
  type?: AccountType;

  @Field({ nullable: true })
  subtype?: string;

  @Field({ nullable: true })
  currency?: string;

  @Field({ nullable: true })
  isActive?: boolean;

  @Field(() => ID, { nullable: true })
  ownerId?: string;

  @Field(() => ID, { nullable: true })
  institutionId?: string;
}

@InputType()
export class CreateAccountInput {
  @Field()
  name: string;

  @Field(() => AccountType)
  type: AccountType;

  @Field()
  subtype: string;

  @Field()
  currency: string;

  @Field(() => ID, { nullable: true })
  institutionId?: string;

  @Field({ nullable: true })
  accountNumber?: string;

  @Field(() => ID, { nullable: true })
  ownerId?: string;
}

@InputType()
export class UpdateAccountInput {
  @Field({ nullable: true })
  name?: string;

  @Field(() => AccountType, { nullable: true })
  type?: AccountType;

  @Field({ nullable: true })
  subtype?: string;

  @Field({ nullable: true })
  currency?: string;

  @Field(() => ID, { nullable: true })
  institutionId?: string;

  @Field({ nullable: true })
  accountNumber?: string;

  @Field({ nullable: true })
  isActive?: boolean;

  @Field(() => ID, { nullable: true })
  ownerId?: string;
}
