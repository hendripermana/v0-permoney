import { NextRequest } from 'next/server';
import { gratitudeService } from '@/services/gratitude.service';
import { requireHousehold, jsonResponse, errorResponse, handleApiError } from '@/lib/auth-helpers';
import { GratitudeType } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { householdId } = await requireHousehold();
    const { searchParams } = new URL(request.url);

    const filters = {
      type: searchParams.get('type') as GratitudeType | undefined,
      giver: searchParams.get('giver') || undefined,
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
    };

    const entries = await gratitudeService.getGratitudeEntries(householdId, filters);
    return jsonResponse(entries);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { householdId, userId } = await requireHousehold();
    const body = await request.json();

    if (!body.giver || !body.type || !body.description || !body.date) {
      return errorResponse('Missing required fields: giver, type, description, date');
    }

    const data = {
      ...body,
      date: new Date(body.date),
      estimatedValueCents: body.estimatedValueCents ? parseInt(body.estimatedValueCents) : undefined,
    };

    const entry = await gratitudeService.createGratitudeEntry(householdId, userId, data);
    return jsonResponse(entry, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
