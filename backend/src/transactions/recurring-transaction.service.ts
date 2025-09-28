import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import {
  CreateRecurringTransactionDto,
  UpdateRecurringTransactionDto,
  RecurringTransactionFiltersDto,
  RecurrenceFrequency,
  RecurringTransactionStatus,
  ExecuteRecurringTransactionDto,
} from './dto/recurring-transaction.dto';
import { HOUSEHOLD_PERMISSIONS } from '../household/constants/permissions';
import { RecurringTransactionRepository } from './recurring-transaction.repository';
import { TransactionsService } from './transactions.service';
import { PermissionsService } from '../household/services/permissions.service';

@Injectable()
export class RecurringTransactionService {
  private readonly logger = new Logger(RecurringTransactionService.name);

  constructor(
    private readonly recurringTransactionRepository: RecurringTransactionRepository,
    private readonly transactionsService: TransactionsService,
    private readonly permissionsService: PermissionsService
  ) {}

  async create(
    householdId: string,
    userId: string,
    createDto: CreateRecurringTransactionDto
  ) {
    // Check permissions
    await this.permissionsService.checkPermission(
      userId,
      householdId,
      HOUSEHOLD_PERMISSIONS.CREATE_TRANSACTIONS
    );

    // Validate dates
    const startDate = new Date(createDto.startDate);
    const endDate = createDto.endDate ? new Date(createDto.endDate) : null;

    if (endDate && endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    // Calculate next execution date
    const nextExecutionDate = this.calculateNextExecutionDate(
      startDate,
      createDto.frequency,
      createDto.intervalValue || 1
    );

    const recurringTransaction =
      await this.recurringTransactionRepository.create({
        householdId,
        name: createDto.name,
        description: createDto.description,
        amountCents: createDto.amountCents,
        currency: createDto.currency || 'IDR',
        accountId: createDto.accountId,
        transferAccountId: createDto.transferAccountId,
        categoryId: createDto.categoryId,
        merchant: createDto.merchant,
        frequency: createDto.frequency,
        intervalValue: createDto.intervalValue || 1,
        startDate,
        endDate,
        nextExecutionDate,
        maxExecutions: createDto.maxExecutions,
        metadata: createDto.metadata,
        createdBy: userId,
      });

    this.logger.log(
      `Created recurring transaction: ${recurringTransaction.id}`
    );
    return recurringTransaction;
  }

  async findById(id: string, userId: string) {
    const recurringTransaction =
      await this.recurringTransactionRepository.findById(id);

    if (!recurringTransaction) {
      throw new NotFoundException('Recurring transaction not found');
    }

    // Check permissions
    await this.permissionsService.checkPermission(
      userId,
      recurringTransaction.householdId,
      HOUSEHOLD_PERMISSIONS.VIEW_ALL_TRANSACTIONS
    );

    return recurringTransaction;
  }

  async findByHousehold(
    householdId: string,
    userId: string,
    filters: RecurringTransactionFiltersDto = {}
  ) {
    // Check permissions
    await this.permissionsService.checkPermission(
      userId,
      householdId,
      HOUSEHOLD_PERMISSIONS.VIEW_ALL_TRANSACTIONS
    );

    return this.recurringTransactionRepository.findByHousehold(
      householdId,
      filters
    );
  }

  async update(
    id: string,
    userId: string,
    updateDto: UpdateRecurringTransactionDto
  ) {
    const recurringTransaction =
      await this.recurringTransactionRepository.findById(id);

    if (!recurringTransaction) {
      throw new NotFoundException('Recurring transaction not found');
    }

    // Check permissions
    await this.permissionsService.checkPermission(
      userId,
      recurringTransaction.householdId,
      HOUSEHOLD_PERMISSIONS.MANAGE_TRANSACTIONS
    );

    // Validate dates if provided
    if (updateDto.startDate || updateDto.endDate) {
      const startDate = updateDto.startDate
        ? new Date(updateDto.startDate)
        : recurringTransaction.startDate;
      const endDate = updateDto.endDate
        ? new Date(updateDto.endDate)
        : recurringTransaction.endDate;

      if (endDate && endDate <= startDate) {
        throw new BadRequestException('End date must be after start date');
      }
    }

    // Recalculate next execution date if frequency or interval changed
    let nextExecutionDate = recurringTransaction.nextExecutionDate;
    if (updateDto.frequency || updateDto.intervalValue || updateDto.startDate) {
      const frequency = updateDto.frequency || recurringTransaction.frequency;
      const intervalValue =
        updateDto.intervalValue || recurringTransaction.intervalValue;
      const startDate = updateDto.startDate
        ? new Date(updateDto.startDate)
        : recurringTransaction.startDate;

      nextExecutionDate = this.calculateNextExecutionDate(
        recurringTransaction.lastExecutionDate || startDate,
        frequency as RecurrenceFrequency,
        intervalValue
      );
    }

    const updatedData: any = {
      ...updateDto,
    };

    if (updateDto.startDate) {
      updatedData.startDate = new Date(updateDto.startDate);
    }

    if (updateDto.endDate) {
      updatedData.endDate = new Date(updateDto.endDate);
    }

    if (nextExecutionDate !== recurringTransaction.nextExecutionDate) {
      updatedData.nextExecutionDate = nextExecutionDate;
    }

    const updated = await this.recurringTransactionRepository.update(
      id,
      updatedData
    );

    this.logger.log(`Updated recurring transaction: ${id}`);
    return updated;
  }

  async delete(id: string, userId: string) {
    const recurringTransaction =
      await this.recurringTransactionRepository.findById(id);

    if (!recurringTransaction) {
      throw new NotFoundException('Recurring transaction not found');
    }

    // Check permissions
    await this.permissionsService.checkPermission(
      userId,
      recurringTransaction.householdId,
      HOUSEHOLD_PERMISSIONS.DELETE_TRANSACTIONS
    );

    await this.recurringTransactionRepository.delete(id);

    this.logger.log(`Deleted recurring transaction: ${id}`);
  }

  async pause(id: string, userId: string) {
    return this.updateStatus(id, userId, RecurringTransactionStatus.PAUSED);
  }

  async resume(id: string, userId: string) {
    return this.updateStatus(id, userId, RecurringTransactionStatus.ACTIVE);
  }

  async cancel(id: string, userId: string) {
    return this.updateStatus(id, userId, RecurringTransactionStatus.CANCELLED);
  }

  private async updateStatus(
    id: string,
    userId: string,
    status: RecurringTransactionStatus
  ) {
    const recurringTransaction =
      await this.recurringTransactionRepository.findById(id);

    if (!recurringTransaction) {
      throw new NotFoundException('Recurring transaction not found');
    }

    // Check permissions
    await this.permissionsService.checkPermission(
      userId,
      recurringTransaction.householdId,
      HOUSEHOLD_PERMISSIONS.MANAGE_TRANSACTIONS
    );

    const updated = await this.recurringTransactionRepository.updateStatus(
      id,
      status
    );

    this.logger.log(`Updated recurring transaction status: ${id} -> ${status}`);
    return {
      ...updated,
      amountCents: Number(updated.amountCents),
    };
  }

  async executeRecurringTransaction(
    executeDto: ExecuteRecurringTransactionDto,
    userId?: string
  ) {
    const recurringTransaction =
      await this.recurringTransactionRepository.findById(
        executeDto.recurringTransactionId
      );

    if (!recurringTransaction) {
      throw new NotFoundException('Recurring transaction not found');
    }

    if (recurringTransaction.status !== RecurringTransactionStatus.ACTIVE) {
      throw new BadRequestException('Recurring transaction is not active');
    }

    // Check if execution is due (unless forced)
    const executionDate = executeDto.executionDate
      ? new Date(executeDto.executionDate)
      : new Date();
    const isDue = executionDate >= recurringTransaction.nextExecutionDate;

    if (!isDue && !executeDto.force) {
      throw new BadRequestException(
        'Recurring transaction is not due for execution'
      );
    }

    // Check if max executions reached
    if (
      recurringTransaction.maxExecutions &&
      recurringTransaction.executionCount >= recurringTransaction.maxExecutions
    ) {
      await this.recurringTransactionRepository.updateStatus(
        recurringTransaction.id,
        RecurringTransactionStatus.COMPLETED
      );
      throw new BadRequestException('Maximum executions reached');
    }

    // Check if end date passed
    if (
      recurringTransaction.endDate &&
      executionDate > recurringTransaction.endDate
    ) {
      await this.recurringTransactionRepository.updateStatus(
        recurringTransaction.id,
        RecurringTransactionStatus.COMPLETED
      );
      throw new BadRequestException('Recurring transaction has ended');
    }

    // Create execution record
    const execution = await this.recurringTransactionRepository.createExecution(
      {
        recurringTransactionId: recurringTransaction.id,
        scheduledDate: executionDate,
        status: 'PENDING',
      }
    );

    try {
      // Create the actual transaction
      const transaction = await this.transactionsService.createTransaction(
        recurringTransaction.householdId,
        {
          description: `${recurringTransaction.name} - ${recurringTransaction.description}`,
          amountCents: Number(recurringTransaction.amountCents),
          currency: recurringTransaction.currency,
          accountId: recurringTransaction.accountId,
          transferAccountId: recurringTransaction.transferAccountId,
          categoryId: recurringTransaction.categoryId,
          merchant: recurringTransaction.merchant,
          date: executionDate.toISOString().split('T')[0],
          metadata: {
            ...(recurringTransaction.metadata as Record<string, any> || {}),
            recurringTransactionId: recurringTransaction.id,
            executionId: execution.id,
          },
        },
        userId || recurringTransaction.createdBy
      );

      // Update execution record with success
      await this.recurringTransactionRepository.updateExecution(execution.id, {
        transactionId: transaction.id,
        executedDate: new Date(),
        status: 'COMPLETED',
      });

      // Calculate next execution date
      const nextExecutionDate = this.calculateNextExecutionDate(
        executionDate,
        recurringTransaction.frequency as RecurrenceFrequency,
        recurringTransaction.intervalValue
      );

      // Update recurring transaction
      await this.recurringTransactionRepository.incrementExecutionCount(
        recurringTransaction.id,
        nextExecutionDate
      );

      // Check if we should complete the recurring transaction
      const shouldComplete =
        (recurringTransaction.maxExecutions &&
          recurringTransaction.executionCount + 1 >=
            recurringTransaction.maxExecutions) ||
        (recurringTransaction.endDate &&
          nextExecutionDate > recurringTransaction.endDate);

      if (shouldComplete) {
        await this.recurringTransactionRepository.updateStatus(
          recurringTransaction.id,
          RecurringTransactionStatus.COMPLETED
        );
      }

      this.logger.log(
        `Executed recurring transaction: ${recurringTransaction.id} -> ${transaction.id}`
      );

      return {
        execution,
        transaction,
        recurringTransaction:
          await this.recurringTransactionRepository.findById(
            recurringTransaction.id
          ),
      };
    } catch (error) {
      // Update execution record with failure
      await this.recurringTransactionRepository.updateExecution(execution.id, {
        status: 'FAILED',
        errorMessage: error.message,
        retryCount: 1,
      });

      this.logger.error(
        `Failed to execute recurring transaction: ${recurringTransaction.id}`,
        error
      );
      throw error;
    }
  }

  async getExecutionHistory(recurringTransactionId: string, userId: string) {
    const recurringTransaction =
      await this.recurringTransactionRepository.findById(
        recurringTransactionId
      );

    if (!recurringTransaction) {
      throw new NotFoundException('Recurring transaction not found');
    }

    // Check permissions
    await this.permissionsService.checkPermission(
      userId,
      recurringTransaction.householdId,
      HOUSEHOLD_PERMISSIONS.VIEW_ALL_TRANSACTIONS
    );

    return this.recurringTransactionRepository.findExecutionsByRecurringTransaction(
      recurringTransactionId
    );
  }

  // Utility method to calculate next execution date
  private calculateNextExecutionDate(
    fromDate: Date,
    frequency: RecurrenceFrequency,
    intervalValue: number
  ): Date {
    const nextDate = new Date(fromDate);

    switch (frequency) {
      case RecurrenceFrequency.DAILY:
        nextDate.setDate(nextDate.getDate() + intervalValue);
        break;
      case RecurrenceFrequency.WEEKLY:
        nextDate.setDate(nextDate.getDate() + intervalValue * 7);
        break;
      case RecurrenceFrequency.MONTHLY:
        nextDate.setMonth(nextDate.getMonth() + intervalValue);
        break;
      case RecurrenceFrequency.YEARLY:
        nextDate.setFullYear(nextDate.getFullYear() + intervalValue);
        break;
      case RecurrenceFrequency.CUSTOM:
        // For custom frequency, treat as days
        nextDate.setDate(nextDate.getDate() + intervalValue);
        break;
    }

    return nextDate;
  }

  // Method for scheduled job to process due recurring transactions
  async processDueRecurringTransactions(): Promise<void> {
    this.logger.log('Processing due recurring transactions');

    try {
      const dueTransactions =
        await this.recurringTransactionRepository.findDueForExecution();

      this.logger.log(
        `Found ${dueTransactions.length} due recurring transactions`
      );

      for (const recurringTransaction of dueTransactions) {
        try {
          await this.executeRecurringTransaction({
            recurringTransactionId: recurringTransaction.id,
          });
        } catch (error) {
          this.logger.error(
            `Failed to execute recurring transaction ${recurringTransaction.id}: ${error.message}`,
            error
          );
        }
      }
    } catch (error) {
      this.logger.error('Failed to process due recurring transactions', error);
    }
  }

  // Method for scheduled job to retry failed executions
  async retryFailedExecutions(): Promise<void> {
    this.logger.log('Retrying failed recurring transaction executions');

    try {
      const failedExecutions =
        await this.recurringTransactionRepository.findFailedExecutions();

      this.logger.log(
        `Found ${failedExecutions.length} failed executions to retry`
      );

      for (const execution of failedExecutions) {
        try {
          // Update retry count
          await this.recurringTransactionRepository.updateExecution(
            execution.id,
            {
              retryCount: execution.retryCount + 1,
              status: 'PENDING',
            }
          );

          // Retry execution
          await this.executeRecurringTransaction({
            recurringTransactionId: execution.recurringTransactionId,
            executionDate: execution.scheduledDate.toISOString(),
            force: true,
          });
        } catch (error) {
          this.logger.error(
            `Failed to retry execution ${execution.id}: ${error.message}`,
            error
          );

          // Mark as permanently failed if max retries reached
          if (execution.retryCount >= 2) {
            await this.recurringTransactionRepository.updateExecution(
              execution.id,
              {
                status: 'PERMANENTLY_FAILED',
                errorMessage: `Max retries reached: ${error.message}`,
              }
            );
          }
        }
      }
    } catch (error) {
      this.logger.error('Failed to retry failed executions', error);
    }
  }
}
