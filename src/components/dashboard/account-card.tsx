'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, cn } from '@/lib/utils';
import { CreditCard, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

interface Institution {
  name: string;
  code: string;
  logoUrl?: string;
  color: string;
}

interface Account {
  id: string;
  name: string;
  type: 'ASSET' | 'LIABILITY';
  subtype: string;
  balance: number;
  currency: string;
  accountNumber: string;
  institution?: Institution;
  isActive: boolean;
}

interface AccountCardProps {
  account: Account;
  showBalance?: boolean;
  className?: string;
}

const institutionColors: Record<string, string> = {
  BCA: 'bg-blue-600',
  BNI: 'bg-orange-600',
  BRI: 'bg-blue-800',
  MANDIRI: 'bg-yellow-600',
  CIMB: 'bg-red-600',
  PERMATA: 'bg-green-600',
  DANAMON: 'bg-blue-500',
  CASH: 'bg-green-500',
  GOPAY: 'bg-green-500',
  OVO: 'bg-purple-600',
  DANA: 'bg-blue-400',
  SHOPEEPAY: 'bg-orange-500',
};

export function AccountCard({ account, showBalance = true, className }: AccountCardProps) {
  const [isBalanceVisible, setIsBalanceVisible] = useState(showBalance);
  
  const institutionColor = account.institution?.code 
    ? institutionColors[account.institution.code] || 'bg-gray-600'
    : institutionColors[account.subtype] || 'bg-gray-600';

  const displayBalance = isBalanceVisible 
    ? formatCurrency(account.balance, account.currency)
    : '••••••••';

  const isPositive = account.balance >= 0;
  const balanceColor = account.type === 'ASSET' 
    ? (isPositive ? 'text-foreground' : 'text-red-600')
    : (isPositive ? 'text-red-600' : 'text-foreground');

  return (
    <Card className={cn(
      'permoney-card relative overflow-hidden min-h-[140px] group cursor-pointer',
      'hover:scale-[1.02] transition-all duration-300',
      className
    )}>
      {/* Background gradient */}
      <div className={cn(
        'absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity',
        institutionColor
      )} />
      
      <CardContent className="p-6 relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            {/* Institution logo/icon */}
            <div className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg',
              institutionColor
            )}>
              {account.institution?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={account.institution.logoUrl} 
                  alt={account.institution.name}
                  className="w-8 h-8 object-contain"
                />
              ) : (
                <span>
                  {account.institution?.code || account.subtype.slice(0, 3).toUpperCase()}
                </span>
              )}
            </div>
            
            <div>
              <h3 className="font-semibold text-lg leading-tight">{account.name}</h3>
              <p className="text-sm text-muted-foreground">
                {account.institution?.name || account.subtype}
              </p>
            </div>
          </div>

          {/* Account type badge */}
          <Badge 
            variant={account.type === 'ASSET' ? 'default' : 'secondary'}
            className="text-xs"
          >
            {account.type}
          </Badge>
        </div>

        <div className="flex items-end justify-between">
          <div className="flex-1">
            {/* Account number */}
            <p className="text-xs text-muted-foreground mb-2 font-mono">
              ••••{account.accountNumber.slice(-4)}
            </p>
            
            {/* Balance */}
            <div className="flex items-center space-x-2">
              <span className={cn('text-2xl font-bold', balanceColor)}>
                {displayBalance}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsBalanceVisible(!isBalanceVisible);
                }}
                className="p-1 hover:bg-muted rounded-md transition-colors"
                aria-label={isBalanceVisible ? 'Hide balance' : 'Show balance'}
              >
                {isBalanceVisible ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>

          {/* Card icon */}
          <CreditCard className="h-6 w-6 text-muted-foreground/50" />
        </div>

        {/* Status indicator */}
        <div className="absolute top-4 right-4">
          <div className={cn(
            'w-2 h-2 rounded-full',
            account.isActive ? 'bg-green-500' : 'bg-red-500'
          )} />
        </div>
      </CardContent>
    </Card>
  );
}
