'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Heart, HelpingHand, Gift, MoreHorizontal, Edit, Trash2, User } from 'lucide-react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { GratitudeEntry } from '@/lib/api/gratitude';
import { useDeleteGratitudeEntry } from '@/hooks/use-gratitude';

const gratitudeTypeConfig = {
  TREAT: {
    icon: Heart,
    label: 'Treat',
    color: 'bg-pink-100 text-pink-700 border-pink-200',
    iconColor: 'text-pink-500',
  },
  HELP: {
    icon: HelpingHand,
    label: 'Help',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    iconColor: 'text-blue-500',
  },
  GIFT: {
    icon: Gift,
    label: 'Gift',
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    iconColor: 'text-purple-500',
  },
};

interface GratitudeEntryCardProps {
  entry: GratitudeEntry;
  onEdit?: (entry: GratitudeEntry) => void;
  showActions?: boolean;
}

export function GratitudeEntryCard({ 
  entry, 
  onEdit, 
  showActions = true 
}: GratitudeEntryCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const deleteGratitudeEntry = useDeleteGratitudeEntry();

  const typeConfig = gratitudeTypeConfig[entry.type];
  const Icon = typeConfig.icon;

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(cents / 100);
  };

  const handleDelete = async () => {
    try {
      await deleteGratitudeEntry.mutateAsync(entry.id);
      setShowDeleteDialog(false);
    } catch (error) {
      // Error is handled by the mutation hook
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-muted">
                  {getInitials(entry.giver)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold text-sm">{entry.giver}</h3>
                  <Badge variant="secondary" className={cn('text-xs', typeConfig.color)}>
                    <Icon className={cn('mr-1 h-3 w-3', typeConfig.iconColor)} />
                    {typeConfig.label}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(entry.date), 'MMM d, yyyy')}
                </p>
              </div>
            </div>

            {showActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(entry)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <p className="text-sm text-foreground mb-3">{entry.description}</p>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-4">
              {entry.category && (
                <div className="flex items-center space-x-1">
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: entry.category.color || '#6b7280' }}
                  />
                  <span>{entry.category.name}</span>
                </div>
              )}
              
              {entry.transaction && (
                <div className="flex items-center space-x-1">
                  <span>Linked to transaction</span>
                </div>
              )}
            </div>

            {entry.estimatedValueCents && entry.estimatedValueCents > 0 && (
              <div className="font-medium text-foreground">
                {formatCurrency(entry.estimatedValueCents)}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-3 pt-3 border-t">
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              <span>Added by {entry.creator.name}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {format(new Date(entry.createdAt), 'MMM d, h:mm a')}
            </span>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Gratitude Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this gratitude entry? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteGratitudeEntry.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteGratitudeEntry.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
