import React from 'react';
import { DashboardLayout, SubscriptionManager } from '@/components';
import { PermoneyCard } from '@/components/permoney-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Bell,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Smartphone,
  CreditCard,
  Calendar,
} from 'lucide-react';

export default function SubscriptionsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <PermoneyCard className="glassmorphism p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
              <Bell className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Kelola Langganan
              </h1>
              <p className="text-muted-foreground text-lg">
                Pantau dan optimalkan semua langganan digital Anda
              </p>
            </div>
            <div className="ml-auto">
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                Smart Tracking
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">
                Auto Detection
              </h3>
              <p className="text-sm text-muted-foreground">
                Deteksi otomatis langganan dari transaksi bank
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-xl flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">
                Smart Alerts
              </h3>
              <p className="text-sm text-muted-foreground">
                Pengingat cerdas sebelum tanggal pembayaran
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center mx-auto mb-3">
                <TrendingDown className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">
                Cost Analysis
              </h3>
              <p className="text-sm text-muted-foreground">
                Analisis biaya dan rekomendasi penghematan
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">
                Calendar View
              </h3>
              <p className="text-sm text-muted-foreground">
                Lihat semua pembayaran dalam kalender
              </p>
            </div>
          </div>
        </PermoneyCard>

        {/* Subscription Manager */}
        <SubscriptionManager />

        {/* Tips & Best Practices */}
        <PermoneyCard className="glassmorphism p-6">
          <div className="flex items-center gap-3 mb-6">
            <Smartphone className="h-6 w-6 text-green-500" />
            <h2 className="text-xl font-bold text-foreground">
              Tips Mengelola Langganan
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">
                Strategi Penghematan
              </h3>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-medium text-green-800 dark:text-green-200">
                      Audit Bulanan
                    </h4>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Tinjau semua langganan setiap bulan dan batalkan yang
                      tidak terpakai
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-medium text-green-800 dark:text-green-200">
                      Paket Bundling
                    </h4>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Cari paket bundling yang lebih hemat daripada langganan
                      terpisah
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-medium text-green-800 dark:text-green-200">
                      Langganan Tahunan
                    </h4>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Manfaatkan diskon langganan tahunan untuk layanan yang
                      sering digunakan
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-medium text-green-800 dark:text-green-200">
                      Family Sharing
                    </h4>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Gunakan family plan untuk berbagi biaya dengan keluarga
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">
                Manajemen Pembayaran
              </h3>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-medium text-blue-800 dark:text-blue-200">
                      Satu Kartu Kredit
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Gunakan satu kartu kredit khusus untuk semua langganan
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-medium text-blue-800 dark:text-blue-200">
                      Tanggal Seragam
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Atur semua pembayaran di tanggal yang sama setiap bulan
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-medium text-blue-800 dark:text-blue-200">
                      Auto-Renewal Alert
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Set pengingat 7 hari sebelum auto-renewal untuk evaluasi
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-medium text-blue-800 dark:text-blue-200">
                      Backup Payment
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Siapkan metode pembayaran cadangan untuk menghindari
                      gangguan layanan
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </PermoneyCard>

        {/* Popular Subscriptions in Indonesia */}
        <PermoneyCard className="glassmorphism p-6">
          <div className="flex items-center gap-3 mb-6">
            <CreditCard className="h-6 w-6 text-purple-500" />
            <h2 className="text-xl font-bold text-foreground">
              Langganan Populer di Indonesia
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                name: 'Netflix',
                category: 'Streaming',
                price: 'Rp 186.000/bulan',
                color: 'bg-red-500',
              },
              {
                name: 'Spotify Premium',
                category: 'Musik',
                price: 'Rp 54.000/bulan',
                color: 'bg-green-500',
              },
              {
                name: 'Disney+ Hotstar',
                category: 'Streaming',
                price: 'Rp 39.000/bulan',
                color: 'bg-blue-500',
              },
              {
                name: 'YouTube Premium',
                category: 'Video',
                price: 'Rp 79.000/bulan',
                color: 'bg-red-600',
              },
              {
                name: 'Adobe Creative Cloud',
                category: 'Software',
                price: 'Rp 799.000/bulan',
                color: 'bg-red-700',
              },
              {
                name: 'Microsoft 365',
                category: 'Produktivitas',
                price: 'Rp 139.000/bulan',
                color: 'bg-blue-600',
              },
              {
                name: 'Canva Pro',
                category: 'Design',
                price: 'Rp 150.000/bulan',
                color: 'bg-purple-500',
              },
              {
                name: 'Zoom Pro',
                category: 'Video Call',
                price: 'Rp 200.000/bulan',
                color: 'bg-blue-400',
              },
              {
                name: 'Notion Pro',
                category: 'Produktivitas',
                price: 'Rp 120.000/bulan',
                color: 'bg-gray-600',
              },
            ].map((sub, index) => (
              <div
                key={index}
                className="p-4 border border-border rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`w-8 h-8 ${sub.color} rounded-lg flex items-center justify-center`}
                  >
                    <span className="text-white text-xs font-bold">
                      {sub.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">
                      {sub.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {sub.category}
                    </p>
                  </div>
                </div>
                <p className="text-sm font-medium text-foreground">
                  {sub.price}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2 text-xs"
                >
                  Tambah ke Tracker
                </Button>
              </div>
            ))}
          </div>
        </PermoneyCard>
      </div>
    </DashboardLayout>
  );
}
