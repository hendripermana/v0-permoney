import { NextRequest } from 'next/server';
import { categoriesService } from '@/services/categories.service';
import { requireHousehold, jsonResponse, errorResponse, handleApiError } from '@/lib/auth-helpers';
import { CategoryType } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { householdId } = await requireHousehold();
    const { searchParams } = new URL(request.url);

    const filters = {
      type: searchParams.get('type') as CategoryType | undefined,
      isActive: searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined,
      isArchived: searchParams.get('isArchived') ? searchParams.get('isArchived') === 'true' : undefined,
      parentId: searchParams.get('parentId') || undefined,
    };

    const categories = await categoriesService.getCategories(householdId, filters);
    return jsonResponse(categories);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { householdId } = await requireHousehold();
    const body = await request.json();

    if (!body.name || !body.slug || !body.type) {
      return errorResponse('Missing required fields: name, slug, type');
    }

    const category = await categoriesService.createCategory(householdId, body);
    return jsonResponse(category, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
