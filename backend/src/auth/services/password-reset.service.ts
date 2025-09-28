import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PasswordService } from './password.service';

@Injectable()
export class PasswordResetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
  ) {}

  async createResetToken(email: string): Promise<{ success: boolean; message: string; token?: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists or not
      return {
        success: true,
        message: 'If the email exists, a password reset link has been sent',
      };
    }

    const token = this.passwordService.generateRandomToken(32);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Deactivate any existing reset tokens for this user
    await this.prisma.passwordReset.updateMany({
      where: {
        userId: user.id,
        isUsed: false,
      },
      data: { isUsed: true },
    });

    // Create new reset token
    await this.prisma.passwordReset.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    return {
      success: true,
      message: 'Password reset token created successfully',
      token, // In production, this would be sent via email
    };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const reset = await this.prisma.passwordReset.findFirst({
      where: {
        token,
        isUsed: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });

    if (!reset) {
      return {
        success: false,
        message: 'Invalid or expired reset token',
      };
    }

    // Validate password strength
    const validation = this.passwordService.validatePasswordStrength(newPassword);
    if (!validation.isValid) {
      return {
        success: false,
        message: `Password validation failed: ${validation.errors.join(', ')}`,
      };
    }

    // Hash new password
    const hashedPassword = await this.passwordService.hashPassword(newPassword);

    // Update user password and mark reset as used
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: reset.userId },
        data: { passwordHash: hashedPassword },
      }),
      this.prisma.passwordReset.update({
        where: { id: reset.id },
        data: { isUsed: true },
      }),
    ]);

    // Deactivate all user sessions for security
    await this.prisma.session.updateMany({
      where: { userId: reset.userId, isActive: true },
      data: { isActive: false },
    });

    return {
      success: true,
      message: 'Password reset successfully',
    };
  }

  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.prisma.passwordReset.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { isUsed: true },
        ],
      },
    });

    return result.count;
  }
}
