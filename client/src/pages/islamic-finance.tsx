import React from 'react';
import { DashboardLayout, ZakatCalculator } from '@/components';
import { PermoneyCard } from '@/components/permoney-card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Star, Shield, BookOpen, Calculator, Heart, Users } from 'lucide-react';

export default function IslamicFinancePage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <PermoneyCard className="glassmorphism p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center">
              <Star className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Keuangan Syariah
              </h1>
              <p className="text-muted-foreground text-lg">
                Kelola keuangan sesuai prinsip Islam
              </p>
            </div>
            <div className="ml-auto">
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Halal Certified
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">
                Syariah Compliant
              </h3>
              <p className="text-sm text-muted-foreground">
                Semua fitur sesuai dengan hukum Islam dan fatwa MUI
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Calculator className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">
                Kalkulator Zakat
              </h3>
              <p className="text-sm text-muted-foreground">
                Hitung zakat dengan akurat sesuai nisab terkini
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Heart className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">
                Sedekah Tracker
              </h3>
              <p className="text-sm text-muted-foreground">
                Pantau dan kelola sedekah serta infaq Anda
              </p>
            </div>
          </div>
        </PermoneyCard>

        {/* Zakat Calculator */}
        <ZakatCalculator />

        {/* Islamic Finance Principles */}
        <PermoneyCard className="glassmorphism p-6">
          <div className="flex items-center gap-3 mb-6">
            <BookOpen className="h-6 w-6 text-blue-500" />
            <h2 className="text-xl font-bold text-foreground">
              Prinsip Keuangan Islam
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">
                Larangan dalam Islam
              </h3>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-medium text-red-800 dark:text-red-200">
                      Riba (Bunga)
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      Dilarang mengambil atau memberi bunga dalam transaksi
                      keuangan
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-medium text-red-800 dark:text-red-200">
                      Gharar (Ketidakpastian)
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      Menghindari transaksi yang mengandung ketidakpastian
                      berlebihan
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-medium text-red-800 dark:text-red-200">
                      Maysir (Judi)
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      Dilarang terlibat dalam aktivitas yang bersifat spekulatif
                      atau judi
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">
                Kewajiban Muslim
              </h3>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-medium text-green-800 dark:text-green-200">
                      Zakat
                    </h4>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Wajib mengeluarkan 2.5% dari harta yang mencapai nisab
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-medium text-green-800 dark:text-green-200">
                      Sedekah & Infaq
                    </h4>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Dianjurkan untuk berbagi rezeki kepada yang membutuhkan
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-medium text-green-800 dark:text-green-200">
                      Investasi Halal
                    </h4>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Memilih investasi yang sesuai dengan prinsip syariah
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </PermoneyCard>

        {/* Halal Investment Guide */}
        <PermoneyCard className="glassmorphism p-6">
          <div className="flex items-center gap-3 mb-6">
            <Users className="h-6 w-6 text-purple-500" />
            <h2 className="text-xl font-bold text-foreground">
              Panduan Investasi Halal
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 border border-border rounded-lg">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-3">
                <Shield className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">
                Saham Syariah
              </h3>
              <p className="text-sm text-muted-foreground">
                Investasi di perusahaan yang beroperasi sesuai prinsip Islam
              </p>
            </div>

            <div className="p-4 border border-border rounded-lg">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-3">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Sukuk</h3>
              <p className="text-sm text-muted-foreground">
                Obligasi syariah yang bebas dari unsur riba
              </p>
            </div>

            <div className="p-4 border border-border rounded-lg">
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center mb-3">
                <Star className="h-5 w-5 text-yellow-600" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Emas</h3>
              <p className="text-sm text-muted-foreground">
                Investasi emas sebagai lindung nilai yang halal
              </p>
            </div>

            <div className="p-4 border border-border rounded-lg">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-3">
                <Heart className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">
                Reksadana Syariah
              </h3>
              <p className="text-sm text-muted-foreground">
                Reksadana yang dikelola sesuai prinsip syariah
              </p>
            </div>
          </div>
        </PermoneyCard>
      </div>
    </DashboardLayout>
  );
}
