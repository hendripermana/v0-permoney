'use client';

import { useState } from 'react';
import { Target, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Goal } from '@/types/budget';
import { GoalCard } from './goal-card';
import { EditGoalDialog } from './edit-goal-dialog-simple';

interface GoalListProps {
  goals?: Goal[];
  isLoading: boolean;
}

export function GoalList({ goals, isLoading }: GoalListProps) {
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-2 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!goals || goals.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Target className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No goals yet</h3>
          <p className="text-muted-foreground text-center mb-4">
            Set your first financial goal to start tracking your progress and stay motivated.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {goals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            onEdit={() => setEditingGoal(goal)}
          />
        ))}
      </div>

      {/* Edit Dialog */}
      {editingGoal && (
        <EditGoalDialog
          goal={editingGoal}
          open={!!editingGoal}
          onOpenChange={(open) => !open && setEditingGoal(null)}
        />
      )}
    </>
  );
}
