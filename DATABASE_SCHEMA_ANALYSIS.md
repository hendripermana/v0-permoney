# 🔍 Database Schema Analysis - Onboarding Data Storage

## 🚨 Critical Finding: Data Loss Risk!

**Issue Discovered:** Onboarding data (firstName, lastName, country, currency preferences) are **ONLY stored in Clerk metadata**, NOT in our database!

---

## 📊 Current Data Flow Analysis

### What Happens During Onboarding:

```typescript
// Step 1: User fills form
firstName: "Hendri"
lastName: "Permana"
householdName: "Hendri Permana's Household"

// Step 2: User selects preferences
countryCode: "ID"
currencyCode: "IDR"
avatarFile: (optional)

// Step 3: On completion
// ✅ Household created in database:
await apiClient.createHousehold({
  name: "Hendri Permana's Household",
  baseCurrency: "IDR"
})

// ✅ Avatar uploaded to Clerk:
await user.setProfileImage({ file: avatarFile })

// ✅ User name updated in Clerk:
await user.update({
  firstName: "Hendri",
  lastName: "Permana",
  unsafeMetadata: { ... }
})

// ❌ BUT: firstName, lastName, country NOT saved to database!
// ❌ Only 'name' field synced (via webhook)
```

---

## 🔍 Current Schema Gaps

### Users Table (Current):
```sql
- id: UUID
- clerkId: TEXT ✅
- email: TEXT ✅
- name: TEXT ✅ (full name only, from Clerk)
- avatarUrl: TEXT ✅ (from Clerk)
- emailVerified: BOOLEAN ✅
- isActive: BOOLEAN ✅
- lastLoginAt: TIMESTAMP ✅
- createdAt: TIMESTAMP ✅
- updatedAt: TIMESTAMP ✅

❌ MISSING:
- firstName (separate field)
- lastName (separate field)
- countryCode (user's country preference)
- preferredCurrency (user's currency preference)
- locale (for localization)
- timezone (for date/time display)
```

### Households Table (Current):
```sql
- id: UUID ✅
- name: TEXT ✅
- baseCurrency: VARCHAR(3) ✅
- settings: JSONB ✅
- createdAt: TIMESTAMP ✅
- updatedAt: TIMESTAMP ✅

❌ MISSING:
- countryCode (household's primary country)
- timezone (household's timezone)
- locale (household's preferred locale)
```

---

## 🎯 Data Storage Analysis

### Where Data Is Currently Stored:

| Data Field | Clerk | Database | Status |
|------------|-------|----------|--------|
| **firstName** | ✅ Clerk.user.firstName | ❌ | 🚨 **CRITICAL** |
| **lastName** | ✅ Clerk.user.lastName | ❌ | 🚨 **CRITICAL** |
| **Full Name** | ✅ Clerk.user.fullName | ✅ users.name | ✅ Good |
| **Email** | ✅ Clerk.user.email | ✅ users.email | ✅ Good |
| **Avatar** | ✅ Clerk.user.imageUrl | ✅ users.avatarUrl | ✅ Good |
| **Country Code** | ✅ Clerk.metadata | ❌ | 🚨 **CRITICAL** |
| **Currency Pref** | ✅ Clerk.metadata | ❌ | 🚨 **CRITICAL** |
| **Household Name** | ✅ Clerk.metadata | ✅ households.name | ✅ Good |
| **Base Currency** | ✅ Clerk.metadata | ✅ households.baseCurrency | ✅ Good |

### Risk Assessment:

**🚨 HIGH RISK:**
1. **Data Dependency on Clerk:** If Clerk has issues, we lose user profile data
2. **No Database Queries:** Can't filter/search users by country or currency
3. **Analytics Limited:** Can't generate insights based on user demographics
4. **No Backup:** If Clerk metadata is lost, profile data is gone
5. **Migration Difficult:** Moving away from Clerk would lose this data

**Impact on User Experience:**
- ❌ Can't personalize based on country/currency without Clerk API call
- ❌ Can't generate country-specific insights
- ❌ Can't do demographic analysis
- ❌ Slow queries (need Clerk API for user details)
- ❌ No offline capability

---

## 💡 Recommended Schema Improvements

### 1. Enhanced Users Table

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS "firstName" TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "lastName" TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "countryCode" VARCHAR(2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS "preferredCurrency" VARCHAR(3);
ALTER TABLE users ADD COLUMN IF NOT EXISTS "locale" VARCHAR(10) DEFAULT 'id-ID';
ALTER TABLE users ADD COLUMN IF NOT EXISTS "timezone" VARCHAR(50) DEFAULT 'Asia/Jakarta';
ALTER TABLE users ADD COLUMN IF NOT EXISTS "phoneNumber" TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "dateOfBirth" DATE;

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS "users_countryCode_idx" ON users("countryCode");
CREATE INDEX IF NOT EXISTS "users_preferredCurrency_idx" ON users("preferredCurrency");
CREATE INDEX IF NOT EXISTS "users_locale_idx" ON users("locale");
```

### 2. Enhanced Households Table

```sql
ALTER TABLE households ADD COLUMN IF NOT EXISTS "countryCode" VARCHAR(2);
ALTER TABLE households ADD COLUMN IF NOT EXISTS "timezone" VARCHAR(50) DEFAULT 'Asia/Jakarta';
ALTER TABLE households ADD COLUMN IF NOT EXISTS "locale" VARCHAR(10) DEFAULT 'id-ID';
ALTER TABLE households ADD COLUMN IF NOT EXISTS "description" TEXT;

-- Add indexes
CREATE INDEX IF NOT EXISTS "households_countryCode_idx" ON households("countryCode");
CREATE INDEX IF NOT EXISTS "households_baseCurrency_idx" ON households("baseCurrency");
```

### 3. New User Preferences Table (Optional, for future)

```sql
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "preferenceKey" TEXT NOT NULL,
  "preferenceValue" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE("userId", "preferenceKey")
);

CREATE INDEX "user_preferences_userId_idx" ON user_preferences("userId");
```

---

## 🔄 Updated Data Flow (Proposed)

### Enhanced Webhook Handler:

```typescript
async function handleUserCreated(data: any) {
  const clerkId = data.id;
  const email = data.email_addresses?.[0]?.email_address;
  const firstName = data.first_name || '';
  const lastName = data.last_name || '';
  const name = `${firstName} ${lastName}`.trim() || email.split('@')[0];
  const avatarUrl = data.image_url;
  const phoneNumber = data.phone_numbers?.[0]?.phone_number;

  await prisma.user.create({
    data: {
      clerkId,
      email,
      name,
      firstName,        // ✅ NEW
      lastName,         // ✅ NEW
      avatarUrl,
      phoneNumber,      // ✅ NEW
      emailVerified: data.email_addresses?.[0]?.verification?.status === 'verified',
      lastLoginAt: new Date(),
    },
  });
}
```

### Enhanced Onboarding Completion:

```typescript
// After creating household, save user preferences to database
await prisma.user.update({
  where: { clerkId: user.id },
  data: {
    firstName: trimmedFirstName,          // ✅ Save to DB
    lastName: trimmedLastName,            // ✅ Save to DB
    countryCode: normalizedCountryCode,   // ✅ Save to DB
    preferredCurrency: normalizedCurrencyCode, // ✅ Save to DB
    locale: getLocaleFromCountry(normalizedCountryCode), // ✅ NEW
    timezone: getTimezoneFromCountry(normalizedCountryCode), // ✅ NEW
  },
});

// Also save household country
await prisma.household.update({
  where: { id: primaryHouseholdId },
  data: {
    countryCode: normalizedCountryCode,   // ✅ Save to DB
    locale: getLocaleFromCountry(normalizedCountryCode), // ✅ NEW
    timezone: getTimezoneFromCountry(normalizedCountryCode), // ✅ NEW
  },
});
```

---

## 📈 Benefits of Enhanced Schema

### 1. **Data Integrity & Reliability**
- ✅ User data persists in our database (not dependent on Clerk)
- ✅ Can query user data without Clerk API calls
- ✅ Backup and recovery possible
- ✅ Migration-friendly architecture

### 2. **Better Analytics & Insights**
```sql
-- User demographics
SELECT "countryCode", COUNT(*) as user_count
FROM users
WHERE "isActive" = true
GROUP BY "countryCode"
ORDER BY user_count DESC;

-- Currency distribution
SELECT "preferredCurrency", COUNT(*) as user_count
FROM users
WHERE "isActive" = true
GROUP BY "preferredCurrency";

-- Household by country
SELECT h."countryCode", COUNT(*) as household_count,
       AVG(account_count) as avg_accounts
FROM households h
LEFT JOIN (
  SELECT "householdId", COUNT(*) as account_count
  FROM accounts
  GROUP BY "householdId"
) a ON a."householdId" = h.id
GROUP BY h."countryCode";
```

### 3. **Enhanced User Experience**
- ✅ Personalized greetings with first name
- ✅ Country-specific insights and tips
- ✅ Currency-specific formatting
- ✅ Timezone-aware date/time display
- ✅ Localized content based on country

### 4. **Advanced Features Enabled**
- ✅ Search users by name (firstName/lastName separately)
- ✅ Filter by country/currency
- ✅ Demographic reports
- ✅ Country-specific features
- ✅ Multi-language support (based on locale)
- ✅ Timezone-aware notifications

### 5. **Performance Improvements**
- ✅ No need to call Clerk API for user details
- ✅ Faster database queries
- ✅ Reduced API costs (fewer Clerk API calls)
- ✅ Better caching possibilities

---

## 🎯 Implementation Priority

### Priority 1: CRITICAL (Do Immediately)
1. ✅ Add firstName, lastName to users table
2. ✅ Add countryCode, preferredCurrency to users table
3. ✅ Update webhook handler to save these fields
4. ✅ Update onboarding completion to save to database
5. ✅ Migrate existing user data from Clerk to database

### Priority 2: HIGH (Do Soon)
1. ✅ Add countryCode to households table
2. ✅ Add timezone, locale to users and households
3. ✅ Update all queries to use database fields
4. ✅ Add indexes for performance

### Priority 3: MEDIUM (Nice to Have)
1. ⏳ Add phoneNumber, dateOfBirth to users
2. ⏳ Create user_preferences table
3. ⏳ Add household description field
4. ⏳ Implement preference management UI

---

## 🔄 Migration Strategy

### Step 1: Add Database Fields (No Breaking Changes)
```sql
-- Run migration
ALTER TABLE users ADD COLUMN "firstName" TEXT;
ALTER TABLE users ADD COLUMN "lastName" TEXT;
ALTER TABLE users ADD COLUMN "countryCode" VARCHAR(2);
ALTER TABLE users ADD COLUMN "preferredCurrency" VARCHAR(3);
ALTER TABLE users ADD COLUMN "locale" VARCHAR(10) DEFAULT 'id-ID';
ALTER TABLE users ADD COLUMN "timezone" VARCHAR(50) DEFAULT 'Asia/Jakarta';

ALTER TABLE households ADD COLUMN "countryCode" VARCHAR(2);
ALTER TABLE households ADD COLUMN "timezone" VARCHAR(50) DEFAULT 'Asia/Jakarta';
ALTER TABLE households ADD COLUMN "locale" VARCHAR(10) DEFAULT 'id-ID';

-- Add indexes
CREATE INDEX "users_countryCode_idx" ON users("countryCode");
CREATE INDEX "users_preferredCurrency_idx" ON users("preferredCurrency");
CREATE INDEX "households_countryCode_idx" ON households("countryCode");
```

### Step 2: Update Webhook Handler
- Modify handleUserCreated to save firstName, lastName
- Modify handleUserUpdated to sync firstName, lastName

### Step 3: Update Onboarding Flow
- Save countryCode, preferredCurrency to database on completion
- Save household countryCode

### Step 4: Migrate Existing Users
```typescript
// Migration script to sync from Clerk to database
async function migrateUserDataFromClerk() {
  const users = await prisma.user.findMany({
    where: { clerkId: { not: null } }
  });

  for (const user of users) {
    try {
      // Get data from Clerk
      const clerkUser = await clerkClient.users.getUser(user.clerkId);
      const metadata = clerkUser.unsafeMetadata as any;

      // Update database
      await prisma.user.update({
        where: { id: user.id },
        data: {
          firstName: clerkUser.firstName || null,
          lastName: clerkUser.lastName || null,
          countryCode: metadata?.onboardingData?.profile?.countryCode || null,
          preferredCurrency: metadata?.onboardingData?.profile?.currencyCode || null,
        },
      });

      console.log(`✅ Migrated user: ${user.email}`);
    } catch (error) {
      console.error(`❌ Failed to migrate user ${user.email}:`, error);
    }
  }
}
```

### Step 5: Update Application Code
- Use database fields instead of Clerk metadata
- Update all user profile displays
- Update all queries

---

## 📊 Impact Assessment

### Current State:
- ❌ Critical user data only in Clerk
- ❌ Limited analytics capability
- ❌ Slow user queries (need Clerk API)
- ❌ Migration risk
- ❌ No demographic insights

### After Implementation:
- ✅ All user data in database (with Clerk as backup)
- ✅ Rich analytics and insights
- ✅ Fast database queries
- ✅ Easy migration path
- ✅ Comprehensive demographic data
- ✅ Better user experience
- ✅ Production-ready architecture

---

## 🚀 Recommended Action Plan

### Immediate (Today):
1. ✅ Create migration SQL script
2. ✅ Update Prisma schema
3. ✅ Run migration on development database
4. ✅ Update webhook handler
5. ✅ Update onboarding completion handler

### Short Term (This Week):
1. ✅ Test complete flow with new fields
2. ✅ Migrate existing users data
3. ✅ Update all queries to use database
4. ✅ Add validation for new fields
5. ✅ Deploy to production

### Long Term (Next Sprint):
1. ⏳ Build analytics dashboard using new fields
2. ⏳ Implement country-specific features
3. ⏳ Add multi-language support
4. ⏳ Build demographic reports
5. ⏳ Implement advanced personalization

---

## 💬 Conclusion

**Critical Issue Found:** User onboarding data (firstName, lastName, country, currency) are stored ONLY in Clerk metadata, creating:
- 🚨 Data loss risk
- 🚨 Limited analytics capability
- 🚨 Performance issues
- 🚨 Migration challenges

**Recommendation:** Immediately implement enhanced schema to store all user profile data in database for:
- ✅ Data integrity and reliability
- ✅ Better analytics and insights
- ✅ Enhanced user experience
- ✅ Production-ready architecture
- ✅ Future-proof design

**Status:** Ready to implement migration script and schema updates.

---

**Analysis Date:** 2025-10-01  
**Analyzed By:** Droid (Factory AI)  
**Priority:** 🚨 CRITICAL - Immediate Action Required
