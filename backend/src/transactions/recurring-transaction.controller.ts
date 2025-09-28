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
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { HouseholdGuard } from '../household/guards/household.guard';
import { RecurringTransactionService } from './recurring-transaction.service';
import {
  CreateRecurringTransactionDto,
  UpdateRecurringTransactionDto,
  RecurringTransactionFiltersDto,
  RecurringTransactionResponseDto,
  RecurringTransactionExecutionDto,
  ExecuteRecurringTransactionDto,
  RecurrenceFrequency,
  RecurringTransactionStatus
} from './dto/recurring-transaction.dto';

@ApiTags('Recurring Transactions')
@ApiBearerAuth()
@UseGuards(HouseholdGuard)
@Controller('households/:householdId/recurring-transactions')
export class RecurringTransactionController {
  constructor(
    private readonly recurringTransactionService: RecurringTransactionService
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new recurring transaction' })
  @ApiParam({ name: 'householdId', description: 'Household ID' })
  @ApiResponse({
    status: 201,
    description: 'Recurring transaction created successfully',
    type: RecurringTransactionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async create(
    @Param('householdId') householdId: string,
    @Body() createDto: CreateRecurringTransactionDto,
    @Request() req: any
  ): Promise<RecurringTransactionResponseDto> {
    const result = await this.recurringTransactionService.create(
      householdId,
      req.user.id,
      createDto
    );

    return {
      ...result,
      amountCents: Number(result.amountCents),
      frequency: result.frequency as RecurrenceFrequency,
      status: result.status as RecurringTransactionStatus,
      metadata: result.metadata as Record<string, any>,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get recurring transactions for household' })
  @ApiParam({ name: 'householdId', description: 'Household ID' })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by status',
  })
  @ApiQuery({
    name: 'accountId',
    required: false,
    description: 'Filter by account ID',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    description: 'Filter by category ID',
  })
  @ApiQuery({
    name: 'frequency',
    required: false,
    description: 'Filter by frequency',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Recurring transactions retrieved successfully',
  })
  async findByHousehold(
    @Param('householdId') householdId: string,
    @Query() filters: RecurringTransactionFiltersDto,
    @Request() req: any
  ) {
    return this.recurringTransactionService.findByHousehold(
      householdId,
      req.user.id,
      filters
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get recurring transaction by ID' })
  @ApiParam({ name: 'householdId', description: 'Household ID' })
  @ApiParam({ name: 'id', description: 'Recurring transaction ID' })
  @ApiResponse({
    status: 200,
    description: 'Recurring transaction retrieved successfully',
    type: RecurringTransactionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Recurring transaction not found' })
  async findById(
    @Param('householdId') householdId: string,
    @Param('id') id: string,
    @Request() req: any
  ): Promise<RecurringTransactionResponseDto> {
    const result = await this.recurringTransactionService.findById(id, req.user.id);
    return {
      ...result,
      amountCents: Number(result.amountCents),
      frequency: result.frequency as RecurrenceFrequency,
      status: result.status as RecurringTransactionStatus,
      metadata: result.metadata as Record<string, any>,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update recurring transaction' })
  @ApiParam({ name: 'householdId', description: 'Household ID' })
  @ApiParam({ name: 'id', description: 'Recurring transaction ID' })
  @ApiResponse({
    status: 200,
    description: 'Recurring transaction updated successfully',
    type: RecurringTransactionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Recurring transaction not found' })
  async update(
    @Param('householdId') householdId: string,
    @Param('id') id: string,
    @Body() updateDto: UpdateRecurringTransactionDto,
    @Request() req: any
  ): Promise<RecurringTransactionResponseDto> {
    const result = await this.recurringTransactionService.update(id, req.user.id, updateDto);
    return {
      ...result,
      amountCents: Number(result.amountCents),
      frequency: result.frequency as RecurrenceFrequency,
      status: result.status as RecurringTransactionStatus,
      metadata: result.metadata as Record<string, any>,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete recurring transaction' })
  @ApiParam({ name: 'householdId', description: 'Household ID' })
  @ApiParam({ name: 'id', description: 'Recurring transaction ID' })
  @ApiResponse({
    status: 204,
    description: 'Recurring transaction deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Recurring transaction not found' })
  async delete(
    @Param('householdId') householdId: string,
    @Param('id') id: string,
    @Request() req: any
  ): Promise<void> {
    await this.recurringTransactionService.delete(id, req.user.id);
  }

  @Post(':id/pause')
  @ApiOperation({ summary: 'Pause recurring transaction' })
  @ApiParam({ name: 'householdId', description: 'Household ID' })
  @ApiParam({ name: 'id', description: 'Recurring transaction ID' })
  @ApiResponse({
    status: 200,
    description: 'Recurring transaction paused successfully',
    type: RecurringTransactionResponseDto,
  })
  async pause(
    @Param('householdId') householdId: string,
    @Param('id') id: string,
    @Request() req: any
  ): Promise<RecurringTransactionResponseDto> {
    const result = await this.recurringTransactionService.pause(id, req.user.id);
    return {
      ...result,
      frequency: result.frequency as RecurrenceFrequency,
      status: result.status as RecurringTransactionStatus,
      metadata: result.metadata as Record<string, any>,
    };
  }

  @Post(':id/resume')
  @ApiOperation({ summary: 'Resume recurring transaction' })
  @ApiParam({ name: 'householdId', description: 'Household ID' })
  @ApiParam({ name: 'id', description: 'Recurring transaction ID' })
  @ApiResponse({
    status: 200,
    description: 'Recurring transaction resumed successfully',
    type: RecurringTransactionResponseDto,
  })
  async resume(
    @Param('householdId') householdId: string,
    @Param('id') id: string,
    @Request() req: any
  ): Promise<RecurringTransactionResponseDto> {
    const result = await this.recurringTransactionService.resume(id, req.user.id);
    return {
      ...result,
      frequency: result.frequency as RecurrenceFrequency,
      status: result.status as RecurringTransactionStatus,
      metadata: result.metadata as Record<string, any>,
    };
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel recurring transaction' })
  @ApiParam({ name: 'householdId', description: 'Household ID' })
  @ApiParam({ name: 'id', description: 'Recurring transaction ID' })
  @ApiResponse({
    status: 200,
    description: 'Recurring transaction cancelled successfully',
    type: RecurringTransactionResponseDto,
  })
  async cancel(
    @Param('householdId') householdId: string,
    @Param('id') id: string,
    @Request() req: any
  ): Promise<RecurringTransactionResponseDto> {
    const result = await this.recurringTransactionService.cancel(id, req.user.id);
    return {
      ...result,
      frequency: result.frequency as RecurrenceFrequency,
      status: result.status as RecurringTransactionStatus,
      metadata: result.metadata as Record<string, any>,
    };
  }

  @Post(':id/execute')
  @ApiOperation({ summary: 'Manually execute recurring transaction' })
  @ApiParam({ name: 'householdId', description: 'Household ID' })
  @ApiParam({ name: 'id', description: 'Recurring transaction ID' })
  @ApiResponse({
    status: 200,
    description: 'Recurring transaction executed successfully',
  })
  async execute(
    @Param('householdId') householdId: string,
    @Param('id') id: string,
    @Body() executeDto: Partial<ExecuteRecurringTransactionDto>,
    @Request() req: any
  ) {
    return this.recurringTransactionService.executeRecurringTransaction(
      {
        recurringTransactionId: id,
        ...executeDto,
      },
      req.user.id
    );
  }

  @Get(':id/executions')
  @ApiOperation({ summary: 'Get execution history for recurring transaction' })
  @ApiParam({ name: 'householdId', description: 'Household ID' })
  @ApiParam({ name: 'id', description: 'Recurring transaction ID' })
  @ApiResponse({
    status: 200,
    description: 'Execution history retrieved successfully',
    type: [RecurringTransactionExecutionDto],
  })
  async getExecutionHistory(
    @Param('householdId') householdId: string,
    @Param('id') id: string,
    @Request() req: any
  ): Promise<RecurringTransactionExecutionDto[]> {
    return this.recurringTransactionService.getExecutionHistory(
      id,
      req.user.id
    );
  }
}
