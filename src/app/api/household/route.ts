import { NextRequest } from 'next/server';
import { householdService } from '@/services/household.service';
import { requireAuth, jsonResponse, errorResponse, handleApiError } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const households = await householdService.getUserHouseholds(userId);
    return jsonResponse(households);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const body = await request.json();

    if (!body.name) {
      return errorResponse('Missing required field: name');
    }

    const household = await householdService.createHousehold(userId, body);
    return jsonResponse(household, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
