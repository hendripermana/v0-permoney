'use client';

import { useState } from 'react';
import { 
  MoreHorizontal, 
  ExternalLink, 
  RefreshCw, 
  Target, 
  TrendingDown, 
  TrendingUp,
  ShoppingCart,
  Trash2,
  Edit,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatCurrency, formatDistanceToNow } from '@/lib/utils';
import { useRefreshPrice, useMarkAsPurchased, useDeleteWishlistItem } from '@/hooks/use-wishlist';
import type { WishlistItem } from '@/types/wishlist';

interface WishlistItemCardProps {
  item: WishlistItem;
}

export function WishlistItemCard({ item }: WishlistItemCardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const refreshPriceMutation = useRefreshPrice();
  const markAsPurchasedMutation = useMarkAsPurchased();
  const deleteItemMutation = useDeleteWishlistItem();

  const handleRefreshPrice = async () => {
    setIsRefreshing(true);
    try {
      await refreshPriceMutation.mutateAsync(item.id);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleMarkAsPurchased = () => {
    markAsPurchasedMutation.mutate(item.id);
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to remove "${item.name}" from your wishlist?`)) {
      deleteItemMutation.mutate(item.id);
    }
  };

  const targetReached = item.targetPrice && item.currentPrice <= item.targetPrice;
  const priceChange = item.priceHistory.length >= 2 
    ? item.currentPrice - item.priceHistory[1].price 
    : 0;
  const priceChangePercent = item.priceHistory.length >= 2 && item.priceHistory[1].price > 0
    ? ((item.currentPrice - item.priceHistory[1].price) / item.priceHistory[1].price) * 100
    : 0;

  return (
    <Card className={`relative transition-all hover:shadow-lg ${
      item.isPurchased ? 'opacity-75' : ''
    } ${targetReached ? 'ring-2 ring-green-500' : ''}`}>
      {targetReached && (
        <div className="absolute -top-2 -right-2 z-10">
          <Badge className="bg-green-500 text-white">
            <Target className="h-3 w-3 mr-1" />
            Target Reached!
          </Badge>
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={item.imageUrl} alt={item.name} />
              <AvatarFallback>{item.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate" title={item.name}>
                {item.name}
              </h3>
              <p className="text-xs text-muted-foreground">{item.merchant}</p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => window.open(item.url, '_blank')}>
                <ExternalLink className="h-4 w-4 mr-2" />
                View Product
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleRefreshPrice} disabled={isRefreshing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh Price
              </DropdownMenuItem>
              <DropdownMenuItem>
                <BarChart3 className="h-4 w-4 mr-2" />
                Price History
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="h-4 w-4 mr-2" />
                Edit Item
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {!item.isPurchased && (
                <DropdownMenuItem onClick={handleMarkAsPurchased}>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Mark as Purchased
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                onClick={handleDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Price Information */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">
              {formatCurrency(item.currentPrice, item.currency)}
            </span>
            {priceChange !== 0 && (
              <div className={`flex items-center space-x-1 text-sm ${
                priceChange > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {priceChange > 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span>{Math.abs(priceChangePercent).toFixed(1)}%</span>
              </div>
            )}
          </div>

          {item.targetPrice && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Target:</span>
              <span className={targetReached ? 'text-green-600 font-semibold' : ''}>
                {formatCurrency(item.targetPrice, item.currency)}
              </span>
            </div>
          )}
        </div>

        {/* Status Badges */}
        <div className="flex flex-wrap gap-2">
          {item.isPurchased && (
            <Badge variant="secondary">
              <ShoppingCart className="h-3 w-3 mr-1" />
              Purchased
            </Badge>
          )}
          {item.linkedGoalId && (
            <Badge variant="outline">
              <Target className="h-3 w-3 mr-1" />
              Linked to Goal
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.open(item.url, '_blank')}
            className="flex-1"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefreshPrice}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Metadata */}
        <div className="text-xs text-muted-foreground">
          Added {formatDistanceToNow(new Date(item.createdAt))} ago
          {item.createdBy && ` by ${item.createdBy.name}`}
        </div>
      </CardContent>
    </Card>
  );
}
