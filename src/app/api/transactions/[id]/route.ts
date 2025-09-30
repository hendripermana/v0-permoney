import { NextRequest } from 'next/server';
import { transactionsService } from '@/services/transactions.service';
import { requireHousehold, jsonResponse, errorResponse, handleApiError } from '@/lib/auth-helpers';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/transactions/:id
 * Get transaction by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { householdId } = await requireHousehold();
    const { id } = params;

    const transaction = await transactionsService.getTransactionById(id, householdId);

    return jsonResponse(transaction);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/transactions/:id
 * Update transaction
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { householdId } = await requireHousehold();
    const { id } = params;
    const body = await request.json();

    // Parse data
    const data = {
      ...body,
      date: body.date ? new Date(body.date) : undefined,
      amountCents: body.amountCents ? parseInt(body.amountCents) : undefined,
      splits: body.splits?.map((split: any) => ({
        ...split,
        amountCents: parseInt(split.amountCents),
      })),
    };

    const transaction = await transactionsService.updateTransaction(id, householdId, data);

    return jsonResponse(transaction);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/transactions/:id
 * Delete transaction
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { householdId } = await requireHousehold();
    const { id } = params;

    await transactionsService.deleteTransaction(id, householdId);

    return new Response(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
