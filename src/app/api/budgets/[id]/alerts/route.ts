import { NextRequest } from 'next/server';
import { budgetsService } from '@/services/budgets.service';
import { requireHousehold, jsonResponse, handleApiError } from '@/lib/auth-helpers';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/budgets/:id/alerts
 * Get budget alerts
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { householdId } = await requireHousehold();
    const { id } = await params;

    const alerts = await budgetsService.getBudgetAlerts(id, householdId);

    return jsonResponse(alerts);
  } catch (error) {
    return handleApiError(error);
  }
}
