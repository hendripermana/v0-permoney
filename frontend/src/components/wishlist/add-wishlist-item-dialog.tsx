'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ExternalLink, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useCreateWishlistItem } from '@/hooks/use-wishlist';
import type { CreateWishlistItemRequest } from '@/types/wishlist';

const addWishlistItemSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  url: z.string().url('Please enter a valid URL'),
  targetPrice: z.string().optional(),
  currency: z.string().default('IDR'),
});

type AddWishlistItemForm = z.infer<typeof addWishlistItemSchema>;

interface AddWishlistItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SUPPORTED_MERCHANTS = [
  { name: 'Tokopedia', domain: 'tokopedia.com', color: 'bg-green-500' },
  { name: 'Shopee', domain: 'shopee.co.id', color: 'bg-orange-500' },
  { name: 'Blibli', domain: 'blibli.com', color: 'bg-blue-500' },
  { name: 'Lazada', domain: 'lazada.co.id', color: 'bg-purple-500' },
  { name: 'Bukalapak', domain: 'bukalapak.com', color: 'bg-red-500' },
];

export function AddWishlistItemDialog({ open, onOpenChange }: AddWishlistItemDialogProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  
  const createWishlistItem = useCreateWishlistItem();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<AddWishlistItemForm>({
    resolver: zodResolver(addWishlistItemSchema),
    defaultValues: {
      currency: 'IDR',
    },
  });

  const watchedUrl = watch('url');

  const detectMerchant = (url: string) => {
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      return SUPPORTED_MERCHANTS.find(merchant => 
        hostname.includes(merchant.domain)
      );
    } catch {
      return null;
    }
  };

  const detectedMerchant = watchedUrl ? detectMerchant(watchedUrl) : null;

  const onSubmit = async (data: AddWishlistItemForm) => {
    setUrlError(null);
    
    const requestData: CreateWishlistItemRequest = {
      name: data.name,
      url: data.url,
      currency: data.currency,
      targetPrice: data.targetPrice ? parseFloat(data.targetPrice) : undefined,
    };

    try {
      await createWishlistItem.mutateAsync(requestData);
      reset();
      onOpenChange(false);
    } catch (error: any) {
      if (error.response?.status === 400) {
        setUrlError(error.response.data.message);
      }
    }
  };

  const handleClose = () => {
    reset();
    setUrlError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add to Wishlist</DialogTitle>
          <DialogDescription>
            Add an item from a supported e-commerce site to track its price
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* URL Input */}
          <div className="space-y-2">
            <Label htmlFor="url">Product URL</Label>
            <Input
              id="url"
              placeholder="https://tokopedia.com/product/..."
              {...register('url')}
              className={errors.url ? 'border-red-500' : ''}
            />
            {errors.url && (
              <p className="text-sm text-red-500">{errors.url.message}</p>
            )}
            {urlError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{urlError}</AlertDescription>
              </Alert>
            )}
            
            {/* Merchant Detection */}
            {detectedMerchant && (
              <div className="flex items-center space-x-2">
                <Badge className={`${detectedMerchant.color} text-white`}>
                  {detectedMerchant.name}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Supported merchant detected
                </span>
              </div>
            )}
          </div>

          {/* Product Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Product Name</Label>
            <Input
              id="name"
              placeholder="Enter product name"
              {...register('name')}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Target Price */}
          <div className="space-y-2">
            <Label htmlFor="targetPrice">Target Price (Optional)</Label>
            <div className="flex space-x-2">
              <Input
                id="targetPrice"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register('targetPrice')}
                className="flex-1"
              />
              <Input
                {...register('currency')}
                className="w-20"
                readOnly
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Get notified when the price drops to or below this amount
            </p>
          </div>

          {/* Supported Merchants Info */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Supported Merchants</Label>
            <div className="flex flex-wrap gap-2">
              {SUPPORTED_MERCHANTS.map((merchant) => (
                <Badge key={merchant.domain} variant="outline" className="text-xs">
                  {merchant.name}
                </Badge>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createWishlistItem.isPending}
              className="min-w-[100px]"
            >
              {createWishlistItem.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Item'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
