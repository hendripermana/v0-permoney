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
  ParseUUIDPipe,
  HttpStatus,
  HttpCode,
  UseInterceptors,
  ClassSerializerInterceptor,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { HouseholdAccessGuard } from '../household/guards/household-access.guard';
import { HouseholdPermissions } from '../household/decorators/household-permissions.decorator';
import { HOUSEHOLD_PERMISSIONS } from '../household/constants/permissions';
import { DebtsService } from './debts.service';
import {
  CreateDebtDto,
  UpdateDebtDto,
  DebtFiltersDto,
  CreateDebtPaymentDto,
  PaymentScheduleResponse,
  DebtSummaryResponse,
} from './dto';
import { Debt, DebtPayment } from '@prisma/client';
import { DebtWithPayments } from './debts.repository';

@Controller('debts')
@UseGuards(HouseholdAccessGuard)
@UseInterceptors(ClassSerializerInterceptor)
@UsePipes(new ValidationPipe({ 
  transform: true, 
  whitelist: true, 
  forbidNonWhitelisted: true,
  transformOptions: {
    enableImplicitConversion: true,
  },
}))
export class DebtsController {
  constructor(private debtsService: DebtsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @HouseholdPermissions(HOUSEHOLD_PERMISSIONS.CREATE_DEBTS)
  async createDebt(
    @Body() createDebtDto: CreateDebtDto,
    @Request() req: any,
  ): Promise<Debt> {
    try {
      return await this.debtsService.createDebt(
        req.user.currentHouseholdId,
        createDebtDto,
        req.user.userId,
      );
    } catch (error) {
      // Log error for monitoring (in production, use proper logging service)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error creating debt:', {
        error: errorMessage,
        userId: req.user.userId,
        householdId: req.user.currentHouseholdId,
        debtData: { ...createDebtDto, principalAmount: '[REDACTED]' }, // Don't log sensitive amounts
      });
      throw error;
    }
  }

  @Get()
  @HouseholdPermissions(HOUSEHOLD_PERMISSIONS.VIEW_DEBTS)
  async getDebts(
    @Query() filters: DebtFiltersDto,
    @Request() req: any,
  ): Promise<DebtWithPayments[]> {
    return this.debtsService.getDebtsByHousehold(
      req.user.currentHouseholdId,
      filters,
    );
  }

  @Get('summary')
  @HouseholdPermissions(HOUSEHOLD_PERMISSIONS.VIEW_DEBTS)
  async getDebtSummary(@Request() req: any): Promise<DebtSummaryResponse> {
    return this.debtsService.getDebtSummary(req.user.currentHouseholdId);
  }

  @Get(':id')
  @HouseholdPermissions(HOUSEHOLD_PERMISSIONS.VIEW_DEBTS)
  async getDebt(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ): Promise<DebtWithPayments> {
    return this.debtsService.getDebtById(id, req.user.currentHouseholdId);
  }

  @Get(':id/schedule')
  @HouseholdPermissions(HOUSEHOLD_PERMISSIONS.VIEW_DEBTS)
  async getPaymentSchedule(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ): Promise<PaymentScheduleResponse> {
    return this.debtsService.calculatePaymentSchedule(
      id,
      req.user.currentHouseholdId,
    );
  }

  @Put(':id')
  @HouseholdPermissions(HOUSEHOLD_PERMISSIONS.MANAGE_DEBTS)
  async updateDebt(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDebtDto: UpdateDebtDto,
    @Request() req: any,
  ): Promise<Debt> {
    return this.debtsService.updateDebt(
      id,
      req.user.currentHouseholdId,
      updateDebtDto,
    );
  }

  @Delete(':id')
  @HouseholdPermissions(HOUSEHOLD_PERMISSIONS.DELETE_DEBTS)
  async deleteDebt(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ): Promise<{ message: string }> {
    await this.debtsService.deleteDebt(id, req.user.currentHouseholdId);
    return { message: 'Debt deleted successfully' };
  }

  @Post(':id/payments')
  @HttpCode(HttpStatus.CREATED)
  @HouseholdPermissions(HOUSEHOLD_PERMISSIONS.MANAGE_DEBTS)
  async recordPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() createPaymentDto: CreateDebtPaymentDto,
    @Request() req: any,
  ): Promise<DebtPayment> {
    try {
      return await this.debtsService.recordPayment(
        id,
        req.user.currentHouseholdId,
        createPaymentDto,
      );
    } catch (error) {
      // Log error for monitoring
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error recording debt payment:', {
        error: errorMessage,
        userId: req.user.userId,
        householdId: req.user.currentHouseholdId,
        debtId: id,
        paymentData: { ...createPaymentDto, amount: '[REDACTED]', principalAmount: '[REDACTED]' },
      });
      throw error;
    }
  }
}
