import { NextRequest } from 'next/server';
import { transactionsService } from '@/services/transactions.service';
import { requireHousehold, jsonResponse, handleApiError } from '@/lib/auth-helpers';

/**
 * GET /api/transactions/stats
 * Get transaction statistics
 */
export async function GET(request: NextRequest) {
  try {
    const { householdId } = await requireHousehold();
    const { searchParams } = new URL(request.url);

    // Parse filters
    const filters = {
      accountId: searchParams.get('accountId') || undefined,
      categoryId: searchParams.get('categoryId') || undefined,
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
    };

    const stats = await transactionsService.getTransactionStats(householdId, filters);

    return jsonResponse(stats);
  } catch (error) {
    return handleApiError(error);
  }
}
