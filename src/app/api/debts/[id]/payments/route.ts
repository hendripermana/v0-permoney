import { NextRequest } from 'next/server';
import { debtsService } from '@/services/debts.service';
import { requireHousehold, jsonResponse, errorResponse, handleApiError } from '@/lib/auth-helpers';

interface RouteParams {
  params: { id: string };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { householdId } = await requireHousehold();
    const body = await request.json();

    if (!body.amountCents || !body.paymentDate || !body.principalAmountCents) {
      return errorResponse('Missing required fields: amountCents, paymentDate, principalAmountCents');
    }

    const data = {
      amountCents: parseInt(body.amountCents),
      principalAmountCents: parseInt(body.principalAmountCents),
      interestAmountCents: body.interestAmountCents ? parseInt(body.interestAmountCents) : 0,
      paymentDate: new Date(body.paymentDate),
      currency: body.currency,
      transactionId: body.transactionId,
    };

    const debt = await debtsService.addPayment(params.id, householdId, data);
    return jsonResponse(debt, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
