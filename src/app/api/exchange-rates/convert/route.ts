import { NextRequest } from 'next/server';
import { exchangeRatesService } from '@/services/exchange-rates.service';
import { requireAuth, jsonResponse, errorResponse, handleApiError } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    
    const amount = searchParams.get('amount');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const date = searchParams.get('date') ? new Date(searchParams.get('date')!) : undefined;

    if (!amount || !from || !to) {
      return errorResponse('Missing required parameters: amount, from, to');
    }

    const convertedAmount = await exchangeRatesService.convertAmount(
      parseFloat(amount),
      from,
      to,
      date
    );
    
    return jsonResponse({ 
      originalAmount: parseFloat(amount),
      convertedAmount,
      fromCurrency: from,
      toCurrency: to,
      date: date || new Date()
    });
  } catch (error) {
    return handleApiError(error);
  }
}
