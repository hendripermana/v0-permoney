'use client';

import { useState } from 'react';
import { MoreHorizontal, Edit, Trash2, Target, Calendar, TrendingUp, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Goal, GoalPriority, GoalStatus } from '@/types/budget';
import { useGoalProgress, useDeleteGoal, useAddGoalContribution } from '@/hooks/use-budgets';
import { formatCurrency } from '@/lib/utils';

interface GoalCardProps {
  goal: Goal;
  onEdit: () => void;
}

export function GoalCard({ goal, onEdit }: GoalCardProps) {
  const [contributionDialogOpen, setContributionDialogOpen] = useState(false);
  const [contributionAmount, setContributionAmount] = useState('');
  
  const { data: progress } = useGoalProgress(goal.id);
  const deleteGoal = useDeleteGoal();
  const addContribution = useAddGoalContribution();

  const getPriorityColor = (priority: GoalPriority) => {
    switch (priority) {
      case GoalPriority.LOW:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      case GoalPriority.MEDIUM:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case GoalPriority.HIGH:
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case GoalPriority.CRITICAL:
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusColor = (status: GoalStatus) => {
    switch (status) {
      case GoalStatus.ACTIVE:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case GoalStatus.COMPLETED:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case GoalStatus.PAUSED:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case GoalStatus.CANCELLED:
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const progressPercentage = progress?.progressPercentage || (goal.currentAmount / goal.targetAmount) * 100;
  const isCompleted = goal.status === GoalStatus.COMPLETED || progressPercentage >= 100;

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleAddContribution = async () => {
    const amount = parseFloat(contributionAmount);
    if (amount > 0) {
      await addContribution.mutateAsync({ id: goal.id, amount: amount * 100 });
      setContributionAmount('');
      setContributionDialogOpen(false);
    }
  };

  const handleDelete = async () => {
    await deleteGoal.mutateAsync(goal.id);
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">{goal.name}</CardTitle>
              {goal.description && (
                <CardDescription className="text-sm">{goal.description}</CardDescription>
              )}
              <div className="flex items-center gap-2">
                <Badge className={getPriorityColor(goal.priority)}>
                  {goal.priority.toLowerCase()}
                </Badge>
                <Badge className={getStatusColor(goal.status)}>
                  {goal.status.toLowerCase()}
                </Badge>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setContributionDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Contribution
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">
                {Math.round(progressPercentage)}%
              </span>
            </div>
            <Progress 
              value={Math.min(progressPercentage, 100)} 
              className="h-2"
            />
            {isCompleted && (
              <div className="flex items-center gap-1 text-green-600 text-xs">
                <Target className="h-3 w-3" />
                Goal completed!
              </div>
            )}
          </div>

          {/* Amounts */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Current</p>
              <p className="font-semibold">
                {formatCurrency(goal.currentAmount / 100, goal.currency)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Target</p>
              <p className="font-semibold">
                {formatCurrency(goal.targetAmount / 100, goal.currency)}
              </p>
            </div>
          </div>

          {/* Remaining Amount */}
          {!isCompleted && (
            <div className="text-sm">
              <p className="text-muted-foreground">Remaining</p>
              <p className="font-semibold text-orange-600">
                {formatCurrency((goal.targetAmount - goal.currentAmount) / 100, goal.currency)}
              </p>
            </div>
          )}

          {/* Target Date */}
          {goal.targetDate && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Target: {formatDate(goal.targetDate)}</span>
            </div>
          )}

          {/* Progress Insights */}
          {progress && (
            <div className="text-xs text-muted-foreground space-y-1">
              {progress.daysRemaining !== undefined && progress.daysRemaining > 0 && (
                <div>{progress.daysRemaining} days remaining</div>
              )}
              {progress.monthlyTargetSaving && (
                <div>
                  Monthly target: {formatCurrency(progress.monthlyTargetSaving / 100, goal.currency)}
                </div>
              )}
              {progress.isOnTrack !== undefined && (
                <div className={progress.isOnTrack ? 'text-green-600' : 'text-orange-600'}>
                  {progress.isOnTrack ? 'On track' : 'Behind schedule'}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Contribution Dialog */}
      <Dialog open={contributionDialogOpen} onOpenChange={setContributionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Contribution</DialogTitle>
            <DialogDescription>
              Add money to your &quot;{goal.name}&quot; goal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">Amount ({goal.currency})</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={contributionAmount}
                onChange={(e) => setContributionAmount(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContributionDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddContribution}
              disabled={!contributionAmount || parseFloat(contributionAmount) <= 0 || addContribution.isPending}
            >
              {addContribution.isPending ? 'Adding...' : 'Add Contribution'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
