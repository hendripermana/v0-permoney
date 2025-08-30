import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { GratitudeService } from './gratitude.service';
import {
  CreateGratitudeEntryDto,
  UpdateGratitudeEntryDto,
  GratitudeFiltersDto,
  GratitudeSummaryDto,
  RelationshipInsightsDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentHousehold } from '../household/decorators/current-household.decorator';

@ApiTags('gratitude')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('gratitude')
export class GratitudeController {
  constructor(private readonly gratitudeService: GratitudeService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new gratitude entry' })
  @ApiResponse({ status: 201, description: 'Gratitude entry created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'Access denied to household' })
  async create(
    @CurrentHousehold() householdId: string,
    @CurrentUser('id') userId: string,
    @Body() createGratitudeEntryDto: CreateGratitudeEntryDto,
  ) {
    return this.gratitudeService.create(householdId, userId, createGratitudeEntryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all gratitude entries with optional filters' })
  @ApiResponse({ status: 200, description: 'Gratitude entries retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiQuery({ name: 'type', required: false, enum: ['TREAT', 'HELP', 'GIFT'], description: 'Filter by gratitude type' })
  @ApiQuery({ name: 'giver', required: false, type: String, description: 'Filter by giver name' })
  @ApiQuery({ name: 'categoryId', required: false, type: String, description: 'Filter by category ID' })
  @ApiQuery({ name: 'fromDate', required: false, type: String, description: 'Filter from date (ISO string)' })
  @ApiQuery({ name: 'toDate', required: false, type: String, description: 'Filter to date (ISO string)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search in description' })
  async findAll(
    @CurrentHousehold() householdId: string,
    @CurrentUser('id') userId: string,
    @Query() filters: GratitudeFiltersDto,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
  ) {
    return this.gratitudeService.findAll(householdId, userId, filters, page, limit);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get gratitude summary and statistics' })
  @ApiResponse({ status: 200, description: 'Gratitude summary retrieved successfully', type: GratitudeSummaryDto })
  @ApiQuery({ name: 'fromDate', required: false, type: String, description: 'Filter from date (ISO string)' })
  @ApiQuery({ name: 'toDate', required: false, type: String, description: 'Filter to date (ISO string)' })
  async getSummary(
    @CurrentHousehold() householdId: string,
    @CurrentUser('id') userId: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ): Promise<GratitudeSummaryDto> {
    return this.gratitudeService.getSummary(householdId, userId, fromDate, toDate);
  }

  @Get('insights')
  @ApiOperation({ summary: 'Get relationship insights based on gratitude patterns' })
  @ApiResponse({ 
    status: 200, 
    description: 'Relationship insights retrieved successfully', 
    type: RelationshipInsightsDto 
  })
  async getRelationshipInsights(
    @CurrentHousehold() householdId: string,
    @CurrentUser('id') userId: string,
  ): Promise<RelationshipInsightsDto> {
    return this.gratitudeService.getRelationshipInsights(householdId, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific gratitude entry by ID' })
  @ApiResponse({ status: 200, description: 'Gratitude entry retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Gratitude entry not found' })
  async findOne(
    @CurrentHousehold() householdId: string,
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.gratitudeService.findOne(householdId, userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a gratitude entry' })
  @ApiResponse({ status: 200, description: 'Gratitude entry updated successfully' })
  @ApiResponse({ status: 404, description: 'Gratitude entry not found' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async update(
    @CurrentHousehold() householdId: string,
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateGratitudeEntryDto: UpdateGratitudeEntryDto,
  ) {
    return this.gratitudeService.update(householdId, userId, id, updateGratitudeEntryDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a gratitude entry' })
  @ApiResponse({ status: 200, description: 'Gratitude entry deleted successfully' })
  @ApiResponse({ status: 404, description: 'Gratitude entry not found' })
  async remove(
    @CurrentHousehold() householdId: string,
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.gratitudeService.remove(householdId, userId, id);
    return { message: 'Gratitude entry deleted successfully' };
  }
}
