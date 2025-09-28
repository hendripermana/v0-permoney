import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { BehaviorAnalysisService } from './services/behavior-analysis.service';
import { CreateEventDto } from './dto/create-event.dto';
import { QueryEventsDto } from './dto/query-events.dto';
import { BehaviorAnalysisDto } from './dto/behavior-analysis.dto';
import { HouseholdGuard } from '../household/guards/household.guard';

@Controller('events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly behaviorAnalysisService: BehaviorAnalysisService,
  ) {}

  @Post()
  async trackEvent(@Request() req, @Body() createEventDto: CreateEventDto) {
    await this.eventsService.trackEvent({
      userId: (req.user?.userId ?? req.user?.sub ?? req.user?.id),
      householdId: req.user.householdId,
      ...createEventDto,
    });

    return { success: true };
  }

  @Get()
  @UseGuards(HouseholdGuard)
  async queryEvents(@Query() query: QueryEventsDto) {
    return this.eventsService.queryEvents(query);
  }

  @Get('stats/:householdId')
  @UseGuards(HouseholdGuard)
  async getEventStats(
    @Param('householdId') householdId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.eventsService.getEventStats(
      householdId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('timeline/:userId')
  @UseGuards(HouseholdGuard)
  async getUserActivityTimeline(
    @Param('userId') userId: string,
    @Query('householdId') householdId: string,
    @Query('days') days?: string,
  ) {
    return this.eventsService.getUserActivityTimeline(
      userId,
      householdId,
      days ? parseInt(days) : 30,
    );
  }

  @Post('analyze')
  @UseGuards(HouseholdGuard)
  async analyzeBehavior(@Body() analysisDto: BehaviorAnalysisDto) {
    return this.behaviorAnalysisService.analyzeBehavior(analysisDto);
  }

  @Get('patterns/:householdId')
  @UseGuards(HouseholdGuard)
  async getSpendingPatterns(@Param('householdId') householdId: string) {
    return this.behaviorAnalysisService.getSpendingPatterns(householdId);
  }

  @Get('insights/:householdId')
  @UseGuards(HouseholdGuard)
  async getFinancialInsights(@Param('householdId') householdId: string) {
    return this.behaviorAnalysisService.getFinancialInsights(householdId);
  }
}
