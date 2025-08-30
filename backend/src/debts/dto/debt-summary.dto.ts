import { DebtType } from './create-debt.dto';

export interface DebtSummaryItem {
  id: string;
  name: string;
  type: DebtType;
  creditor: string;
  currentBalance: number;
  originalAmount: number;
  currency: string;
  nextPaymentDue?: Date;
  nextPaymentAmount?: number;
  monthlyPayment?: number;
  payoffDate?: Date;
  isOverdue?: boolean;
}

export interface DebtSummaryByType {
  type: DebtType;
  totalBalance: number;
  count: number;
  debts: DebtSummaryItem[];
}

export interface DebtSummaryResponse {
  totalDebt: number;
  currency: string;
  byType: DebtSummaryByType[];
  upcomingPayments: {
    dueToday: DebtSummaryItem[];
    dueThisWeek: DebtSummaryItem[];
    dueThisMonth: DebtSummaryItem[];
    overdue: DebtSummaryItem[];
  };
  payoffProjection: {
    totalInterestRemaining: number;
    averagePayoffMonths: number;
    earliestPayoffDate?: Date;
  };
}
