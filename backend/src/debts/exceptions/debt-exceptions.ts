import { BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';

export class DebtValidationException extends BadRequestException {
  constructor(message: string, field?: string) {
    super({
      message,
      field,
      error: 'Debt Validation Error',
      statusCode: 400,
    });
  }
}

export class DebtNotFoundException extends NotFoundException {
  constructor(debtId: string) {
    super({
      message: `Debt with ID ${debtId} not found or access denied`,
      debtId,
      error: 'Debt Not Found',
      statusCode: 404,
    });
  }
}

export class DebtPaymentException extends BadRequestException {
  constructor(message: string, debtId?: string, currentBalance?: number) {
    super({
      message,
      debtId,
      currentBalance,
      error: 'Debt Payment Error',
      statusCode: 400,
    });
  }
}

export class DebtCalculationException extends BadRequestException {
  constructor(message: string, debtType?: string) {
    super({
      message,
      debtType,
      error: 'Debt Calculation Error',
      statusCode: 400,
    });
  }
}

export class DebtBusinessRuleException extends ConflictException {
  constructor(message: string, rule: string) {
    super({
      message,
      rule,
      error: 'Debt Business Rule Violation',
      statusCode: 409,
    });
  }
}

export class DebtCurrencyException extends BadRequestException {
  constructor(message: string, providedCurrency?: string, supportedCurrencies?: string[]) {
    super({
      message,
      providedCurrency,
      supportedCurrencies,
      error: 'Debt Currency Error',
      statusCode: 400,
    });
  }
}

export class DebtTermException extends BadRequestException {
  constructor(message: string, startDate?: string, maturityDate?: string) {
    super({
      message,
      startDate,
      maturityDate,
      error: 'Debt Term Error',
      statusCode: 400,
    });
  }
}
