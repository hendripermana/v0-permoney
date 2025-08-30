import { ApiProperty } from '@nestjs/swagger';
import { GratitudeType } from '@prisma/client';

export class GratitudeSummaryDto {
  @ApiProperty({ description: 'Total number of gratitude entries' })
  totalEntries: number;

  @ApiProperty({ description: 'Total estimated value in cents' })
  totalValueCents: number;

  @ApiProperty({ description: 'Currency for the total value' })
  currency: string;

  @ApiProperty({ description: 'Breakdown by gratitude type' })
  byType: GratitudeTypeBreakdown[];

  @ApiProperty({ description: 'Top givers with their contribution counts' })
  topGivers: GiverBreakdown[];

  @ApiProperty({ description: 'Monthly trend data' })
  monthlyTrend: MonthlyGratitudeTrend[];
}

export class GratitudeTypeBreakdown {
  @ApiProperty({ enum: GratitudeType })
  type: GratitudeType;

  @ApiProperty({ description: 'Number of entries for this type' })
  count: number;

  @ApiProperty({ description: 'Total value in cents for this type' })
  totalValueCents: number;

  @ApiProperty({ description: 'Average value in cents for this type' })
  averageValueCents: number;
}

export class GiverBreakdown {
  @ApiProperty({ description: 'Name of the giver' })
  giver: string;

  @ApiProperty({ description: 'Number of gratitude entries from this giver' })
  count: number;

  @ApiProperty({ description: 'Total value in cents from this giver' })
  totalValueCents: number;

  @ApiProperty({ description: 'Most recent gratitude date' })
  lastGratitudeDate: Date;
}

export class MonthlyGratitudeTrend {
  @ApiProperty({ description: 'Year and month (YYYY-MM)' })
  month: string;

  @ApiProperty({ description: 'Number of entries in this month' })
  count: number;

  @ApiProperty({ description: 'Total value in cents for this month' })
  totalValueCents: number;
}
