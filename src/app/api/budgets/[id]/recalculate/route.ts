import { NextRequest } from 'next/server';
import { budgetsService } from '@/services/budgets.service';
import { requireHousehold, jsonResponse, handleApiError } from '@/lib/auth-helpers';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * POST /api/budgets/:id/recalculate
 * Recalculate budget spent amounts
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { householdId } = await requireHousehold();
    const { id } = params;

    const budget = await budgetsService.recalculateBudget(id, householdId);

    return jsonResponse(budget);
  } catch (error) {
    return handleApiError(error);
  }
}
