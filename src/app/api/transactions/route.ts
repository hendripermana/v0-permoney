import { NextRequest } from 'next/server';
import { transactionsService } from '@/services/transactions.service';
import { requireHousehold, jsonResponse, errorResponse, handleApiError } from '@/lib/auth-helpers';

/**
 * GET /api/transactions
 * Get all transactions with filters
 */
export async function GET(request: NextRequest) {
  try {
    const { householdId, userId } = await requireHousehold();
    const { searchParams } = new URL(request.url);

    // Parse filters from query params
    const filters = {
      accountId: searchParams.get('accountId') || undefined,
      categoryId: searchParams.get('categoryId') || undefined,
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      minAmount: searchParams.get('minAmount') ? parseInt(searchParams.get('minAmount')!) : undefined,
      maxAmount: searchParams.get('maxAmount') ? parseInt(searchParams.get('maxAmount')!) : undefined,
      merchant: searchParams.get('merchant') || undefined,
      search: searchParams.get('search') || undefined,
      tags: searchParams.getAll('tags'),
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      orderBy: searchParams.get('orderBy') || 'date',
      orderDirection: (searchParams.get('orderDirection') || 'desc') as 'asc' | 'desc',
    };

    const result = await transactionsService.getTransactions(householdId, filters);

    return jsonResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/transactions
 * Create a new transaction
 */
export async function POST(request: NextRequest) {
  try {
    const { householdId, userId } = await requireHousehold();
    const body = await request.json();

    // Validate required fields
    if (!body.accountId || !body.amountCents || !body.description || !body.date) {
      return errorResponse('Missing required fields: accountId, amountCents, description, date');
    }

    // Parse date
    const data = {
      ...body,
      date: new Date(body.date),
      amountCents: parseInt(body.amountCents),
      originalAmountCents: body.originalAmountCents ? parseInt(body.originalAmountCents) : undefined,
      exchangeRate: body.exchangeRate ? parseFloat(body.exchangeRate) : undefined,
      splits: body.splits?.map((split: any) => ({
        ...split,
        amountCents: parseInt(split.amountCents),
      })),
    };

    const transaction = await transactionsService.createTransaction(householdId, data, userId);

    return jsonResponse(transaction, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
