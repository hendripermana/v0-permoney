export interface PaymentScheduleItem {
  paymentNumber: number;
  dueDate: Date;
  paymentAmount: number;
  principalAmount: number;
  interestAmount: number;
  remainingBalance: number;
  isPaid: boolean;
  actualPaymentDate?: Date;
}

export interface PaymentScheduleResponse {
  debtId: string;
  debtName: string;
  totalPayments: number;
  monthlyPayment?: number; // For fixed payment schedules
  schedule: PaymentScheduleItem[];
  summary: {
    totalInterest: number;
    totalPrincipal: number;
    totalAmount: number;
    remainingBalance: number;
    nextPaymentDue?: Date;
    payoffDate?: Date;
  };
}
