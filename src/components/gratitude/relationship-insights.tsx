'use client';

import { Heart, Users, TrendingUp, BarChart3, Lightbulb, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { RelationshipInsights } from '@/lib/api/gratitude';

const insightTypeConfig = {
  TOP_GIVER: {
    icon: Star,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
  },
  COMMON_TYPE: {
    icon: BarChart3,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  TREND: {
    icon: TrendingUp,
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  DEFAULT: {
    icon: Lightbulb,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
};

const relationshipTypeConfig = {
  balanced: {
    label: 'Balanced',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    description: 'Equal give and take',
  },
  'giver-focused': {
    label: 'Giver-Focused',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    description: 'One person gives more',
  },
  'receiver-focused': {
    label: 'Receiver-Focused',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    description: 'One person receives more',
  },
};

interface RelationshipInsightsProps {
  insights: RelationshipInsights;
  className?: string;
}

export function RelationshipInsightsComponent({ insights, className }: RelationshipInsightsProps) {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'decreasing':
        return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />;
      default:
        return <TrendingUp className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Key Insights */}
      {insights.insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lightbulb className="h-5 w-5" />
              <span>Key Insights</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.insights.map((insight, index) => {
                const config = insightTypeConfig[insight.type as keyof typeof insightTypeConfig] || insightTypeConfig.DEFAULT;
                const Icon = config.icon;

                return (
                  <div
                    key={index}
                    className={cn(
                      'p-4 rounded-lg border',
                      config.bgColor,
                      config.borderColor
                    )}
                  >
                    <div className="flex items-start space-x-3">
                      <Icon className={cn('h-5 w-5 mt-0.5', config.color)} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{insight.title}</h4>
                          <Badge
                            variant="secondary"
                            className={cn(
                              'text-xs',
                              getConfidenceColor(insight.confidence)
                            )}
                          >
                            {getConfidenceLabel(insight.confidence)} confidence
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {insight.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Giver Analysis */}
      {insights.giverAnalysis.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Relationship Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {insights.giverAnalysis.map((analysis, index) => (
                <div key={index} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{analysis.giver}</h4>
                    <div className="flex items-center space-x-2">
                      {getTrendIcon(analysis.trend)}
                      <Badge variant="outline" className="text-xs">
                        {analysis.primaryGratitudeType.toLowerCase()}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-muted-foreground">
                          Relationship Strength
                        </span>
                        <span className="text-sm font-medium">
                          {analysis.relationshipStrength}/100
                        </span>
                      </div>
                      <Progress value={analysis.relationshipStrength} className="h-2" />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-muted-foreground">
                          Generosity Score
                        </span>
                        <span className="text-sm font-medium">
                          {analysis.generosityScore}/100
                        </span>
                      </div>
                      <Progress value={analysis.generosityScore} className="h-2" />
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <span>Average frequency: </span>
                    <span className="font-medium">
                      {analysis.averageFrequency.toFixed(1)} times per month
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reciprocity Analysis */}
      {insights.reciprocityAnalysis.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Heart className="h-5 w-5" />
              <span>Reciprocity Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.reciprocityAnalysis.map((reciprocity, index) => {
                const relationshipConfig = relationshipTypeConfig[
                  reciprocity.relationshipType as keyof typeof relationshipTypeConfig
                ] || relationshipTypeConfig.balanced;

                const total = reciprocity.person1ToPerson2 + reciprocity.person2ToPerson1;
                const person1Percentage = total > 0 ? (reciprocity.person1ToPerson2 / total) * 100 : 50;
                const person2Percentage = total > 0 ? (reciprocity.person2ToPerson1 / total) * 100 : 50;

                return (
                  <div key={index} className="space-y-3 p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">
                        {reciprocity.person1} ↔ {reciprocity.person2}
                      </h4>
                      <Badge
                        className={cn(
                          'text-xs',
                          relationshipConfig.color,
                          relationshipConfig.bgColor
                        )}
                      >
                        {relationshipConfig.label}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>{reciprocity.person1} acknowledges {reciprocity.person2}</span>
                        <span className="font-medium">{reciprocity.person1ToPerson2} times</span>
                      </div>
                      <Progress value={person1Percentage} className="h-2" />

                      <div className="flex items-center justify-between text-sm">
                        <span>{reciprocity.person2} acknowledges {reciprocity.person1}</span>
                        <span className="font-medium">{reciprocity.person2ToPerson1} times</span>
                      </div>
                      <Progress value={person2Percentage} className="h-2" />
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {relationshipConfig.description}
                      </span>
                      <span className="font-medium">
                        Balance Score: {(reciprocity.reciprocityScore * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {insights.insights.length === 0 && 
       insights.giverAnalysis.length === 0 && 
       insights.reciprocityAnalysis.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No Insights Yet</h3>
            <p className="text-muted-foreground">
              Add more gratitude entries to see relationship insights and patterns.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
