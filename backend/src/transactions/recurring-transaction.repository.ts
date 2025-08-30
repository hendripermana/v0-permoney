import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateRecurringTransactionDto,
  UpdateRecurringTransactionDto,
  RecurringTransactionFiltersDto,
  RecurrenceFrequency,
  RecurringTransactionStatus,
} from './dto/recurring-transaction.dto';

export interface CreateRecurringTransactionData {
  householdId: string;
  name: string;
  description: string;
  amountCents: number;
  currency: string;
  accountId: string;
  transferAccountId?: string;
  categoryId?: string;
  merchant?: string;
  frequency: RecurrenceFrequency;
  intervalValue: number;
  startDate: Date;
  endDate?: Date;
  nextExecutionDate: Date;
  maxExecutions?: number;
  metadata?: Record<string, any>;
  createdBy: string;
}

export interface UpdateRecurringTransactionData {
  name?: string;
  description?: string;
  amountCents?: number;
  currency?: string;
  accountId?: string;
  transferAccountId?: string;
  categoryId?: string;
  merchant?: string;
  frequency?: RecurrenceFrequency;
  intervalValue?: number;
  startDate?: Date;
  endDate?: Date;
  nextExecutionDate?: Date;
  maxExecutions?: number;
  status?: RecurringTransactionStatus;
  metadata?: Record<string, any>;
}

export interface CreateRecurringTransactionExecutionData {
  recurringTransactionId: string;
  scheduledDate: Date;
  status?: string;
}

export interface UpdateRecurringTransactionExecutionData {
  transactionId?: string;
  executedDate?: Date;
  status?: string;
  errorMessage?: string;
  retryCount?: number;
}

@Injectable()
export class RecurringTransactionRepository {
  private readonly logger = new Logger(RecurringTransactionRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateRecurringTransactionData) {
    this.logger.log(`Creating recurring transaction: ${data.name}`);

    return this.prisma.recurringTransaction.create({
      data: {
        householdId: data.householdId,
        name: data.name,
        description: data.description,
        amountCents: data.amountCents,
        currency: data.currency,
        accountId: data.accountId,
        transferAccountId: data.transferAccountId,
        categoryId: data.categoryId,
        merchant: data.merchant,
        frequency: data.frequency,
        intervalValue: data.intervalValue,
        startDate: data.startDate,
        endDate: data.endDate,
        nextExecutionDate: data.nextExecutionDate,
        maxExecutions: data.maxExecutions,
        metadata: data.metadata || {},
        createdBy: data.createdBy,
      },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            type: true,
            currency: true,
          },
        },
        transferAccount: {
          select: {
            id: true,
            name: true,
            type: true,
            currency: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
          },
        },
      },
    });
  }

  async findById(id: string) {
    return this.prisma.recurringTransaction.findUnique({
      where: { id },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            type: true,
            currency: true,
          },
        },
        transferAccount: {
          select: {
            id: true,
            name: true,
            type: true,
            currency: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
          },
        },
        executions: {
          orderBy: { scheduledDate: 'desc' },
          take: 10,
        },
      },
    });
  }

  async findByHousehold(
    householdId: string,
    filters: RecurringTransactionFiltersDto = {}
  ) {
    const {
      status,
      accountId,
      categoryId,
      frequency,
      page = 1,
      limit = 20,
    } = filters;

    const where: any = {
      householdId,
    };

    if (status) {
      where.status = status;
    }

    if (accountId) {
      where.accountId = accountId;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (frequency) {
      where.frequency = frequency;
    }

    const [items, total] = await Promise.all([
      this.prisma.recurringTransaction.findMany({
        where,
        include: {
          account: {
            select: {
              id: true,
              name: true,
              type: true,
              currency: true,
            },
          },
          transferAccount: {
            select: {
              id: true,
              name: true,
              type: true,
              currency: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              icon: true,
              color: true,
            },
          },
        },
        orderBy: { nextExecutionDate: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.recurringTransaction.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findDueForExecution(date: Date = new Date()) {
    return this.prisma.recurringTransaction.findMany({
      where: {
        status: RecurringTransactionStatus.ACTIVE,
        nextExecutionDate: {
          lte: date,
        },
        OR: [{ endDate: null }, { endDate: { gte: date } }],
        AND: [
          {
            OR: [
              { maxExecutions: null },
              {
                executionCount: {
                  lt: this.prisma.recurringTransaction.fields.maxExecutions,
                },
              },
            ],
          },
        ],
      },
      include: {
        account: true,
        transferAccount: true,
        category: true,
        household: true,
      },
    });
  }

  async update(id: string, data: UpdateRecurringTransactionData) {
    this.logger.log(`Updating recurring transaction: ${id}`);

    return this.prisma.recurringTransaction.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            type: true,
            currency: true,
          },
        },
        transferAccount: {
          select: {
            id: true,
            name: true,
            type: true,
            currency: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
          },
        },
      },
    });
  }

  async delete(id: string) {
    this.logger.log(`Deleting recurring transaction: ${id}`);

    return this.prisma.recurringTransaction.delete({
      where: { id },
    });
  }

  async incrementExecutionCount(id: string, nextExecutionDate: Date) {
    return this.prisma.recurringTransaction.update({
      where: { id },
      data: {
        executionCount: { increment: 1 },
        lastExecutionDate: new Date(),
        nextExecutionDate,
      },
    });
  }

  async updateStatus(id: string, status: RecurringTransactionStatus) {
    return this.prisma.recurringTransaction.update({
      where: { id },
      data: { status },
    });
  }

  // Execution tracking methods
  async createExecution(data: CreateRecurringTransactionExecutionData) {
    return this.prisma.recurringTransactionExecution.create({
      data: {
        recurringTransactionId: data.recurringTransactionId,
        scheduledDate: data.scheduledDate,
        status: data.status || 'PENDING',
      },
    });
  }

  async updateExecution(
    id: string,
    data: UpdateRecurringTransactionExecutionData
  ) {
    return this.prisma.recurringTransactionExecution.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async findExecutionsByRecurringTransaction(
    recurringTransactionId: string,
    limit = 50
  ) {
    return this.prisma.recurringTransactionExecution.findMany({
      where: { recurringTransactionId },
      include: {
        transaction: {
          select: {
            id: true,
            description: true,
            amountCents: true,
            currency: true,
            date: true,
          },
        },
      },
      orderBy: { scheduledDate: 'desc' },
      take: limit,
    });
  }

  async findPendingExecutions(limit = 100) {
    return this.prisma.recurringTransactionExecution.findMany({
      where: {
        status: 'PENDING',
        scheduledDate: {
          lte: new Date(),
        },
      },
      include: {
        recurringTransaction: {
          include: {
            account: true,
            transferAccount: true,
            category: true,
            household: true,
          },
        },
      },
      orderBy: { scheduledDate: 'asc' },
      take: limit,
    });
  }

  async findFailedExecutions(retryLimit = 3) {
    return this.prisma.recurringTransactionExecution.findMany({
      where: {
        status: 'FAILED',
        retryCount: {
          lt: retryLimit,
        },
      },
      include: {
        recurringTransaction: {
          include: {
            account: true,
            transferAccount: true,
            category: true,
            household: true,
          },
        },
      },
      orderBy: { updatedAt: 'asc' },
    });
  }
}
