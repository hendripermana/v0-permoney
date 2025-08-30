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
  HttpStatus,
  HttpCode
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IslamicFinanceService } from './islamic-finance.service';
import { 
  CalculateZakatDto, 
  CreateZakatReminderDto, 
  UpdateZakatReminderDto,
  UpdateShariaComplianceDto, 
  GenerateIslamicReportDto,
  RecordZakatPaymentDto,
  ZakatCalculationResponseDto 
} from './dto/zakat-calculation.dto';
import { ZakatAssetType, ZakatReminderType, IslamicReportType } from './types/islamic-finance.types';

@ApiTags('Islamic Finance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('islamic-finance')
export class IslamicFinanceController {
  constructor(private readonly islamicFinanceService: IslamicFinanceService) {}

  // Zakat Calculation Endpoints
  @Post('zakat/calculate')
  @ApiOperation({ summary: 'Calculate zakat for a household' })
  @ApiResponse({ status: 201, description: 'Zakat calculation completed', type: ZakatCalculationResponseDto })
  async calculateZakat(@Body() dto: CalculateZakatDto, @Request() req: any) {
    return this.islamicFinanceService.calculateZakat(dto);
  }

  @Get('zakat/calculations/:householdId')
  @ApiOperation({ summary: 'Get zakat calculations for a household' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getZakatCalculations(
    @Param('householdId') householdId: string,
    @Query('limit') limit?: number
  ) {
    return this.islamicFinanceService.getZakatCalculations(householdId, limit);
  }

  @Get('zakat/calculations/:householdId/latest')
  @ApiOperation({ summary: 'Get latest zakat calculation for a household' })
  async getLatestZakatCalculation(@Param('householdId') householdId: string) {
    return this.islamicFinanceService.getLatestZakatCalculation(householdId);
  }

  @Post('zakat/payments')
  @ApiOperation({ summary: 'Record a zakat payment' })
  @HttpCode(HttpStatus.CREATED)
  async recordZakatPayment(@Body() dto: RecordZakatPaymentDto) {
    await this.islamicFinanceService.recordZakatPayment(dto);
    return { message: 'Zakat payment recorded successfully' };
  }

  @Get('zakat/payments/:householdId')
  @ApiOperation({ summary: 'Get zakat payment history for a household' })
  async getZakatPayments(@Param('householdId') householdId: string) {
    return this.islamicFinanceService.getZakatPayments(householdId);
  }

  // Zakat Reminder Endpoints
  @Post('zakat/reminders')
  @ApiOperation({ summary: 'Create a zakat reminder' })
  async createZakatReminder(@Body() dto: CreateZakatReminderDto) {
    return this.islamicFinanceService.createZakatReminder(dto);
  }

  @Get('zakat/reminders/:householdId')
  @ApiOperation({ summary: 'Get zakat reminders for a household' })
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean })
  async getZakatReminders(
    @Param('householdId') householdId: string,
    @Query('activeOnly') activeOnly?: boolean
  ) {
    return this.islamicFinanceService.getZakatReminders(householdId, activeOnly);
  }

  @Get('zakat/reminders/:householdId/upcoming')
  @ApiOperation({ summary: 'Get upcoming zakat reminders for a household' })
  @ApiQuery({ name: 'daysAhead', required: false, type: Number })
  async getUpcomingZakatReminders(
    @Param('householdId') householdId: string,
    @Query('daysAhead') daysAhead?: number
  ) {
    return this.islamicFinanceService.getUpcomingZakatReminders(householdId, daysAhead);
  }

  @Put('zakat/reminders/:id')
  @ApiOperation({ summary: 'Update a zakat reminder' })
  async updateZakatReminder(
    @Param('id') id: string,
    @Body() dto: UpdateZakatReminderDto
  ) {
    return this.islamicFinanceService.updateZakatReminder(id, dto);
  }

  @Delete('zakat/reminders/:id')
  @ApiOperation({ summary: 'Delete a zakat reminder' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteZakatReminder(@Param('id') id: string) {
    await this.islamicFinanceService.deleteZakatReminder(id);
  }

  // Sharia Compliance Endpoints
  @Put('compliance/accounts')
  @ApiOperation({ summary: 'Update account Sharia compliance status' })
  async updateAccountCompliance(
    @Body() dto: UpdateShariaComplianceDto,
    @Request() req: any
  ) {
    return this.islamicFinanceService.updateAccountCompliance(dto, req.user.id);
  }

  @Get('compliance/accounts/:accountId')
  @ApiOperation({ summary: 'Get account Sharia compliance status' })
  async getAccountCompliance(@Param('accountId') accountId: string) {
    return this.islamicFinanceService.getAccountCompliance(accountId);
  }

  @Get('compliance/households/:householdId')
  @ApiOperation({ summary: 'Get household Sharia compliance overview' })
  async getHouseholdCompliance(@Param('householdId') householdId: string) {
    return this.islamicFinanceService.getHouseholdCompliance(householdId);
  }

  @Get('compliance/households/:householdId/summary')
  @ApiOperation({ summary: 'Get household compliance summary statistics' })
  async getComplianceSummary(@Param('householdId') householdId: string) {
    return this.islamicFinanceService.getComplianceSummary(householdId);
  }

  @Get('compliance/accounts/due-for-review')
  @ApiOperation({ summary: 'Get accounts due for compliance review' })
  @ApiQuery({ name: 'householdId', required: false, type: String })
  async getAccountsDueForReview(@Query('householdId') householdId?: string) {
    return this.islamicFinanceService.getAccountsDueForReview(householdId);
  }

  @Post('compliance/accounts/:accountId/auto-assess')
  @ApiOperation({ summary: 'Auto-assess account Sharia compliance' })
  async autoAssessAccountCompliance(@Param('accountId') accountId: string) {
    const status = await this.islamicFinanceService.autoAssessAccountCompliance(accountId);
    return { accountId, suggestedStatus: status };
  }

  @Post('compliance/households/:householdId/bulk-assess')
  @ApiOperation({ summary: 'Bulk assess Sharia compliance for all household accounts' })
  @HttpCode(HttpStatus.ACCEPTED)
  async bulkAssessCompliance(@Param('householdId') householdId: string) {
    await this.islamicFinanceService.bulkAssessCompliance(householdId);
    return { message: 'Bulk compliance assessment initiated' };
  }

  // Islamic Reporting Endpoints
  @Post('reports')
  @ApiOperation({ summary: 'Generate an Islamic finance report' })
  async generateIslamicReport(
    @Body() dto: GenerateIslamicReportDto,
    @Request() req: any
  ) {
    return this.islamicFinanceService.generateIslamicReport(dto, req.user.id);
  }

  @Get('reports/:householdId')
  @ApiOperation({ summary: 'Get Islamic finance reports for a household' })
  @ApiQuery({ name: 'reportType', required: false, enum: IslamicReportType })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getIslamicReports(
    @Param('householdId') householdId: string,
    @Query('reportType') reportType?: IslamicReportType,
    @Query('limit') limit?: number
  ) {
    return this.islamicFinanceService.getIslamicReports(householdId, reportType, limit);
  }

  @Get('reports/:householdId/latest/:reportType')
  @ApiOperation({ summary: 'Get latest Islamic finance report of specific type' })
  async getLatestIslamicReport(
    @Param('householdId') householdId: string,
    @Param('reportType') reportType: IslamicReportType
  ) {
    return this.islamicFinanceService.getLatestIslamicReport(householdId, reportType);
  }

  // Dashboard and Overview Endpoints
  @Get('dashboard/:householdId')
  @ApiOperation({ summary: 'Get Islamic finance dashboard overview' })
  async getIslamicFinanceDashboard(@Param('householdId') householdId: string) {
    return this.islamicFinanceService.getIslamicFinanceDashboard(householdId);
  }

  @Post('initialize/:householdId')
  @ApiOperation({ summary: 'Initialize Islamic finance features for a household' })
  @HttpCode(HttpStatus.ACCEPTED)
  async initializeIslamicFinance(@Param('householdId') householdId: string) {
    await this.islamicFinanceService.initializeIslamicFinance(householdId);
    return { message: 'Islamic finance initialization completed' };
  }

  // Utility Endpoints
  @Get('constants/zakat-asset-types')
  @ApiOperation({ summary: 'Get available zakat asset types' })
  async getZakatAssetTypes() {
    return Object.values(ZakatAssetType);
  }

  @Get('constants/reminder-types')
  @ApiOperation({ summary: 'Get available zakat reminder types' })
  async getZakatReminderTypes() {
    return Object.values(ZakatReminderType);
  }

  @Get('constants/report-types')
  @ApiOperation({ summary: 'Get available Islamic report types' })
  async getIslamicReportTypes() {
    return Object.values(IslamicReportType);
  }
}
