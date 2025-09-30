import { NextRequest } from 'next/server';
import { householdService } from '@/services/household.service';
import { requireAuth, jsonResponse, handleApiError } from '@/lib/auth-helpers';

interface RouteParams {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();
    const household = await householdService.getHouseholdById(params.id);
    return jsonResponse(household);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();
    const body = await request.json();
    const household = await householdService.updateHousehold(params.id, body);
    return jsonResponse(household);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();
    await householdService.deleteHousehold(params.id);
    return new Response(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
