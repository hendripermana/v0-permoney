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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HouseholdAccessGuard } from '../household/guards/household-access.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AccountType } from '@prisma/client';

interface UserPayload {
  sub: string;
  email: string;
  householdId: string;
}

@Controller('accounts')
@UseGuards(JwtAuthGuard, HouseholdAccessGuard)
export class AccountsController {
  constructor(private accountsService: AccountsService) {}

  @Post()
  async createAccount(
    @Body() createAccountDto: CreateAccountDto,
    @CurrentUser() user: UserPayload,
  ) {
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
  ) {
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
  ) {
    return this.accountsService.getAccountsGrouped(
      user.householdId,
      filters,
      user.sub,
    );
  }

  @Get('stats')
  async getAccountStats(@CurrentUser() user: UserPayload) {
    return this.accountsService.getAccountStats(user.householdId);
  }

  @Get('net-worth')
  async getNetWorth(
    @Query('currency') currency = 'IDR',
    @Query() filters: AccountFiltersDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.accountsService.getNetWorthSummary(
      user.householdId,
      currency,
      filters,
    );
  }

  @Get('subtypes/:type')
  async getAccountSubtypes(@Param('type') type: AccountType) {
    return this.accountsService.getAccountSubtypes(type);
  }

  @Get(':id')
  async getAccount(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserPayload,
  ) {
    return this.accountsService.getAccountById(id, user.householdId);
  }

  @Get(':id/balance')
  async getAccountBalance(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserPayload,
  ) {
    const balance = await this.accountsService.getAccountBalance(id, user.householdId);
    return { balance: balance.toString() }; // Convert BigInt to string for JSON
  }

  @Get(':id/history')
  async getAccountHistory(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @CurrentUser() user: UserPayload,
  ) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default to 30 days ago
    const end = endDate ? new Date(endDate) : new Date(); // Default to today

    const history = await this.accountsService.getAccountHistory(
      id,
      user.householdId,
      start,
      end,
    );

    // Convert BigInt to string for JSON serialization
    return history.map(point => ({
      date: point.date,
      balance: point.balance.toString(),
    }));
  }

  @Put(':id')
  async updateAccount(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAccountDto: UpdateAccountDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.accountsService.updateAccount(id, user.householdId, updateAccountDto);
  }

  @Delete(':id')
  async deleteAccount(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserPayload,
  ) {
    return this.accountsService.deleteAccount(id, user.householdId);
  }

  @Post(':id/validate')
  async validateAccountIntegrity(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserPayload,
  ) {
    const isValid = await this.accountsService.validateAccountIntegrity(id, user.householdId);
    return { isValid };
  }

  @Post(':id/sync')
  async syncAccountBalance(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserPayload,
  ) {
    await this.accountsService.syncAccountBalance(id, user.householdId);
    return { message: 'Account balance synchronized successfully' };
  }
}
