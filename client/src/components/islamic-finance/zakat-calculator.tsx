import React, { useState, useEffect } from 'react';
import { PermoneyCard } from '@/components/permoney-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Calculator,
  Coins,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ZakatCalculation {
  goldSilver: number;
  cash: number;
  investments: number;
  businessAssets: number;
  total: number;
  zakatDue: number;
  isWajib: boolean;
  nisab: number;
  nextAssessment: Date;
}

interface ZakatInputs {
  goldWeight: number; // in grams
  silverWeight: number; // in grams
  cashAmount: number;
  bankSavings: number;
  investments: number;
  businessInventory: number;
  businessCash: number;
  debtsOwed: number;
  debtsOwing: number;
}

const GOLD_NISAB_GRAMS = 85; // 85 grams of gold
const SILVER_NISAB_GRAMS = 595; // 595 grams of silver
const ZAKAT_RATE = 0.025; // 2.5%
const CURRENT_GOLD_PRICE_PER_GRAM = 1000000; // IDR per gram (approximate)
const CURRENT_SILVER_PRICE_PER_GRAM = 15000; // IDR per gram (approximate)

export function ZakatCalculator() {
  const [inputs, setInputs] = useState<ZakatInputs>({
    goldWeight: 0,
    silverWeight: 0,
    cashAmount: 0,
    bankSavings: 0,
    investments: 0,
    businessInventory: 0,
    businessCash: 0,
    debtsOwed: 0,
    debtsOwing: 0,
  });

  const [calculation, setCalculation] = useState<ZakatCalculation | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const calculateZakat = () => {
    setIsCalculating(true);

    setTimeout(() => {
      // Calculate total wealth
      const goldValue = inputs.goldWeight * CURRENT_GOLD_PRICE_PER_GRAM;
      const silverValue = inputs.silverWeight * CURRENT_SILVER_PRICE_PER_GRAM;
      const totalCash =
        inputs.cashAmount + inputs.bankSavings + inputs.businessCash;
      const totalInvestments = inputs.investments;
      const totalBusinessAssets = inputs.businessInventory;

      // Calculate net wealth (assets minus debts)
      const totalAssets =
        goldValue +
        silverValue +
        totalCash +
        totalInvestments +
        totalBusinessAssets +
        inputs.debtsOwed;
      const netWealth = totalAssets - inputs.debtsOwing;

      // Calculate Nisab (minimum threshold)
      const goldNisab = GOLD_NISAB_GRAMS * CURRENT_GOLD_PRICE_PER_GRAM;
      const silverNisab = SILVER_NISAB_GRAMS * CURRENT_SILVER_PRICE_PER_GRAM;
      const nisab = Math.min(goldNisab, silverNisab); // Use lower of the two

      // Check if Zakat is Wajib (obligatory)
      const isWajib = netWealth >= nisab;

      // Calculate Zakat due
      const zakatDue = isWajib ? netWealth * ZAKAT_RATE : 0;

      // Next assessment date (1 year from now)
      const nextAssessment = new Date();
      nextAssessment.setFullYear(nextAssessment.getFullYear() + 1);

      setCalculation({
        goldSilver: goldValue + silverValue,
        cash: totalCash,
        investments: totalInvestments,
        businessAssets: totalBusinessAssets,
        total: netWealth,
        zakatDue,
        isWajib,
        nisab,
        nextAssessment,
      });

      setIsCalculating(false);
    }, 1000);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleInputChange = (field: keyof ZakatInputs, value: string) => {
    const numValue = parseFloat(value) || 0;
    setInputs(prev => ({ ...prev, [field]: numValue }));
  };

  return (
    <div className="space-y-6">
      <PermoneyCard className="glassmorphism p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
            <Calculator className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Kalkulator Zakat
            </h2>
            <p className="text-muted-foreground">
              Hitung zakat sesuai syariah Islam
            </p>
          </div>
        </div>

        <Alert className="mb-6 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            Zakat adalah kewajiban bagi Muslim yang memiliki harta mencapai
            nisab dan telah dimiliki selama satu tahun hijriah. Kalkulator ini
            menggunakan standar syariah yang berlaku umum.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Assets Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Coins className="h-5 w-5 text-yellow-500" />
              Aset yang Wajib Zakat
            </h3>

            <div className="space-y-3">
              <div>
                <Label htmlFor="goldWeight">Emas (gram)</Label>
                <Input
                  id="goldWeight"
                  type="number"
                  placeholder="0"
                  value={inputs.goldWeight || ''}
                  onChange={e =>
                    handleInputChange('goldWeight', e.target.value)
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="silverWeight">Perak (gram)</Label>
                <Input
                  id="silverWeight"
                  type="number"
                  placeholder="0"
                  value={inputs.silverWeight || ''}
                  onChange={e =>
                    handleInputChange('silverWeight', e.target.value)
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="cashAmount">Uang Tunai (IDR)</Label>
                <Input
                  id="cashAmount"
                  type="number"
                  placeholder="0"
                  value={inputs.cashAmount || ''}
                  onChange={e =>
                    handleInputChange('cashAmount', e.target.value)
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="bankSavings">Tabungan Bank (IDR)</Label>
                <Input
                  id="bankSavings"
                  type="number"
                  placeholder="0"
                  value={inputs.bankSavings || ''}
                  onChange={e =>
                    handleInputChange('bankSavings', e.target.value)
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="investments">Investasi (IDR)</Label>
                <Input
                  id="investments"
                  type="number"
                  placeholder="0"
                  value={inputs.investments || ''}
                  onChange={e =>
                    handleInputChange('investments', e.target.value)
                  }
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Business & Debts Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Bisnis & Hutang
            </h3>

            <div className="space-y-3">
              <div>
                <Label htmlFor="businessInventory">
                  Inventori Bisnis (IDR)
                </Label>
                <Input
                  id="businessInventory"
                  type="number"
                  placeholder="0"
                  value={inputs.businessInventory || ''}
                  onChange={e =>
                    handleInputChange('businessInventory', e.target.value)
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="businessCash">Kas Bisnis (IDR)</Label>
                <Input
                  id="businessCash"
                  type="number"
                  placeholder="0"
                  value={inputs.businessCash || ''}
                  onChange={e =>
                    handleInputChange('businessCash', e.target.value)
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="debtsOwed">Piutang (IDR)</Label>
                <Input
                  id="debtsOwed"
                  type="number"
                  placeholder="0"
                  value={inputs.debtsOwed || ''}
                  onChange={e => handleInputChange('debtsOwed', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="debtsOwing">Hutang (IDR)</Label>
                <Input
                  id="debtsOwing"
                  type="number"
                  placeholder="0"
                  value={inputs.debtsOwing || ''}
                  onChange={e =>
                    handleInputChange('debtsOwing', e.target.value)
                  }
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Button
            onClick={calculateZakat}
            disabled={isCalculating}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
          >
            {isCalculating ? 'Menghitung...' : 'Hitung Zakat'}
          </Button>
        </div>
      </PermoneyCard>

      {/* Results */}
      {calculation && (
        <PermoneyCard className="glassmorphism p-6">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              {calculation.isWajib ? (
                <CheckCircle className="h-8 w-8 text-green-500" />
              ) : (
                <AlertCircle className="h-8 w-8 text-yellow-500" />
              )}
              <div>
                <h3 className="text-xl font-bold text-foreground">
                  {calculation.isWajib
                    ? 'Zakat Wajib Dibayar'
                    : 'Zakat Belum Wajib'}
                </h3>
                <p className="text-muted-foreground">
                  {calculation.isWajib
                    ? 'Harta Anda telah mencapai nisab'
                    : 'Harta Anda belum mencapai nisab'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Emas & Perak:</span>
                  <span className="font-medium">
                    {formatCurrency(calculation.goldSilver)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Uang Tunai:</span>
                  <span className="font-medium">
                    {formatCurrency(calculation.cash)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Investasi:</span>
                  <span className="font-medium">
                    {formatCurrency(calculation.investments)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Aset Bisnis:</span>
                  <span className="font-medium">
                    {formatCurrency(calculation.businessAssets)}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Nisab (Minimum):
                  </span>
                  <span className="font-medium">
                    {formatCurrency(calculation.nisab)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Harta:</span>
                  <span className="font-medium">
                    {formatCurrency(calculation.total)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span
                    className={
                      calculation.isWajib ? 'text-green-600' : 'text-yellow-600'
                    }
                  >
                    Zakat yang Harus Dibayar:
                  </span>
                  <span
                    className={
                      calculation.isWajib ? 'text-green-600' : 'text-yellow-600'
                    }
                  >
                    {formatCurrency(calculation.zakatDue)}
                  </span>
                </div>
              </div>
            </div>

            {calculation.isWajib && (
              <Alert className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  <strong>Zakat Wajib:</strong> Segera bayarkan zakat Anda
                  sebesar {formatCurrency(calculation.zakatDue)} kepada yang
                  berhak menerimanya. Penilaian berikutnya:{' '}
                  {calculation.nextAssessment.toLocaleDateString('id-ID')}.
                </AlertDescription>
              </Alert>
            )}

            {!calculation.isWajib && (
              <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                  <strong>Belum Wajib:</strong> Harta Anda belum mencapai nisab
                  sebesar {formatCurrency(calculation.nisab)}. Kekurangan:{' '}
                  {formatCurrency(calculation.nisab - calculation.total)}.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </PermoneyCard>
      )}
    </div>
  );
}

export default ZakatCalculator;
