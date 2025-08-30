// Common utility functions

import { Money, Currency } from './types';

export function formatMoney(money: Money): string {
  const formatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: money.currency,
  });
  return formatter.format(money.amount);
}

export function convertCurrency(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency,
  exchangeRate: number
): Money {
  if (fromCurrency === toCurrency) {
    return { amount, currency: toCurrency };
  }

  return {
    amount: amount * exchangeRate,
    currency: toCurrency,
  };
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
