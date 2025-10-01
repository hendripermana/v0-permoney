# 🔄 Migration Guide - Existing Users to Clerk

This guide helps you migrate existing Permoney users to Clerk authentication system.

## 📋 Overview

When migrating from JWT-based authentication to Clerk, existing users need to be:
1. Synced to Clerk (create Clerk accounts)
2. Linked in database (connect Clerk ID to user record)
3. Household reconciliation (link users to their existing households)
4. Metadata update (mark onboarding as complete)

## 🎯 Migration Strategy

### Option A: Automatic Migration (Recommended)

Users create new Clerk accounts, and we automatically link them to existing data.

**Pros:**
- ✅ Users verify their identity
- ✅ More secure
- ✅ Email verification built-in
- ✅ Clerk manages password security

**Cons:**
- ⚠️ Users need to sign up again
- ⚠️ Requires user communication

**Steps:**

1. **Communicate with users** (send email notification):
   ```
   Subject: Important: Account Security Upgrade
   
   Hi [Name],
   
   We're upgrading Permoney's authentication system for better security and features.
   
   Action Required:
   1. Visit https://permoney.com/sign-up
   2. Sign up with the SAME email address: [user-email]
   3. Your existing data will be automatically linked
   
   Your data is safe and will be preserved.
   
   Best regards,
   Permoney Team
   ```

2. **Configure email matching** in webhook handler (already implemented):
   ```typescript
   // src/app/api/webhooks/clerk/route.ts
   // Automatically links by email when user signs up
   ```

3. **User signs up** with same email
4. **Webhook automatically**:
   - Creates user record with Clerk ID
   - Checks for existing data
   - Links to existing household if found
   - Updates metadata

### Option B: Manual Migration with Script

For each existing user, manually create Clerk account and sync.

**Use Case:** Small number of users, or VIP users requiring personal assistance.

**Steps:**

1. **Create Clerk account** for user (in Clerk Dashboard):
   - Go to Clerk Dashboard → Users
   - Click "Create user"
   - Enter user's email and basic info
   - Set temporary password
   - Copy the Clerk User ID (e.g., `user_2xxx...`)

2. **Run sync script**:
   ```bash
   ./scripts/sync-clerk-user.sh
   ```

3. **Follow prompts**:
   - Enter Clerk User ID
   - Enter user email (must match database)
   - Enter user full name
   - Confirm

4. **Script will**:
   - ✅ Link Clerk ID to database user
   - ✅ Find existing household (if user has accounts/transactions)
   - ✅ Create household membership
   - ✅ Display household ID for metadata update

5. **Update Clerk metadata**:
   - Go to Clerk Dashboard → Users → Select user
   - Click "Metadata" tab
   - In "Unsafe metadata", add:
     ```json
     {
       "onboardingComplete": true,
       "primaryHouseholdId": "uuid-from-script-output"
     }
     ```
   - Save

6. **Notify user**:
   - Send password reset email from Clerk
   - Inform them to set their new password

## 🔧 Detailed Migration Process

### Step 1: Identify Users to Migrate

Query database for users without Clerk ID:

```sql
-- Find users without Clerk ID
SELECT 
  id,
  email,
  name,
  "createdAt",
  "lastLoginAt"
FROM users
WHERE "clerkId" IS NULL
  AND "isActive" = true
ORDER BY "lastLoginAt" DESC NULLS LAST;
```

### Step 2: Check User's Household Status

For each user, check if they have existing data:

```sql
-- Check user's household and data
SELECT 
  u.id,
  u.email,
  u.name,
  COUNT(DISTINCT hm."householdId") as household_count,
  COUNT(DISTINCT a.id) as account_count,
  COUNT(DISTINCT t.id) as transaction_count
FROM users u
LEFT JOIN household_members hm ON hm."userId" = u.id
LEFT JOIN accounts a ON a."householdId" = hm."householdId"
LEFT JOIN transactions t ON t."householdId" = hm."householdId"
WHERE u.email = 'user@example.com'
GROUP BY u.id, u.email, u.name;
```

### Step 3: Run Migration for Each User

#### For Boss (hendripermana13@gmail.com)

Your case specifically:

1. **Current Status**:
   - ✅ User exists in database
   - ✅ Clerk account exists
   - ✅ User synced to database
   - ❌ Missing household membership (you ran script but need household link)

2. **Fix with Updated Script**:
   ```bash
   ./scripts/sync-clerk-user.sh
   
   # Enter:
   # Clerk ID: user_33Gj18iJKpaRmZo3xlqw2DPLokY
   # Email: hendripermana13@gmail.com
   # Name: Hendri Permana
   ```

3. **Script will**:
   - Check if user has existing accounts/transactions
   - Create household: "Hendri Permana's Household"
   - Add you as ADMIN
   - Output household ID

4. **Update Clerk Metadata**:
   ```json
   {
     "onboardingComplete": true,
     "primaryHouseholdId": "<household_id_from_script>",
     "onboardingData": {
       "completedAt": "2025-09-28T07:34:54.225Z",
       "profile": {
         "firstName": "Hendri",
         "lastName": "Permana",
         "countryCode": "ID",
         "currencyCode": "IDR"
       }
     }
   }
   ```

### Step 4: Verify Migration

After migration, verify each user:

```sql
-- Verify user is properly set up
SELECT 
  u.id,
  u."clerkId",
  u.email,
  u.name,
  hm.role,
  h.name as household_name,
  h."baseCurrency"
FROM users u
LEFT JOIN household_members hm ON hm."userId" = u.id
LEFT JOIN households h ON h.id = hm."householdId"
WHERE u."clerkId" = 'user_xxx'
LIMIT 1;
```

Expected result:
- ✅ User has clerkId
- ✅ User has household membership
- ✅ User is ADMIN of household
- ✅ Household has baseCurrency set

## 🚨 Common Migration Issues

### Issue 1: User Exists in DB but No Household

**Symptom:** User can login but forced to re-onboard

**Diagnosis:**
```sql
SELECT 
  u.id,
  u."clerkId",
  COUNT(hm.id) as membership_count
FROM users u
LEFT JOIN household_members hm ON hm."userId" = u.id
WHERE u."clerkId" = 'user_xxx'
GROUP BY u.id, u."clerkId";
-- membership_count should be > 0
```

**Fix:**
```bash
# Re-run sync script (it will detect existing user and create household)
./scripts/sync-clerk-user.sh
```

### Issue 2: User Has Multiple Households

**Symptom:** User has data in multiple households

**Diagnosis:**
```sql
SELECT 
  u.email,
  hm."householdId",
  h.name as household_name,
  hm.role,
  COUNT(DISTINCT a.id) as accounts,
  COUNT(DISTINCT t.id) as transactions
FROM users u
JOIN household_members hm ON hm."userId" = u.id
JOIN households h ON h.id = hm."householdId"
LEFT JOIN accounts a ON a."householdId" = h.id
LEFT JOIN transactions t ON t."householdId" = h.id
WHERE u."clerkId" = 'user_xxx'
GROUP BY u.email, hm."householdId", h.name, hm.role;
```

**Fix:**
- Identify primary household (most accounts/transactions)
- Update Clerk metadata with primary household ID
- Or: Let user choose in onboarding

### Issue 3: Duplicate Users (Same Email)

**Symptom:** Multiple user records with same email

**Diagnosis:**
```sql
SELECT 
  email,
  COUNT(*) as count,
  ARRAY_AGG("clerkId") as clerk_ids,
  ARRAY_AGG(id) as user_ids
FROM users
GROUP BY email
HAVING COUNT(*) > 1;
```

**Fix:**
```sql
-- Merge users manually
-- 1. Identify primary user (with clerkId or most recent)
-- 2. Update foreign keys to point to primary user
-- 3. Delete duplicate

-- Example:
UPDATE household_members 
SET "userId" = 'primary_user_id'
WHERE "userId" = 'duplicate_user_id';

-- Then delete duplicate
DELETE FROM users WHERE id = 'duplicate_user_id';
```

## 📊 Migration Monitoring

### Track Migration Progress

```sql
-- Migration status dashboard
SELECT 
  COUNT(*) as total_users,
  COUNT("clerkId") as clerk_synced,
  COUNT(*) - COUNT("clerkId") as pending_sync,
  COUNT(DISTINCT hm."householdId") as users_with_household
FROM users u
LEFT JOIN household_members hm ON hm."userId" = u.id
WHERE u."isActive" = true;
```

### Monitor Daily Active Users

```sql
-- Check login activity
SELECT 
  DATE("lastLoginAt") as login_date,
  COUNT(*) as user_count,
  COUNT("clerkId") as clerk_users,
  COUNT(*) - COUNT("clerkId") as legacy_users
FROM users
WHERE "lastLoginAt" > NOW() - INTERVAL '7 days'
GROUP BY DATE("lastLoginAt")
ORDER BY login_date DESC;
```

## ✅ Post-Migration Checklist

- [ ] All active users have Clerk IDs
- [ ] All users have household memberships
- [ ] Clerk metadata is updated for all users
- [ ] Users can login successfully
- [ ] Users can access their data (accounts, transactions)
- [ ] No duplicate user records
- [ ] Webhook is working for new users
- [ ] Old JWT authentication is disabled (if fully migrated)

## 🎯 Boss-Specific Fix

For your immediate issue (hendripermana13@gmail.com):

```bash
# 1. Run enhanced sync script
./scripts/sync-clerk-user.sh

# 2. When prompted, enter:
#    Clerk ID: user_33Gj18iJKpaRmZo3xlqw2DPLokY
#    Email: hendripermana13@gmail.com
#    Name: Hendri Permana

# 3. Note the household ID from output

# 4. Update Clerk metadata:
#    - Go to: https://dashboard.clerk.com
#    - Users → hendripermana13@gmail.com
#    - Metadata tab
#    - Unsafe metadata:
```

```json
{
  "onboardingComplete": true,
  "primaryHouseholdId": "<household_id_from_step_3>"
}
```

```bash
# 5. Try logging in again
#    Should go directly to dashboard
```

## 📞 Support

If migration fails:

1. **Check logs**: `npm run dev` and watch console
2. **Check database**: Verify user, household, and membership records
3. **Check Clerk**: Verify user exists and metadata is correct
4. **Re-run script**: Safe to run multiple times (upserts)
5. **Manual fix**: Use SQL queries to fix specific issues

---

**Last Updated:** 2025-09-30  
**Version:** 2.0.0
