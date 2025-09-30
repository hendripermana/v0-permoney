import { NextRequest } from 'next/server';
import { accountsService } from '@/services/accounts.service';
import { requireHousehold, jsonResponse, handleApiError } from '@/lib/auth-helpers';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/accounts/:id
 * Get account by ID
 */
export async function GET(_request: NextRequest, props: RouteParams) {
  try {
    const { householdId } = await requireHousehold();
    const params = await props.params;
    const { id } = params;

    const account = await accountsService.getAccountById(id, householdId);

    return jsonResponse(account);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/accounts/:id
 * Update account
 */
export async function PUT(request: NextRequest, props: RouteParams) {
  try {
    const { householdId } = await requireHousehold();
    const params = await props.params;
    const { id } = params;
    const body = await request.json();

    // Parse data
    const data = {
      ...body,
      balanceCents: body.balanceCents ? parseInt(body.balanceCents) : undefined,
    };

    const account = await accountsService.updateAccount(id, householdId, data);

    return jsonResponse(account);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/accounts/:id
 * Delete account
 */
export async function DELETE(_request: NextRequest, props: RouteParams) {
  try {
    const { householdId } = await requireHousehold();
    const params = await props.params;
    const { id } = params;

    await accountsService.deleteAccount(id, householdId);

    return new Response(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
