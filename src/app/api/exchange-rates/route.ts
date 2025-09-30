import { NextRequest } from 'next/server';
import { exchangeRatesService } from '@/services/exchange-rates.service';
import { requireAuth, jsonResponse, handleApiError } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    
    const date = searchParams.get('date') ? new Date(searchParams.get('date')!) : new Date();
    const rates = await exchangeRatesService.getExchangeRatesForDate(date);
    
    return jsonResponse(rates);
  } catch (error) {
    return handleApiError(error);
  }
}
