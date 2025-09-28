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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { 
  CreateTransactionDto, 
  UpdateTransactionDto, 
  TransactionFiltersDto, 
  TransactionSearchDto,
  TransactionSplitDto,
  UpdateTransactionSplitsDto,
} from './dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { HouseholdAccessGuard } from '../household/guards/household-access.guard';
import { HouseholdPermissions } from '../household/decorators/household-permissions.decorator';
import { HOUSEHOLD_PERMISSIONS } from '../household/constants/permissions';
import { TrackEvent } from '../events/decorators/track-event.decorator';
import { EventType } from '../events/types/event.types';

@Controller('transactions')
@UseGuards(HouseholdAccessGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @HouseholdPermissions(HOUSEHOLD_PERMISSIONS.CREATE_TRANSACTIONS)
  @TrackEvent({
    eventType: EventType.TRANSACTION_CREATED,
    resourceType: 'transaction',
    extractResourceId: (args, result) => result?.id,
    extractEventData: (args, result) => ({
      amount: args[0]?.amountCents,
      currency: args[0]?.currency,
      categoryId: args[0]?.categoryId,
      accountId: args[0]?.accountId,
      merchant: args[0]?.merchant,
    }),
  })
  async createTransaction(
    @Body() createTransactionDto: CreateTransactionDto,
    @CurrentUser('householdId') householdId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.transactionsService.createTransaction(householdId, createTransactionDto, userId);
  }

  @Get()
  @HouseholdPermissions(HOUSEHOLD_PERMISSIONS.VIEW_ALL_TRANSACTIONS)
  async getTransactions(
    @Query() filters: TransactionFiltersDto,
    @CurrentUser('householdId') householdId: string,
  ) {
    return this.transactionsService.getTransactions(householdId, filters);
  }

  @Get('search')
  @HouseholdPermissions(HOUSEHOLD_PERMISSIONS.VIEW_ALL_TRANSACTIONS)
  async searchTransactions(
    @Query() searchParams: TransactionSearchDto,
    @CurrentUser('householdId') householdId: string,
  ) {
    return this.transactionsService.searchTransactions(householdId, searchParams);
  }

  @Get('stats')
  @HouseholdPermissions(HOUSEHOLD_PERMISSIONS.VIEW_ALL_TRANSACTIONS)
  async getTransactionStats(
    @Query() filters: TransactionFiltersDto,
    @CurrentUser('householdId') householdId: string,
  ) {
    return this.transactionsService.getTransactionStats(householdId, filters);
  }

  @Get('category-breakdown')
  @HouseholdPermissions(HOUSEHOLD_PERMISSIONS.VIEW_ALL_TRANSACTIONS)
  async getCategoryBreakdown(
    @Query() filters: TransactionFiltersDto,
    @CurrentUser('householdId') householdId: string,
  ) {
    return this.transactionsService.getCategoryBreakdown(householdId, filters);
  }

  @Get(':id')
  @HouseholdPermissions(HOUSEHOLD_PERMISSIONS.VIEW_ALL_TRANSACTIONS)
  async getTransactionById(
    @Param('id') id: string,
    @CurrentUser('householdId') householdId: string,
  ) {
    return this.transactionsService.getTransactionById(id, householdId);
  }

  @Put(':id')
  @HouseholdPermissions(HOUSEHOLD_PERMISSIONS.MANAGE_TRANSACTIONS)
  @TrackEvent({
    eventType: EventType.TRANSACTION_UPDATED,
    resourceType: 'transaction',
    extractResourceId: (args) => args[0],
    extractEventData: (args) => ({
      updatedFields: Object.keys(args[1] || {}),
    }),
  })
  async updateTransaction(
    @Param('id') id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
    @CurrentUser('householdId') householdId: string,
  ) {
    return this.transactionsService.updateTransaction(id, householdId, updateTransactionDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @HouseholdPermissions(HOUSEHOLD_PERMISSIONS.DELETE_TRANSACTIONS)
  async deleteTransaction(
    @Param('id') id: string,
    @CurrentUser('householdId') householdId: string,
  ) {
    await this.transactionsService.deleteTransaction(id, householdId);
  }

  @Put(':id/splits')
  @HouseholdPermissions(HOUSEHOLD_PERMISSIONS.MANAGE_TRANSACTIONS)
  async updateTransactionSplits(
    @Param('id') id: string,
    @Body() updateSplitsDto: UpdateTransactionSplitsDto,
    @CurrentUser('householdId') householdId: string,
  ) {
    return this.transactionsService.updateTransactionSplits(id, householdId, updateSplitsDto.splits);
  }

  @Put(':id/category')
  @HouseholdPermissions(HOUSEHOLD_PERMISSIONS.CATEGORIZE_TRANSACTIONS)
  @TrackEvent({
    eventType: EventType.TRANSACTION_CATEGORIZED,
    resourceType: 'transaction',
    extractResourceId: (args) => args[0],
    extractEventData: (args) => ({
      newCategoryId: args[1],
      source: 'manual',
    }),
  })
  async categorizeTransaction(
    @Param('id') id: string,
    @Body('categoryId') categoryId: string,
    @CurrentUser('householdId') householdId: string,
  ) {
    return this.transactionsService.categorizeTransaction(id, householdId, categoryId);
  }

  @Post(':id/tags')
  @HouseholdPermissions(HOUSEHOLD_PERMISSIONS.CATEGORIZE_TRANSACTIONS)
  async addTransactionTags(
    @Param('id') id: string,
    @Body('tags') tags: string[],
    @CurrentUser('householdId') householdId: string,
  ) {
    return this.transactionsService.addTransactionTags(id, householdId, tags);
  }

  @Delete(':id/tags')
  @HouseholdPermissions(HOUSEHOLD_PERMISSIONS.CATEGORIZE_TRANSACTIONS)
  async removeTransactionTags(
    @Param('id') id: string,
    @Body('tags') tags: string[],
    @CurrentUser('householdId') householdId: string,
  ) {
    return this.transactionsService.removeTransactionTags(id, householdId, tags);
  }

  @Get(':id/validate')
  @HouseholdPermissions(HOUSEHOLD_PERMISSIONS.VIEW_ALL_TRANSACTIONS)
  async validateTransactionAccounting(
    @Param('id') id: string,
    @CurrentUser('householdId') householdId: string,
  ) {
    return this.transactionsService.validateTransactionAccounting(id, householdId);
  }
}
