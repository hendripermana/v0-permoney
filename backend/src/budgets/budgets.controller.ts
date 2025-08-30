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
} from '@nestjs/common';
import { BudgetsService, BudgetProgress, BudgetAlert } from './budgets.service';
import { BudgetWithCategories } from './budgets.repository';
import { BudgetAnalyticsService, BudgetAnalytics, CategorySpendingPattern } from './services/budget-analytics.service';
import { BudgetTransactionService } from './services/budget-transaction.service';
import {
  CreateBudgetDto,
  UpdateBudgetDto,
  BudgetFiltersDto,
  BudgetRecommendationDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HouseholdGuard } from '../household/guards/household.guard';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@Controller('budgets')
@UseGuards(JwtAuthGuard, HouseholdGuard)
export class BudgetsController {
  constructor(
    private readonly budgetsService: BudgetsService,
    private readonly budgetAnalyticsService: BudgetAnalyticsService,
    private readonly budgetTransactionService: BudgetTransactionService
  ) {}

  @Post()
  async createBudget(
    @Request() req: RequestWithUser,
    @Body() createBudgetDto: CreateBudgetDto
  ): Promise<BudgetWithCategories> {
    return this.budgetsService.createBudget(req.user.householdId, createBudgetDto);
  }

  @Get()
  async getBudgets(
    @Request() req: RequestWithUser,
    @Query() filters: BudgetFiltersDto
  ): Promise<BudgetWithCategories[]> {
    return this.budgetsService.getBudgets(req.user.householdId, filters);
  }

  @Get('recommendations')
  async getBudgetRecommendations(
    @Request() req: RequestWithUser
  ): Promise<BudgetRecommendationDto[]> {
    return this.budgetAnalyticsService.generateAdvancedRecommendations(req.user.householdId);
  }

  @Get('analytics')
  async getBudgetAnalytics(
    @Request() req: RequestWithUser
  ): Promise<BudgetAnalytics> {
    return this.budgetAnalyticsService.getBudgetAnalytics(req.user.householdId);
  }

  @Get('spending-patterns')
  async getSpendingPatterns(
    @Request() req: RequestWithUser,
    @Query('months') months?: string
  ): Promise<CategorySpendingPattern[]> {
    const monthsNumber = months ? parseInt(months, 10) : 12;
    return this.budgetAnalyticsService.getCategorySpendingPatterns(req.user.householdId, monthsNumber);
  }

  @Get(':categoryId/utilization-trends')
  async getUtilizationTrends(
    @Request() req: RequestWithUser,
    @Param('categoryId') categoryId: string,
    @Query('months') months?: string
  ) {
    const monthsNumber = months ? parseInt(months, 10) : 6;
    return this.budgetTransactionService.getBudgetUtilizationTrends(
      req.user.householdId,
      categoryId,
      monthsNumber
    );
  }

  @Get(':id')
  async getBudgetById(
    @Request() req: RequestWithUser,
    @Param('id') id: string
  ): Promise<BudgetWithCategories> {
    return this.budgetsService.getBudgetById(id, req.user.householdId);
  }

  @Get(':id/progress')
  async getBudgetProgress(
    @Request() req: RequestWithUser,
    @Param('id') id: string
  ): Promise<BudgetProgress> {
    return this.budgetsService.getBudgetProgress(id, req.user.householdId);
  }

  @Get(':id/alerts')
  async getBudgetAlerts(
    @Request() req: RequestWithUser,
    @Param('id') id: string
  ): Promise<BudgetAlert[]> {
    return this.budgetsService.getBudgetAlerts(id, req.user.householdId);
  }

  @Put(':id')
  async updateBudget(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() updateBudgetDto: UpdateBudgetDto
  ): Promise<BudgetWithCategories> {
    return this.budgetsService.updateBudget(id, req.user.householdId, updateBudgetDto);
  }

  @Post(':id/carry-over')
  async carryOverBudget(
    @Request() req: RequestWithUser,
    @Param('id') id: string
  ): Promise<BudgetWithCategories> {
    return this.budgetsService.carryOverUnusedBudget(id, req.user.householdId);
  }

  @Post(':id/recalculate')
  async recalculateBudgetSpending(
    @Request() req: RequestWithUser,
    @Param('id') id: string
  ): Promise<{ message: string }> {
    await this.budgetTransactionService.recalculateBudgetSpending(id, req.user.householdId);
    return { message: 'Budget spending recalculated successfully' };
  }

  @Delete(':id')
  async deleteBudget(
    @Request() req: RequestWithUser,
    @Param('id') id: string
  ): Promise<{ message: string }> {
    await this.budgetsService.deleteBudget(id, req.user.householdId);
    return { message: 'Budget deleted successfully' };
  }
}
