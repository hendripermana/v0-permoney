import { NextRequest } from 'next/server';
import { accountsService } from '@/services/accounts.service';
import { requireHousehold, jsonResponse, errorResponse, handleApiError } from '@/lib/auth-helpers';
import { AccountType } from '@prisma/client';

/**
 * GET /api/accounts
 * Get all accounts with filters
 */
export async function GET(request: NextRequest) {
  try {
    const { householdId } = await requireHousehold();
    const { searchParams } = new URL(request.url);

    // Parse filters from query params
    const filters = {
      type: searchParams.get('type') as AccountType | undefined,
      isActive: searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined,
      currency: searchParams.get('currency') || undefined,
      institutionId: searchParams.get('institutionId') || undefined,
      ownerId: searchParams.get('ownerId') || undefined,
    };

    const accounts = await accountsService.getAccounts(householdId, filters);

    return jsonResponse(accounts);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/accounts
 * Create a new account
 */
export async function POST(request: NextRequest) {
  try {
    const { householdId } = await requireHousehold();
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.type || !body.subtype) {
      return errorResponse('Missing required fields: name, type, subtype');
    }

    // Parse data
    const data = {
      ...body,
      balanceCents: body.balanceCents ? parseInt(body.balanceCents) : undefined,
    };

    const account = await accountsService.createAccount(householdId, data);

    return jsonResponse(account, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
