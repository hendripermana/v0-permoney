/**
 * User Profile API
 * 
 * Manages user profile data in database
 * Provides GET and PUT endpoints for profile management
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, jsonResponse, errorResponse, handleApiError } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

// Locale mapping for countries
const LOCALE_MAP: Record<string, string> = {
  'ID': 'id-ID',
  'US': 'en-US',
  'SG': 'en-SG',
  'MY': 'ms-MY',
  'GB': 'en-GB',
  'AU': 'en-AU',
  'CA': 'en-CA',
  'NZ': 'en-NZ',
  'IN': 'en-IN',
  'PH': 'en-PH',
  'TH': 'th-TH',
  'VN': 'vi-VN',
  'JP': 'ja-JP',
  'KR': 'ko-KR',
  'CN': 'zh-CN',
  'TW': 'zh-TW',
  'HK': 'zh-HK',
  'FR': 'fr-FR',
  'DE': 'de-DE',
  'ES': 'es-ES',
  'IT': 'it-IT',
  'PT': 'pt-PT',
  'BR': 'pt-BR',
  'NL': 'nl-NL',
  'RU': 'ru-RU',
  'SA': 'ar-SA',
  'AE': 'ar-AE',
};

// Timezone mapping for countries
const TIMEZONE_MAP: Record<string, string> = {
  'ID': 'Asia/Jakarta',
  'US': 'America/New_York',
  'SG': 'Asia/Singapore',
  'MY': 'Asia/Kuala_Lumpur',
  'GB': 'Europe/London',
  'AU': 'Australia/Sydney',
  'CA': 'America/Toronto',
  'NZ': 'Pacific/Auckland',
  'IN': 'Asia/Kolkata',
  'PH': 'Asia/Manila',
  'TH': 'Asia/Bangkok',
  'VN': 'Asia/Ho_Chi_Minh',
  'JP': 'Asia/Tokyo',
  'KR': 'Asia/Seoul',
  'CN': 'Asia/Shanghai',
  'TW': 'Asia/Taipei',
  'HK': 'Asia/Hong_Kong',
  'FR': 'Europe/Paris',
  'DE': 'Europe/Berlin',
  'ES': 'Europe/Madrid',
  'IT': 'Europe/Rome',
  'PT': 'Europe/Lisbon',
  'BR': 'America/Sao_Paulo',
  'NL': 'Europe/Amsterdam',
  'RU': 'Europe/Moscow',
  'SA': 'Asia/Riyadh',
  'AE': 'Asia/Dubai',
};

/**
 * GET /api/user/profile
 * Get current user profile data
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await requireAuth();
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
        clerkId: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        countryCode: true,
        preferredCurrency: true,
        locale: true,
        timezone: true,
        phoneNumber: true,
        dateOfBirth: true,
        avatarUrl: true,
        emailVerified: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return errorResponse('User not found', 404);
    }

    return jsonResponse(user);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/user/profile
 * Update user profile data
 */
export async function PUT(req: NextRequest) {
  try {
    const { userId } = await requireAuth();
    
    // Get user's database record
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return errorResponse('User not found', 404);
    }

    const body = await req.json();
    const {
      firstName,
      lastName,
      countryCode,
      preferredCurrency,
      phoneNumber,
      dateOfBirth,
    } = body;

    // Auto-determine locale and timezone from country
    const locale = countryCode ? (LOCALE_MAP[countryCode] || 'id-ID') : undefined;
    const timezone = countryCode ? (TIMEZONE_MAP[countryCode] || 'Asia/Jakarta') : undefined;

    // Build update data (only include provided fields)
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (countryCode !== undefined) {
      updateData.countryCode = countryCode;
      updateData.locale = locale;
      updateData.timezone = timezone;
    }
    if (preferredCurrency !== undefined) updateData.preferredCurrency = preferredCurrency;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;

    // Update full name if firstName or lastName changed
    if (firstName !== undefined || lastName !== undefined) {
      const newFirstName = firstName ?? user.firstName ?? '';
      const newLastName = lastName ?? user.lastName ?? '';
      updateData.name = `${newFirstName} ${newLastName}`.trim() || user.name;
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        clerkId: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        countryCode: true,
        preferredCurrency: true,
        locale: true,
        timezone: true,
        phoneNumber: true,
        dateOfBirth: true,
        avatarUrl: true,
        updatedAt: true,
      },
    });

    console.log(`[Profile API] ✅ User profile updated: ${user.email}`);
    console.log(`[Profile API]    Name: ${updatedUser.firstName} ${updatedUser.lastName}`);
    console.log(`[Profile API]    Country: ${updatedUser.countryCode}, Currency: ${updatedUser.preferredCurrency}`);

    return jsonResponse(updatedUser);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/user/profile
 * Partial update user profile (alias for PUT)
 */
export async function PATCH(req: NextRequest) {
  return PUT(req);
}
