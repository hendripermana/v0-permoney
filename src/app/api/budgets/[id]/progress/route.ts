import { NextRequest } from 'next/server';
import { budgetsService } from '@/services/budgets.service';
import { requireHousehold, jsonResponse, handleApiError } from '@/lib/auth-helpers';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/budgets/:id/progress
 * Get budget progress
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { householdId } = await requireHousehold();
    const { id } = params;

    const progress = await budgetsService.getBudgetProgress(id, householdId);

    return jsonResponse(progress);
  } catch (error) {
    return handleApiError(error);
  }
}
