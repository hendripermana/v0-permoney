import { NextRequest } from 'next/server';
import { categoriesService } from '@/services/categories.service';
import { requireHousehold, jsonResponse, handleApiError } from '@/lib/auth-helpers';

interface RouteParams {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { householdId } = await requireHousehold();
    const category = await categoriesService.getCategoryById(params.id, householdId);
    return jsonResponse(category);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { householdId } = await requireHousehold();
    const body = await request.json();
    const category = await categoriesService.updateCategory(params.id, householdId, body);
    return jsonResponse(category);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { householdId } = await requireHousehold();
    await categoriesService.deleteCategory(params.id, householdId);
    return new Response(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
