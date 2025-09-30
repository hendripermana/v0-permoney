/**
 * Households API Route (Plural) - Compatibility Layer
 * 
 * This route provides compatibility with the frontend API client
 * which uses `/api/households` (plural) instead of `/api/household` (singular)
 * 
 * Forwards all requests to the household service
 */

import { NextRequest } from 'next/server';
import { householdService } from '@/services/household.service';
import { requireAuth, jsonResponse, errorResponse, handleApiError } from '@/lib/auth-helpers';

/**
 * GET /api/households
 * Get all households for current user
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const households = await householdService.getUserHouseholds(userId);
    return jsonResponse(households);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/households
 * Create a new household
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const body = await request.json();

    if (!body.name) {
      return errorResponse('Missing required field: name', 400);
    }

    const household = await householdService.createHousehold(userId, body);
    return jsonResponse(household, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
