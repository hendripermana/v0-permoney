import { Injectable } from '@nestjs/common';
import { Household, HouseholdMember, Prisma, $Enums } from '@prisma/client';
import { AbstractBaseRepository } from '../common/base/base.repository';
import { CreateHouseholdDto, UpdateHouseholdDto, ViewType } from './dto';

export interface HouseholdWithMembers extends Household {
  members: (HouseholdMember & {
    user: {
      id: string;
      name: string;
      email: string;
      avatarUrl: string | null;
    };
  })[];
}

@Injectable()
export class HouseholdRepository extends AbstractBaseRepository<
  Household,
  CreateHouseholdDto,
  UpdateHouseholdDto
> {
  async create(data: CreateHouseholdDto): Promise<Household> {
    return this.prisma.household.create({
      data,
    });
  }

  async findById(id: string): Promise<HouseholdWithMembers | null> {
    return this.prisma.household.findUnique({
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
      },
    });
  }

  async findMany(filters?: any): Promise<HouseholdWithMembers[]> {
    const where = this.buildWhereClause(filters || {});
    
    return this.prisma.household.findMany({
      where,
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
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByUserId(userId: string): Promise<HouseholdWithMembers[]> {
    return this.prisma.household.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
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
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, data: UpdateHouseholdDto): Promise<Household> {
    return this.prisma.household.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.household.delete({
      where: { id },
    });
  }

  async addMember(
    householdId: string,
    userId: string,
    role: $Enums.HouseholdRole,
    permissions: string[] = []
  ): Promise<HouseholdMember> {
    return this.prisma.householdMember.create({
      data: {
        householdId,
        userId,
        role,
        permissions,
      },
    });
  }

  async updateMember(
    householdId: string,
    userId: string,
    data: { role?: $Enums.HouseholdRole; permissions?: string[] }
  ): Promise<HouseholdMember> {
    return this.prisma.householdMember.update({
      where: {
        userId_householdId: {
          userId,
          householdId,
        },
      },
      data,
    });
  }

  async removeMember(householdId: string, userId: string): Promise<void> {
    await this.prisma.householdMember.delete({
      where: {
        userId_householdId: {
          userId,
          householdId,
        },
      },
    });
  }

  async findMember(
    householdId: string,
    userId: string
  ): Promise<HouseholdMember | null> {
    return this.prisma.householdMember.findUnique({
      where: {
        userId_householdId: {
          userId,
          householdId,
        },
      },
    });
  }

  async getMembersByHousehold(householdId: string): Promise<
    (HouseholdMember & {
      user: {
        id: string;
        name: string;
        email: string;
        avatarUrl: string | null;
      };
    })[]
  > {
    return this.prisma.householdMember.findMany({
      where: { householdId },
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
      orderBy: { joinedAt: 'asc' },
    });
  }

  async getUserRole(householdId: string, userId: string): Promise<$Enums.HouseholdRole | null> {
    const member = await this.findMember(householdId, userId);
    return member?.role || null;
  }

  async hasPermission(
    householdId: string,
    userId: string,
    permission: string
  ): Promise<boolean> {
    const member = await this.findMember(householdId, userId);
    if (!member) return false;

    // ADMIN has all permissions
    if (member.role === $Enums.HouseholdRole.ADMIN) return true;

    // Check specific permissions
    const permissions = Array.isArray(member.permissions) 
      ? member.permissions as string[]
      : [];
    
    return permissions.includes(permission);
  }

  async getFilteredData(
    householdId: string,
    userId: string,
    viewType: ViewType
  ): Promise<{
    allowedUserIds: string[];
    allowedAccountIds: string[];
  }> {
    const household = await this.findById(householdId);
    if (!household) {
      return { allowedUserIds: [], allowedAccountIds: [] };
    }

    const currentMember = household.members.find(m => m.userId === userId);
    if (!currentMember) {
      return { allowedUserIds: [], allowedAccountIds: [] };
    }

    let allowedUserIds: string[] = [];
    
    switch (viewType) {
      case ViewType.INDIVIDUAL:
        allowedUserIds = [userId];
        break;
        
      case ViewType.PARTNER_ONLY:
        // Include user and their partner (ADMIN/PARTNER roles)
        allowedUserIds = household.members
          .filter(m => 
            m.userId === userId || 
            [$Enums.HouseholdRole.ADMIN, $Enums.HouseholdRole.PARTNER, $Enums.HouseholdRole.FINANCE_STAFF].includes(m.role)
          )
          .map(m => m.userId);
        break;
        
      case ViewType.COMBINED:
        // Include all household members
        allowedUserIds = household.members.map(m => m.userId);
        break;
        
      default:
        allowedUserIds = [userId];
    }

    // Get account IDs that belong to allowed users or are shared
    const allowedAccountIds = await this.prisma.account
      .findMany({
        where: {
          householdId,
          OR: [
            { ownerId: { in: allowedUserIds } },
            { ownerId: null }, // Shared accounts
          ],
        },
        select: { id: true },
      })
      .then(accounts => accounts.map(a => a.id));

    return { allowedUserIds, allowedAccountIds };
  }
}
