'use client';

import React, { useState } from 'react';
import { Plus, Settings, Users, Eye } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { HouseholdSelector } from './household-selector';
import { CreateHouseholdDialog } from './create-household-dialog';
import { MemberManagement } from './member-management';
import { HouseholdSettings } from './household-settings';
import { ViewTypeSelector } from './view-type-selector';
import { useHouseholds, useHousehold, useUserRole, useFilteredData } from '../../hooks/use-households';
import { ViewType } from '../../lib/api';

interface HouseholdDashboardProps {
  initialHouseholdId?: string;
}

export function HouseholdDashboard({ initialHouseholdId }: HouseholdDashboardProps) {
  const [selectedHouseholdId, setSelectedHouseholdId] = useState(initialHouseholdId || '');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewType, setViewType] = useState<ViewType>('individual');

  const { data: households, isLoading: householdsLoading } = useHouseholds();
  const { data: household, isLoading: householdLoading } = useHousehold(selectedHouseholdId);
  const { data: userRoleData } = useUserRole(selectedHouseholdId);
  const { data: filteredData } = useFilteredData(selectedHouseholdId, viewType);

  const isAdmin = userRoleData?.role === 'ADMIN';

  // Auto-select first household if none selected
  React.useEffect(() => {
    if (!selectedHouseholdId && households && households.length > 0) {
      setSelectedHouseholdId(households[0].id);
    }
  }, [households, selectedHouseholdId]);

  const handleCreateHousehold = (household: any) => {
    setSelectedHouseholdId(household.id);
  };

  if (householdsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">Loading households...</div>
      </div>
    );
  }

  if (!households || households.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle>Welcome to Permoney</CardTitle>
            <CardDescription>
              Create your first household to start managing your finances
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Household
            </Button>
          </CardContent>
        </Card>
        <CreateHouseholdDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSuccess={handleCreateHousehold}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Household Management</h1>
          <p className="text-muted-foreground">
            Manage your household members, settings, and financial views
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <HouseholdSelector
            value={selectedHouseholdId}
            onValueChange={setSelectedHouseholdId}
            onCreateNew={() => setCreateDialogOpen(true)}
          />
          {selectedHouseholdId && (
            <ViewTypeSelector
              value={viewType}
              onValueChange={setViewType}
            />
          )}
        </div>
      </div>

      {selectedHouseholdId && household && (
        <>
          {/* Household Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {household.name}
                    <Badge variant="outline">{household.baseCurrency}</Badge>
                  </CardTitle>
                  <CardDescription>
                    {household.members.length} member{household.members.length !== 1 ? 's' : ''} • 
                    Created {new Date(household.createdAt).toLocaleDateString()}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={
                    userRoleData?.role === 'ADMIN' 
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      : userRoleData?.role === 'PARTNER'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                      : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                  }>
                    {userRoleData?.role}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            {filteredData && (
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {filteredData.allowedUserIds.length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Visible Users
                    </div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {filteredData.allowedAccountIds.length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Accessible Accounts
                    </div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      <Eye className="h-6 w-6 mx-auto" />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {viewType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} View
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Management Tabs */}
          <Tabs defaultValue="members" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="members" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Members
              </TabsTrigger>
              <TabsTrigger 
                value="settings" 
                className="flex items-center gap-2"
                disabled={!isAdmin}
              >
                <Settings className="h-4 w-4" />
                Settings
                {!isAdmin && <Badge variant="outline" className="ml-1 text-xs">Admin Only</Badge>}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="members" className="space-y-4">
              <MemberManagement householdId={selectedHouseholdId} />
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              {isAdmin ? (
                <HouseholdSettings householdId={selectedHouseholdId} />
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Admin Access Required</h3>
                    <p className="text-muted-foreground">
                      Only household administrators can modify settings.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}

      <CreateHouseholdDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleCreateHousehold}
      />
    </div>
  );
}
