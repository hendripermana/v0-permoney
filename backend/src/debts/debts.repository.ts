import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Debt, DebtPayment, Prisma } from '@prisma/client';
import { CreateDebtDto, UpdateDebtDto, DebtFiltersDto, CreateDebtPaymentDto, DebtType } from './dto';

export interface DebtWithPayments extends Debt {
  payments: DebtPayment[];
}

@Injectable()
export class DebtsRepository {
  constructor(private prisma: PrismaService) {}

  async create(householdId: string, data: CreateDebtDto): Promise<Debt> {
    return this.prisma.debt.create({
      data: {
        householdId,
        type: data.type,
        name: data.name,
        creditor: data.creditor,
        principalAmountCents: Math.round(data.principalAmount * 100),
        currentBalanceCents: Math.round(data.principalAmount * 100), // Initially equals principal
        currency: data.currency || 'IDR',
        interestRate: data.interestRate ? new Prisma.Decimal(data.interestRate) : null,
        marginRate: data.marginRate ? new Prisma.Decimal(data.marginRate) : null,
        startDate: new Date(data.startDate),
        maturityDate: data.maturityDate ? new Date(data.maturityDate) : null,
        metadata: (data.metadata as any) || {},
      },
    });
  }

  async findById(id: string): Promise<DebtWithPayments | null> {
    return this.prisma.debt.findUnique({
      where: { id },
      include: {
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
    });
  }

  async findByHousehold(
    householdId: string,
    filters?: DebtFiltersDto,
  ): Promise<DebtWithPayments[]> {
    const where: Prisma.DebtWhereInput = {
      householdId,
    };

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.creditor) {
      where.creditor = {
        contains: filters.creditor,
        mode: 'insensitive',
      };
    }

    if (filters?.search) {
      where.OR = [
        {
          name: {
            contains: filters.search,
            mode: 'insensitive',
          },
        },
        {
          creditor: {
            contains: filters.search,
            mode: 'insensitive',
          },
        },
      ];
    }

    return this.prisma.debt.findMany({
      where,
      include: {
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
      orderBy: [
        { isActive: 'desc' },
        { currentBalanceCents: 'desc' },
      ],
    });
  }

  async update(id: string, data: UpdateDebtDto): Promise<Debt> {
    const updateData: Prisma.DebtUpdateInput = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.creditor !== undefined) updateData.creditor = data.creditor;
    if (data.principalAmount !== undefined) {
      updateData.principalAmountCents = Math.round(data.principalAmount * 100);
    }
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.interestRate !== undefined) {
      updateData.interestRate = data.interestRate ? new Prisma.Decimal(data.interestRate) : null;
    }
    if (data.marginRate !== undefined) {
      updateData.marginRate = data.marginRate ? new Prisma.Decimal(data.marginRate) : null;
    }
    if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
    if (data.maturityDate !== undefined) {
      updateData.maturityDate = data.maturityDate ? new Date(data.maturityDate) : null;
    }
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.metadata !== undefined) updateData.metadata = data.metadata as any;

    return this.prisma.debt.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.debt.delete({
      where: { id },
    });
  }

  async createPayment(debtId: string, data: CreateDebtPaymentDto): Promise<DebtPayment> {
    return this.prisma.$transaction(async (tx) => {
      // First, get the current debt to validate and get currency
      const debt = await tx.debt.findUnique({
        where: { id: debtId },
        select: { 
          id: true, 
          currentBalanceCents: true, 
          currency: true, 
          isActive: true,
          householdId: true 
        },
      });

      if (!debt) {
        throw new Error(`Debt with ID ${debtId} not found`);
      }

      if (!debt.isActive) {
        throw new Error('Cannot create payment for inactive debt');
      }

      const principalAmountCents = Math.round(data.principalAmount * 100);
      
      // Validate that we won't create negative balance
      if (debt.currentBalanceCents < principalAmountCents) {
        throw new Error(
          `Insufficient debt balance. Current: ${Number(debt.currentBalanceCents) / 100}, ` +
          `Requested principal payment: ${data.principalAmount}`
        );
      }

      // Create the payment record
      const payment = await tx.debtPayment.create({
        data: {
          debtId,
          amountCents: Math.round(data.amount * 100),
          currency: debt.currency,
          paymentDate: new Date(data.paymentDate),
          principalAmountCents,
          interestAmountCents: Math.round((data.interestAmount || 0) * 100),
          transactionId: data.transactionId || null,
        },
      });

      // Update the debt's current balance
      const updatedDebt = await tx.debt.update({
        where: { id: debtId },
        data: {
          currentBalanceCents: {
            decrement: principalAmountCents,
          },
          updatedAt: new Date(),
        },
        select: { currentBalanceCents: true },
      });

      // If debt is fully paid, consider marking it as inactive or paid off
      if (updatedDebt.currentBalanceCents <= 0) {
        await tx.debt.update({
          where: { id: debtId },
          data: {
            currentBalanceCents: 0, // Ensure it's exactly zero
            // Note: We don't automatically set isActive to false
            // as the user might want to keep it for historical purposes
            metadata: {
              paidOffDate: new Date().toISOString(),
            },
          },
        });
      }

      return payment;
    }, {
      maxWait: 5000, // Maximum time to wait for a transaction slot (5s)
      timeout: 10000, // Maximum time the transaction can run (10s)
    });
  }

  async getPaymentsByDebt(debtId: string): Promise<DebtPayment[]> {
    return this.prisma.debtPayment.findMany({
      where: { debtId },
      orderBy: { paymentDate: 'desc' },
    });
  }

  async getDebtsByType(householdId: string): Promise<Record<DebtType, DebtWithPayments[]>> {
    const debts = await this.findByHousehold(householdId, { isActive: true });
    
    const result: Record<DebtType, DebtWithPayments[]> = {
      PERSONAL: [],
      CONVENTIONAL: [],
      ISLAMIC: [],
    };

    debts.forEach(debt => {
      result[debt.type].push(debt);
    });

    return result;
  }

  async getTotalDebtByHousehold(householdId: string): Promise<bigint> {
    const result = await this.prisma.debt.aggregate({
      where: {
        householdId,
        isActive: true,
      },
      _sum: {
        currentBalanceCents: true,
      },
    });

    return result._sum.currentBalanceCents || BigInt(0);
  }
}
