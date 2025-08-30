import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { HouseholdRole } from '@prisma/client';
import { HouseholdService } from './household.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { HouseholdAccessGuard } from './guards/household-access.guard';
import { HouseholdRoles } from './decorators/household-roles.decorator';
import {
  CreateHouseholdDto,
  UpdateHouseholdDto,
  InviteMemberDto,
  UpdateMemberDto,
  HouseholdFiltersDto,
  ViewType,
} from './dto';

@Controller('households')
export class HouseholdController {
  constructor(private readonly householdService: HouseholdService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createHouseholdDto: CreateHouseholdDto) {
    return this.householdService.create(createHouseholdDto);
  }

  @Get()
  async findUserHouseholds(@CurrentUser('id') userId: string) {
    return this.householdService.findUserHouseholds(userId);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.householdService.findById(id);
  }

  @Put(':id')
  @UseGuards(HouseholdAccessGuard)
  @HouseholdRoles(HouseholdRole.ADMIN)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateHouseholdDto: UpdateHouseholdDto,
  ) {
    return this.householdService.update(id, updateHouseholdDto);
  }

  @Delete(':id')
  @UseGuards(HouseholdAccessGuard)
  @HouseholdRoles(HouseholdRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.householdService.delete(id);
  }

  @Post(':id/members')
  @UseGuards(HouseholdAccessGuard)
  @HouseholdRoles(HouseholdRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async inviteMember(
    @Param('id', ParseUUIDPipe) householdId: string,
    @Body() inviteMemberDto: InviteMemberDto,
  ) {
    await this.householdService.inviteMember(householdId, inviteMemberDto);
    return { message: 'Member invited successfully' };
  }

  @Get(':id/members')
  async getMembers(@Param('id', ParseUUIDPipe) householdId: string) {
    return this.householdService.getMembers(householdId);
  }

  @Put(':id/members/:memberId')
  @UseGuards(HouseholdAccessGuard)
  @HouseholdRoles(HouseholdRole.ADMIN)
  async updateMember(
    @Param('id', ParseUUIDPipe) householdId: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Body() updateMemberDto: UpdateMemberDto,
  ) {
    await this.householdService.updateMemberRole(householdId, memberId, updateMemberDto);
    return { message: 'Member updated successfully' };
  }

  @Delete(':id/members/:memberId')
  @UseGuards(HouseholdAccessGuard)
  @HouseholdRoles(HouseholdRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMember(
    @Param('id', ParseUUIDPipe) householdId: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
  ) {
    await this.householdService.removeMember(householdId, memberId);
  }

  @Put(':id/settings')
  @UseGuards(HouseholdAccessGuard)
  @HouseholdRoles(HouseholdRole.ADMIN)
  async updateSettings(
    @Param('id', ParseUUIDPipe) householdId: string,
    @Body() settings: Record<string, any>,
  ) {
    return this.householdService.updateSettings(householdId, settings);
  }

  @Get(':id/filtered-data')
  async getFilteredData(
    @Param('id', ParseUUIDPipe) householdId: string,
    @Query('viewType') viewType: ViewType = ViewType.INDIVIDUAL,
  ) {
    return this.householdService.getFilteredData(householdId, viewType);
  }

  @Get(':id/permissions/:permission')
  async checkPermission(
    @Param('id', ParseUUIDPipe) householdId: string,
    @Param('permission') permission: string,
  ) {
    const hasPermission = await this.householdService.hasPermission(householdId, permission);
    return { hasPermission };
  }

  @Get(':id/role')
  async getUserRole(@Param('id', ParseUUIDPipe) householdId: string) {
    const role = await this.householdService.getUserRole(householdId);
    return { role };
  }

  @Get('permissions')
  async getAvailablePermissions() {
    return this.householdService.getAvailablePermissions();
  }

  @Get(':id/permissions')
  async getHouseholdPermissions(@Param('id', ParseUUIDPipe) householdId: string) {
    return this.householdService.getHouseholdPermissions(householdId);
  }
}
