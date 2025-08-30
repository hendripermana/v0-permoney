'use client';

import { useState } from 'react';
import { Plus, Search, Filter, TrendingDown, TrendingUp, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWishlist } from '@/hooks/use-wishlist';
import { WishlistItemCard } from '@/components/wishlist/wishlist-item-card';
import { AddWishlistItemDialog } from '@/components/wishlist/add-wishlist-item-dialog';
import { WishlistStats } from '@/components/wishlist/wishlist-stats';
import { formatCurrency } from '@/lib/utils';

export default function WishlistPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  
  const { data: wishlistItems = [], isLoading } = useWishlist();

  const filteredItems = wishlistItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.merchant.toLowerCase().includes(searchQuery.toLowerCase());
    
    switch (activeTab) {
      case 'active':
        return matchesSearch && !item.isPurchased;
      case 'purchased':
        return matchesSearch && item.isPurchased;
      case 'target-reached':
        return matchesSearch && !item.isPurchased && item.targetPrice && item.currentPrice <= item.targetPrice;
      default:
        return matchesSearch;
    }
  });

  const stats = {
    total: wishlistItems.length,
    active: wishlistItems.filter(item => !item.isPurchased).length,
    purchased: wishlistItems.filter(item => item.isPurchased).length,
    targetReached: wishlistItems.filter(item => 
      !item.isPurchased && item.targetPrice && item.currentPrice <= item.targetPrice
    ).length,
    totalValue: wishlistItems
      .filter(item => !item.isPurchased)
      .reduce((sum, item) => sum + item.currentPrice, 0),
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Smart Wishlist</h1>
          <p className="text-muted-foreground">
            Track prices and get notified when your desired items go on sale
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </div>

      {/* Stats */}
      <WishlistStats stats={stats} />

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search items or merchants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filters
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">
            All ({stats.total})
          </TabsTrigger>
          <TabsTrigger value="active">
            Active ({stats.active})
          </TabsTrigger>
          <TabsTrigger value="target-reached" className="text-green-600">
            <Target className="h-4 w-4 mr-1" />
            Target Reached ({stats.targetReached})
          </TabsTrigger>
          <TabsTrigger value="purchased">
            Purchased ({stats.purchased})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredItems.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <div className="text-6xl">🛍️</div>
                  <h3 className="text-lg font-semibold">
                    {searchQuery ? 'No items found' : 'Your wishlist is empty'}
                  </h3>
                  <p className="text-muted-foreground max-w-md">
                    {searchQuery 
                      ? 'Try adjusting your search terms or filters'
                      : 'Start by adding items you want to track. We\'ll monitor prices and notify you of deals!'
                    }
                  </p>
                  {!searchQuery && (
                    <Button onClick={() => setShowAddDialog(true)} className="mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Item
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
                <WishlistItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Item Dialog */}
      <AddWishlistItemDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog}
      />
    </div>
  );
}
