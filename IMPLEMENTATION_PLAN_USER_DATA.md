# 🎯 Implementation Plan - User Data Storage Enhancement

## 📊 Executive Summary

**Status:** ✅ **Database Migration Complete!**

**What Was Done:**
1. ✅ Analyzed onboarding data flow (found critical gap)
2. ✅ Created comprehensive database schema analysis
3. ✅ Designed enhanced schema with new fields
4. ✅ Ran database migration successfully
5. ✅ Verified all new columns and indexes created

**What's Next:**
1. Update Prisma schema file
2. Update webhook handler to save firstName, lastName
3. Update onboarding completion to save all profile data
4. Migrate existing user data from Clerk
5. Test complete flow

---

## 🚨 Critical Finding

**Issue:** User onboarding data (firstName, lastName, country, currency) stored ONLY in Clerk metadata, NOT in database!

**Risk:**
- 🚨 Data loss if Clerk has issues
- 🚨 Can't query users by demographics
- 🚨 Limited analytics capability
- 🚨 Performance issues (need Clerk API for user details)
- 🚨 Migration risk if we ever move away from Clerk

**Impact on UX:**
- ❌ Can't personalize greetings with first name
- ❌ Can't generate country-specific insights
- ❌ Can't do demographic analysis
- ❌ Slow queries for user profiles

---

## ✅ What's Been Completed

### 1. Database Migration ✅

**Files Created:**
- `prisma/migrations/add_user_profile_fields/migration.sql`
- `DATABASE_SCHEMA_ANALYSIS.md` (comprehensive analysis)
- `scripts/migrate-clerk-data-to-db.ts` (data migration script)

**Fields Added to `users` table:**
```sql
✅ firstName           TEXT
✅ lastName            TEXT  
✅ countryCode         VARCHAR(2)
✅ preferredCurrency   VARCHAR(3)
✅ locale              VARCHAR(10) DEFAULT 'id-ID'
✅ timezone            VARCHAR(50) DEFAULT 'Asia/Jakarta'
✅ phoneNumber         TEXT
✅ dateOfBirth         DATE
```

**Fields Added to `households` table:**
```sql
✅ countryCode   VARCHAR(2)
✅ timezone      VARCHAR(50) DEFAULT 'Asia/Jakarta'
✅ locale        VARCHAR(10) DEFAULT 'id-ID'
✅ description   TEXT
```

**Indexes Created:**
```sql
✅ users_firstName_idx
✅ users_lastName_idx
✅ users_countryCode_idx
✅ users_preferredCurrency_idx
✅ users_locale_idx
✅ households_countryCode_idx
✅ households_baseCurrency_idx
```

**Verification:**
```bash
psql -d permoney -c "\d users" | grep firstName
# firstName | text | | |

psql -d permoney -c "\d households" | grep countryCode  
# countryCode | character varying(2) | | |
```

---

## 📋 Implementation Steps Remaining

### Step 1: Update Prisma Schema ⏳

**File:** `prisma/schema.prisma`

**Update User Model:**
```prisma
model User {
  id                  String    @id @default(uuid()) @db.Uuid
  clerkId             String?   @unique
  email               String    @unique
  passwordHash        String?
  name                String
  
  // NEW: Profile fields from onboarding
  firstName           String?
  lastName            String?
  countryCode         String?   @db.VarChar(2)
  preferredCurrency   String?   @db.VarChar(3)
  locale              String?   @default("id-ID") @db.VarChar(10)
  timezone            String?   @default("Asia/Jakarta") @db.VarChar(50)
  phoneNumber         String?
  dateOfBirth         DateTime? @db.Date
  
  avatarUrl           String?
  isActive            Boolean   @default(true)
  emailVerified       Boolean   @default(false)
  lastLoginAt         DateTime?
  failedLoginAttempts Int       @default(0)
  lockedUntil         DateTime?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  // Relations...
  @@index([countryCode])
  @@index([firstName])
  @@index([lastName])
  @@index([preferredCurrency])
  @@index([locale])
  @@map("users")
}
```

**Update Household Model:**
```prisma
model Household {
  id           String   @id @default(uuid()) @db.Uuid
  name         String
  baseCurrency String   @default("IDR") @db.VarChar(3)
  
  // NEW: Location and preferences
  countryCode  String?  @db.VarChar(2)
  timezone     String?  @default("Asia/Jakarta") @db.VarChar(50)
  locale       String?  @default("id-ID") @db.VarChar(10)
  description  String?
  
  settings     Json     @default("{}")
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // Relations...
  @@index([countryCode])
  @@index([baseCurrency])
  @@map("households")
}
```

**After updating, run:**
```bash
npx prisma generate
```

### Step 2: Update Webhook Handler ⏳

**File:** `src/app/api/webhooks/clerk/route.ts`

**Update handleUserCreated:**
```typescript
async function handleUserCreated(data: any) {
  const clerkId = data.id;
  const email = data.email_addresses?.[0]?.email_address;
  const firstName = data.first_name || '';
  const lastName = data.last_name || '';
  const name = `${firstName} ${lastName}`.trim() || email.split('@')[0];
  const avatarUrl = data.image_url;
  const phoneNumber = data.phone_numbers?.[0]?.phone_number || null;

  await prisma.user.create({
    data: {
      clerkId,
      email,
      name,
      firstName,        // ✅ NEW: Save firstName
      lastName,         // ✅ NEW: Save lastName
      avatarUrl,
      phoneNumber,      // ✅ NEW: Save phoneNumber
      emailVerified: data.email_addresses?.[0]?.verification?.status === 'verified',
      lastLoginAt: new Date(),
    },
  });
}
```

**Update handleUserUpdated:**
```typescript
async function handleUserUpdated(data: any) {
  // ... existing code ...
  
  await prisma.user.upsert({
    where: { clerkId },
    update: {
      email,
      name,
      firstName,        // ✅ NEW
      lastName,         // ✅ NEW
      avatarUrl,
      phoneNumber,      // ✅ NEW
      emailVerified: data.email_addresses?.[0]?.verification?.status === 'verified',
      lastLoginAt: new Date(),
    },
    create: {
      // ... same as above
    },
  });
}
```

### Step 3: Update Onboarding Completion ⏳

**File:** `src/app/(onboarding)/onboarding/page.tsx`

**Update completeOnboarding function:**
```typescript
const completeOnboarding = async () => {
  // ... existing validation ...
  
  try {
    const values = form.getValues();
    const trimmedFirstName = values.firstName.trim();
    const trimmedLastName = values.lastName.trim();
    const trimmedHouseholdName = values.householdName.trim();
    const normalizedCountryCode = values.countryCode.trim().toUpperCase();
    const normalizedCurrencyCode = normalizeCurrencyCode(values.currencyCode);

    // Create/update household
    await ensureHousehold();

    // ✅ NEW: Save user profile data to database
    await fetch('/api/user/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        countryCode: normalizedCountryCode,
        preferredCurrency: normalizedCurrencyCode,
      }),
    });

    // ✅ NEW: Update household with country data
    await apiClient.updateHousehold(primaryHouseholdId, {
      name: trimmedHouseholdName,
      baseCurrency: normalizedCurrencyCode,
      countryCode: normalizedCountryCode,
    });

    // Update Clerk metadata (keep for backward compatibility)
    const metadata = {
      ...user.unsafeMetadata,
      onboardingComplete: true,
      primaryHouseholdId,
      onboardingData: {
        // ... existing structure
      },
    };

    await user.update({
      firstName: trimmedFirstName,
      lastName: trimmedLastName,
      unsafeMetadata: metadata,
    });

    await user.reload();
    router.replace("/dashboard");
  } catch (error) {
    // ... error handling
  }
};
```

### Step 4: Create User Profile API Endpoint ⏳

**File:** `src/app/api/user/profile/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, jsonResponse, handleApiError } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

/**
 * PUT /api/user/profile
 * Update user profile data
 */
export async function PUT(req: NextRequest) {
  try {
    const { userId } = await requireAuth();
    
    // Get user's database ID
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
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

    const locale = countryCode ? (localeMap[countryCode] || 'id-ID') : undefined;
    const timezone = countryCode ? (timezoneMap[countryCode] || 'Asia/Jakarta') : undefined;

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        firstName,
        lastName,
        countryCode,
        preferredCurrency,
        locale,
        timezone,
        phoneNumber,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        updatedAt: new Date(),
      },
    });

    return jsonResponse(updatedUser);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * GET /api/user/profile
 * Get user profile data
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
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return jsonResponse(user);
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Step 5: Run Data Migration Script ⏳

**Migrate existing users from Clerk to database:**

```bash
# Install ts-node if not already installed
npm install -D ts-node

# Run migration script
ts-node scripts/migrate-clerk-data-to-db.ts
```

**Expected Output:**
```
🔄 Starting Clerk to Database Migration
========================================

📊 Found 2 users to process

📝 Processing: hendripermana13@gmail.com (user_33Gj18...)
  ✅ Success: User data migrated
     - Name: Hendri Permana
     - Country: ID
     - Currency: IDR
     - Locale: id-ID
     - Timezone: Asia/Jakarta
  ✅ Household updated: Hendri Permana's Household

========================================
🎯 Migration Summary
========================================
✅ Successfully migrated: 2
⏭️  Skipped (up to date): 0
❌ Errors: 0
📊 Total processed: 2

✅ Migration completed successfully!
```

### Step 6: Test Complete Flow ⏳

**Test 1: Webhook (New User Sign Up)**
```
1. Sign up new user
2. Check logs:
   [Webhook] Creating user: user_xxx (email)
   [Webhook] ✅ User created successfully

3. Check database:
   SELECT "firstName", "lastName", "countryCode", "preferredCurrency"
   FROM users WHERE email = 'test@test.com';
   
   Expected: firstName and lastName populated from Clerk
```

**Test 2: Onboarding (Complete Flow)**
```
1. Complete onboarding
2. Fill Step 1: First name, Last name, Household name
3. Fill Step 2: Country ID, Currency IDR
4. Submit

5. Check database:
   SELECT u."firstName", u."lastName", u."countryCode", u."preferredCurrency",
          h."countryCode", h."baseCurrency"
   FROM users u
   JOIN household_members hm ON hm."userId" = u.id
   JOIN households h ON h.id = hm."householdId"
   WHERE u.email = 'test@test.com';
   
   Expected: All fields populated correctly
```

**Test 3: Profile API**
```bash
# Get profile
curl http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer $CLERK_TOKEN"

# Update profile  
curl -X PUT http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer $CLERK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "countryCode": "US",
    "preferredCurrency": "USD"
  }'
```

---

## 📊 Benefits After Implementation

### 1. Data Integrity ✅
```sql
-- All user data in our database
SELECT 
  u."firstName",
  u."lastName",
  u."countryCode",
  u."preferredCurrency",
  u."locale",
  u."timezone",
  h.name as household_name,
  h."baseCurrency"
FROM users u
JOIN household_members hm ON hm."userId" = u.id
JOIN households h ON h.id = hm."householdId"
WHERE u."isActive" = true;

-- No need to call Clerk API!
```

### 2. Rich Analytics ✅
```sql
-- User demographics
SELECT 
  "countryCode",
  COUNT(*) as user_count,
  AVG(EXTRACT(YEAR FROM AGE("dateOfBirth"))) as avg_age
FROM users
WHERE "isActive" = true
GROUP BY "countryCode"
ORDER BY user_count DESC;

-- Currency preferences
SELECT 
  "preferredCurrency",
  COUNT(*) as user_count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage
FROM users
WHERE "isActive" = true
GROUP BY "preferredCurrency";
```

### 3. Enhanced UX ✅
```typescript
// Personalized greeting
const user = await prisma.user.findUnique({
  where: { clerkId: userId },
});

return `Hi ${user.firstName || user.name}! 👋`;

// Country-specific insights
if (user.countryCode === 'ID') {
  // Show IDR-specific tips
} else if (user.countryCode === 'US') {
  // Show USD-specific tips
}

// Timezone-aware dates
const userTimezone = user.timezone || 'Asia/Jakarta';
const localDate = formatInTimeZone(date, userTimezone, 'PPP');
```

### 4. Better Performance ✅
```typescript
// Before: Need Clerk API call
const clerkUser = await clerkClient.users.getUser(clerkId);
const firstName = clerkUser.firstName; // Slow!

// After: Direct database query
const user = await prisma.user.findUnique({
  where: { clerkId },
  select: { firstName: true, lastName: true, countryCode: true },
});
// Fast!
```

---

## 🎯 Success Criteria

After implementation, we should have:

1. ✅ All user profile data stored in database
2. ✅ Webhook automatically saves firstName, lastName
3. ✅ Onboarding saves all profile data to database
4. ✅ Existing users migrated from Clerk metadata
5. ✅ New API endpoint for profile management
6. ✅ All database queries work without Clerk
7. ✅ Analytics queries return demographic data
8. ✅ Performance improved (no Clerk API calls)

---

## 📝 Next Steps for Boss

**Immediate:**
1. ✅ Review this implementation plan
2. ⏳ Approve Prisma schema update
3. ⏳ Approve webhook handler changes
4. ⏳ Approve onboarding flow changes

**After Approval:**
1. ⏳ I will implement all code changes
2. ⏳ Run migration script for existing users
3. ⏳ Test complete flow end-to-end
4. ⏳ Verify data integrity
5. ⏳ Deploy to production

---

## 🚨 Important Notes

**Data Migration:**
- Migration is **non-destructive** (ADD COLUMN only)
- Existing data remains intact
- New fields are nullable (won't break existing code)
- Can be rolled back if needed

**Backward Compatibility:**
- Clerk metadata still updated (for backup)
- Existing code still works (name field unchanged)
- Gradual migration possible
- No breaking changes

**Performance:**
- Database queries will be **faster**
- No Clerk API calls needed for user details
- Better caching possible
- Reduced API costs

---

**Status:** ✅ Database Migration Complete - Ready for Code Implementation  
**Created:** 2025-10-01  
**Author:** Droid (Factory AI)  
**Priority:** 🚨 HIGH - Critical for data integrity and UX
