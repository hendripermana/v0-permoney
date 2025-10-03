import { NextRequest } from 'next/server';
import { debtsService } from '@/services/debts.service';
import { requireHousehold, jsonResponse, handleApiError } from '@/lib/auth-helpers';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { householdId } = await requireHousehold();
    const resolvedParams = await params;
    const debt = await debtsService.getDebtById(resolvedParams.id, householdId);
    return jsonResponse(debt);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { householdId } = await requireHousehold();
    const resolvedParams = await params;
    const body = await request.json();

    const data = {
      ...body,
      principalAmountCents: body.principalAmountCents ? parseInt(body.principalAmountCents) : undefined,
      currentBalanceCents: body.currentBalanceCents ? parseInt(body.currentBalanceCents) : undefined,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      maturityDate: body.maturityDate ? new Date(body.maturityDate) : undefined,
    };

    const debt = await debtsService.updateDebt(resolvedParams.id, householdId, data);
    return jsonResponse(debt);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { householdId } = await requireHousehold();
    const resolvedParams = await params;
    await debtsService.deleteDebt(resolvedParams.id, householdId);
    return new Response(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
