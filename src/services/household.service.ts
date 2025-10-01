import { Prisma, Household, HouseholdRole } from '@prisma/client';
import { BaseService } from './base.service';
import { CACHE_TTL } from '@/lib/redis';

export interface CreateHouseholdData {
  name: string;
  baseCurrency?: string;
  countryCode?: string;
  timezone?: string;
  locale?: string;
  description?: string;
  settings?: Record<string, any>;
}

export interface UpdateHouseholdData {
  name?: string;
  baseCurrency?: string;
  countryCode?: string;
  timezone?: string;
  locale?: string;
  description?: string;
  settings?: Record<string, any>;
}

export interface HouseholdWithMembers extends Household {
  members: Array<{
    id: string;
    userId: string;
    role: HouseholdRole;
    permissions: any;
    joinedAt: Date;
    user: {
      id: string;
      name: string;
      email: string;
      avatarUrl?: string;
    };
  }>;
  _count?: {
    members: number;
    accounts: number;
    transactions: number;
  };
}

export interface AddMemberData {
  userId: string;
  role: HouseholdRole;
  permissions?: any[];
}

export interface UpdateMemberData {
  role?: HouseholdRole;
  permissions?: any[];
}

export class HouseholdService extends BaseService {
  async createHousehold(
    userId: string,
    data: CreateHouseholdData
  ): Promise<HouseholdWithMembers> {
    try {
      this.validateRequired(data, ['name']);

      const result = await this.prisma.$transaction(async (tx) => {
        // Create household
        const household = await tx.household.create({
          data: {
            name: data.name,
            baseCurrency: data.baseCurrency || 'IDR',
            settings: data.settings || {},
          },
        });

        // Add creator as admin
        await tx.householdMember.create({
          data: {
            userId,
            householdId: household.id,
            role: 'ADMIN',
            permissions: [],
          },
        });

        return household;
      });

      return this.getHouseholdById(result.id);
    } catch (error) {
      return this.handleError(error, 'Failed to create household');
    }
  }

  async getHouseholdById(id: string): Promise<HouseholdWithMembers> {
    try {
      const household = await this.prisma.household.findUnique({
        where: { id },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatarUrl: true,
                },
              },
            },
          },
          _count: {
            select: {
              members: true,
              accounts: true,
              transactions: true,
            },
          },
        },
      });

      if (!household) {
        throw new Error('Household not found');
      }

      return household as HouseholdWithMembers;
    } catch (error) {
      return this.handleError(error, 'Failed to fetch household');
    }
  }

  async getUserHouseholds(userId: string): Promise<HouseholdWithMembers[]> {
    try {
      const memberships = await this.prisma.householdMember.findMany({
        where: { userId },
        include: {
          household: {
            include: {
              members: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      avatarUrl: true,
                    },
                  },
                },
              },
              _count: {
                select: {
                  members: true,
                  accounts: true,
                  transactions: true,
                },
              },
            },
          },
        },
      });

      return memberships.map(m => m.household as HouseholdWithMembers);
    } catch (error) {
      return this.handleError(error, 'Failed to fetch user households');
    }
  }

  async updateHousehold(
    id: string,
    data: UpdateHouseholdData
  ): Promise<HouseholdWithMembers> {
    try {
      await this.prisma.household.update({
        where: { id },
        data,
      });

      return this.getHouseholdById(id);
    } catch (error) {
      return this.handleError(error, 'Failed to update household');
    }
  }

  async deleteHousehold(id: string): Promise<void> {
    try {
      await this.prisma.household.delete({ where: { id } });
    } catch (error) {
      return this.handleError(error, 'Failed to delete household');
    }
  }

  async addMember(
    householdId: string,
    data: AddMemberData
  ): Promise<HouseholdWithMembers> {
    try {
      this.validateRequired(data, ['userId', 'role']);

      await this.prisma.householdMember.create({
        data: {
          householdId,
          userId: data.userId,
          role: data.role,
          permissions: data.permissions || [],
        },
      });

      return this.getHouseholdById(householdId);
    } catch (error) {
      return this.handleError(error, 'Failed to add member');
    }
  }

  async updateMember(
    householdId: string,
    userId: string,
    data: UpdateMemberData
  ): Promise<HouseholdWithMembers> {
    try {
      await this.prisma.householdMember.updateMany({
        where: { householdId, userId },
        data,
      });

      return this.getHouseholdById(householdId);
    } catch (error) {
      return this.handleError(error, 'Failed to update member');
    }
  }

  async removeMember(householdId: string, userId: string): Promise<void> {
    try {
      await this.prisma.householdMember.deleteMany({
        where: { householdId, userId },
      });
    } catch (error) {
      return this.handleError(error, 'Failed to remove member');
    }
  }
}

export const householdService = new HouseholdService();
