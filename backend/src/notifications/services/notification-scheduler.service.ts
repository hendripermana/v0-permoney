import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications.service';
import { 
  NotificationType, 
  NotificationChannel, 
  NotificationPriority 
} from '../types/notification.types';

@Injectable()
export class NotificationSchedulerService {
  private readonly logger = new Logger(NotificationSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    @InjectQueue('notifications') private readonly notificationQueue: Queue,
  ) {}

  // Check for budget alerts every hour
  @Cron(CronExpression.EVERY_HOUR)
  async checkBudgetAlerts() {
    this.logger.log('Checking for budget alerts...');

    try {
      // Get active budgets that are close to or over their limits
      const budgets = await this.prisma.budget.findMany({
        where: {
          isActive: true,
          endDate: {
            gte: new Date(),
          },
        },
        include: {
          categories: true,
          household: {
            include: {
              members: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      });

      for (const budget of budgets) {
        for (const category of budget.categories) {
          const spentPercentage = (Number(category.spentAmountCents) / Number(category.allocatedAmountCents)) * 100;

          // Check for budget exceeded (100% or more)
          if (spentPercentage >= 100) {
            await this.createBudgetAlert(
              budget,
              category,
              NotificationType.BUDGET_EXCEEDED,
              spentPercentage
            );
          }
          // Check for budget warning (80% or more)
          else if (spentPercentage >= 80) {
            await this.createBudgetAlert(
              budget,
              category,
              NotificationType.BUDGET_WARNING,
              spentPercentage
            );
          }
        }
      }
    } catch (error) {
      this.logger.error('Error checking budget alerts:', error);
    }
  }

  // Check for debt payment reminders daily at 9 AM
  @Cron('0 9 * * *')
  async checkDebtPaymentReminders() {
    this.logger.log('Checking for debt payment reminders...');

    try {
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

      // This would require additional debt payment schedule logic
      // For now, we'll create a placeholder implementation
      const debts = await this.prisma.debt.findMany({
        where: {
          isActive: true,
          maturityDate: {
            lte: threeDaysFromNow,
            gte: new Date(),
          },
        },
        include: {
          household: {
            include: {
              members: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      });

      for (const debt of debts) {
        const daysUntilDue = Math.ceil(
          (debt.maturityDate!.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );

        for (const member of debt.household.members) {
          await this.notificationsService.createNotification({
            userId: member.user.id,
            householdId: debt.householdId,
            type: NotificationType.DEBT_PAYMENT_DUE,
            title: 'Debt Payment Due Soon',
            message: `Your debt "${debt.name}" is due in ${daysUntilDue} days. Amount: ${this.formatCurrency(debt.currentBalanceCents, debt.currency)}`,
            actionUrl: `/debts/${debt.id}`,
            actionText: 'View Debt Details',
            channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
            priority: NotificationPriority.HIGH,
            metadata: {
              debtId: debt.id,
              daysUntilDue,
              amount: debt.currentBalanceCents,
              currency: debt.currency,
            },
          });
        }
      }
    } catch (error) {
      this.logger.error('Error checking debt payment reminders:', error);
    }
  }

  // Check for Zakat reminders monthly on the 1st at 9 AM
  @Cron('0 9 1 * *')
  async checkZakatReminders() {
    this.logger.log('Checking for Zakat reminders...');

    try {
      const zakatCalculations = await this.prisma.zakatCalculation.findMany({
        where: {
          isZakatDue: true,
          nextCalculationDate: {
            lte: new Date(),
          },
        },
        include: {
          household: {
            include: {
              members: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      });

      for (const calculation of zakatCalculations) {
        for (const member of calculation.household.members) {
          await this.notificationsService.createNotification({
            userId: member.user.id,
            householdId: calculation.householdId,
            type: NotificationType.ZAKAT_REMINDER,
            title: 'Zakat Payment Due',
            message: `Your Zakat calculation shows an amount due: ${this.formatCurrency(calculation.zakatAmountCents, calculation.currency)}`,
            actionUrl: `/islamic-finance/zakat/${calculation.id}`,
            actionText: 'View Zakat Details',
            channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
            priority: NotificationPriority.HIGH,
            metadata: {
              zakatCalculationId: calculation.id,
              amount: calculation.zakatAmountCents,
              currency: calculation.currency,
              hijriYear: calculation.hijriYear,
            },
          });
        }
      }
    } catch (error) {
      this.logger.error('Error checking Zakat reminders:', error);
    }
  }

  // Generate monthly reports on the 1st of each month at 8 AM
  @Cron('0 8 1 * *')
  async generateMonthlyReports() {
    this.logger.log('Generating monthly reports...');

    try {
      const households = await this.prisma.household.findMany({
        include: {
          members: {
            include: {
              user: true,
            },
          },
        },
      });

      for (const household of households) {
        // Queue monthly report generation for each household
        await this.notificationQueue.add('generate-monthly-report', {
          householdId: household.id,
        });

        // Notify household members that report is being generated
        for (const member of household.members) {
          await this.notificationsService.createNotification({
            userId: member.user.id,
            householdId: household.id,
            type: NotificationType.MONTHLY_REPORT_READY,
            title: 'Monthly Report Ready',
            message: `Your monthly financial report for ${household.name} is now available.`,
            actionUrl: `/reports/monthly`,
            actionText: 'View Report',
            channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
            priority: NotificationPriority.LOW,
            metadata: {
              reportMonth: new Date().getMonth(),
              reportYear: new Date().getFullYear(),
            },
          });
        }
      }
    } catch (error) {
      this.logger.error('Error generating monthly reports:', error);
    }
  }

  // Clean up old notifications weekly
  @Cron(CronExpression.EVERY_WEEK)
  async cleanupOldNotifications() {
    this.logger.log('Cleaning up old notifications...');

    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Delete read notifications older than 30 days
      const deletedCount = await this.prisma.notification.deleteMany({
        where: {
          status: 'READ',
          readAt: {
            lt: thirtyDaysAgo,
          },
        },
      });

      this.logger.log(`Cleaned up ${deletedCount.count} old notifications`);
    } catch (error) {
      this.logger.error('Error cleaning up old notifications:', error);
    }
  }

  private async createBudgetAlert(
    budget: any,
    category: any,
    type: NotificationType,
    spentPercentage: number
  ) {
    const isExceeded = type === NotificationType.BUDGET_EXCEEDED;
    const title = isExceeded ? 'Budget Exceeded!' : 'Budget Warning';
    const message = `Your ${budget.name} budget for category has ${isExceeded ? 'exceeded' : 'reached'} ${spentPercentage.toFixed(1)}% of the allocated amount.`;

    for (const member of budget.household.members) {
      // Check if we've already sent this alert recently (within 24 hours)
      const recentAlert = await this.prisma.notification.findFirst({
        where: {
          userId: member.user.id,
          type,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
          metadata: {
            path: ['budgetId'],
            equals: budget.id,
          },
        },
      });

      if (!recentAlert) {
        await this.notificationsService.createNotification({
          userId: member.user.id,
          householdId: budget.householdId,
          type,
          title,
          message,
          actionUrl: `/budgets/${budget.id}`,
          actionText: 'View Budget',
          channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
          priority: isExceeded ? NotificationPriority.HIGH : NotificationPriority.MEDIUM,
          metadata: {
            budgetId: budget.id,
            categoryId: category.id,
            spentPercentage,
            allocatedAmount: category.allocatedAmountCents,
            spentAmount: category.spentAmountCents,
          },
        });
      }
    }
  }

  private formatCurrency(amountCents: bigint, currency: string): string {
    const amount = Number(amountCents) / 100;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }

  // Manual trigger methods for testing
  async triggerBudgetCheck() {
    await this.checkBudgetAlerts();
  }

  async triggerDebtReminders() {
    await this.checkDebtPaymentReminders();
  }

  async triggerZakatReminders() {
    await this.checkZakatReminders();
  }

  async triggerMonthlyReports() {
    await this.generateMonthlyReports();
  }
}
