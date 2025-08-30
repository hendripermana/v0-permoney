// Type definitions for debt module dependencies
// This file provides type definitions for external dependencies to ensure
// the debt module can compile independently

declare module '../prisma/prisma.service' {
  export class PrismaService {
    debt: any;
    debtPayment: any;
    $transaction: any;
  }
}

declare module '../household/guards/household-access.guard' {
  export class HouseholdAccessGuard {
    canActivate(): boolean;
  }
  export const HOUSEHOLD_PERMISSIONS_KEY: string;
}

declare module '../household/decorators/household-permissions.decorator' {
  export function HouseholdPermissions(...permissions: string[]): MethodDecorator;
}

declare module '../household/constants/permissions' {
  export const HOUSEHOLD_PERMISSIONS: {
    MANAGE_DEBTS: string;
    VIEW_DEBTS: string;
    CREATE_DEBTS: string;
    DELETE_DEBTS: string;
  };
}

declare module '../auth/guards/jwt-auth.guard' {
  export class JwtAuthGuard {
    canActivate(): boolean;
  }
}

// Prisma Client types that we need
declare module '@prisma/client' {
  export enum DebtType {
    PERSONAL = 'PERSONAL',
    CONVENTIONAL = 'CONVENTIONAL',
    ISLAMIC = 'ISLAMIC'
  }

  export interface Debt {
    id: string;
    householdId: string;
    type: DebtType;
    name: string;
    creditor: string;
    principalAmountCents: bigint;
    currentBalanceCents: bigint;
    currency: string;
    interestRate: Decimal | null;
    marginRate: Decimal | null;
    startDate: Date;
    maturityDate: Date | null;
    isActive: boolean;
    metadata: any;
    createdAt: Date;
    updatedAt: Date;
  }

  export interface DebtPayment {
    id: string;
    debtId: string;
    amountCents: bigint;
    currency: string;
    paymentDate: Date;
    principalAmountCents: bigint;
    interestAmountCents: bigint;
    transactionId: string | null;
    createdAt: Date;
  }

  export class Decimal {
    constructor(value: number | string);
    toNumber(): number;
    toString(): string;
  }

  export namespace Prisma {
    export class Decimal {
      constructor(value: number | string);
      toNumber(): number;
      toString(): string;
    }

    export interface DebtWhereInput {
      householdId?: string;
      type?: DebtType;
      isActive?: boolean;
      creditor?: {
        contains?: string;
        mode?: 'insensitive';
      };
      OR?: Array<{
        name?: {
          contains?: string;
          mode?: 'insensitive';
        };
        creditor?: {
          contains?: string;
          mode?: 'insensitive';
        };
      }>;
    }

    export interface DebtUpdateInput {
      name?: string;
      creditor?: string;
      principalAmountCents?: number;
      currency?: string;
      interestRate?: Decimal | null;
      marginRate?: Decimal | null;
      startDate?: Date;
      maturityDate?: Date | null;
      isActive?: boolean;
      metadata?: any;
    }
  }
}
