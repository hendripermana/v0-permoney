import { NextRequest } from 'next/server';
import { accountsService } from '@/services/accounts.service';
import { requireHousehold, jsonResponse, handleApiError } from '@/lib/auth-helpers';

/**
 * GET /api/accounts/net-worth
 * Calculate net worth
 */
export async function GET(request: NextRequest) {
  try {
    const { householdId } = await requireHousehold();
    const { searchParams } = new URL(request.url);

    const currency = searchParams.get('currency') || 'IDR';

    const netWorth = await accountsService.getNetWorth(householdId, currency);

    return jsonResponse(netWorth);
  } catch (error) {
    return handleApiError(error);
  }
}
