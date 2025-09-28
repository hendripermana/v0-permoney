import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';
import { RequestContextService } from '../../common/services/request-context.service';
import { createClerkClient } from '@clerk/backend';

@Injectable()
export class UserContextInterceptor implements NestInterceptor {
  private readonly clerk = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY!,
  });

  constructor(
    private readonly prisma: PrismaService,
    private readonly requestContext: RequestContextService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const ctxType = context.getType<'http' | 'graphql' | 'ws' | 'rpc'>();

    // Only for HTTP/GraphQL
    if (ctxType !== 'http' && ctxType !== 'graphql') {
      return next.handle();
    }

    const request = ctxType === 'http'
      ? context.switchToHttp().getRequest()
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      : require('@nestjs/graphql').GqlExecutionContext.create(context).getContext().req;

    const authUser = request?.user;

    if (authUser?.id) {
      // Ensure DB user exists and populate household context
      const { userId, householdId } = await this.ensureUserAndHousehold(authUser.id);

      // Populate request.user and RequestContextService
      request.user.userId = userId;
      request.user.householdId = householdId;

      this.requestContext.setUserId(userId);
      this.requestContext.setHouseholdId(householdId);
    }

    return next.handle();
  }

  private async ensureUserAndHousehold(clerkUserId: string): Promise<{ userId: string; householdId: string }> {
    // Find or create user linked to Clerk
    let user = await this.prisma.user.findUnique({ where: { clerkId: clerkUserId } });

    if (!user) {
      // Fetch user from Clerk for email/name
      const clerkUser = await this.clerk.users.getUser(clerkUserId);
      const primaryEmail = clerkUser?.primaryEmailAddressId
        ? clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId)?.emailAddress
        : clerkUser?.emailAddresses?.[0]?.emailAddress;

      user = await this.prisma.user.create({
        data: {
          clerkId: clerkUserId,
          email: (primaryEmail || '').toLowerCase(),
          name: [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ') || (primaryEmail?.split('@')[0] || 'User'),
          avatarUrl: clerkUser?.imageUrl || null,
          emailVerified: true,
          isActive: true,
        },
      });
    }

    // Determine current household context: pick first membership if exists; otherwise create default
    let membership = await this.prisma.householdMember.findFirst({ where: { userId: user.id } });

    if (!membership) {
      const household = await this.prisma.household.create({
        data: {
          name: 'Personal',
          settings: {},
        },
      });

      membership = await this.prisma.householdMember.create({
        data: {
          householdId: household.id,
          userId: user.id,
          role: 'ADMIN',
          permissions: [],
        },
      });
    }

    return { userId: user.id, householdId: membership.householdId };
  }
}
