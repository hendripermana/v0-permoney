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
    const { dbUserId } = await requireAuth();
    
    if (!dbUserId) {
      return errorResponse('User not found in database. Please complete sign-up.', 404);
    }
    
    const households = await householdService.getUserHouseholds(dbUserId);
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
    const { dbUserId } = await requireAuth();
    
    if (!dbUserId) {
      return errorResponse('User not found in database. Please complete sign-up.', 404);
    }
    
    const body = await request.json();

    if (!body.name) {
      return errorResponse('Missing required field: name', 400);
    }

    const household = await householdService.createHousehold(dbUserId, body);
    return jsonResponse(household, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
