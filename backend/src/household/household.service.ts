import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Logger
} from '@nestjs/common';
import { HouseholdRole } from '../../../node_modules/.prisma/client';
import { AbstractBaseService } from '../common/base/base.service';
import { PrismaService } from '../prisma/prisma.service';
import { RequestContextService } from '../common/services/request-context.service';
import { HouseholdRepository, HouseholdWithMembers } from './household.repository';
import { PermissionsService } from './services/permissions.service';
import { 
  CreateHouseholdDto, 
  UpdateHouseholdDto, 
  InviteMemberDto, 
  UpdateMemberDto,
  ViewType 
} from './dto';
import { HOUSEHOLD_PERMISSIONS, DEFAULT_ROLE_PERMISSIONS } from './constants/permissions';

@Injectable()
export class HouseholdService {
  private readonly logger = new Logger(HouseholdService.name);

  constructor(
    private readonly householdRepository: HouseholdRepository,
    private readonly prisma: PrismaService,
    private readonly requestContext: RequestContextService,
    private readonly permissionsService: PermissionsService,
  ) {}

  async create(data: CreateHouseholdDto): Promise<HouseholdWithMembers> {
    const userId = this.requestContext.getUserId();
    if (!userId) {
      throw new BadRequestException('User context required');
    }

    // Create household and add creator as ADMIN
    const household = await this.prisma.$transaction(async (tx) => {
      const newHousehold = await tx.household.create({
        data,
      });

      await tx.householdMember.create({
        data: {
          householdId: newHousehold.id,
          userId,
          role: HouseholdRole.ADMIN,
          permissions: [], // ADMIN has all permissions by default
        },
      });

      return newHousehold;
    });

    // Return household with members
    return this.householdRepository.findById(household.id) as Promise<HouseholdWithMembers>;
  }

  async getHouseholdById(id: string): Promise<HouseholdWithMembers | null> {
    return this.householdRepository.findById(id);
  }

  async updateHousehold(id: string, data: UpdateHouseholdDto): Promise<HouseholdWithMembers> {
    const updated = await this.householdRepository.update(id, data);
    return this.householdRepository.findById(id) as Promise<HouseholdWithMembers>;
  }

  async deleteHousehold(id: string): Promise<void> {
    return this.householdRepository.delete(id);
  }

  async findUserHouseholds(userId?: string): Promise<HouseholdWithMembers[]> {
    const targetUserId = userId || this.requestContext.getUserId();
    if (!targetUserId) {
      throw new BadRequestException('User context required');
    }

    return this.householdRepository.findByUserId(targetUserId);
  }

  async inviteMember(householdId: string, inviteData: InviteMemberDto): Promise<void> {
    const userId = this.requestContext.getUserId();
    if (!userId) {
      throw new BadRequestException('User context required');
    }

    // Check if current user has permission to invite members
    await this.validateAdminPermission(householdId, userId);

    // Check if user exists
    const invitedUser = await this.prisma.user.findUnique({
      where: { email: inviteData.email.toLowerCase() },
    });

    if (!invitedUser) {
      throw new NotFoundException('User not found');
    }

    // Check if user is already a member
    const existingMember = await this.householdRepository.findMember(
      householdId,
      invitedUser.id
    );

    if (existingMember) {
      throw new ConflictException('User is already a member of this household');
    }

    // Add member to household with default permissions for their role
    const defaultPermissions = DEFAULT_ROLE_PERMISSIONS[inviteData.role] || [];
    const permissions = inviteData.permissions && inviteData.permissions.length > 0 
      ? inviteData.permissions 
      : defaultPermissions;

    await this.householdRepository.addMember(
      householdId,
      invitedUser.id,
      inviteData.role,
      permissions as string[]
    );

    this.logger.log(`User ${invitedUser.email} invited to household ${householdId} with role ${inviteData.role}`);
  }

  async updateMemberRole(
    householdId: string,
    memberId: string,
    updateData: UpdateMemberDto
  ): Promise<void> {
    const userId = this.requestContext.getUserId();
    if (!userId) {
      throw new BadRequestException('User context required');
    }

    // Check if current user has permission to update member roles
    await this.validateAdminPermission(householdId, userId);

    // Prevent self-demotion from ADMIN if they're the only admin
    if (memberId === userId && updateData.role && updateData.role !== HouseholdRole.ADMIN) {
      const adminCount = await this.prisma.householdMember.count({
        where: {
          householdId,
          role: HouseholdRole.ADMIN,
        },
      });

      if (adminCount <= 1) {
        throw new BadRequestException('Cannot remove the last admin from household');
      }
    }

    // Update member
    await this.householdRepository.updateMember(householdId, memberId, updateData);

    this.logger.log(`Member ${memberId} role updated in household ${householdId}`);
  }

  async removeMember(householdId: string, memberId: string): Promise<void> {
    const userId = this.requestContext.getUserId();
    if (!userId) {
      throw new BadRequestException('User context required');
    }

    // Check if current user has permission to remove members
    await this.validateAdminPermission(householdId, userId);

    // Prevent removing the last admin
    const member = await this.householdRepository.findMember(householdId, memberId);
    if (member?.role === HouseholdRole.ADMIN) {
      const adminCount = await this.prisma.householdMember.count({
        where: {
          householdId,
          role: HouseholdRole.ADMIN,
        },
      });

      if (adminCount <= 1) {
        throw new BadRequestException('Cannot remove the last admin from household');
      }
    }

    await this.householdRepository.removeMember(householdId, memberId);

    this.logger.log(`Member ${memberId} removed from household ${householdId}`);
  }

  async getMembers(householdId: string) {
    const userId = this.requestContext.getUserId();
    if (!userId) {
      throw new BadRequestException('User context required');
    }

    // Check if user is a member of the household
    await this.validateMembership(householdId, userId);

    return this.householdRepository.getMembersByHousehold(householdId);
  }

  async updateSettings(
    householdId: string,
    settings: Record<string, any>
  ): Promise<HouseholdWithMembers> {
    const userId = this.requestContext.getUserId();
    if (!userId) {
      throw new BadRequestException('User context required');
    }

    // Check if user has permission to update settings
    await this.validateAdminPermission(householdId, userId);

    const household = await this.householdRepository.update(householdId, { settings });
    return this.householdRepository.findById(household.id) as Promise<HouseholdWithMembers>;
  }

  async getFilteredData(householdId: string, viewType: ViewType) {
    const userId = this.requestContext.getUserId();
    if (!userId) {
      throw new BadRequestException('User context required');
    }

    // Check if user is a member of the household
    await this.validateMembership(householdId, userId);

    return this.householdRepository.getFilteredData(householdId, userId, viewType);
  }

  async hasPermission(
    householdId: string,
    permission: string,
    userId?: string
  ): Promise<boolean> {
    const targetUserId = userId || this.requestContext.getUserId();
    if (!targetUserId) {
      return false;
    }

    return this.householdRepository.hasPermission(householdId, targetUserId, permission);
  }

  async getUserRole(householdId: string, userId?: string): Promise<HouseholdRole | null> {
    const targetUserId = userId || this.requestContext.getUserId();
    if (!targetUserId) {
      return null;
    }

    return this.householdRepository.getUserRole(householdId, targetUserId);
  }

  async getAvailablePermissions() {
    return {
      permissions: this.permissionsService.getAllPermissions(),
      permissionsByCategory: this.permissionsService.getPermissionsByCategory(),
      roleDefaults: DEFAULT_ROLE_PERMISSIONS,
    };
  }

  async getHouseholdPermissions(householdId: string) {
    const userId = this.requestContext.getUserId();
    if (!userId) {
      throw new BadRequestException('User context required');
    }

    // Check if user is a member of the household
    await this.validateMembership(householdId, userId);

    const member = await this.householdRepository.findMember(householdId, userId);
    if (!member) {
      return { permissions: [], role: null };
    }

    const permissions = Array.isArray(member.permissions) 
      ? member.permissions as string[]
      : [];

    return {
      permissions,
      role: member.role,
      permissionDescriptions: permissions.reduce((acc, permission) => {
        acc[permission] = this.permissionsService.getPermissionDescription(permission as any);
        return acc;
      }, {} as Record<string, string>),
    };
  }

  private async validateMembership(householdId: string, userId: string): Promise<void> {
    const member = await this.householdRepository.findMember(householdId, userId);
    if (!member) {
      throw new ForbiddenException('Access denied: Not a member of this household');
    }
  }

  private async validateAdminPermission(householdId: string, userId: string): Promise<void> {
    const role = await this.householdRepository.getUserRole(householdId, userId);
    if (role !== HouseholdRole.ADMIN) {
      throw new ForbiddenException('Access denied: Admin role required');
    }
  }

  protected async validateCreateData(data: CreateHouseholdDto): Promise<void> {
    if (!data.name?.trim()) {
      throw new BadRequestException('Household name is required');
    }

    if (data.name.length > 255) {
      throw new BadRequestException('Household name must be less than 255 characters');
    }
  }

  protected async validateUpdateData(id: string, data: UpdateHouseholdDto): Promise<void> {
    if (data.name !== undefined) {
      if (!data.name?.trim()) {
        throw new BadRequestException('Household name cannot be empty');
      }

      if (data.name.length > 255) {
        throw new BadRequestException('Household name must be less than 255 characters');
      }
    }
  }

  protected async validateDelete(id: string): Promise<void> {
    const userId = this.requestContext.getUserId();
    if (!userId) {
      throw new BadRequestException('User context required');
    }

    // Only allow deletion if user is the sole admin
    const members = await this.householdRepository.getMembersByHousehold(id);
    const admins = members.filter(m => m.role === HouseholdRole.ADMIN);
    
    if (admins.length !== 1 || admins[0].userId !== userId) {
      throw new ForbiddenException('Only the sole admin can delete a household');
    }

    // Check if household has any financial data
    const [accountCount, transactionCount] = await Promise.all([
      this.prisma.account.count({ where: { householdId: id } }),
      this.prisma.transaction.count({ where: { householdId: id } }),
    ]);

    if (accountCount > 0 || transactionCount > 0) {
      throw new BadRequestException(
        'Cannot delete household with existing accounts or transactions'
      );
    }
  }
}
