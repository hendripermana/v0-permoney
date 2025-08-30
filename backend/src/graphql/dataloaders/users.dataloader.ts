import { Injectable } from '@nestjs/common';
import DataLoader from 'dataloader';
import { PrismaService } from '../../prisma/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class UsersDataLoader {
  constructor(private prisma: PrismaService) {}

  // Batch load users by IDs
  private userLoader = new DataLoader<string, User | null>(
    async (userIds: readonly string[]) => {
      const users = await this.prisma.user.findMany({
        where: {
          id: { in: [...userIds] },
          isActive: true,
        },
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          // Exclude sensitive fields like passwordHash
        },
      });

      const userMap = new Map(users.map(user => [user.id, user]));
      return userIds.map(id => userMap.get(id) || null);
    },
  );

  // Batch load users by household ID
  private usersByHouseholdLoader = new DataLoader<string, User[]>(
    async (householdIds: readonly string[]) => {
      const householdMembers = await this.prisma.householdMember.findMany({
        where: {
          householdId: { in: [...householdIds] },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              avatarUrl: true,
              isActive: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
        orderBy: {
          joinedAt: 'asc',
        },
      });

      const usersByHousehold = new Map<string, User[]>();
      householdMembers.forEach(member => {
        if (member.user.isActive) {
          const existing = usersByHousehold.get(member.householdId) || [];
          existing.push(member.user);
          usersByHousehold.set(member.householdId, existing);
        }
      });

      return householdIds.map(id => usersByHousehold.get(id) || []);
    },
  );

  // Batch load user emails by IDs (for notifications)
  private userEmailLoader = new DataLoader<string, string | null>(
    async (userIds: readonly string[]) => {
      const users = await this.prisma.user.findMany({
        where: {
          id: { in: [...userIds] },
          isActive: true,
        },
        select: {
          id: true,
          email: true,
        },
      });

      const emailMap = new Map(users.map(user => [user.id, user.email]));
      return userIds.map(id => emailMap.get(id) || null);
    },
  );

  // Batch load user names by IDs (for display)
  private userNameLoader = new DataLoader<string, string | null>(
    async (userIds: readonly string[]) => {
      const users = await this.prisma.user.findMany({
        where: {
          id: { in: [...userIds] },
          isActive: true,
        },
        select: {
          id: true,
          name: true,
        },
      });

      const nameMap = new Map(users.map(user => [user.id, user.name]));
      return userIds.map(id => nameMap.get(id) || null);
    },
  );

  // Public methods
  async loadUser(id: string): Promise<User | null> {
    return this.userLoader.load(id);
  }

  async loadUsers(ids: string[]): Promise<(User | null)[]> {
    return this.userLoader.loadMany(ids);
  }

  async loadUsersByHousehold(householdId: string): Promise<User[]> {
    return this.usersByHouseholdLoader.load(householdId);
  }

  async loadUserEmail(id: string): Promise<string | null> {
    return this.userEmailLoader.load(id);
  }

  async loadUserEmails(ids: string[]): Promise<(string | null)[]> {
    return this.userEmailLoader.loadMany(ids);
  }

  async loadUserName(id: string): Promise<string | null> {
    return this.userNameLoader.load(id);
  }

  async loadUserNames(ids: string[]): Promise<(string | null)[]> {
    return this.userNameLoader.loadMany(ids);
  }

  // Clear cache methods
  clearUser(id: string): void {
    this.userLoader.clear(id);
    this.userEmailLoader.clear(id);
    this.userNameLoader.clear(id);
  }

  clearUsersByHousehold(householdId: string): void {
    this.usersByHouseholdLoader.clear(householdId);
  }

  clearAll(): void {
    this.userLoader.clearAll();
    this.usersByHouseholdLoader.clearAll();
    this.userEmailLoader.clearAll();
    this.userNameLoader.clearAll();
  }
}
