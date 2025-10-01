/**
 * Clerk Webhook Handler
 * 
 * Automatically syncs user data from Clerk to our database
 * Handles user.created, user.updated, and user.deleted events
 * 
 * Features:
 * - Signature verification for security
 * - Automatic user synchronization
 * - Comprehensive error handling
 * - Detailed logging for monitoring
 */

import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { prisma } from '@/lib/prisma';

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  if (!webhookSecret) {
    console.error('Missing CLERK_WEBHOOK_SECRET environment variable');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  // Get headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // Verify headers
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json(
      { error: 'Missing svix headers' },
      { status: 400 }
    );
  }

  // Get body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Verify webhook signature
  const wh = new Webhook(webhookSecret);
  let evt: any;

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  // Handle the event
  const eventType = evt.type;
  console.log(`Clerk webhook event received: ${eventType}`);

  try {
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
        console.log(`Unhandled event type: ${eventType}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error handling webhook event ${eventType}:`, error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

async function handleUserCreated(data: any) {
  const clerkId = data.id;
  const email = data.email_addresses?.[0]?.email_address;
  
  if (!email) {
    console.error(`Cannot create user ${clerkId}: No email address found`);
    throw new Error('Email address is required');
  }

  const firstName = data.first_name || '';
  const lastName = data.last_name || '';
  const name = `${firstName} ${lastName}`.trim() || email.split('@')[0] || 'User';
  const avatarUrl = data.image_url;

  console.log(`[Webhook] Creating user in database: ${clerkId} (${email})`);

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (existingUser) {
      console.log(`[Webhook] User already exists: ${clerkId} (${existingUser.email})`);
      
      // Update lastLoginAt
      await prisma.user.update({
        where: { clerkId },
        data: { 
          lastLoginAt: new Date(),
          emailVerified: data.email_addresses?.[0]?.verification?.status === 'verified',
        },
      });
      
      return;
    }

    // Create user in database
    const newUser = await prisma.user.create({
      data: {
        clerkId,
        email,
        name,
        avatarUrl,
        emailVerified: data.email_addresses?.[0]?.verification?.status === 'verified',
        lastLoginAt: new Date(),
      },
    });

    console.log(`[Webhook] ✅ User created successfully: ${clerkId} (${email}) [DB ID: ${newUser.id}]`);
  } catch (error) {
    console.error(`[Webhook] ❌ Error creating user ${clerkId}:`, error);
    throw error;
  }
}

async function handleUserUpdated(data: any) {
  const clerkId = data.id;
  const email = data.email_addresses?.[0]?.email_address;
  
  if (!email) {
    console.error(`Cannot update user ${clerkId}: No email address found`);
    throw new Error('Email address is required');
  }

  const firstName = data.first_name || '';
  const lastName = data.last_name || '';
  const name = `${firstName} ${lastName}`.trim() || email.split('@')[0] || 'User';
  const avatarUrl = data.image_url;

  console.log(`[Webhook] Updating user in database: ${clerkId} (${email})`);

  try {
    // Upsert user (create if not exists, update if exists)
    const user = await prisma.user.upsert({
      where: { clerkId },
      update: {
        email,
        name,
        avatarUrl,
        emailVerified: data.email_addresses?.[0]?.verification?.status === 'verified',
        lastLoginAt: new Date(),
      },
      create: {
        clerkId,
        email,
        name,
        avatarUrl,
        emailVerified: data.email_addresses?.[0]?.verification?.status === 'verified',
        lastLoginAt: new Date(),
      },
    });

    console.log(`[Webhook] ✅ User updated successfully: ${clerkId} (${email}) [DB ID: ${user.id}]`);
  } catch (error) {
    console.error(`[Webhook] ❌ Error updating user ${clerkId}:`, error);
    throw error;
  }
}

async function handleUserDeleted(data: any) {
  const clerkId = data.id;

  console.log(`[Webhook] Deleting user from database: ${clerkId}`);

  try {
    // Soft delete: update isActive flag
    const result = await prisma.user.updateMany({
      where: { clerkId },
      data: { 
        isActive: false,
        updatedAt: new Date(),
      },
    });

    if (result.count === 0) {
      console.log(`[Webhook] ⚠️  User not found for deletion: ${clerkId}`);
    } else {
      console.log(`[Webhook] ✅ User marked as inactive: ${clerkId}`);
    }
  } catch (error) {
    console.error(`[Webhook] ❌ Error deleting user ${clerkId}:`, error);
    throw error;
  }
}
