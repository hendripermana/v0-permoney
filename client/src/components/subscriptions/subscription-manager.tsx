import React, { useState, useEffect } from 'react';
import { PermoneyCard } from '@/components/permoney-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Bell,
  Plus,
  Calendar as CalendarIcon,
  CreditCard,
  Smartphone,
  Tv,
  Music,
  Gamepad2,
  ShoppingCart,
  AlertTriangle,
  CheckCircle,
  Clock,
  Trash2,
  Edit,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  format,
  addDays,
  addMonths,
  addYears,
  differenceInDays,
  isBefore,
  isToday,
} from 'date-fns';
import { id } from 'date-fns/locale';

interface Subscription {
  id: string;
  name: string;
  amount: number;
  currency: string;
  category: string;
  frequency: 'monthly' | 'yearly' | 'weekly' | 'quarterly';
  nextPayment: Date;
  lastPayment?: Date;
  isActive: boolean;
  autoRenewal: boolean;
  reminderDays: number;
  icon: string;
  color: string;
  description?: string;
  provider: string;
  paymentMethod: string;
}

interface SubscriptionStats {
  totalMonthly: number;
  totalYearly: number;
  activeCount: number;
  upcomingPayments: number;
  potentialSavings: number;
}

const SUBSCRIPTION_CATEGORIES = [
  { value: 'streaming', label: 'Streaming', icon: Tv, color: '#ef4444' },
  { value: 'music', label: 'Musik', icon: Music, color: '#8b5cf6' },
  { value: 'software', label: 'Software', icon: Smartphone, color: '#3b82f6' },
  { value: 'gaming', label: 'Gaming', icon: Gamepad2, color: '#10b981' },
  {
    value: 'shopping',
    label: 'Shopping',
    icon: ShoppingCart,
    color: '#f59e0b',
  },
  { value: 'finance', label: 'Keuangan', icon: CreditCard, color: '#6366f1' },
  { value: 'other', label: 'Lainnya', icon: Bell, color: '#64748b' },
];

const POPULAR_SUBSCRIPTIONS = [
  {
    name: 'Netflix',
    category: 'streaming',
    amount: 186000,
    icon: 'Tv',
    color: '#e50914',
  },
  {
    name: 'Spotify',
    category: 'music',
    amount: 54000,
    icon: 'Music',
    color: '#1db954',
  },
  {
    name: 'Disney+ Hotstar',
    category: 'streaming',
    amount: 39000,
    icon: 'Tv',
    color: '#1e3a8a',
  },
  {
    name: 'YouTube Premium',
    category: 'streaming',
    amount: 79000,
    icon: 'Tv',
    color: '#ff0000',
  },
  {
    name: 'Adobe Creative Cloud',
    category: 'software',
    amount: 799000,
    icon: 'Smartphone',
    color: '#ff0000',
  },
  {
    name: 'Microsoft 365',
    category: 'software',
    amount: 139000,
    icon: 'Smartphone',
    color: '#0078d4',
  },
  {
    name: 'Canva Pro',
    category: 'software',
    amount: 150000,
    icon: 'Smartphone',
    color: '#00c4cc',
  },
];

export function SubscriptionManager() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [newSubscription, setNewSubscription] = useState<Partial<Subscription>>(
    {
      name: '',
      amount: 0,
      currency: 'IDR',
      category: 'other',
      frequency: 'monthly',
      nextPayment: new Date(),
      isActive: true,
      autoRenewal: true,
      reminderDays: 3,
      icon: 'Bell',
      color: '#64748b',
      provider: '',
      paymentMethod: 'credit_card',
    }
  );

  useEffect(() => {
    // Load subscriptions from localStorage or API
    const savedSubscriptions = localStorage.getItem('permoney_subscriptions');
    if (savedSubscriptions) {
      const parsed = JSON.parse(savedSubscriptions).map((sub: any) => ({
        ...sub,
        nextPayment: new Date(sub.nextPayment),
        lastPayment: sub.lastPayment ? new Date(sub.lastPayment) : undefined,
      }));
      setSubscriptions(parsed);
    } else {
      // Add some demo data
      const demoSubscriptions: Subscription[] = [
        {
          id: '1',
          name: 'Netflix',
          amount: 186000,
          currency: 'IDR',
          category: 'streaming',
          frequency: 'monthly',
          nextPayment: addDays(new Date(), 5),
          isActive: true,
          autoRenewal: true,
          reminderDays: 3,
          icon: 'Tv',
          color: '#e50914',
          provider: 'Netflix Inc.',
          paymentMethod: 'credit_card',
        },
        {
          id: '2',
          name: 'Spotify Premium',
          amount: 54000,
          currency: 'IDR',
          category: 'music',
          frequency: 'monthly',
          nextPayment: addDays(new Date(), 12),
          isActive: true,
          autoRenewal: true,
          reminderDays: 3,
          icon: 'Music',
          color: '#1db954',
          provider: 'Spotify AB',
          paymentMethod: 'debit_card',
        },
      ];
      setSubscriptions(demoSubscriptions);
    }
  }, []);

  useEffect(() => {
    // Calculate statistics
    if (subscriptions.length > 0) {
      const activeSubscriptions = subscriptions.filter(sub => sub.isActive);

      const monthlyTotal = activeSubscriptions.reduce((total, sub) => {
        switch (sub.frequency) {
          case 'monthly':
            return total + sub.amount;
          case 'yearly':
            return total + sub.amount / 12;
          case 'weekly':
            return total + sub.amount * 4.33;
          case 'quarterly':
            return total + sub.amount / 3;
          default:
            return total;
        }
      }, 0);

      const yearlyTotal = monthlyTotal * 12;
      const upcomingPayments = activeSubscriptions.filter(
        sub => differenceInDays(sub.nextPayment, new Date()) <= 7
      ).length;

      setStats({
        totalMonthly: monthlyTotal,
        totalYearly: yearlyTotal,
        activeCount: activeSubscriptions.length,
        upcomingPayments,
        potentialSavings: yearlyTotal * 0.15, // Estimate 15% potential savings
      });
    }
  }, [subscriptions]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getNextPaymentDate = (frequency: string, currentDate: Date) => {
    switch (frequency) {
      case 'weekly':
        return addDays(currentDate, 7);
      case 'monthly':
        return addMonths(currentDate, 1);
      case 'quarterly':
        return addMonths(currentDate, 3);
      case 'yearly':
        return addYears(currentDate, 1);
      default:
        return addMonths(currentDate, 1);
    }
  };

  const getPaymentStatus = (nextPayment: Date, reminderDays: number) => {
    const today = new Date();
    const daysUntil = differenceInDays(nextPayment, today);

    if (isToday(nextPayment)) {
      return {
        status: 'due',
        label: 'Jatuh Tempo Hari Ini',
        color: 'bg-red-500',
      };
    } else if (isBefore(nextPayment, today)) {
      return { status: 'overdue', label: 'Terlambat', color: 'bg-red-600' };
    } else if (daysUntil <= reminderDays) {
      return {
        status: 'upcoming',
        label: `${daysUntil} hari lagi`,
        color: 'bg-yellow-500',
      };
    } else {
      return {
        status: 'normal',
        label: `${daysUntil} hari lagi`,
        color: 'bg-green-500',
      };
    }
  };

  const addSubscription = () => {
    if (!newSubscription.name || !newSubscription.amount) return;

    const subscription: Subscription = {
      id: Date.now().toString(),
      name: newSubscription.name,
      amount: newSubscription.amount,
      currency: newSubscription.currency || 'IDR',
      category: newSubscription.category || 'other',
      frequency: newSubscription.frequency || 'monthly',
      nextPayment: selectedDate || new Date(),
      isActive: true,
      autoRenewal: newSubscription.autoRenewal || true,
      reminderDays: newSubscription.reminderDays || 3,
      icon: newSubscription.icon || 'Bell',
      color: newSubscription.color || '#64748b',
      provider: newSubscription.provider || '',
      paymentMethod: newSubscription.paymentMethod || 'credit_card',
    };

    const updatedSubscriptions = [...subscriptions, subscription];
    setSubscriptions(updatedSubscriptions);
    localStorage.setItem(
      'permoney_subscriptions',
      JSON.stringify(updatedSubscriptions)
    );

    // Reset form
    setNewSubscription({
      name: '',
      amount: 0,
      currency: 'IDR',
      category: 'other',
      frequency: 'monthly',
      nextPayment: new Date(),
      isActive: true,
      autoRenewal: true,
      reminderDays: 3,
      icon: 'Bell',
      color: '#64748b',
      provider: '',
      paymentMethod: 'credit_card',
    });
    setSelectedDate(undefined);
    setIsAddDialogOpen(false);
  };

  const toggleSubscription = (id: string) => {
    const updatedSubscriptions = subscriptions.map(sub =>
      sub.id === id ? { ...sub, isActive: !sub.isActive } : sub
    );
    setSubscriptions(updatedSubscriptions);
    localStorage.setItem(
      'permoney_subscriptions',
      JSON.stringify(updatedSubscriptions)
    );
  };

  const deleteSubscription = (id: string) => {
    const updatedSubscriptions = subscriptions.filter(sub => sub.id !== id);
    setSubscriptions(updatedSubscriptions);
    localStorage.setItem(
      'permoney_subscriptions',
      JSON.stringify(updatedSubscriptions)
    );
  };

  const getCategoryIcon = (category: string) => {
    const categoryData = SUBSCRIPTION_CATEGORIES.find(
      cat => cat.value === category
    );
    return categoryData?.icon || Bell;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PermoneyCard className="glassmorphism p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Bell className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                Pengingat Langganan
              </h2>
              <p className="text-muted-foreground">
                Kelola dan pantau semua langganan Anda
              </p>
            </div>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Langganan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Tambah Langganan Baru</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nama Layanan</Label>
                  <Input
                    id="name"
                    value={newSubscription.name || ''}
                    onChange={e =>
                      setNewSubscription(prev => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Netflix, Spotify, dll."
                  />
                </div>

                <div>
                  <Label htmlFor="amount">Biaya</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={newSubscription.amount || ''}
                    onChange={e =>
                      setNewSubscription(prev => ({
                        ...prev,
                        amount: parseFloat(e.target.value) || 0,
                      }))
                    }
                    placeholder="150000"
                  />
                </div>

                <div>
                  <Label htmlFor="category">Kategori</Label>
                  <Select
                    value={newSubscription.category}
                    onValueChange={value =>
                      setNewSubscription(prev => ({ ...prev, category: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBSCRIPTION_CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="frequency">Frekuensi</Label>
                  <Select
                    value={newSubscription.frequency}
                    onValueChange={(value: any) =>
                      setNewSubscription(prev => ({
                        ...prev,
                        frequency: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Mingguan</SelectItem>
                      <SelectItem value="monthly">Bulanan</SelectItem>
                      <SelectItem value="quarterly">Triwulan</SelectItem>
                      <SelectItem value="yearly">Tahunan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Tanggal Pembayaran Berikutnya</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate
                          ? format(selectedDate, 'PPP', { locale: id })
                          : 'Pilih tanggal'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <Button onClick={addSubscription} className="w-full">
                  Tambah Langganan
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {stats.activeCount}
              </div>
              <div className="text-sm text-muted-foreground">
                Langganan Aktif
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {formatCurrency(stats.totalMonthly)}
              </div>
              <div className="text-sm text-muted-foreground">Per Bulan</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {formatCurrency(stats.totalYearly)}
              </div>
              <div className="text-sm text-muted-foreground">Per Tahun</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">
                {stats.upcomingPayments}
              </div>
              <div className="text-sm text-muted-foreground">Jatuh Tempo</div>
            </div>
          </div>
        )}
      </PermoneyCard>

      {/* Upcoming Payments Alert */}
      {stats && stats.upcomingPayments > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
            <strong>Perhatian:</strong> Anda memiliki {stats.upcomingPayments}{' '}
            pembayaran yang akan jatuh tempo dalam 7 hari ke depan.
          </AlertDescription>
        </Alert>
      )}

      {/* Subscriptions List */}
      <PermoneyCard className="glassmorphism p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Daftar Langganan
        </h3>

        {subscriptions.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Belum ada langganan yang ditambahkan
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {subscriptions.map(subscription => {
              const IconComponent = getCategoryIcon(subscription.category);
              const paymentStatus = getPaymentStatus(
                subscription.nextPayment,
                subscription.reminderDays
              );

              return (
                <div
                  key={subscription.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: subscription.color }}
                    >
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-foreground">
                          {subscription.name}
                        </h4>
                        {!subscription.isActive && (
                          <Badge variant="secondary">Nonaktif</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(subscription.amount)} /{' '}
                        {subscription.frequency === 'monthly'
                          ? 'bulan'
                          : subscription.frequency === 'yearly'
                            ? 'tahun'
                            : subscription.frequency === 'weekly'
                              ? 'minggu'
                              : 'triwulan'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          className={cn(
                            'text-white text-xs',
                            paymentStatus.color
                          )}
                        >
                          {paymentStatus.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(subscription.nextPayment, 'dd MMM yyyy', {
                            locale: id,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSubscription(subscription.id)}
                    >
                      {subscription.isActive ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Clock className="h-4 w-4 text-gray-500" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteSubscription(subscription.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </PermoneyCard>

      {/* Savings Insights */}
      {stats && stats.potentialSavings > 0 && (
        <PermoneyCard className="glassmorphism p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="h-6 w-6 text-green-500" />
            <h3 className="text-lg font-semibold text-foreground">
              Peluang Penghematan
            </h3>
          </div>

          <div className="space-y-3">
            <p className="text-muted-foreground">
              Berdasarkan analisis langganan Anda, ada potensi penghematan
              hingga {formatCurrency(stats.potentialSavings)} per tahun.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <h4 className="font-medium text-green-800 dark:text-green-200">
                  Tips Penghematan
                </h4>
                <ul className="text-sm text-green-700 dark:text-green-300 mt-2 space-y-1">
                  <li>• Tinjau langganan yang jarang digunakan</li>
                  <li>• Cari paket bundling yang lebih hemat</li>
                  <li>• Manfaatkan promo langganan tahunan</li>
                </ul>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <h4 className="font-medium text-blue-800 dark:text-blue-200">
                  Rekomendasi
                </h4>
                <ul className="text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1">
                  <li>• Gunakan family plan untuk berbagi</li>
                  <li>• Set reminder untuk evaluasi bulanan</li>
                  <li>• Bandingkan dengan alternatif lain</li>
                </ul>
              </div>
            </div>
          </div>
        </PermoneyCard>
      )}
    </div>
  );
}

export default SubscriptionManager;
