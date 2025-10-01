#!/bin/bash

# Enhanced Clerk User Sync Script with Household Reconciliation
# Usage: ./scripts/sync-clerk-user.sh

echo "🔄 Enhanced Clerk User Sync Script"
echo "==================================="
echo ""

# Prompt for Clerk User ID
echo "📝 Enter Clerk User ID (from Clerk Dashboard → Users):"
echo "   Format: user_2xxxxxxxxxxxxx"
read -p "   Clerk User ID: " CLERK_ID

if [ -z "$CLERK_ID" ]; then
  echo "❌ Error: Clerk User ID is required"
  exit 1
fi

# Prompt for email
echo ""
echo "📝 Enter user email:"
read -p "   Email: " USER_EMAIL

if [ -z "$USER_EMAIL" ]; then
  echo "❌ Error: Email is required"
  exit 1
fi

# Prompt for name
echo ""
echo "📝 Enter user full name:"
read -p "   Name: " USER_NAME

if [ -z "$USER_NAME" ]; then
  echo "❌ Error: Name is required"
  exit 1
fi

# Confirm
echo ""
echo "📋 Summary:"
echo "   Clerk ID: $CLERK_ID"
echo "   Email: $USER_EMAIL"
echo "   Name: $USER_NAME"
echo ""
read -p "❓ Confirm and sync user? (y/n): " CONFIRM

if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
  echo "❌ Cancelled"
  exit 0
fi

# Run database operations
echo ""
echo "🔄 Syncing user to database..."

# Use psql with connection from .env
psql -d permoney <<EOF
-- Step 1: Upsert user
INSERT INTO users (
  id, 
  "clerkId", 
  email, 
  name, 
  "isActive", 
  "emailVerified", 
  "createdAt", 
  "updatedAt"
)
VALUES (
  gen_random_uuid(),
  '$CLERK_ID',
  '$USER_EMAIL',
  '$USER_NAME',
  true,
  true,
  NOW(),
  NOW()
)
ON CONFLICT ("clerkId") DO UPDATE
SET 
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  "updatedAt" = NOW()
RETURNING id;

-- Step 2: Find or create household for existing users with data
DO \$\$
DECLARE
  v_user_id UUID;
  v_household_id UUID;
  v_household_count INT;
BEGIN
  -- Get user ID
  SELECT id INTO v_user_id FROM users WHERE "clerkId" = '$CLERK_ID';
  
  -- Check if user already has any household membership
  SELECT COUNT(*) INTO v_household_count 
  FROM household_members 
  WHERE "userId" = v_user_id;
  
  IF v_household_count = 0 THEN
    -- Check if user has existing accounts (indicates old user)
    IF EXISTS (
      SELECT 1 FROM accounts 
      WHERE "createdBy" = v_user_id 
         OR "updatedBy" = v_user_id
      LIMIT 1
    ) THEN
      -- Old user with data: create household and link
      INSERT INTO households (id, name, "baseCurrency", settings, "createdAt", "updatedAt")
      VALUES (
        gen_random_uuid(),
        '$USER_NAME''s Household',
        'IDR',
        '{}',
        NOW(),
        NOW()
      )
      RETURNING id INTO v_household_id;
      
      -- Add user as admin
      INSERT INTO household_members ("id", "userId", "householdId", role, permissions, "joinedAt")
      VALUES (gen_random_uuid(), v_user_id, v_household_id, 'ADMIN', '[]', NOW());
      
      RAISE NOTICE 'Created household for existing user: %', v_household_id;
    ELSE
      RAISE NOTICE 'New user - will complete onboarding flow';
    END IF;
  ELSE
    RAISE NOTICE 'User already has household membership';
  END IF;
END \$\$;
EOF

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Success! User synced to database"
  echo ""
  echo "📊 User Details:"
  psql -d permoney -c "SELECT \"clerkId\", email, name, \"createdAt\" FROM users WHERE \"clerkId\" = '$CLERK_ID';"
  echo ""
  echo "📊 Household Membership:"
  psql -d permoney -c "
    SELECT 
      hm.role,
      h.name as household_name,
      h.\"baseCurrency\",
      hm.\"joinedAt\"
    FROM household_members hm
    JOIN households h ON h.id = hm.\"householdId\"
    JOIN users u ON u.id = hm.\"userId\"
    WHERE u.\"clerkId\" = '$CLERK_ID';
  "
  echo ""
  echo "🎉 Done! User can now login."
  echo ""
  echo "⚠️  Important: If user has existing household, you MUST update Clerk metadata:"
  echo "   1. Go to Clerk Dashboard → Users → Select user"
  echo "   2. Click 'Metadata' tab"
  echo "   3. In 'Unsafe metadata', add:"
  echo "      {"
  echo "        \"onboardingComplete\": true,"
  echo "        \"primaryHouseholdId\": \"<household_id_from_above>\""
  echo "      }"
else
  echo ""
  echo "❌ Error: Failed to sync user"
  echo "   Please check database connection and try again"
  exit 1
fi
