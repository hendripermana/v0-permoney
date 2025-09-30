import { NextRequest } from 'next/server';
import { accountsService } from '@/services/accounts.service';
import { requireHousehold, jsonResponse, handleApiError } from '@/lib/auth-helpers';

/**
 * GET /api/accounts/stats
 * Get account statistics
 */
export async function GET(request: NextRequest) {
  try {
    const { householdId } = await requireHousehold();

    const stats = await accountsService.getAccountStats(householdId);

    return jsonResponse(stats);
  } catch (error) {
    return handleApiError(error);
  }
}
