export interface ZakatCalculation {
  id: string;
  householdId: string;
  calculationDate: Date;
  hijriYear: number;
  nisabThreshold: Money;
  totalZakatableAssets: Money;
  zakatAmount: Money;
  assetBreakdown: ZakatAssetBreakdown[];
  isZakatDue: boolean;
  nextCalculationDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ZakatAssetBreakdown {
  assetType: ZakatAssetType;
  accountId?: string;
  accountName?: string;
  amount: Money;
  zakatRate: number;
  zakatAmount: Money;
  haulCompleted: boolean;
  haulStartDate?: Date;
}

export interface ZakatReminder {
  id: string;
  householdId: string;
  reminderType: ZakatReminderType;
  scheduledDate: Date;
  hijriDate: string;
  zakatAmount?: Money;
  message: string;
  isActive: boolean;
  isSent: boolean;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShariaCompliantAccount {
  accountId: string;
  complianceStatus: ShariaComplianceStatus;
  complianceNotes?: string;
  lastReviewDate: Date;
  nextReviewDate: Date;
}

export interface IslamicFinanceReport {
  id: string;
  householdId: string;
  reportType: IslamicReportType;
  period: ReportPeriod;
  generatedAt: Date;
  data: IslamicReportData;
}

export interface IslamicReportData {
  zakatSummary?: ZakatSummary;
  shariaCompliantAssets?: ShariaAssetSummary;
  islamicDebtSummary?: IslamicDebtSummary;
  halaalIncomeBreakdown?: HalaalIncomeBreakdown;
}

export interface ZakatSummary {
  totalZakatableAssets: Money;
  currentNisabThreshold: Money;
  zakatDue: Money;
  lastZakatPayment?: ZakatPayment;
  nextZakatDueDate: Date;
  haulStatus: HaulStatus[];
}

export interface ZakatPayment {
  id: string;
  amount: Money;
  paymentDate: Date;
  hijriDate: string;
  transactionId?: string;
  notes?: string;
}

export interface HaulStatus {
  assetType: ZakatAssetType;
  haulStartDate: Date;
  haulCompletionDate: Date;
  isHaulComplete: boolean;
  daysRemaining?: number;
}

export interface ShariaAssetSummary {
  compliantAssets: Money;
  nonCompliantAssets: Money;
  underReviewAssets: Money;
  compliancePercentage: number;
}

export interface IslamicDebtSummary {
  murabahahContracts: MurabahahContract[];
  totalIslamicDebt: Money;
  totalMarginPaid: Money;
  averageMarginRate: number;
}

export interface MurabahahContract {
  debtId: string;
  contractName: string;
  principalAmount: Money;
  marginAmount: Money;
  totalAmount: Money;
  remainingBalance: Money;
  marginRate: number;
  startDate: Date;
  maturityDate: Date;
  monthlyPayment: Money;
}

export interface HalaalIncomeBreakdown {
  totalIncome: Money;
  halaalIncome: Money;
  questionableIncome: Money;
  nonHalaalIncome: Money;
  purificationRequired: Money;
}

export interface Money {
  amount: number;
  currency: string;
}

export interface ReportPeriod {
  startDate: Date;
  endDate: Date;
  type: 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'HIJRI_YEAR';
}

// Enums
export enum ZakatAssetType {
  CASH = 'CASH',
  GOLD = 'GOLD',
  SILVER = 'SILVER',
  BUSINESS_ASSETS = 'BUSINESS_ASSETS',
  INVESTMENT = 'INVESTMENT',
  SAVINGS = 'SAVINGS',
  CRYPTOCURRENCY = 'CRYPTOCURRENCY',
}

export enum ZakatReminderType {
  ANNUAL_CALCULATION = 'ANNUAL_CALCULATION',
  PAYMENT_DUE = 'PAYMENT_DUE',
  HAUL_COMPLETION = 'HAUL_COMPLETION',
  NISAB_THRESHOLD_MET = 'NISAB_THRESHOLD_MET',
}

export enum ShariaComplianceStatus {
  COMPLIANT = 'COMPLIANT',
  NON_COMPLIANT = 'NON_COMPLIANT',
  UNDER_REVIEW = 'UNDER_REVIEW',
  QUESTIONABLE = 'QUESTIONABLE',
}

export enum IslamicReportType {
  ZAKAT_CALCULATION = 'ZAKAT_CALCULATION',
  SHARIA_COMPLIANCE = 'SHARIA_COMPLIANCE',
  ISLAMIC_DEBT_SUMMARY = 'ISLAMIC_DEBT_SUMMARY',
  HALAAL_INCOME_ANALYSIS = 'HALAAL_INCOME_ANALYSIS',
  COMPREHENSIVE = 'COMPREHENSIVE',
}

// Constants
export const ZAKAT_RATES = {
  [ZakatAssetType.CASH]: 0.025, // 2.5%
  [ZakatAssetType.GOLD]: 0.025, // 2.5%
  [ZakatAssetType.SILVER]: 0.025, // 2.5%
  [ZakatAssetType.BUSINESS_ASSETS]: 0.025, // 2.5%
  [ZakatAssetType.INVESTMENT]: 0.025, // 2.5%
  [ZakatAssetType.SAVINGS]: 0.025, // 2.5%
  [ZakatAssetType.CRYPTOCURRENCY]: 0.025, // 2.5%
} as const;

export const NISAB_THRESHOLDS = {
  GOLD_GRAMS: 85, // 85 grams of gold
  SILVER_GRAMS: 595, // 595 grams of silver
} as const;

export const HAUL_PERIOD_DAYS = 354; // Islamic lunar year in days
