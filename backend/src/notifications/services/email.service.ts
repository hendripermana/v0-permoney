import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationType } from '../types/notification.types';
import { RetryService } from '../../common/services/retry.service';
import { CircuitBreaker } from '../../common/patterns/circuit-breaker';
import { FallbackService } from '../../common/patterns/fallback.service';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private fallbackTransporter?: nodemailer.Transporter;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly retryService: RetryService,
    private readonly circuitBreaker: CircuitBreaker,
    private readonly fallbackService: FallbackService,
  ) {
    this.initializeTransporter();
    this.initializeFallbackTransporter();
  }

  private initializeTransporter() {
    const emailConfig = {
      host: this.configService.get('EMAIL_HOST', 'smtp.gmail.com'),
      port: this.configService.get('EMAIL_PORT', 587),
      secure: this.configService.get('EMAIL_SECURE', false),
      auth: {
        user: this.configService.get('EMAIL_USER'),
        pass: this.configService.get('EMAIL_PASSWORD'),
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    };

    this.transporter = nodemailer.createTransport(emailConfig);
  }

  private initializeFallbackTransporter() {
    const fallbackHost = this.configService.get('EMAIL_FALLBACK_HOST');
    if (fallbackHost) {
      const fallbackConfig = {
        host: fallbackHost,
        port: this.configService.get('EMAIL_FALLBACK_PORT', 587),
        secure: this.configService.get('EMAIL_FALLBACK_SECURE', false),
        auth: {
          user: this.configService.get('EMAIL_FALLBACK_USER'),
          pass: this.configService.get('EMAIL_FALLBACK_PASSWORD'),
        },
        pool: true,
        maxConnections: 3,
        maxMessages: 50,
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000,
      };

      this.fallbackTransporter = nodemailer.createTransport(fallbackConfig);
      this.logger.log('Fallback email transporter initialized');
    }
  }

  async sendNotificationEmail(
    to: string,
    type: NotificationType,
    data: {
      title: string;
      message: string;
      actionUrl?: string;
      actionText?: string;
      metadata?: Record<string, any>;
      userName?: string;
      householdName?: string;
    }
  ): Promise<boolean> {
    return this.circuitBreaker.execute(
      async () => {
        const result = await this.retryService.executeWithRetry(
          async () => {
            const template = await this.getEmailTemplate(type);
            if (!template) {
              this.logger.warn(`No email template found for notification type: ${type}`);
              return false;
            }

            const { subject, htmlContent, textContent } = this.processTemplate(template, data);

            const mailOptions = {
              from: this.configService.get('EMAIL_FROM', 'noreply@permoney.id'),
              to,
              subject,
              text: textContent,
              html: htmlContent,
            };

            // Try primary transporter with fallback
            const fallbackResult = await this.fallbackService.executeWithFallback(
              () => this.transporter.sendMail(mailOptions),
              {
                name: 'email-send',
                fallbackFunction: this.fallbackTransporter 
                  ? () => this.fallbackTransporter!.sendMail(mailOptions)
                  : undefined,
                gracefulDegradation: true,
                logFailures: true,
              }
            );

            if (fallbackResult.usedFallback) {
              this.logger.warn(`Email sent using fallback transporter to ${to} for notification type ${type}`);
            } else {
              this.logger.log(`Email sent successfully to ${to} for notification type ${type}`);
            }

            return true;
          },
          {
            maxRetries: 3,
            baseDelay: 2000,
            maxDelay: 30000,
            jitter: true,
            retryCondition: (error) => {
              // Retry on network errors and temporary SMTP errors
              return error.code === 'ECONNRESET' ||
                     error.code === 'ETIMEDOUT' ||
                     error.code === 'ENOTFOUND' ||
                     error.responseCode >= 400 && error.responseCode < 500;
            },
          }
        );

        if (!result.success) {
          throw result.lastError || new Error('Email sending failed after retries');
        }

        return result.result!;
      },
      {
        name: 'email-service',
        failureThreshold: 3,
        successThreshold: 2,
        timeout: 15000,
        resetTimeout: 120000,
      }
    );
  }

  async sendBulkEmails(
    recipients: Array<{
      email: string;
      type: NotificationType;
      data: any;
    }>
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const recipient of recipients) {
      const sent = await this.sendNotificationEmail(
        recipient.email,
        recipient.type,
        recipient.data
      );
      
      if (sent) {
        success++;
      } else {
        failed++;
      }
    }

    return { success, failed };
  }

  private async getEmailTemplate(type: NotificationType) {
    const template = await this.prisma.emailTemplate.findFirst({
      where: {
        type,
        isActive: true,
      },
    });

    if (!template) {
      // Return default template
      return this.getDefaultTemplate(type);
    }

    return template;
  }

  private getDefaultTemplate(type: NotificationType) {
    const templates = {
      [NotificationType.BUDGET_EXCEEDED]: {
        subject: 'Budget Alert: {{title}}',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">Budget Alert</h2>
            <p>Hi {{userName}},</p>
            <p>{{message}}</p>
            {{#if actionUrl}}
            <a href="{{actionUrl}}" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              {{actionText}}
            </a>
            {{/if}}
            <p>Best regards,<br>Permoney Team</p>
          </div>
        `,
        textContent: 'Hi {{userName}}, {{message}}',
      },
      [NotificationType.DEBT_PAYMENT_DUE]: {
        subject: 'Debt Payment Reminder: {{title}}',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f59e0b;">Payment Reminder</h2>
            <p>Hi {{userName}},</p>
            <p>{{message}}</p>
            {{#if actionUrl}}
            <a href="{{actionUrl}}" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              {{actionText}}
            </a>
            {{/if}}
            <p>Best regards,<br>Permoney Team</p>
          </div>
        `,
        textContent: 'Hi {{userName}}, {{message}}',
      },
      [NotificationType.ZAKAT_REMINDER]: {
        subject: 'Zakat Reminder: {{title}}',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #059669;">Zakat Reminder</h2>
            <p>Assalamu'alaikum {{userName}},</p>
            <p>{{message}}</p>
            {{#if actionUrl}}
            <a href="{{actionUrl}}" style="background-color: #059669; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              {{actionText}}
            </a>
            {{/if}}
            <p>Barakallahu fiik,<br>Permoney Team</p>
          </div>
        `,
        textContent: 'Assalamu\'alaikum {{userName}}, {{message}}',
      },
      [NotificationType.MONTHLY_REPORT_READY]: {
        subject: 'Your Monthly Financial Report is Ready',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #3b82f6;">Monthly Report Ready</h2>
            <p>Hi {{userName}},</p>
            <p>{{message}}</p>
            {{#if actionUrl}}
            <a href="{{actionUrl}}" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              {{actionText}}
            </a>
            {{/if}}
            <p>Best regards,<br>Permoney Team</p>
          </div>
        `,
        textContent: 'Hi {{userName}}, {{message}}',
      },
      [NotificationType.SECURITY_ALERT]: {
        subject: 'Security Alert: {{title}}',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">Security Alert</h2>
            <p>Hi {{userName}},</p>
            <p>{{message}}</p>
            {{#if actionUrl}}
            <a href="{{actionUrl}}" style="background-color: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              {{actionText}}
            </a>
            {{/if}}
            <p>If you didn't perform this action, please contact our support team immediately.</p>
            <p>Best regards,<br>Permoney Security Team</p>
          </div>
        `,
        textContent: 'Hi {{userName}}, {{message}}',
      },
    };

    return templates[type] || {
      subject: '{{title}}',
      htmlContent: '<p>{{message}}</p>',
      textContent: '{{message}}',
    };
  }

  private processTemplate(
    template: { subject: string; htmlContent: string; textContent: string },
    data: Record<string, unknown>
  ) {
    const processString = (str: string) => {
      return str.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return data[key] || match;
      });
    };

    return {
      subject: processString(template.subject),
      htmlContent: processString(template.htmlContent),
      textContent: processString(template.textContent),
    };
  }

  async testConnection(): Promise<boolean> {
    const result = await this.retryService.executeWithRetry(
      async () => {
        await this.transporter.verify();
        return true;
      },
      {
        maxRetries: 2,
        baseDelay: 1000,
        maxDelay: 5000,
        jitter: false,
      }
    );

    if (result.success) {
      this.logger.log('Email service connection verified successfully');
      
      // Also test fallback if available
      if (this.fallbackTransporter) {
        try {
          await this.fallbackTransporter.verify();
          this.logger.log('Fallback email service connection verified successfully');
        } catch (error) {
          this.logger.warn('Fallback email service connection failed:', error);
        }
      }
      
      return true;
    } else {
      this.logger.error('Email service connection failed:', result.lastError);
      return false;
    }
  }

  /**
   * Get circuit breaker statistics for monitoring
   */
  getCircuitBreakerStats() {
    return this.circuitBreaker.getStats('email-service');
  }

  /**
   * Reset circuit breaker manually
   */
  resetCircuitBreaker() {
    this.circuitBreaker.reset('email-service');
    this.logger.log('Email service circuit breaker reset manually');
  }
}
