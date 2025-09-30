import { Prisma, Debt, DebtType } from '@prisma/client';
import { BaseService } from './base.service';
import { CACHE_TTL } from '@/lib/redis';

export interface CreateDebtData {
  type: DebtType;
  name: string;
  creditor: string;
  principalAmountCents: number;
  currentBalanceCents?: number;
  currency?: string;
  interestRate?: number;
  marginRate?: number;
  startDate: Date;
  maturityDate?: Date;
  metadata?: Record<string, any>;
}

export interface UpdateDebtData {
  type?: DebtType;
  name?: string;
  creditor?: string;
  principalAmountCents?: number;
  currentBalanceCents?: number;
  currency?: string;
  interestRate?: number;
  marginRate?: number;
  startDate?: Date;
  maturityDate?: Date;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

export interface CreateDebtPaymentData {
  amountCents: number;
  currency?: string;
  paymentDate: Date;
  principalAmountCents: number;
  interestAmountCents?: number;
  transactionId?: string;
}

export interface DebtFilters {
  type?: DebtType;
  isActive?: boolean;
}

export interface DebtWithDetails extends Debt {
  payments: any[];
  _count?: {
    payments: number;
  };
}

export class DebtsService extends BaseService {
  async createDebt(
    householdId: string,
    data: CreateDebtData
  ): Promise<DebtWithDetails> {
    try {
      this.validateRequired(data, ['type', 'name', 'creditor', 'principalAmountCents', 'startDate']);

      const debt = await this.prisma.debt.create({
        data: {
          householdId,
          type: data.type,
          name: data.name,
          creditor: data.creditor,
          principalAmountCents: BigInt(data.principalAmountCents),
          currentBalanceCents: BigInt(data.currentBalanceCents || data.principalAmountCents),
          currency: data.currency || 'IDR',
          interestRate: data.interestRate,
          marginRate: data.marginRate,
          startDate: data.startDate,
          maturityDate: data.maturityDate,
          metadata: data.metadata || {},
          isActive: true,
        },
        include: {
          payments: true,
          _count: {
            select: { payments: true },
          },
        },
      });

      await this.invalidateCachePatterns(`debts:${householdId}*`, `dashboard:${householdId}`);
      return debt as DebtWithDetails;
    } catch (error) {
      return this.handleError(error, 'Failed to create debt');
    }
  }

  async getDebtById(id: string, householdId: string): Promise<DebtWithDetails> {
    try {
      const debt = await this.prisma.debt.findFirst({
        where: { id, householdId },
        include: {
          payments: {
            orderBy: { paymentDate: 'desc' },
          },
          _count: {
            select: { payments: true },
          },
        },
      });

      if (!debt) {
        throw new Error('Debt not found');
      }

      return debt as DebtWithDetails;
    } catch (error) {
      return this.handleError(error, 'Failed to fetch debt');
    }
  }

  async getDebts(
    householdId: string,
    filters: DebtFilters = {}
  ): Promise<DebtWithDetails[]> {
    try {
      const where: Prisma.DebtWhereInput = {
        householdId,
        ...(filters.type && { type: filters.type }),
        ...(filters.isActive !== undefined && { isActive: filters.isActive }),
      };

      const debts = await this.prisma.debt.findMany({
        where,
        include: {
          payments: {
            orderBy: { paymentDate: 'desc' },
            take: 5,
          },
          _count: {
            select: { payments: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return debts as DebtWithDetails[];
    } catch (error) {
      return this.handleError(error, 'Failed to fetch debts');
    }
  }

  async updateDebt(
    id: string,
    householdId: string,
    data: UpdateDebtData
  ): Promise<DebtWithDetails> {
    try {
      await this.getDebtById(id, householdId);

      const debt = await this.prisma.debt.update({
        where: { id },
        data: {
          ...(data.type && { type: data.type }),
          ...(data.name && { name: data.name }),
          ...(data.creditor && { creditor: data.creditor }),
          ...(data.principalAmountCents !== undefined && { 
            principalAmountCents: BigInt(data.principalAmountCents) 
          }),
          ...(data.currentBalanceCents !== undefined && { 
            currentBalanceCents: BigInt(data.currentBalanceCents) 
          }),
          ...(data.currency && { currency: data.currency }),
          ...(data.interestRate !== undefined && { interestRate: data.interestRate }),
          ...(data.marginRate !== undefined && { marginRate: data.marginRate }),
          ...(data.startDate && { startDate: data.startDate }),
          ...(data.maturityDate !== undefined && { maturityDate: data.maturityDate }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
          ...(data.metadata && { metadata: data.metadata }),
        },
        include: {
          payments: true,
          _count: {
            select: { payments: true },
          },
        },
      });

      await this.invalidateCachePatterns(`debts:${householdId}*`, `dashboard:${householdId}`);
      return debt as DebtWithDetails;
    } catch (error) {
      return this.handleError(error, 'Failed to update debt');
    }
  }

  async deleteDebt(id: string, householdId: string): Promise<void> {
    try {
      await this.getDebtById(id, householdId);
      await this.prisma.debt.delete({ where: { id } });
      await this.invalidateCachePatterns(`debts:${householdId}*`, `dashboard:${householdId}`);
    } catch (error) {
      return this.handleError(error, 'Failed to delete debt');
    }
  }

  async addPayment(
    debtId: string,
    householdId: string,
    data: CreateDebtPaymentData
  ): Promise<DebtWithDetails> {
    try {
      const debt = await this.getDebtById(debtId, householdId);

      await this.prisma.$transaction(async (tx) => {
        // Create payment
        await tx.debtPayment.create({
          data: {
            debtId,
            amountCents: BigInt(data.amountCents),
            currency: data.currency || 'IDR',
            paymentDate: data.paymentDate,
            principalAmountCents: BigInt(data.principalAmountCents),
            interestAmountCents: BigInt(data.interestAmountCents || 0),
            transactionId: data.transactionId,
          },
        });

        // Update debt balance
        const newBalance = Number(debt.currentBalanceCents) - data.principalAmountCents;
        await tx.debt.update({
          where: { id: debtId },
          data: {
            currentBalanceCents: BigInt(Math.max(0, newBalance)),
            isActive: newBalance > 0,
          },
        });
      });

      await this.invalidateCachePatterns(`debts:${householdId}*`, `dashboard:${householdId}`);
      return this.getDebtById(debtId, householdId);
    } catch (error) {
      return this.handleError(error, 'Failed to add debt payment');
    }
  }
}

export const debtsService = new DebtsService();
