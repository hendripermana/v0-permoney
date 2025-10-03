import { NextRequest } from 'next/server';
import { budgetsService } from '@/services/budgets.service';
import { requireHousehold, jsonResponse, handleApiError } from '@/lib/auth-helpers';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/budgets/:id
 * Get budget by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { householdId } = await requireHousehold();
    const { id } = await params;

    const budget = await budgetsService.getBudgetById(id, householdId);

    return jsonResponse(budget);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/budgets/:id
 * Update budget
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { householdId } = await requireHousehold();
    const { id } = await params;
    const body = await request.json();

    // Parse data
    const data = {
      ...body,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      categories: body.categories?.map((cat: any) => ({
        categoryId: cat.categoryId,
        allocatedAmountCents: parseInt(cat.allocatedAmountCents),
        carryOverCents: cat.carryOverCents ? parseInt(cat.carryOverCents) : 0,
      })),
    };

    const budget = await budgetsService.updateBudget(id, householdId, data);

    return jsonResponse(budget);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/budgets/:id
 * Delete budget
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { householdId } = await requireHousehold();
    const { id } = await params;

    await budgetsService.deleteBudget(id, householdId);

    return new Response(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
