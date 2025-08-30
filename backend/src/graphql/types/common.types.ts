import { ObjectType, Field, Int, Float, ID, registerEnumType } from '@nestjs/graphql';
import { GraphQLScalarType } from 'graphql';
import { Kind } from 'graphql/language';

// Custom scalar for BigInt amounts
export const GraphQLBigInt = new GraphQLScalarType({
  name: 'BigInt',
  description: 'BigInt custom scalar type for large numbers',
  serialize(value: unknown): string {
    if (typeof value === 'bigint') {
      return value.toString();
    }
    if (typeof value === 'string' || typeof value === 'number') {
      return BigInt(value).toString();
    }
    throw new Error('Value must be a BigInt, string, or number');
  },
  parseValue(value: unknown): bigint {
    if (typeof value === 'string') {
      return BigInt(value);
    }
    if (typeof value === 'number') {
      return BigInt(Math.floor(value));
    }
    throw new Error('Value must be a string or number');
  },
  parseLiteral(ast): bigint {
    if (ast.kind === Kind.STRING || ast.kind === Kind.INT) {
      return BigInt(ast.value);
    }
    throw new Error('Value must be a string or integer literal');
  },
});

// Custom scalar for DateTime
export const GraphQLDateTime = new GraphQLScalarType({
  name: 'DateTime',
  description: 'Date custom scalar type',
  serialize(value: unknown): string {
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value === 'string') {
      return new Date(value).toISOString();
    }
    throw new Error('Value must be a Date or string');
  },
  parseValue(value: unknown): Date {
    if (typeof value === 'string') {
      return new Date(value);
    }
    throw new Error('Value must be a string');
  },
  parseLiteral(ast): Date {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value);
    }
    throw new Error('Value must be a string literal');
  },
});

// Money type for financial amounts
@ObjectType()
export class Money {
  @Field(() => GraphQLBigInt)
  cents: bigint;

  @Field()
  currency: string;

  @Field(() => Float)
  amount: number;

  @Field()
  formatted: string;
}

// Pagination types
@ObjectType()
export class PageInfo {
  @Field(() => Boolean)
  hasNextPage: boolean;

  @Field(() => Boolean)
  hasPreviousPage: boolean;

  @Field(() => String, { nullable: true })
  startCursor?: string;

  @Field(() => String, { nullable: true })
  endCursor?: string;
}

@ObjectType()
export class PaginationInfo {
  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  totalPages: number;

  @Field(() => Boolean)
  hasNextPage: boolean;

  @Field(() => Boolean)
  hasPreviousPage: boolean;
}

// Date range input
@ObjectType()
export class DateRange {
  @Field(() => GraphQLDateTime)
  startDate: Date;

  @Field(() => GraphQLDateTime)
  endDate: Date;
}

// Enums
export enum ViewType {
  INDIVIDUAL = 'INDIVIDUAL',
  PARTNER_ONLY = 'PARTNER_ONLY',
  COMBINED = 'COMBINED',
}

export enum GroupBy {
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  QUARTER = 'QUARTER',
  YEAR = 'YEAR',
  CATEGORY = 'CATEGORY',
  MERCHANT = 'MERCHANT',
  ACCOUNT = 'ACCOUNT',
}

export enum TimeInterval {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
}

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  TRANSFER = 'TRANSFER',
}

export enum InsightType {
  SPENDING_PATTERN = 'SPENDING_PATTERN',
  BUDGET_ALERT = 'BUDGET_ALERT',
  ANOMALY = 'ANOMALY',
  RECOMMENDATION = 'RECOMMENDATION',
  TREND = 'TREND',
}

export enum InsightPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

// Register enums with GraphQL
registerEnumType(ViewType, { name: 'ViewType' });
registerEnumType(GroupBy, { name: 'GroupBy' });
registerEnumType(TimeInterval, { name: 'TimeInterval' });
registerEnumType(TransactionType, { name: 'TransactionType' });
registerEnumType(InsightType, { name: 'InsightType' });
registerEnumType(InsightPriority, { name: 'InsightPriority' });

// Error types
@ObjectType()
export class GraphQLError {
  @Field()
  message: string;

  @Field({ nullable: true })
  code?: string;

  @Field(() => [String], { nullable: true })
  path?: string[];
}

// Success response wrapper
@ObjectType()
export class MutationResponse {
  @Field()
  success: boolean;

  @Field({ nullable: true })
  message?: string;

  @Field(() => [GraphQLError], { nullable: true })
  errors?: GraphQLError[];
}
