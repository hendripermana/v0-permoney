'use client';

import { useState } from 'react';
import { Heart, Filter, Calendar, Search, BarChart3, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AddGratitudeEntryDialog } from '@/components/gratitude/add-gratitude-entry-dialog';
import { GratitudeEntryCard } from '@/components/gratitude/gratitude-entry-card';
import { GratitudeSummaryComponent } from '@/components/gratitude/gratitude-summary';
import { RelationshipInsightsComponent } from '@/components/gratitude/relationship-insights';
import {
  useGratitudeEntries,
  useGratitudeSummary,
  useRelationshipInsights,
} from '@/hooks/use-gratitude';
import { GratitudeFilters } from '@/lib/api/gratitude';

export default function GratitudePage() {
  const [filters, setFilters] = useState<GratitudeFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('entries');

  // Apply search term to filters
  const appliedFilters = {
    ...filters,
    ...(searchTerm && { search: searchTerm }),
  };

  const {
    data: entriesData,
    isLoading: entriesLoading,
    error: entriesError,
  } = useGratitudeEntries(appliedFilters, currentPage, 12);

  const {
    data: summary,
    isLoading: summaryLoading,
  } = useGratitudeSummary();

  const {
    data: insights,
    isLoading: insightsLoading,
  } = useRelationshipInsights();

  const handleFilterChange = (key: keyof GratitudeFilters, value: string | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
    setCurrentPage(1);
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== undefined) || searchTerm;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center space-x-2">
            <Heart className="h-8 w-8 text-pink-500" />
            <span>Gratitude Journal</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Track moments of gratitude and strengthen relationships
          </p>
        </div>
        <AddGratitudeEntryDialog>
          <Button>
            <Heart className="mr-2 h-4 w-4" />
            Add Gratitude
          </Button>
        </AddGratitudeEntryDialog>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="entries" className="flex items-center space-x-2">
            <Heart className="h-4 w-4" />
            <span>Entries</span>
          </TabsTrigger>
          <TabsTrigger value="summary" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Summary</span>
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Insights</span>
          </TabsTrigger>
        </TabsList>

        {/* Entries Tab */}
        <TabsContent value="entries" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Filters</span>
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-2">
                    Active
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search descriptions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select
                  value={filters.type || ''}
                  onValueChange={(value) => handleFilterChange('type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All types</SelectItem>
                    <SelectItem value="TREAT">Treats</SelectItem>
                    <SelectItem value="HELP">Help</SelectItem>
                    <SelectItem value="GIFT">Gifts</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Filter by giver..."
                  value={filters.giver || ''}
                  onChange={(e) => handleFilterChange('giver', e.target.value)}
                />

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    disabled={!hasActiveFilters}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Entries Grid */}
          {entriesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-16 w-full mb-2" />
                    <Skeleton className="h-3 w-1/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : entriesError ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-destructive">Failed to load gratitude entries</p>
              </CardContent>
            </Card>
          ) : !entriesData?.entries.length ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No Gratitude Entries</h3>
                <p className="text-muted-foreground mb-4">
                  {hasActiveFilters
                    ? 'No entries match your current filters.'
                    : 'Start by adding your first gratitude entry.'}
                </p>
                {!hasActiveFilters && (
                  <AddGratitudeEntryDialog>
                    <Button>
                      <Heart className="mr-2 h-4 w-4" />
                      Add Your First Entry
                    </Button>
                  </AddGratitudeEntryDialog>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {entriesData.entries.map((entry) => (
                  <GratitudeEntryCard key={entry.id} entry={entry} />
                ))}
              </div>

              {/* Pagination */}
              {entriesData.totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {entriesData.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.min(entriesData.totalPages, prev + 1))}
                    disabled={currentPage === entriesData.totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* Summary Tab */}
        <TabsContent value="summary">
          {summaryLoading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-8 w-16 mb-2" />
                      <Skeleton className="h-4 w-32" />
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            </div>
          ) : summary ? (
            <GratitudeSummaryComponent summary={summary} />
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No Data Available</h3>
                <p className="text-muted-foreground">
                  Add some gratitude entries to see your summary.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights">
          {insightsLoading ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            </div>
          ) : insights ? (
            <RelationshipInsightsComponent insights={insights} />
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No Insights Available</h3>
                <p className="text-muted-foreground">
                  Add more gratitude entries to generate relationship insights.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
