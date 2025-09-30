import { NextRequest } from 'next/server';
import { debtsService } from '@/services/debts.service';
import { requireHousehold, jsonResponse, errorResponse, handleApiError } from '@/lib/auth-helpers';
import { DebtType } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { householdId } = await requireHousehold();
    const { searchParams } = new URL(request.url);

    const filters = {
      type: searchParams.get('type') as DebtType | undefined,
      isActive: searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined,
    };

    const debts = await debtsService.getDebts(householdId, filters);
    return jsonResponse(debts);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { householdId } = await requireHousehold();
    const body = await request.json();

    if (!body.type || !body.name || !body.creditor || !body.principalAmountCents || !body.startDate) {
      return errorResponse('Missing required fields: type, name, creditor, principalAmountCents, startDate');
    }

    const data = {
      ...body,
      principalAmountCents: parseInt(body.principalAmountCents),
      currentBalanceCents: body.currentBalanceCents ? parseInt(body.currentBalanceCents) : undefined,
      startDate: new Date(body.startDate),
      maturityDate: body.maturityDate ? new Date(body.maturityDate) : undefined,
    };

    const debt = await debtsService.createDebt(householdId, data);
    return jsonResponse(debt, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
