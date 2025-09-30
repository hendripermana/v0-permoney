/**
 * Clerk Webhook Handler
 * 
 * Automatically syncs users from Clerk to our database
 * Handles user.created, user.updated, and user.deleted events
 * 
 * Setup instructions for Boss:
 * 1. Go to Clerk Dashboard → Webhooks
 * 2. Create new endpoint
 * 3. URL: https://your-domain.com/api/webhooks/clerk
 * 4. Subscribe to: user.created, user.updated, user.deleted
 * 5. Copy signing secret and add to .env as CLERK_WEBHOOK_SECRET
 */

import { NextRequest } from 'next/server';
import { headers } from 'next/headers';
import { Webhook } from 'svix';
import { prisma } from '@/lib/prisma';
import { jsonResponse, errorResponse } from '@/lib/auth-helpers';

// Webhook event types
interface ClerkWebhookEvent {
  type: string;
  data: {
    id: string;
    email_addresses?: Array<{
      email_address: string;
      id: string;
    }>;
    primary_email_address_id?: string;
    first_name?: string | null;
    last_name?: string | null;
    image_url?: string;
    created_at?: number;
    updated_at?: number;
  };
}

/**
 * POST /api/webhooks/clerk
 * Handle Clerk webhook events
 */
export async function POST(request: NextRequest) {
  try {
    // Get the webhook secret from environment
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
      console.error('Missing CLERK_WEBHOOK_SECRET environment variable');
      return errorResponse('Webhook secret not configured', 500);
    }

    // Get the headers
    const headerPayload = await headers();
    const svix_id = headerPayload.get('svix-id');
    const svix_timestamp = headerPayload.get('svix-timestamp');
    const svix_signature = headerPayload.get('svix-signature');

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
      return errorResponse('Missing svix headers', 400);
    }

    // Get the body
    const payload = await request.json();
    const body = JSON.stringify(payload);

    // Create a new Svix instance with your secret
    const wh = new Webhook(WEBHOOK_SECRET);

    let evt: ClerkWebhookEvent;

    // Verify the payload with the headers
    try {
      evt = wh.verify(body, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      }) as ClerkWebhookEvent;
    } catch (err) {
      console.error('Error verifying webhook:', err);
      return errorResponse('Invalid webhook signature', 400);
    }

    // Handle the webhook
    const eventType = evt.type;
    console.log(`Clerk webhook received: ${eventType}`);

    switch (eventType) {
      case 'user.created':
        await handleUserCreated(evt.data);
        break;
      case 'user.updated':
        await handleUserUpdated(evt.data);
        break;
      case 'user.deleted':
        await handleUserDeleted(evt.data);
        break;
      default:
        console.log(`Unhandled webhook event: ${eventType}`);
    }

    return jsonResponse({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return errorResponse('Webhook processing failed', 500);
  }
}

/**
 * Handle user.created event
 */
async function handleUserCreated(data: ClerkWebhookEvent['data']) {
  try {
    const primaryEmail = data.email_addresses?.find(
      (email) => email.id === data.primary_email_address_id
    );

    if (!primaryEmail) {
      console.error('No primary email found for user:', data.id);
      return;
    }

    const fullName = [data.first_name, data.last_name]
      .filter(Boolean)
      .join(' ') || primaryEmail.email_address.split('@')[0];

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { clerkId: data.id },
    });

    if (existingUser) {
      console.log(`User already exists: ${data.id}`);
      return;
    }

    // Create user in database
    const user = await prisma.user.create({
      data: {
        clerkId: data.id,
        email: primaryEmail.email_address,
        name: fullName,
        avatarUrl: data.image_url,
        emailVerified: true, // Clerk handles verification
        isActive: true,
      },
    });

    console.log(`User created in database: ${user.id} (Clerk: ${data.id})`);
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

/**
 * Handle user.updated event
 */
async function handleUserUpdated(data: ClerkWebhookEvent['data']) {
  try {
    const primaryEmail = data.email_addresses?.find(
      (email) => email.id === data.primary_email_address_id
    );

    if (!primaryEmail) {
      console.error('No primary email found for user:', data.id);
      return;
    }

    const fullName = [data.first_name, data.last_name]
      .filter(Boolean)
      .join(' ') || primaryEmail.email_address.split('@')[0];

    // Update user in database
    await prisma.user.upsert({
      where: { clerkId: data.id },
      update: {
        email: primaryEmail.email_address,
        name: fullName,
        avatarUrl: data.image_url,
      },
      create: {
        clerkId: data.id,
        email: primaryEmail.email_address,
        name: fullName,
        avatarUrl: data.image_url,
        emailVerified: true,
        isActive: true,
      },
    });

    console.log(`User updated in database: ${data.id}`);
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

/**
 * Handle user.deleted event
 */
async function handleUserDeleted(data: ClerkWebhookEvent['data']) {
  try {
    // Soft delete user (set isActive = false)
    await prisma.user.updateMany({
      where: { clerkId: data.id },
      data: { isActive: false },
    });

    console.log(`User soft deleted: ${data.id}`);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}
