import { ApiProperty } from '@nestjs/swagger';
import { GratitudeType } from '@prisma/client';

export class RelationshipInsightsDto {
  @ApiProperty({ description: 'Insights about relationships based on gratitude patterns' })
  insights: RelationshipInsight[];

  @ApiProperty({ description: 'Giver relationship analysis' })
  giverAnalysis: GiverRelationshipAnalysis[];

  @ApiProperty({ description: 'Reciprocity analysis between household members' })
  reciprocityAnalysis: ReciprocityAnalysis[];
}

export class RelationshipInsight {
  @ApiProperty({ description: 'Type of insight' })
  type: string;

  @ApiProperty({ description: 'Title of the insight' })
  title: string;

  @ApiProperty({ description: 'Detailed description of the insight' })
  description: string;

  @ApiProperty({ description: 'Supporting data for the insight' })
  data: any;

  @ApiProperty({ description: 'Confidence score (0-1)' })
  confidence: number;
}

export class GiverRelationshipAnalysis {
  @ApiProperty({ description: 'Name of the giver' })
  giver: string;

  @ApiProperty({ description: 'Relationship strength score (0-100)' })
  relationshipStrength: number;

  @ApiProperty({ description: 'Most common gratitude type from this giver' })
  primaryGratitudeType: GratitudeType;

  @ApiProperty({ description: 'Average frequency (entries per month)' })
  averageFrequency: number;

  @ApiProperty({ description: 'Generosity score based on value and frequency' })
  generosityScore: number;

  @ApiProperty({ description: 'Trend direction (increasing, stable, decreasing)' })
  trend: string;
}

export class ReciprocityAnalysis {
  @ApiProperty({ description: 'First person in the relationship' })
  person1: string;

  @ApiProperty({ description: 'Second person in the relationship' })
  person2: string;

  @ApiProperty({ description: 'Gratitude given by person1 to person2' })
  person1ToPerson2: number;

  @ApiProperty({ description: 'Gratitude given by person2 to person1' })
  person2ToPerson1: number;

  @ApiProperty({ description: 'Reciprocity balance score (-1 to 1)' })
  reciprocityScore: number;

  @ApiProperty({ description: 'Relationship type (balanced, giver-focused, receiver-focused)' })
  relationshipType: string;
}
