#!/usr/bin/env ts-node

/**
 * Migrate User Data from Clerk to Database
 * 
 * This script syncs user profile data from Clerk unsafeMetadata to our database.
 * Should be run after schema migration to backfill existing users.
 * 
 * Usage:
 *   ts-node scripts/migrate-clerk-data-to-db.ts
 *   or
 *   npm run migrate:clerk-data
 */

import { PrismaClient } from '@prisma/client';
import { clerkClient } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

interface ClerkMetadata {
  onboardingComplete?: boolean;
  primaryHouseholdId?: string;
  onboardingData?: {
    completedAt?: string;
    profile?: {
      firstName?: string;
      lastName?: string;
      countryCode?: string;
      currencyCode?: string;
    };
    household?: {
      id?: string;
      name?: string;
      baseCurrency?: string;
    };
  };
}

async function migrateUserData() {
  console.log('🔄 Starting Clerk to Database Migration');
  console.log('========================================\n');

  try {
    // Get all users with Clerk IDs
    const users = await prisma.user.findMany({
      where: {
        clerkId: { not: null },
        isActive: true,
      },
      include: {
        householdMembers: {
          include: {
            household: true,
          },
          take: 1,
        },
      },
    });

    console.log(`📊 Found ${users.length} users to process\n`);

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (const user of users) {
      try {
        console.log(`\n📝 Processing: ${user.email} (${user.clerkId})`);

        // Get user data from Clerk
        const clerkUser = await clerkClient.users.getUser(user.clerkId!);
        const metadata = (clerkUser.unsafeMetadata || {}) as ClerkMetadata;

        // Extract data
        const firstName = clerkUser.firstName || metadata.onboardingData?.profile?.firstName || null;
        const lastName = clerkUser.lastName || metadata.onboardingData?.profile?.lastName || null;
        const countryCode = metadata.onboardingData?.profile?.countryCode || null;
        const preferredCurrency = metadata.onboardingData?.profile?.currencyCode || null;

        // Determine locale and timezone from country
        const localeMap: Record<string, string> = {
          'ID': 'id-ID',
          'US': 'en-US',
          'SG': 'en-SG',
          'MY': 'ms-MY',
          'GB': 'en-GB',
        };

        const timezoneMap: Record<string, string> = {
          'ID': 'Asia/Jakarta',
          'US': 'America/New_York',
          'SG': 'Asia/Singapore',
          'MY': 'Asia/Kuala_Lumpur',
          'GB': 'Europe/London',
        };

        const locale = countryCode ? (localeMap[countryCode] || 'id-ID') : 'id-ID';
        const timezone = countryCode ? (timezoneMap[countryCode] || 'Asia/Jakarta') : 'Asia/Jakarta';

        // Check if update is needed
        const needsUpdate = 
          user.firstName !== firstName ||
          user.lastName !== lastName ||
          !user.countryCode ||
          !user.preferredCurrency;

        if (!needsUpdate) {
          console.log('  ⏭️  Skipped: Data already up to date');
          skippedCount++;
          continue;
        }

        // Update user in database
        await prisma.user.update({
          where: { id: user.id },
          data: {
            firstName,
            lastName,
            countryCode,
            preferredCurrency,
            locale,
            timezone,
          },
        });

        console.log('  ✅ Success: User data migrated');
        console.log(`     - Name: ${firstName} ${lastName}`);
        console.log(`     - Country: ${countryCode || 'N/A'}`);
        console.log(`     - Currency: ${preferredCurrency || 'N/A'}`);
        console.log(`     - Locale: ${locale}`);
        console.log(`     - Timezone: ${timezone}`);

        // Update household if exists and has country data
        if (user.householdMembers.length > 0 && countryCode) {
          const household = user.householdMembers[0].household;
          if (!household.countryCode) {
            await prisma.household.update({
              where: { id: household.id },
              data: {
                countryCode,
                locale,
                timezone,
              },
            });
            console.log(`  ✅ Household updated: ${household.name}`);
          }
        }

        successCount++;
      } catch (error) {
        console.error(`  ❌ Error processing ${user.email}:`, error);
        errorCount++;
      }
    }

    // Summary
    console.log('\n========================================');
    console.log('🎯 Migration Summary');
    console.log('========================================');
    console.log(`✅ Successfully migrated: ${successCount}`);
    console.log(`⏭️  Skipped (up to date): ${skippedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📊 Total processed: ${users.length}`);
    console.log('');

    if (errorCount === 0) {
      console.log('✅ Migration completed successfully!');
    } else {
      console.log('⚠️  Migration completed with some errors. Please review above.');
    }
  } catch (error) {
    console.error('❌ Fatal error during migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateUserData()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
