import { NextRequest } from 'next/server';
import { analyticsService } from '@/services/analytics.service';
import { requireHousehold, jsonResponse, handleApiError } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const { householdId } = await requireHousehold();
    const { searchParams } = new URL(request.url);

    const filters = {
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      accountId: searchParams.get('accountId') || undefined,
    };

    const cashflow = await analyticsService.getCashflowAnalytics(householdId, filters);
    return jsonResponse(cashflow);
  } catch (error) {
    return handleApiError(error);
  }
}
