'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Emoji mappings for different categories and merchants
export const CATEGORY_EMOJIS: Record<string, string> = {
  // Food & Dining
  'food': '🍽️',
  'restaurant': '🍽️',
  'groceries': '🛒',
  'coffee': '☕',
  'fast-food': '🍔',
  'delivery': '🚚',
  
  // Transportation
  'transport': '🚗',
  'fuel': '⛽',
  'parking': '🅿️',
  'taxi': '🚕',
  'public-transport': '🚌',
  'flight': '✈️',
  
  // Shopping
  'shopping': '🛍️',
  'clothing': '👕',
  'electronics': '📱',
  'books': '📚',
  'pharmacy': '💊',
  'beauty': '💄',
  
  // Entertainment
  'entertainment': '🎬',
  'movies': '🎬',
  'music': '🎵',
  'games': '🎮',
  'sports': '⚽',
  
  // Bills & Utilities
  'utilities': '💡',
  'internet': '🌐',
  'phone': '📞',
  'insurance': '🛡️',
  'rent': '🏠',
  'subscription': '📺',
  
  // Health & Fitness
  'health': '🏥',
  'fitness': '💪',
  'doctor': '👨‍⚕️',
  'dental': '🦷',
  
  // Education
  'education': '🎓',
  'courses': '📖',
  
  // Finance
  'investment': '📈',
  'savings': '💰',
  'loan': '🏦',
  'transfer': '💸',
  'income': '💵',
  
  // Travel
  'travel': '🧳',
  'hotel': '🏨',
  'vacation': '🏖️',
  
  // Personal Care
  'personal-care': '🧴',
  'haircut': '💇',
  'spa': '🧖‍♀️',
  
  // Gifts & Donations
  'gifts': '🎁',
  'charity': '❤️',
  'donation': '🤝',
  
  // Business
  'business': '💼',
  'office': '🏢',
  'supplies': '📎',
  
  // Default
  'other': '💳',
  'unknown': '❓',
};

// Color mappings for different transaction types and categories
export const CATEGORY_COLORS: Record<string, string> = {
  // Income - Green shades
  'income': 'bg-green-100 text-green-800 border-green-200',
  'salary': 'bg-green-100 text-green-800 border-green-200',
  'bonus': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'investment': 'bg-teal-100 text-teal-800 border-teal-200',
  
  // Essential expenses - Blue shades
  'rent': 'bg-blue-100 text-blue-800 border-blue-200',
  'utilities': 'bg-sky-100 text-sky-800 border-sky-200',
  'groceries': 'bg-cyan-100 text-cyan-800 border-cyan-200',
  'insurance': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  
  // Transportation - Purple shades
  'transport': 'bg-purple-100 text-purple-800 border-purple-200',
  'fuel': 'bg-violet-100 text-violet-800 border-violet-200',
  'parking': 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
  
  // Food & Dining - Orange shades
  'food': 'bg-orange-100 text-orange-800 border-orange-200',
  'restaurant': 'bg-amber-100 text-amber-800 border-amber-200',
  'coffee': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  
  // Shopping - Pink shades
  'shopping': 'bg-pink-100 text-pink-800 border-pink-200',
  'clothing': 'bg-rose-100 text-rose-800 border-rose-200',
  'electronics': 'bg-red-100 text-red-800 border-red-200',
  
  // Entertainment - Lime shades
  'entertainment': 'bg-lime-100 text-lime-800 border-lime-200',
  'movies': 'bg-green-100 text-green-800 border-green-200',
  'games': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  
  // Health - Red shades (medical)
  'health': 'bg-red-50 text-red-700 border-red-200',
  'doctor': 'bg-red-100 text-red-800 border-red-200',
  'pharmacy': 'bg-pink-50 text-pink-700 border-pink-200',
  
  // Default
  'other': 'bg-gray-100 text-gray-800 border-gray-200',
  'unknown': 'bg-slate-100 text-slate-800 border-slate-200',
};

// Transaction amount color based on type
export const AMOUNT_COLORS = {
  income: 'text-green-600',
  expense: 'text-red-600',
  transfer: 'text-blue-600',
};

interface TransactionEmojiProps {
  category?: string;
  merchant?: string;
  className?: string;
}

export function TransactionEmoji({ category, merchant, className }: TransactionEmojiProps) {
  // Try to get emoji from merchant first, then category
  const merchantKey = merchant?.toLowerCase().replace(/\s+/g, '-');
  const categoryKey = category?.toLowerCase().replace(/\s+/g, '-');
  
  const emoji = (merchantKey && CATEGORY_EMOJIS[merchantKey]) || 
                (categoryKey && CATEGORY_EMOJIS[categoryKey]) || 
                CATEGORY_EMOJIS.other;

  return (
    <span className={cn('text-lg', className)} role="img" aria-label={category || 'transaction'}>
      {emoji}
    </span>
  );
}

interface TransactionColorTagProps {
  category?: string;
  type?: 'income' | 'expense' | 'transfer';
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'secondary';
  className?: string;
}

export function TransactionColorTag({ 
  category, 
  type = 'expense',
  children, 
  variant = 'default',
  className 
}: TransactionColorTagProps) {
  const categoryKey = category?.toLowerCase().replace(/\s+/g, '-');
  const colorClass = (categoryKey && CATEGORY_COLORS[categoryKey]) || CATEGORY_COLORS.other;

  return (
    <Badge 
      variant={variant}
      className={cn(
        variant === 'default' && colorClass,
        'font-medium',
        className
      )}
    >
      {children}
    </Badge>
  );
}

interface TransactionAmountProps {
  amount: number;
  currency?: string;
  type?: 'income' | 'expense' | 'transfer';
  className?: string;
  showSign?: boolean;
}

export function TransactionAmount({ 
  amount, 
  currency = 'IDR',
  type = 'expense',
  className,
  showSign = true,
}: TransactionAmountProps) {
  const colorClass = AMOUNT_COLORS[type];
  const sign = showSign ? (type === 'income' ? '+' : type === 'expense' ? '-' : '') : '';
  
  const formatAmount = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(value));
  };

  return (
    <span className={cn('font-semibold', colorClass, className)}>
      {sign}{formatAmount(amount)}
    </span>
  );
}

interface VisualTransactionCardProps {
  transaction: {
    id: string;
    description: string;
    amount: number;
    currency?: string;
    category?: string;
    merchant?: string;
    type?: 'income' | 'expense' | 'transfer';
    date: Date;
    tags?: string[];
  };
  className?: string;
  showEmoji?: boolean;
  showColorTag?: boolean;
  compact?: boolean;
}

export function VisualTransactionCard({ 
  transaction, 
  className,
  showEmoji = true,
  showColorTag = true,
  compact = false,
}: VisualTransactionCardProps) {
  return (
    <div className={cn(
      'flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors',
      compact && 'p-2 gap-2',
      className
    )}>
      {showEmoji && (
        <div className="flex-shrink-0">
          <TransactionEmoji 
            category={transaction.category}
            merchant={transaction.merchant}
            className={compact ? 'text-base' : 'text-lg'}
          />
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className={cn(
              'font-medium truncate',
              compact ? 'text-sm' : 'text-base'
            )}>
              {transaction.description}
            </p>
            {transaction.merchant && (
              <p className={cn(
                'text-muted-foreground truncate',
                compact ? 'text-xs' : 'text-sm'
              )}>
                {transaction.merchant}
              </p>
            )}
          </div>
          
          <div className="flex-shrink-0 text-right">
            <TransactionAmount
              amount={transaction.amount}
              currency={transaction.currency}
              type={transaction.type}
              className={compact ? 'text-sm' : 'text-base'}
            />
            <p className={cn(
              'text-muted-foreground',
              compact ? 'text-xs' : 'text-sm'
            )}>
              {transaction.date.toLocaleDateString('id-ID')}
            </p>
          </div>
        </div>
        
        {showColorTag && (transaction.category || transaction.tags?.length) && (
          <div className="flex items-center gap-1 mt-2">
            {transaction.category && (
              <TransactionColorTag 
                category={transaction.category}
                type={transaction.type}
                variant="outline"
                className={compact ? 'text-xs px-1.5 py-0.5' : 'text-xs'}
              >
                {transaction.category}
              </TransactionColorTag>
            )}
            {transaction.tags?.slice(0, 2).map((tag, index) => (
              <Badge 
                key={index}
                variant="secondary"
                className={cn(
                  'text-xs',
                  compact && 'px-1.5 py-0.5'
                )}
              >
                {tag}
              </Badge>
            ))}
            {transaction.tags && transaction.tags.length > 2 && (
              <Badge 
                variant="outline"
                className={cn(
                  'text-xs',
                  compact && 'px-1.5 py-0.5'
                )}
              >
                +{transaction.tags.length - 2}
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
// Simple EmojiPicker component
interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  selectedEmoji?: string;
  className?: string;
}

export function EmojiPicker({ onEmojiSelect, selectedEmoji, className }: EmojiPickerProps) {
  const emojis = ['😊', '😢', '😡', '😍', '🤔', '😴', '🎉', '💰', '🛒', '🍕', '⛽', '🏠', '🚗', '💊', '📱', '👕'];
  
  return (
    <div className={cn("grid grid-cols-4 gap-2 p-2", className)}>
      {emojis.map((emoji) => (
        <button
          key={emoji}
          onClick={() => onEmojiSelect(emoji)}
          className={cn(
            "p-2 hover:bg-gray-100 rounded text-lg transition-colors",
            selectedEmoji === emoji && "bg-blue-100 border-2 border-blue-500"
          )}
          type="button"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
