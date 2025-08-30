import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wishlistApi } from '@/lib/api/wishlist';
import type {
  WishlistItem,
  CreateWishlistItemRequest,
  UpdateWishlistItemRequest,
} from '@/types/wishlist';
import { useToast } from '@/hooks/use-toast';

export const useWishlist = () => {
  return useQuery({
    queryKey: ['wishlist'],
    queryFn: wishlistApi.getWishlistItems,
  });
};

export const useWishlistItem = (id: string) => {
  return useQuery({
    queryKey: ['wishlist', id],
    queryFn: () => wishlistApi.getWishlistItem(id),
    enabled: !!id,
  });
};

export const useCreateWishlistItem = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: wishlistApi.createWishlistItem,
    onSuccess: (newItem) => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      toast({ title: 'Success', description: `Added "${newItem.name}" to your wishlist` });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to add item to wishlist', variant: 'destructive' });
    },
  });
};

export const useUpdateWishlistItem = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWishlistItemRequest }) =>
      wishlistApi.updateWishlistItem(id, data),
    onSuccess: (updatedItem) => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      queryClient.invalidateQueries({ queryKey: ['wishlist', updatedItem.id] });
      toast({ title: 'Success', description: 'Wishlist item updated' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to update wishlist item', variant: 'destructive' });
    },
  });
};

export const useDeleteWishlistItem = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: wishlistApi.deleteWishlistItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      toast({ title: 'Success', description: 'Item removed from wishlist' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to remove item', variant: 'destructive' });
    },
  });
};

export const useRefreshPrice = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: wishlistApi.refreshPrice,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      queryClient.invalidateQueries({ queryKey: ['wishlist', data.item.id] });
      
      if (data.priceAlert) {
        const { priceAlert } = data;
        if (priceAlert.targetReached) {
          toast({ title: 'Success', description: `🎉 Target price reached for "${priceAlert.itemName}"!` });
        } else if (Math.abs(priceAlert.priceChangePercent) >= 10) {
          const direction = priceAlert.priceChange > 0 ? 'increased' : 'decreased';
          toast({ 
            title: 'Price Update', 
            description: `Price ${direction} by ${Math.abs(priceAlert.priceChangePercent).toFixed(1)}% for "${priceAlert.itemName}"` 
          });
        }
      }
      
      toast({ title: 'Success', description: 'Price updated' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to refresh price', variant: 'destructive' });
    },
  });
};

export const useMarkAsPurchased = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: wishlistApi.markAsPurchased,
    onSuccess: (item) => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      queryClient.invalidateQueries({ queryKey: ['wishlist', item.id] });
      toast({ title: 'Success', description: `Marked "${item.name}" as purchased! 🎉` });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to mark as purchased', variant: 'destructive' });
    },
  });
};

export const useLinkToGoal = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, goalId }: { id: string; goalId: string }) =>
      wishlistApi.linkToGoal(id, goalId),
    onSuccess: (item) => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      queryClient.invalidateQueries({ queryKey: ['wishlist', item.id] });
      toast({ title: 'Success', description: 'Item linked to goal' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to link to goal', variant: 'destructive' });
    },
  });
};

export const useUnlinkFromGoal = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: wishlistApi.unlinkFromGoal,
    onSuccess: (item) => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      queryClient.invalidateQueries({ queryKey: ['wishlist', item.id] });
      toast({ title: 'Success', description: 'Item unlinked from goal' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to unlink from goal', variant: 'destructive' });
    },
  });
};

export const usePriceHistory = (id: string, days = 30) => {
  return useQuery({
    queryKey: ['wishlist', id, 'price-history', days],
    queryFn: () => wishlistApi.getPriceHistory(id, days),
    enabled: !!id,
  });
};

export const useSavingsOpportunity = (id: string) => {
  return useQuery({
    queryKey: ['wishlist', id, 'savings-opportunity'],
    queryFn: () => wishlistApi.getSavingsOpportunity(id),
    enabled: !!id,
  });
};

export const useWishlistByGoal = (goalId: string) => {
  return useQuery({
    queryKey: ['wishlist', 'goal', goalId],
    queryFn: () => wishlistApi.getWishlistByGoal(goalId),
    enabled: !!goalId,
  });
};
