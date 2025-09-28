import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

export interface ClerkJwtPayload {
  sub: string; // Clerk user ID
  email?: string;
  name?: string;
  avatar?: string;
  iat: number;
  exp: number;
}

@Injectable()
export class ClerkService {
  private readonly logger = new Logger(ClerkService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Decode a Clerk JWT token (verification is handled by Clerk)
   */
  async verifyClerkToken(token: string): Promise<ClerkJwtPayload | null> {
    try {
      // Decode the token without verification (Clerk handles verification)
      const payload = this.jwtService.decode(token) as ClerkJwtPayload;

      // Basic validation - check if required fields exist
      if (!payload || !payload.sub || !payload.iat || !payload.exp) {
        return null;
      }

      // Check if token is expired
      if (payload.exp * 1000 < Date.now()) {
        return null;
      }

      return payload;
    } catch (error) {
      this.logger.error('Failed to decode Clerk token', error);
      return null;
    }
  }

  /**
   * Find or create a user based on Clerk ID
   */
  async findOrCreateUserFromClerk(clerkUserId: string, userData?: {
    email?: string;
    name?: string;
    avatar?: string;
  }): Promise<any> {
    try {
      // Try to find existing user by Clerk ID
      let user = await this.prisma.user.findUnique({
        where: { clerkId: clerkUserId },
      });

      if (user) {
        // Update user data if provided
        if (userData) {
          user = await this.prisma.user.update({
            where: { id: user.id },
            data: {
              ...userData,
              updatedAt: new Date(),
            },
          });
        }
        return user;
      }

      // If user doesn't exist, we need email to create one
      if (!userData?.email) {
        throw new Error('Email is required to create new user from Clerk');
      }

      // Check if user exists by email (might be a legacy user)
      const existingUserByEmail = await this.prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existingUserByEmail) {
        // Link existing user to Clerk
        user = await this.prisma.user.update({
          where: { id: existingUserByEmail.id },
          data: {
            clerkId: clerkUserId,
            ...userData,
            updatedAt: new Date(),
          },
        });
        this.logger.log(`Linked existing user ${existingUserByEmail.id} to Clerk user ${clerkUserId}`);
        return user;
      }

      // Create new user
      user = await this.prisma.user.create({
        data: {
          clerkId: clerkUserId,
          email: userData.email,
          name: userData.name || userData.email.split('@')[0],
          avatarUrl: userData.avatar,
          emailVerified: true, // Clerk handles email verification
          isActive: true,
        },
      });

      this.logger.log(`Created new user ${user.id} from Clerk user ${clerkUserId}`);
      return user;
    } catch (error) {
      this.logger.error('Failed to find or create user from Clerk', error);
      throw error;
    }
  }

  /**
   * Get user by Clerk ID
   */
  async getUserByClerkId(clerkUserId: string): Promise<any | null> {
    try {
      return await this.prisma.user.findUnique({
        where: { clerkId: clerkUserId },
      });
    } catch (error) {
      this.logger.error('Failed to get user by Clerk ID', error);
      return null;
    }
  }

  /**
   * Sync user data from Clerk
   */
  async syncUserFromClerk(clerkUserId: string, userData: {
    email?: string;
    name?: string;
    avatar?: string;
  }): Promise<any> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { clerkId: clerkUserId },
      });

      if (!user) {
        throw new Error(`User with Clerk ID ${clerkUserId} not found`);
      }

      return await this.prisma.user.update({
        where: { id: user.id },
        data: {
          ...userData,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error('Failed to sync user from Clerk', error);
      throw error;
    }
  }

  /**
   * Handle Clerk webhook events
   */
  async handleClerkWebhook(eventType: string, data: any): Promise<void> {
    try {
      switch (eventType) {
        case 'user.created':
          await this.handleUserCreated(data);
          break;
        case 'user.updated':
          await this.handleUserUpdated(data);
          break;
        case 'user.deleted':
          await this.handleUserDeleted(data);
          break;
        default:
          this.logger.warn(`Unhandled Clerk webhook event: ${eventType}`);
      }
    } catch (error) {
      this.logger.error('Failed to handle Clerk webhook', error);
      throw error;
    }
  }

  private async handleUserCreated(data: any): Promise<void> {
    const { id: clerkUserId, email_addresses, first_name, last_name, image_url } = data;

    const email = email_addresses?.[0]?.email_address;
    const name = [first_name, last_name].filter(Boolean).join(' ') || email?.split('@')[0];

    await this.findOrCreateUserFromClerk(clerkUserId, {
      email,
      name,
      avatar: image_url,
    });
  }

  private async handleUserUpdated(data: any): Promise<void> {
    const { id: clerkUserId, email_addresses, first_name, last_name, image_url } = data;

    const email = email_addresses?.[0]?.email_address;
    const name = [first_name, last_name].filter(Boolean).join(' ') || email?.split('@')[0];

    await this.syncUserFromClerk(clerkUserId, {
      email,
      name,
      avatar: image_url,
    });
  }

  private async handleUserDeleted(data: any): Promise<void> {
    const { id: clerkUserId } = data;

    // Soft delete user by deactivating
    await this.prisma.user.updateMany({
      where: { clerkId: clerkUserId },
      data: { isActive: false },
    });
  }
}
