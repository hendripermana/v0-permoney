/**
 * Household by ID API Route (Plural URL) - Compatibility Layer
 * 
 * This route provides compatibility with the frontend API client
 * which uses `/api/households/:id` (plural)
 */

import { NextRequest } from 'next/server';
import { householdService } from '@/services/household.service';
import { requireAuth, requireHousehold, jsonResponse, errorResponse, handleApiError } from '@/lib/auth-helpers';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/households/:id
 * Get household by ID
 */
export async function GET(_request: NextRequest, props: RouteParams) {
  try {
    const { userId } = await requireAuth();
    const params = await props.params;
    const { id } = params;
    
    const household = await householdService.getHouseholdById(id, userId);
    return jsonResponse(household);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/households/:id
 * Update household
 */
export async function PUT(request: NextRequest, props: RouteParams) {
  try {
    const { userId } = await requireAuth();
    const params = await props.params;
    const { id } = params;
    const body = await request.json();

    const household = await householdService.updateHousehold(id, userId, body);
    return jsonResponse(household);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/households/:id
 * Delete household
 */
export async function DELETE(_request: NextRequest, props: RouteParams) {
  try {
    const { userId } = await requireAuth();
    const params = await props.params;
    const { id } = params;

    await householdService.deleteHousehold(id, userId);
    return jsonResponse({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
