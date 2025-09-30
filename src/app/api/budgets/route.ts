import { NextRequest } from 'next/server';
import { budgetsService } from '@/services/budgets.service';
import { requireHousehold, jsonResponse, errorResponse, handleApiError } from '@/lib/auth-helpers';
import { BudgetPeriod } from '@prisma/client';

/**
 * GET /api/budgets
 * Get all budgets with filters
 */
export async function GET(request: NextRequest) {
  try {
    const { householdId } = await requireHousehold();
    const { searchParams } = new URL(request.url);

    // Parse filters
    const filters = {
      isActive: searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined,
      period: searchParams.get('period') as BudgetPeriod | undefined,
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
    };

    const budgets = await budgetsService.getBudgets(householdId, filters);

    return jsonResponse(budgets);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/budgets
 * Create a new budget
 */
export async function POST(request: NextRequest) {
  try {
    const { householdId } = await requireHousehold();
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.period || !body.startDate || !body.endDate || !body.categories) {
      return errorResponse('Missing required fields: name, period, startDate, endDate, categories');
    }

    // Parse data
    const data = {
      ...body,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      categories: body.categories.map((cat: any) => ({
        categoryId: cat.categoryId,
        allocatedAmountCents: parseInt(cat.allocatedAmountCents),
        carryOverCents: cat.carryOverCents ? parseInt(cat.carryOverCents) : 0,
      })),
    };

    const budget = await budgetsService.createBudget(householdId, data);

    return jsonResponse(budget, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
