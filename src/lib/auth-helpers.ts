import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from './prisma';

export interface AuthContext {
  userId: string;
  user: any;
  householdId: string | null;
}

/**
 * Get authenticated user context with household
 */
export async function getAuthContext(): Promise<AuthContext> {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('Unauthorized');
  }

  const user = await currentUser();

  // Get user's household from database
  const dbUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      householdMembers: {
        include: {
          household: true,
        },
        take: 1, // Get first household for now
      },
    },
  });

  const householdId = dbUser?.householdMembers[0]?.householdId || null;

  return {
    userId,
    user,
    householdId,
  };
}

/**
 * Require authentication
 */
export async function requireAuth(): Promise<AuthContext> {
  const context = await getAuthContext();
  
  if (!context.userId) {
    throw new Error('Unauthorized');
  }

  return context;
}

/**
 * Require household membership
 */
export async function requireHousehold(): Promise<Required<AuthContext>> {
  const context = await requireAuth();
  
  if (!context.householdId) {
    throw new Error('No household found. Please complete onboarding.');
  }

  return context as Required<AuthContext>;
}

/**
 * Create JSON response
 */
export function jsonResponse(data: any, status: number = 200) {
  return Response.json(data, { status });
}

/**
 * Create error response
 */
export function errorResponse(message: string, status: number = 400) {
  return Response.json({ error: message }, { status });
}

/**
 * Handle API errors
 */
export function handleApiError(error: unknown) {
  console.error('API Error:', error);

  if (error instanceof Error) {
    const message = error.message;
    
    if (message.includes('Unauthorized') || message.includes('No household')) {
      return errorResponse(message, 401);
    }
    
    if (message.includes('not found')) {
      return errorResponse(message, 404);
    }
    
    return errorResponse(message, 400);
  }

  return errorResponse('Internal server error', 500);
}
