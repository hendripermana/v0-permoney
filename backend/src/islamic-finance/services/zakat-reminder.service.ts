import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { ZakatReminder, ZakatReminderType } from '../types/islamic-finance.types';
import { CreateZakatReminderDto, UpdateZakatReminderDto } from '../dto/zakat-calculation.dto';

@Injectable()
export class ZakatReminderService {
  private readonly logger = new Logger(ZakatReminderService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createReminder(dto: CreateZakatReminderDto): Promise<ZakatReminder> {
    this.logger.log(`Creating zakat reminder for household: ${dto.householdId}`);

    const reminder = await this.prisma.zakatReminder.create({
      data: {
        householdId: dto.householdId,
        reminderType: dto.reminderType,
        scheduledDate: new Date(dto.scheduledDate),
        hijriDate: dto.hijriDate,
        zakatAmountCents: dto.zakatAmount ? Math.round(dto.zakatAmount * 100) : null,
        currency: dto.zakatCurrency,
        message: dto.message,
        isActive: true,
        isSent: false
      }
    });

    return this.mapToZakatReminder(reminder);
  }

  async updateReminder(id: string, dto: UpdateZakatReminderDto): Promise<ZakatReminder> {
    const updateData: any = {};
    
    if (dto.scheduledDate) {
      updateData.scheduledDate = new Date(dto.scheduledDate);
    }
    if (dto.message) {
      updateData.message = dto.message;
    }
    if (dto.isActive !== undefined) {
      updateData.isActive = dto.isActive;
    }

    const reminder = await this.prisma.zakatReminder.update({
      where: { id },
      data: updateData
    });

    return this.mapToZakatReminder(reminder);
  }

  async getReminders(householdId: string, activeOnly = true): Promise<ZakatReminder[]> {
    const reminders = await this.prisma.zakatReminder.findMany({
      where: {
        householdId,
        ...(activeOnly && { isActive: true })
      },
      orderBy: { scheduledDate: 'asc' }
    });

    return reminders.map(reminder => this.mapToZakatReminder(reminder));
  }

  async getUpcomingReminders(householdId: string, daysAhead = 30): Promise<ZakatReminder[]> {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + daysAhead);

    const reminders = await this.prisma.zakatReminder.findMany({
      where: {
        householdId,
        isActive: true,
        isSent: false,
        scheduledDate: {
          lte: endDate
        }
      },
      orderBy: { scheduledDate: 'asc' }
    });

    return reminders.map(reminder => this.mapToZakatReminder(reminder));
  }

  async markReminderAsSent(id: string): Promise<void> {
    await this.prisma.zakatReminder.update({
      where: { id },
      data: {
        isSent: true,
        sentAt: new Date()
      }
    });
  }

  async deleteReminder(id: string): Promise<void> {
    await this.prisma.zakatReminder.delete({
      where: { id }
    });
  }

  // Automated reminder creation based on zakat calculations
  async createAutomaticReminders(householdId: string): Promise<void> {
    this.logger.log(`Creating automatic zakat reminders for household: ${householdId}`);

    const latestCalculation = await this.prisma.zakatCalculation.findFirst({
      where: { householdId },
      orderBy: { calculationDate: 'desc' }
    });

    if (!latestCalculation) {
      return;
    }

    // Create annual calculation reminder
    const nextCalculationDate = latestCalculation.nextCalculationDate;
    const calculationReminderDate = new Date(nextCalculationDate);
    calculationReminderDate.setDate(calculationReminderDate.getDate() - 30); // 30 days before

    await this.createReminderIfNotExists({
      householdId,
      reminderType: ZakatReminderType.ANNUAL_CALCULATION,
      scheduledDate: calculationReminderDate.toISOString(),
      hijriDate: this.convertToHijriDate(calculationReminderDate),
      message: 'Time to calculate your annual zakat. Review your assets and determine your zakat obligation.'
    });

    // Create payment due reminder if zakat is due
    if (latestCalculation.isZakatDue) {
      const paymentDueDate = new Date(latestCalculation.calculationDate);
      paymentDueDate.setDate(paymentDueDate.getDate() + 7); // 7 days after calculation

      await this.createReminderIfNotExists({
        householdId,
        reminderType: ZakatReminderType.PAYMENT_DUE,
        scheduledDate: paymentDueDate.toISOString(),
        hijriDate: this.convertToHijriDate(paymentDueDate),
        zakatAmount: Number(latestCalculation.zakatAmountCents) / 100,
        zakatCurrency: latestCalculation.currency,
        message: `Your zakat payment of ${latestCalculation.currency} ${Number(latestCalculation.zakatAmountCents) / 100} is due. Please make your payment to fulfill your religious obligation.`
      });
    }

    // Create haul completion reminders for assets approaching haul completion
    const assetBreakdown = await this.prisma.zakatAssetBreakdown.findMany({
      where: { zakatCalculationId: latestCalculation.id },
      include: { account: true }
    });

    for (const asset of assetBreakdown) {
      if (!asset.haulCompleted && asset.haulStartDate) {
        const haulCompletionDate = new Date(asset.haulStartDate);
        haulCompletionDate.setDate(haulCompletionDate.getDate() + 354); // Islamic lunar year

        const reminderDate = new Date(haulCompletionDate);
        reminderDate.setDate(reminderDate.getDate() - 7); // 7 days before haul completion

        if (reminderDate > new Date()) {
          await this.createReminderIfNotExists({
            householdId,
            reminderType: ZakatReminderType.HAUL_COMPLETION,
            scheduledDate: reminderDate.toISOString(),
            hijriDate: this.convertToHijriDate(reminderDate),
            message: `Your ${asset.accountName || asset.assetType} account will complete its haul period soon. This asset will become eligible for zakat calculation.`
          });
        }
      }
    }
  }

  // Cron job to process due reminders
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async processDueReminders(): Promise<void> {
    this.logger.log('Processing due zakat reminders');

    const dueReminders = await this.prisma.zakatReminder.findMany({
      where: {
        isActive: true,
        isSent: false,
        scheduledDate: {
          lte: new Date()
        }
      },
      include: { household: true }
    });

    for (const reminder of dueReminders) {
      try {
        // In a real implementation, this would send notifications via email, push notifications, etc.
        await this.sendReminderNotification(reminder);
        await this.markReminderAsSent(reminder.id);
        
        this.logger.log(`Sent zakat reminder ${reminder.id} to household ${reminder.householdId}`);
      } catch (error) {
        this.logger.error(`Failed to send zakat reminder ${reminder.id}:`, error);
      }
    }
  }

  // Cron job to create automatic reminders
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async createDailyAutomaticReminders(): Promise<void> {
    this.logger.log('Creating daily automatic zakat reminders');

    // Get all households that have zakat calculations
    const households = await this.prisma.household.findMany({
      where: {
        zakatCalculations: {
          some: {}
        }
      }
    });

    for (const household of households) {
      try {
        await this.createAutomaticReminders(household.id);
      } catch (error) {
        this.logger.error(`Failed to create automatic reminders for household ${household.id}:`, error);
      }
    }
  }

  private async createReminderIfNotExists(dto: CreateZakatReminderDto): Promise<void> {
    const existingReminder = await this.prisma.zakatReminder.findFirst({
      where: {
        householdId: dto.householdId,
        reminderType: dto.reminderType,
        scheduledDate: new Date(dto.scheduledDate),
        isActive: true
      }
    });

    if (!existingReminder) {
      await this.createReminder(dto);
    }
  }

  private async sendReminderNotification(reminder: any): Promise<void> {
    // In a real implementation, this would integrate with notification services
    // For now, we'll just log the reminder
    this.logger.log(`Zakat Reminder: ${reminder.message} (Household: ${reminder.householdId})`);
    
    // TODO: Integrate with:
    // - Email service
    // - Push notification service
    // - In-app notification system
    // - SMS service (optional)
  }

  private convertToHijriDate(gregorianDate: Date): string {
    // Simplified Hijri date conversion
    // In a real implementation, use a proper Hijri calendar library like moment-hijri
    const hijriYear = Math.floor((gregorianDate.getFullYear() - 622) * 1.030684);
    const hijriMonth = ((gregorianDate.getMonth() + 1) % 12) + 1;
    const hijriDay = gregorianDate.getDate();
    
    return `${hijriDay}/${hijriMonth}/${hijriYear} AH`;
  }

  private mapToZakatReminder(dbReminder: any): ZakatReminder {
    return {
      id: dbReminder.id,
      householdId: dbReminder.householdId,
      reminderType: dbReminder.reminderType,
      scheduledDate: dbReminder.scheduledDate,
      hijriDate: dbReminder.hijriDate,
      zakatAmount: dbReminder.zakatAmountCents ? {
        amount: Number(dbReminder.zakatAmountCents) / 100,
        currency: dbReminder.currency
      } : undefined,
      message: dbReminder.message,
      isActive: dbReminder.isActive,
      isSent: dbReminder.isSent,
      sentAt: dbReminder.sentAt,
      createdAt: dbReminder.createdAt,
      updatedAt: dbReminder.updatedAt
    };
  }
}
