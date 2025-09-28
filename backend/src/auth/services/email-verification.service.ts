import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PasswordService } from './password.service';

@Injectable()
export class EmailVerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
  ) {}

  async createVerificationToken(userId: string): Promise<string> {
    const token = this.passwordService.generateRandomToken(32);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.prisma.emailVerification.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });

    return token;
  }

  async verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
    const verification = await this.prisma.emailVerification.findFirst({
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

    if (!verification) {
      return {
        success: false,
        message: 'Invalid or expired verification token',
      };
    }

    // Mark verification as used
    await this.prisma.emailVerification.update({
      where: { id: verification.id },
      data: { isUsed: true },
    });

    // Update user email verification status
    await this.prisma.user.update({
      where: { id: verification.userId },
      data: { emailVerified: true },
    });

    return {
      success: true,
      message: 'Email verified successfully',
    };
  }

  async isEmailVerified(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { emailVerified: true },
    });

    return user?.emailVerified || false;
  }

  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.prisma.emailVerification.deleteMany({
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
