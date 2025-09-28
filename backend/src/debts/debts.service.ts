import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  DebtValidationException,
  DebtNotFoundException,
  DebtPaymentException,
  DebtCalculationException,
  DebtBusinessRuleException,
  DebtCurrencyException,
  DebtTermException,
} from './exceptions/debt-exceptions';
import { DebtsRepository, DebtWithPayments } from './debts.repository';
import { 
  CreateDebtDto, 
  UpdateDebtDto, 
  DebtFiltersDto, 
  CreateDebtPaymentDto,
  PaymentScheduleResponse,
  PaymentScheduleItem,
  DebtSummaryResponse,
  DebtSummaryByType,
  DebtSummaryItem,
  DebtType
} from './dto';
import { Debt, DebtPayment } from '../../../node_modules/.prisma/client';

@Injectable()
export class DebtsService {
  constructor(private debtsRepository: DebtsRepository) {}

  async createDebt(
    householdId: string,
    data: CreateDebtDto,
    userId: string,
  ): Promise<Debt> {
    // Validate debt type specific fields
    this.validateDebtTypeFields(data);

    return this.debtsRepository.create(householdId, data);
  }

  async getDebtById(id: string, householdId: string): Promise<DebtWithPayments> {
    const debt = await this.debtsRepository.findById(id);
    
    if (!debt) {
      throw new NotFoundException(`Debt with ID ${id} not found`);
    }

    if (debt.householdId !== householdId) {
      throw new ForbiddenException('Access denied to this debt');
    }

    return debt;
  }

  async getDebtsByHousehold(
    householdId: string,
    filters?: DebtFiltersDto,
  ): Promise<DebtWithPayments[]> {
    return this.debtsRepository.findByHousehold(householdId, filters);
  }

  async updateDebt(
    id: string,
    householdId: string,
    data: UpdateDebtDto,
  ): Promise<Debt> {
    // Verify debt exists and belongs to household
    await this.getDebtById(id, householdId);

    // Validate debt type specific fields if type is being updated
    if (data.type) {
      this.validateDebtTypeFields(data as CreateDebtDto);
    }

    return this.debtsRepository.update(id, data);
  }

  async deleteDebt(id: string, householdId: string): Promise<void> {
    // Verify debt exists and belongs to household
    await this.getDebtById(id, householdId);

    await this.debtsRepository.delete(id);
  }

  async recordPayment(
    debtId: string,
    householdId: string,
    data: CreateDebtPaymentDto,
  ): Promise<DebtPayment> {
    const debt = await this.getDebtById(debtId, householdId);

    // Validate debt is active
    if (!debt.isActive) {
      throw new BadRequestException('Cannot record payment for inactive debt');
    }

    // Validate payment date
    const paymentDate = new Date(data.paymentDate);
    const debtStartDate = new Date(debt.startDate);
    const today = new Date();
    
    if (paymentDate < debtStartDate) {
      throw new BadRequestException('Payment date cannot be before debt start date');
    }
    
    if (paymentDate > today) {
      throw new BadRequestException('Payment date cannot be in the future');
    }

    // Validate payment amounts
    const currentBalance = Number(debt.currentBalanceCents) / 100;
    const totalPaymentAmount = data.principalAmount + (data.interestAmount || 0);
    
    // Validate principal amount doesn't exceed current balance
    if (data.principalAmount > currentBalance) {
      throw new BadRequestException(
        `Principal payment amount (${data.principalAmount.toFixed(2)}) cannot exceed current debt balance (${currentBalance.toFixed(2)})`
      );
    }

    // Validate total payment amount matches sum of components
    const tolerance = 0.01; // Allow 1 cent tolerance for rounding
    if (Math.abs(data.amount - totalPaymentAmount) > tolerance) {
      throw new BadRequestException(
        `Total payment amount (${data.amount.toFixed(2)}) must equal principal (${data.principalAmount.toFixed(2)}) + interest/margin (${(data.interestAmount || 0).toFixed(2)}) = ${totalPaymentAmount.toFixed(2)}`
      );
    }

    // Validate payment type consistency with debt type
    this.validatePaymentTypeConsistency(debt, data);

    // Validate payment doesn't create negative balance
    if (data.principalAmount > currentBalance) {
      throw new BadRequestException(
        `Payment would result in negative balance. Maximum principal payment allowed: ${currentBalance.toFixed(2)}`
      );
    }

    // Check for duplicate payments on the same date (optional business rule)
    const existingPaymentsOnDate = debt.payments.filter(
      payment => payment.paymentDate.toDateString() === paymentDate.toDateString()
    );
    
    if (existingPaymentsOnDate.length > 0) {
      // Allow multiple payments per day but warn about potential duplicates
      const totalExistingAmount = existingPaymentsOnDate.reduce(
        (sum, payment) => sum + Number(payment.amountCents) / 100, 
        0
      );
      
      if (Math.abs(totalExistingAmount - data.amount) < tolerance) {
        throw new BadRequestException(
          `A payment of similar amount (${totalExistingAmount.toFixed(2)}) already exists for this date. If this is intentional, please adjust the amount slightly or use a different date.`
        );
      }
    }

    return this.debtsRepository.createPayment(debtId, data);
  }

  private validatePaymentTypeConsistency(debt: DebtWithPayments, paymentData: CreateDebtPaymentDto): void {
    switch (debt.type) {
      case DebtType.PERSONAL:
        if ((paymentData.interestAmount || 0) > 0) {
          throw new BadRequestException(
            'Personal loans cannot have interest payments. Please set interest amount to 0.'
          );
        }
        break;
        
      case DebtType.CONVENTIONAL:
        // For conventional debt, we expect some interest unless it's a principal-only payment
        // This is informational rather than restrictive
        if ((paymentData.interestAmount || 0) === 0 && paymentData.principalAmount > 0) {
          // This might be a principal-only payment, which is allowed but uncommon
          // We could log this for audit purposes
        }
        break;
        
      case DebtType.ISLAMIC:
        // For Islamic financing, margin payments are expected
        // Similar to conventional, this is informational
        if ((paymentData.interestAmount || 0) === 0 && paymentData.principalAmount > 0) {
          // This might be a principal-only payment
        }
        break;
    }

    // Validate reasonable payment amounts
    const currentBalance = Number(debt.currentBalanceCents) / 100;
    const originalAmount = Number(debt.principalAmountCents) / 100;
    
    // Check if payment is suspiciously large (more than 50% of original amount in one payment)
    if (paymentData.amount > originalAmount * 0.5) {
      // This is allowed but might indicate data entry error
      // In a production system, you might want to require confirmation for large payments
    }

    // Validate interest/margin calculation reasonableness for conventional and Islamic debt
    if (debt.type !== DebtType.PERSONAL && (paymentData.interestAmount || 0) > 0) {
      const rate = debt.type === DebtType.CONVENTIONAL 
        ? (debt.interestRate ? Number(debt.interestRate) : 0)
        : (debt.marginRate ? Number(debt.marginRate) : 0);
        
      if (rate > 0) {
        // Rough validation: monthly interest/margin shouldn't exceed monthly rate * balance
        const monthlyRate = rate / 12;
        const expectedMaxInterest = currentBalance * monthlyRate * 2; // Allow 2x for flexibility
        
        if ((paymentData.interestAmount || 0) > expectedMaxInterest) {
          throw new BadRequestException(
            `Interest/margin amount (${(paymentData.interestAmount || 0).toFixed(2)}) seems unusually high. ` +
            `Expected maximum based on current balance and rate: ${expectedMaxInterest.toFixed(2)}. ` +
            `Please verify the calculation.`
          );
        }
      }
    }
  }

  async calculatePaymentSchedule(
    debtId: string,
    householdId: string,
  ): Promise<PaymentScheduleResponse> {
    const debt = await this.getDebtById(debtId, householdId);
    const payments = await this.debtsRepository.getPaymentsByDebt(debtId);

    const currentBalance = Number(debt.currentBalanceCents) / 100;
    const originalAmount = Number(debt.principalAmountCents) / 100;

    switch (debt.type) {
      case DebtType.PERSONAL:
        return this.calculatePersonalLoanSchedule(debt, payments, currentBalance, originalAmount);
      case DebtType.CONVENTIONAL:
        return this.calculateConventionalSchedule(debt, payments, currentBalance, originalAmount);
      case DebtType.ISLAMIC:
        return this.calculateIslamicSchedule(debt, payments, currentBalance, originalAmount);
      default:
        throw new BadRequestException(`Unsupported debt type: ${debt.type}`);
    }
  }

  async getDebtSummary(householdId: string): Promise<DebtSummaryResponse> {
    const debtsByType = await this.debtsRepository.getDebtsByType(householdId);
    const totalDebt = await this.debtsRepository.getTotalDebtByHousehold(householdId);

    const byType: DebtSummaryByType[] = [];
    const upcomingPayments = {
      dueToday: [] as DebtSummaryItem[],
      dueThisWeek: [] as DebtSummaryItem[],
      dueThisMonth: [] as DebtSummaryItem[],
      overdue: [] as DebtSummaryItem[],
    };

    const today = new Date();
    const oneWeekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const oneMonthFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    for (const [type, debts] of Object.entries(debtsByType)) {
      if (debts.length === 0) continue;

      const typeBalance = debts.reduce((sum, debt) => sum + Number(debt.currentBalanceCents), 0) / 100;
      
      const debtItems: DebtSummaryItem[] = debts.map(debt => {
        const currentBalance = Number(debt.currentBalanceCents) / 100;
        const originalAmount = Number(debt.principalAmountCents) / 100;
        
        return {
          id: debt.id,
          name: debt.name,
          type: debt.type as DebtType,
          creditor: debt.creditor,
          currentBalance,
          originalAmount,
          currency: debt.currency,
          // TODO: Calculate next payment details based on payment schedule
        };
      });

      byType.push({
        type: type as DebtType,
        totalBalance: typeBalance,
        count: debts.length,
        debts: debtItems,
      });
    }

    return {
      totalDebt: Number(totalDebt) / 100,
      currency: 'IDR', // TODO: Support multi-currency
      byType,
      upcomingPayments,
      payoffProjection: {
        totalInterestRemaining: 0, // TODO: Calculate based on schedules
        averagePayoffMonths: 0, // TODO: Calculate based on schedules
      },
    };
  }

  private validateDebtTypeFields(data: CreateDebtDto): void {
    // Validate date logic
    const startDate = new Date(data.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time for date comparison
    
    if (startDate < new Date('1900-01-01')) {
      throw new DebtTermException('Start date cannot be before 1900-01-01', data.startDate);
    }
    
    if (data.maturityDate) {
      const maturityDate = new Date(data.maturityDate);
      if (maturityDate <= startDate) {
        throw new DebtTermException('Maturity date must be after start date', data.startDate, data.maturityDate);
      }
      
      // Reasonable maximum term validation (e.g., 50 years)
      const maxDate = new Date(startDate);
      maxDate.setFullYear(maxDate.getFullYear() + 50);
      if (maturityDate > maxDate) {
        throw new BadRequestException('Debt term cannot exceed 50 years');
      }
    }

    // Validate debt type specific requirements
    switch (data.type) {
      case DebtType.PERSONAL:
        // Personal loans should not have interest or margin rates
        if (data.interestRate !== undefined && data.interestRate !== null) {
          throw new BadRequestException(
            'Personal loans cannot have interest rates. Personal loans are typically zero-interest arrangements between individuals.'
          );
        }
        if (data.marginRate !== undefined && data.marginRate !== null) {
          throw new BadRequestException(
            'Personal loans cannot have margin rates. Use conventional or Islamic debt types for commercial financing.'
          );
        }
        // Personal loans typically don't have strict maturity dates, but we allow them for planning
        break;
        
      case DebtType.CONVENTIONAL:
        // Conventional debt must have interest rate
        if (data.interestRate === undefined || data.interestRate === null) {
          throw new BadRequestException(
            'Conventional debt must have an interest rate. Please specify the annual interest rate as a decimal (e.g., 0.12 for 12%).'
          );
        }
        if (data.marginRate !== undefined && data.marginRate !== null) {
          throw new BadRequestException(
            'Conventional debt cannot have margin rates. Margin rates are used for Islamic financing only.'
          );
        }
        // Validate reasonable interest rate ranges
        if (data.interestRate < 0.001) { // 0.1%
          throw new BadRequestException('Interest rate seems unusually low. Please verify the rate is correct.');
        }
        if (data.interestRate > 0.5) { // 50%
          throw new BadRequestException('Interest rate exceeds reasonable limits (50% annually). Please verify the rate is correct.');
        }
        // Conventional debt should typically have maturity date for proper amortization
        if (!data.maturityDate) {
          throw new BadRequestException(
            'Conventional debt should have a maturity date for proper payment schedule calculation.'
          );
        }
        break;
        
      case DebtType.ISLAMIC:
        // Islamic financing must have margin rate
        if (data.marginRate === undefined || data.marginRate === null) {
          throw new BadRequestException(
            'Islamic financing must have a margin rate. Please specify the profit margin rate as a decimal (e.g., 0.06 for 6%).'
          );
        }
        if (data.interestRate !== undefined && data.interestRate !== null) {
          throw new BadRequestException(
            'Islamic financing cannot have interest rates. Islamic finance uses profit margins instead of interest.'
          );
        }
        // Validate reasonable margin rate ranges
        if (data.marginRate < 0.001) { // 0.1%
          throw new BadRequestException('Margin rate seems unusually low. Please verify the rate is correct.');
        }
        if (data.marginRate > 0.3) { // 30%
          throw new BadRequestException('Margin rate exceeds reasonable limits (30%). Please verify the rate is correct.');
        }
        // Islamic financing should have maturity date for Murabahah contracts
        if (!data.maturityDate) {
          throw new BadRequestException(
            'Islamic financing should have a maturity date for proper Murabahah contract terms.'
          );
        }
        break;
        
      default:
        throw new BadRequestException(`Unsupported debt type: ${data.type}`);
    }

    // Validate currency
    const supportedCurrencies = ['IDR', 'USD', 'EUR', 'SGD', 'MYR', 'THB'];
    if (!supportedCurrencies.includes(data.currency || 'IDR')) {
      throw new BadRequestException(
        `Currency ${data.currency} is not supported. Supported currencies: ${supportedCurrencies.join(', ')}`
      );
    }

    // Validate principal amount reasonableness
    if (data.principalAmount < 1) {
      throw new BadRequestException('Principal amount must be at least 1.00');
    }
    
    // Currency-specific amount validation
    const maxAmounts: Record<string, number> = {
      'IDR': 999999999999, // 999 billion IDR
      'USD': 999999999,    // 999 million USD
      'EUR': 999999999,    // 999 million EUR
      'SGD': 999999999,    // 999 million SGD
      'MYR': 999999999,    // 999 million MYR
      'THB': 999999999,    // 999 million THB
    };
    
    const maxAmount = maxAmounts[data.currency || 'IDR'];
    if (data.principalAmount > maxAmount) {
      throw new BadRequestException(
        `Principal amount exceeds maximum allowed for ${data.currency}: ${maxAmount.toLocaleString()}`
      );
    }
  }

  private calculatePersonalLoanSchedule(
    debt: DebtWithPayments,
    payments: DebtPayment[],
    currentBalance: number,
    originalAmount: number,
  ): PaymentScheduleResponse {
    // Personal loans are flexible - no fixed schedule
    // Just show payment history and remaining balance
    const schedule: PaymentScheduleItem[] = payments.map((payment, index) => ({
      paymentNumber: payments.length - index,
      dueDate: payment.paymentDate,
      paymentAmount: Number(payment.amountCents) / 100,
      principalAmount: Number(payment.principalAmountCents) / 100,
      interestAmount: 0, // Personal loans have no interest
      remainingBalance: currentBalance, // Would need to calculate historical balance
      isPaid: true,
      actualPaymentDate: payment.paymentDate,
    }));

    return {
      debtId: debt.id,
      debtName: debt.name,
      totalPayments: payments.length,
      schedule,
      summary: {
        totalInterest: 0,
        totalPrincipal: originalAmount - currentBalance,
        totalAmount: originalAmount,
        remainingBalance: currentBalance,
      },
    };
  }

  private calculateConventionalSchedule(
    debt: DebtWithPayments,
    payments: DebtPayment[],
    currentBalance: number,
    originalAmount: number,
  ): PaymentScheduleResponse {
    const interestRate = debt.interestRate ? Number(debt.interestRate) : 0;
    const monthlyRate = interestRate / 12;
    
    // Calculate actual term based on debt dates
    let termMonths: number;
    if (debt.maturityDate) {
      const startDate = new Date(debt.startDate);
      const maturityDate = new Date(debt.maturityDate);
      termMonths = Math.ceil((maturityDate.getTime() - startDate.getTime()) / (30.44 * 24 * 60 * 60 * 1000)); // More accurate month calculation
    } else {
      // Default terms based on debt amount (common lending practices)
      if (originalAmount <= 10000) termMonths = 36; // 3 years for smaller amounts
      else if (originalAmount <= 50000) termMonths = 60; // 5 years for medium amounts
      else termMonths = 120; // 10 years for larger amounts
    }

    // Calculate remaining term based on payments made
    const totalPaid = payments.reduce((sum, payment) => sum + Number(payment.principalAmountCents) / 100, 0);
    const remainingPrincipal = currentBalance;
    
    // Recalculate monthly payment based on remaining balance and term
    const remainingTermMonths = this.calculateRemainingTerm(debt, payments, termMonths);
    const monthlyPayment = this.calculateMonthlyPayment(remainingPrincipal, monthlyRate, remainingTermMonths);
    
    const schedule: PaymentScheduleItem[] = [];
    let balance = currentBalance;
    const today = new Date();
    
    // Start from next month
    const nextPaymentDate = new Date(today);
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
    nextPaymentDate.setDate(debt.startDate.getDate()); // Use original start date's day

    // Generate future payment schedule
    for (let i = 1; balance > 0.01 && i <= remainingTermMonths; i++) {
      const interestAmount = balance * monthlyRate;
      let principalAmount = monthlyPayment - interestAmount;
      
      // Handle final payment
      if (principalAmount > balance) {
        principalAmount = balance;
      }
      
      const paymentAmount = principalAmount + interestAmount;
      balance -= principalAmount;

      const dueDate = new Date(nextPaymentDate);
      dueDate.setMonth(dueDate.getMonth() + (i - 1));

      schedule.push({
        paymentNumber: i,
        dueDate,
        paymentAmount: Math.round(paymentAmount * 100) / 100, // Round to cents
        principalAmount: Math.round(principalAmount * 100) / 100,
        interestAmount: Math.round(interestAmount * 100) / 100,
        remainingBalance: Math.round(balance * 100) / 100,
        isPaid: false,
      });

      // Break if balance is effectively zero
      if (balance < 0.01) break;
    }

    // Include payment history
    const historicalSchedule = this.buildHistoricalSchedule(debt, payments);
    const fullSchedule = [...historicalSchedule, ...schedule];

    const totalInterest = schedule.reduce((sum, item) => sum + item.interestAmount, 0);
    const totalInterestPaid = payments.reduce((sum, payment) => sum + Number(payment.interestAmountCents) / 100, 0);

    return {
      debtId: debt.id,
      debtName: debt.name,
      totalPayments: fullSchedule.length,
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
      schedule: fullSchedule,
      summary: {
        totalInterest: Math.round((totalInterest + totalInterestPaid) * 100) / 100,
        totalPrincipal: originalAmount,
        totalAmount: Math.round((originalAmount + totalInterest + totalInterestPaid) * 100) / 100,
        remainingBalance: Math.round(currentBalance * 100) / 100,
        nextPaymentDue: schedule[0]?.dueDate,
        payoffDate: schedule[schedule.length - 1]?.dueDate,
      },
    };
  }

  private calculateRemainingTerm(debt: DebtWithPayments, payments: DebtPayment[], originalTermMonths: number): number {
    if (payments.length === 0) return originalTermMonths;
    
    // Calculate months elapsed since first payment or debt start
    const firstPaymentDate = payments.length > 0 
      ? new Date(Math.min(...payments.map(p => p.paymentDate.getTime())))
      : new Date(debt.startDate);
    
    const today = new Date();
    const monthsElapsed = Math.floor((today.getTime() - firstPaymentDate.getTime()) / (30.44 * 24 * 60 * 60 * 1000));
    
    return Math.max(1, originalTermMonths - monthsElapsed);
  }

  private buildHistoricalSchedule(debt: DebtWithPayments, payments: DebtPayment[]): PaymentScheduleItem[] {
    return payments
      .sort((a, b) => a.paymentDate.getTime() - b.paymentDate.getTime())
      .map((payment, index) => ({
        paymentNumber: -(payments.length - index), // Negative numbers for historical
        dueDate: payment.paymentDate,
        paymentAmount: Number(payment.amountCents) / 100,
        principalAmount: Number(payment.principalAmountCents) / 100,
        interestAmount: Number(payment.interestAmountCents) / 100,
        remainingBalance: 0, // Would need to calculate historical balance
        isPaid: true,
        actualPaymentDate: payment.paymentDate,
      }));
  }

  private calculateIslamicSchedule(
    debt: DebtWithPayments,
    payments: DebtPayment[],
    currentBalance: number,
    originalAmount: number,
  ): PaymentScheduleResponse {
    // Islamic financing (Murabahah) principles:
    // 1. Fixed profit margin determined at contract inception
    // 2. No compound interest - total amount is principal + fixed margin
    // 3. Equal monthly installments (typically)
    // 4. Early payment may reduce total margin (depending on contract terms)
    
    const marginRate = debt.marginRate ? Number(debt.marginRate) : 0;
    
    // Calculate actual term
    let termMonths: number;
    if (debt.maturityDate) {
      const startDate = new Date(debt.startDate);
      const maturityDate = new Date(debt.maturityDate);
      termMonths = Math.ceil((maturityDate.getTime() - startDate.getTime()) / (30.44 * 24 * 60 * 60 * 1000));
    } else {
      // Default terms for Islamic financing (typically longer terms)
      if (originalAmount <= 50000) termMonths = 60; // 5 years
      else if (originalAmount <= 200000) termMonths = 120; // 10 years
      else termMonths = 240; // 20 years for large amounts (like home financing)
    }

    // In Murabahah, the total selling price is fixed at contract inception
    const totalMargin = originalAmount * marginRate;
    const totalSellingPrice = originalAmount + totalMargin;
    
    // Calculate how much margin has been paid and remains
    const totalPrincipalPaid = originalAmount - currentBalance;
    const totalMarginPaid = payments.reduce((sum, payment) => sum + Number(payment.interestAmountCents) / 100, 0);
    
    // Remaining margin is proportional to remaining principal (simplified approach)
    // In practice, this might vary based on specific contract terms
    const remainingMarginRatio = currentBalance / originalAmount;
    const remainingMargin = (totalMargin - totalMarginPaid);
    
    // Calculate remaining term
    const remainingTermMonths = this.calculateRemainingTerm(debt, payments, termMonths);
    
    // Monthly payment calculation for remaining amount
    const remainingTotalAmount = currentBalance + remainingMargin;
    const monthlyPayment = remainingTotalAmount / remainingTermMonths;
    
    const schedule: PaymentScheduleItem[] = [];
    let remainingPrincipal = currentBalance;
    let remainingMarginAmount = remainingMargin;
    const today = new Date();
    
    // Start from next month
    const nextPaymentDate = new Date(today);
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
    nextPaymentDate.setDate(debt.startDate.getDate());

    // Generate future payment schedule
    for (let i = 1; (remainingPrincipal > 0.01 || remainingMarginAmount > 0.01) && i <= remainingTermMonths; i++) {
      // In Murabahah, each payment typically contains both principal and margin portions
      // The ratio can be fixed or vary based on contract terms
      
      let paymentAmount = monthlyPayment;
      let principalPortion: number;
      let marginPortion: number;
      
      // Calculate proportional split (common approach)
      const principalRatio = remainingPrincipal / (remainingPrincipal + remainingMarginAmount);
      principalPortion = Math.min(paymentAmount * principalRatio, remainingPrincipal);
      marginPortion = Math.min(paymentAmount - principalPortion, remainingMarginAmount);
      
      // Adjust payment amount if it's the final payment
      if (i === remainingTermMonths || (remainingPrincipal + remainingMarginAmount) < monthlyPayment) {
        paymentAmount = remainingPrincipal + remainingMarginAmount;
        principalPortion = remainingPrincipal;
        marginPortion = remainingMarginAmount;
      }
      
      remainingPrincipal -= principalPortion;
      remainingMarginAmount -= marginPortion;

      const dueDate = new Date(nextPaymentDate);
      dueDate.setMonth(dueDate.getMonth() + (i - 1));

      schedule.push({
        paymentNumber: i,
        dueDate,
        paymentAmount: Math.round(paymentAmount * 100) / 100,
        principalAmount: Math.round(principalPortion * 100) / 100,
        interestAmount: Math.round(marginPortion * 100) / 100, // Using interestAmount field for margin
        remainingBalance: Math.round(remainingPrincipal * 100) / 100,
        isPaid: false,
      });

      // Break if both principal and margin are effectively zero
      if (remainingPrincipal < 0.01 && remainingMarginAmount < 0.01) break;
    }

    // Include payment history
    const historicalSchedule = this.buildHistoricalSchedule(debt, payments);
    const fullSchedule = [...historicalSchedule, ...schedule];

    const totalFutureMargin = schedule.reduce((sum, item) => sum + item.interestAmount, 0);

    return {
      debtId: debt.id,
      debtName: debt.name,
      totalPayments: fullSchedule.length,
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
      schedule: fullSchedule,
      summary: {
        totalInterest: Math.round((totalMargin) * 100) / 100, // Total margin (not interest)
        totalPrincipal: originalAmount,
        totalAmount: Math.round(totalSellingPrice * 100) / 100,
        remainingBalance: Math.round(currentBalance * 100) / 100,
        nextPaymentDue: schedule[0]?.dueDate,
        payoffDate: schedule[schedule.length - 1]?.dueDate,
      },
    };
  }

  private calculateMonthlyPayment(principal: number, monthlyRate: number, termMonths: number): number {
    if (monthlyRate === 0) {
      return principal / termMonths;
    }
    
    return principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
           (Math.pow(1 + monthlyRate, termMonths) - 1);
  }
}
