# 🔐 Clerk Setup Guide - Permoney

This guide explains how to set up Clerk authentication for Permoney, including webhook configuration for automatic user synchronization.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Clerk Dashboard Setup](#clerk-dashboard-setup)
3. [Webhook Configuration](#webhook-configuration)
4. [Environment Variables](#environment-variables)
5. [Syncing Existing Users](#syncing-existing-users)
6. [Testing the Setup](#testing-the-setup)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

- Clerk account (sign up at https://clerk.com)
- Permoney application running locally or deployed
- PostgreSQL database set up and running
- Node.js and npm installed

## Clerk Dashboard Setup

### 1. Create a Clerk Application

1. Go to https://dashboard.clerk.com
2. Click "Add application"
3. Choose your application name (e.g., "Permoney")
4. Select "Email & Password" as authentication method
5. Click "Create application"

### 2. Get API Keys

1. In your Clerk dashboard, go to "API Keys"
2. Copy the following keys:
   - **Publishable Key** (starts with `pk_test_` or `pk_live_`)
   - **Secret Key** (starts with `sk_test_` or `sk_live_`)

### 3. Configure Redirect URLs

1. Go to "Paths" in Clerk dashboard
2. Set the following paths:
   - **Sign-in**: `/sign-in`
   - **Sign-up**: `/sign-up`
   - **After sign-in**: `/onboarding`
   - **After sign-up**: `/onboarding`

## Webhook Configuration

Webhooks are crucial for automatic user synchronization. When a user signs up or updates their profile in Clerk, the webhook will automatically create/update the user in your database.

### 1. Create Webhook Endpoint

1. In Clerk dashboard, go to "Webhooks"
2. Click "Add Endpoint"
3. Enter your webhook URL:
   - **Local Development**: Use ngrok or similar tool
     ```bash
     # Install ngrok
     brew install ngrok  # macOS
     
     # Start ngrok tunnel
     ngrok http 3000
     
     # Your webhook URL will be:
     # https://your-random-subdomain.ngrok.io/api/webhooks/clerk
     ```
   - **Production**: `https://yourdomain.com/api/webhooks/clerk`

### 2. Subscribe to Events

Select the following events:
- ✅ `user.created` (when new user signs up)
- ✅ `user.updated` (when user updates profile)
- ✅ `user.deleted` (when user is deleted)

### 3. Get Webhook Secret

1. After creating the webhook, copy the **Signing Secret** (starts with `whsec_`)
2. You'll need this for your environment variables

## Environment Variables

Add the following to your `.env` file:

```env
# ============================================================================
# CLERK AUTHENTICATION
# ============================================================================
# Get these from https://dashboard.clerk.com → API Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_your-clerk-publishable-key"
CLERK_SECRET_KEY="sk_test_your-clerk-secret-key"

# Clerk Webhook Secret (from Webhooks section)
CLERK_WEBHOOK_SECRET="whsec_your-webhook-secret"

# Clerk Paths (customize if needed)
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/onboarding"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/onboarding"
```

## Syncing Existing Users

If you have existing users in your database (from before Clerk migration), use the sync script:

### Manual Sync Script

```bash
# Run the sync script
./scripts/sync-clerk-user.sh

# Follow the prompts:
# 1. Enter Clerk User ID (from Clerk Dashboard → Users)
# 2. Enter user email
# 3. Enter user full name
# 4. Confirm
```

The script will:
- ✅ Create/update user in database
- ✅ Check if user has existing data (accounts, transactions)
- ✅ Create household if user has existing data
- ✅ Link user to household as ADMIN

### Update Clerk Metadata (Important!)

After syncing, you MUST update the user's metadata in Clerk:

1. Go to Clerk Dashboard → Users → Select the user
2. Click "Metadata" tab
3. In "Unsafe metadata" section, add:

```json
{
  "onboardingComplete": true,
  "primaryHouseholdId": "uuid-from-sync-script-output"
}
```

4. Click "Save"

## Testing the Setup

### Test 1: New User Sign Up

1. Start your application:
   ```bash
   npm run dev
   ```

2. Navigate to `/sign-up`
3. Create a new account
4. After successful sign up:
   - ✅ Should redirect to `/onboarding` (not `/dashboard`)
   - ✅ Should see onboarding steps
   - ✅ Complete all onboarding steps
   - ✅ Should redirect to `/dashboard`

5. Check database:
   ```sql
   -- User should be created
   SELECT * FROM users WHERE "clerkId" = 'user_xxx';
   
   -- Household should be created
   SELECT * FROM households WHERE id IN (
     SELECT "householdId" FROM household_members WHERE "userId" = 'user_uuid'
   );
   
   -- User should be household admin
   SELECT * FROM household_members WHERE "userId" = 'user_uuid';
   ```

### Test 2: Existing User Login

1. Login with existing user credentials
2. Should redirect to:
   - ✅ `/dashboard` if onboarding complete
   - ✅ `/onboarding` if onboarding incomplete

### Test 3: Webhook Verification

Check your application logs for webhook events:

```bash
# You should see logs like:
Clerk webhook event received: user.created
Creating user in database: user_xxx (email@example.com)
User created successfully: user_xxx
```

## Troubleshooting

### Issue: Webhook Not Receiving Events

**Solution:**
1. Check webhook URL is correct in Clerk dashboard
2. Verify `CLERK_WEBHOOK_SECRET` in `.env`
3. For local development, ensure ngrok is running
4. Check webhook logs in Clerk dashboard

### Issue: User Forced to Re-onboard After Login

**Root Cause:** User exists in Clerk but not in database, or missing household membership.

**Solution:**
1. Run sync script: `./scripts/sync-clerk-user.sh`
2. Update Clerk metadata with household ID
3. Ensure user has household membership in database

### Issue: 400 Bad Request on Household API

**Root Cause:** User not synced to database yet.

**Solution:**
1. Verify webhook is working
2. Check user exists in database:
   ```sql
   SELECT * FROM users WHERE "clerkId" = 'user_xxx';
   ```
3. If not exists, manually sync or wait for webhook

### Issue: Image Loading Error (flagcdn.com)

**Root Cause:** Next.js Image component requires domain whitelist.

**Solution:** Already fixed in `next.config.js`:
```javascript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'flagcdn.com',
      pathname: '/w80/**',
    },
    // ... other domains
  ],
}
```

### Issue: Redirect Loop Between Dashboard and Onboarding

**Root Cause:** Inconsistent onboarding state between Clerk metadata and database.

**Solution:**
1. Check Clerk metadata:
   ```json
   {
     "onboardingComplete": true,
     "primaryHouseholdId": "uuid"
   }
   ```
2. Verify household exists:
   ```sql
   SELECT * FROM households WHERE id = 'uuid';
   ```
3. Verify household membership:
   ```sql
   SELECT * FROM household_members 
   WHERE "householdId" = 'uuid' AND "userId" = 'user_uuid';
   ```

## Architecture Overview

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     New User Sign Up                        │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
              ┌──────────────────────┐
              │  Clerk Sign Up Page   │
              └──────────────────────┘
                          │
                          ▼
              ┌──────────────────────┐
              │   User Created in     │
              │      Clerk            │
              └──────────────────────┘
                          │
                          ▼
              ┌──────────────────────┐
              │  Webhook Triggered    │
              │  (user.created)       │
              └──────────────────────┘
                          │
                          ▼
              ┌──────────────────────┐
              │  User Auto-Synced to  │
              │     Database          │
              └──────────────────────┘
                          │
                          ▼
              ┌──────────────────────┐
              │  Redirect to          │
              │  /onboarding          │
              └──────────────────────┘
                          │
                          ▼
              ┌──────────────────────┐
              │  User Completes       │
              │  Onboarding Steps     │
              └──────────────────────┘
                          │
                          ▼
              ┌──────────────────────┐
              │  Household Created    │
              │  Metadata Updated     │
              └──────────────────────┘
                          │
                          ▼
              ┌──────────────────────┐
              │  Redirect to          │
              │  /dashboard           │
              └──────────────────────┘
```

### Existing User Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Existing User Login                      │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
              ┌──────────────────────┐
              │  Clerk Sign In Page   │
              └──────────────────────┘
                          │
                          ▼
              ┌──────────────────────┐
              │  Check Clerk Metadata │
              │  onboardingComplete?  │
              └──────────────────────┘
                          │
                 ┌────────┴────────┐
                 │                 │
            Yes  │                 │  No
                 │                 │
                 ▼                 ▼
      ┌─────────────────┐  ┌─────────────────┐
      │  Redirect to     │  │  Redirect to     │
      │  /dashboard      │  │  /onboarding     │
      └─────────────────┘  └─────────────────┘
```

## Best Practices

1. **Always use webhooks** for user synchronization (don't rely on manual sync)
2. **Test webhook locally** with ngrok before deploying
3. **Monitor webhook logs** in Clerk dashboard
4. **Keep Clerk metadata in sync** with database state
5. **Use environment-specific webhook URLs** (dev vs production)
6. **Handle webhook failures gracefully** with retry logic
7. **Validate webhook signatures** for security

## Support

If you encounter issues:

1. Check application logs for errors
2. Verify environment variables are set correctly
3. Test webhook with Clerk dashboard "Test" button
4. Check database for user and household data
5. Review Clerk documentation: https://clerk.com/docs

---

**Last Updated:** 2025-09-30  
**Version:** 2.0.0
