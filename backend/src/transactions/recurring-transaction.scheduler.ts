import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RecurringTransactionService } from './recurring-transaction.service';

@Injectable()
export class RecurringTransactionScheduler {
  private readonly logger = new Logger(RecurringTransactionScheduler.name);

  constructor(
    private readonly recurringTransactionService: RecurringTransactionService
  ) {}

  /**
   * Process due recurring transactions every hour
   * This ensures transactions are executed promptly when they become due
   */
  @Cron(CronExpression.EVERY_HOUR)
  async processDueRecurringTransactions(): Promise<void> {
    this.logger.log(
      'Starting scheduled processing of due recurring transactions'
    );

    try {
      await this.recurringTransactionService.processDueRecurringTransactions();
      this.logger.log('Completed processing due recurring transactions');
    } catch (error) {
      this.logger.error('Failed to process due recurring transactions', error);
    }
  }

  /**
   * Retry failed executions every 6 hours
   * This provides resilience for temporary failures
   */
  @Cron(CronExpression.EVERY_6_HOURS)
  async retryFailedExecutions(): Promise<void> {
    this.logger.log(
      'Starting retry of failed recurring transaction executions'
    );

    try {
      await this.recurringTransactionService.retryFailedExecutions();
      this.logger.log('Completed retry of failed executions');
    } catch (error) {
      this.logger.error('Failed to retry failed executions', error);
    }
  }

  /**
   * Manual trigger for processing due transactions
   * Useful for testing or manual intervention
   */
  async triggerProcessing(): Promise<void> {
    this.logger.log('Manual trigger for processing due recurring transactions');
    await this.processDueRecurringTransactions();
  }

  /**
   * Manual trigger for retrying failed executions
   * Useful for testing or manual intervention
   */
  async triggerRetry(): Promise<void> {
    this.logger.log('Manual trigger for retrying failed executions');
    await this.retryFailedExecutions();
  }
}
