import { Injectable, Logger } from '@nestjs/common'
import { createClerkClient } from '@clerk/backend'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'

type HouseholdRoleValue = 'ADMIN' | 'PARTNER' | 'FINANCE_STAFF'

interface ResolvedUserContext {
  userId: string
  householdId: string
}

@Injectable()
export class UserContextService {
  private readonly clerk = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY!,
  });

  private readonly logger = new Logger(UserContextService.name);

  constructor(private readonly prisma: PrismaService) {}

  async resolveUserContext(clerkUserId: string): Promise<ResolvedUserContext> {
    if (!clerkUserId) {
      throw new Error('Clerk user ID is required to resolve user context');
    }

    const clerkUser = await this.fetchClerkUser(clerkUserId);
    const user = await this.findOrCreateUser(clerkUserId, clerkUser);
    const preferredHouseholdId = this.extractPreferredHouseholdId(clerkUser);
    const householdId = await this.ensureHouseholdMembership(user.id, preferredHouseholdId, clerkUserId);

    return { userId: user.id, householdId }
  }

  private async fetchClerkUser(clerkUserId: string): Promise<any> {
    try {
      return await this.clerk.users.getUser(clerkUserId);
    } catch (error) {
      this.logger.error(`Failed to retrieve Clerk user ${clerkUserId}`, error as Error);
      throw error;
    }
  }

  private async findOrCreateUser(clerkUserId: string, clerkUser: any) {
    const primaryEmail = this.extractPrimaryEmail(clerkUser);
    const fullName = [clerkUser?.firstName, clerkUser?.lastName]
      .filter(Boolean)
      .join(' ') || primaryEmail?.split('@')[0] || 'User';

    const existingUser = await this.prisma.user.findUnique({ where: { clerkId: clerkUserId } });

    if (existingUser) {
      // Optionally keep user data in sync with Clerk
      const shouldUpdate =
        (primaryEmail && existingUser.email !== primaryEmail.toLowerCase()) ||
        (fullName && existingUser.name !== fullName) ||
        (clerkUser?.imageUrl && existingUser.avatarUrl !== clerkUser.imageUrl);

      if (shouldUpdate) {
        return this.prisma.user.update({
          where: { id: existingUser.id },
          data: {
            email: primaryEmail?.toLowerCase() ?? existingUser.email,
            name: fullName,
            avatarUrl: clerkUser?.imageUrl ?? existingUser.avatarUrl,
            updatedAt: new Date(),
          },
        });
      }

      return existingUser;
    }

    return this.prisma.user.create({
      data: {
        clerkId: clerkUserId,
        email: primaryEmail?.toLowerCase() ?? `${clerkUserId}@unknown.local`,
        name: fullName,
        avatarUrl: clerkUser?.imageUrl ?? null,
        emailVerified: true,
        isActive: true,
      },
    });
  }

  private extractPrimaryEmail(clerkUser: any): string | undefined {
    if (!clerkUser) return undefined;

    if (clerkUser.primaryEmailAddressId) {
      return clerkUser.emailAddresses?.find((email: any) => email.id === clerkUser.primaryEmailAddressId)?.emailAddress;
    }

    return clerkUser.emailAddresses?.[0]?.emailAddress;
  }

  private extractPreferredHouseholdId(clerkUser: any): string | undefined {
    const metadata = clerkUser?.unsafeMetadata ?? {};
    const householdId = metadata.primaryHouseholdId;
    return typeof householdId === 'string' && householdId.trim().length > 0 ? householdId : undefined;
  }

  private async ensureHouseholdMembership(
    userId: string,
    preferredHouseholdId: string | undefined,
    clerkUserId: string,
  ): Promise<string> {
    if (preferredHouseholdId) {
      const preferredMembership = await this.prisma.householdMember.findFirst({
        where: { userId, householdId: preferredHouseholdId },
      });

      if (preferredMembership) {
        return preferredMembership.householdId;
      }
    }

    const existingMembership = await this.prisma.householdMember.findFirst({
      where: { userId },
      orderBy: { joinedAt: 'asc' },
    })

    if (existingMembership) {
      return existingMembership.householdId;
    }

    const household = await this.prisma.household.create({
      data: {
        name: 'Personal',
        settings: {},
      },
    });

    await this.prisma.householdMember.create({
      data: {
        householdId: household.id,
        userId,
        role: 'ADMIN' as HouseholdRoleValue,
        permissions: [],
      },
    })

    this.logger.log(`Created default household for Clerk user ${clerkUserId}`);

    return household.id;
  }
}
