import { NextRequest } from 'next/server';
import { transactionsService } from '@/services/transactions.service';
import { requireHousehold, jsonResponse, handleApiError } from '@/lib/auth-helpers';

/**
 * GET /api/transactions/category-breakdown
 * Get category breakdown
 */
export async function GET(request: NextRequest) {
  try {
    const { householdId } = await requireHousehold();
    const { searchParams } = new URL(request.url);

    // Parse filters
    const filters = {
      accountId: searchParams.get('accountId') || undefined,
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
    };

    const breakdown = await transactionsService.getCategoryBreakdown(householdId, filters);

    return jsonResponse(breakdown);
  } catch (error) {
    return handleApiError(error);
  }
}
