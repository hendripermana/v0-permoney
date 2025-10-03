import { NextRequest } from 'next/server';
import { gratitudeService } from '@/services/gratitude.service';
import { requireHousehold, jsonResponse, handleApiError } from '@/lib/auth-helpers';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { householdId } = await requireHousehold();
    const entry = await gratitudeService.getGratitudeById(resolvedParams.id, householdId);
    return jsonResponse(entry);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { householdId } = await requireHousehold();
    const body = await request.json();

    const data = {
      ...body,
      date: body.date ? new Date(body.date) : undefined,
      estimatedValueCents: body.estimatedValueCents ? parseInt(body.estimatedValueCents) : undefined,
    };

    const entry = await gratitudeService.updateGratitudeEntry(resolvedParams.id, householdId, data);
    return jsonResponse(entry);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { householdId } = await requireHousehold();
    await gratitudeService.deleteGratitudeEntry(resolvedParams.id, householdId);
    return new Response(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
