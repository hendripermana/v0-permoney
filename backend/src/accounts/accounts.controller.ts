import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { CreateAccountDto, UpdateAccountDto, AccountFiltersDto } from './dto';
import { HouseholdAccessGuard } from '../household/guards/household-access.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AccountType } from '@prisma/client';

interface UserPayload {
  sub: string;
  email: string;
  householdId: string;
}

@Controller('accounts')
@UseGuards(HouseholdAccessGuard)
export class AccountsController {
  constructor(private accountsService: AccountsService) {}

  @Post()
  async createAccount(
    @Body() createAccountDto: CreateAccountDto,
    @CurrentUser() user: UserPayload,
  ): Promise<any> {
    return this.accountsService.createAccount(
      user.householdId,
      createAccountDto,
      user.sub,
    );
  }

  @Get()
  async getAccounts(
    @Query() filters: AccountFiltersDto,
    @CurrentUser() user: UserPayload,
  ): Promise<any[]> {
    return this.accountsService.getAccountsByHousehold(
      user.householdId,
      filters,
      user.sub,
    );
  }

  @Get('grouped')
  async getAccountsGrouped(
    @Query() filters: AccountFiltersDto,
    @CurrentUser() user: UserPayload,
  ): Promise<any> {
    return this.accountsService.getAccountsGrouped(
      user.householdId,
      filters,
      user.sub,
    );
  }

  @Get('stats')
  async getAccountStats(
    @CurrentUser() user: UserPayload
  ): Promise<any> {
    return this.accountsService.getAccountStats(user.householdId);
  }

  @Get('net-worth')
  async getNetWorth(
    @Query('currency') currency = 'IDR',
    @Query() filters: AccountFiltersDto,
    @CurrentUser() user: UserPayload,
  ): Promise<any> {
    return this.accountsService.getNetWorthSummary(
      user.householdId,
      currency,
      filters,
    );
  }

  @Get('subtypes/:type')
  async getAccountSubtypes(
    @Param('type') type: AccountType
  ): Promise<string[]> {
    return this.accountsService.getAccountSubtypes(type);
  }

  @Get(':id')
  async getAccount(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserPayload,
  ): Promise<any> {
    return this.accountsService.getAccountById(id, user.householdId);
  }

  @Get(':id/balance')
  async getAccountBalance(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserPayload,
  ): Promise<any> {
    return this.accountsService.getAccountBalance(id, user.householdId);
  }

  @Get(':id/history')
  async getAccountHistory(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @CurrentUser() user: UserPayload,
  ): Promise<any[]> {
    return this.accountsService.getAccountHistory(
      id,
      user.householdId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Put(':id')
  async updateAccount(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAccountDto: UpdateAccountDto,
    @CurrentUser() user: UserPayload,
  ): Promise<any> {
    return this.accountsService.updateAccount(id, user.householdId, updateAccountDto);
  }

  @Delete(':id')
  async deleteAccount(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserPayload,
  ): Promise<any> {
    return this.accountsService.deleteAccount(id, user.householdId);
  }

  @Post(':id/validate')
  async validateAccountIntegrity(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserPayload,
  ): Promise<any> {
    return this.accountsService.validateAccountIntegrity(id, user.householdId);
  }

  @Post(':id/sync')
  async syncAccountBalance(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserPayload,
  ): Promise<any> {
    return this.accountsService.syncAccountBalance(id, user.householdId);
  }
}
