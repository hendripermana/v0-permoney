#!/bin/bash

# Script to manually create household for a user
# Usage: ./scripts/create-household-for-user.sh

echo "🏠 Create Household for User"
echo "============================="
echo ""

# Prompt for user email
echo "📝 Enter user email:"
read -p "   Email: " USER_EMAIL

if [ -z "$USER_EMAIL" ]; then
  echo "❌ Error: Email is required"
  exit 1
fi

# Get user details
echo ""
echo "🔍 Looking up user..."
USER_INFO=$(psql -d permoney -t -c "SELECT id, \"clerkId\", name FROM users WHERE email = '$USER_EMAIL';")

if [ -z "$USER_INFO" ]; then
  echo "❌ Error: User not found with email: $USER_EMAIL"
  exit 1
fi

USER_ID=$(echo $USER_INFO | awk '{print $1}')
CLERK_ID=$(echo $USER_INFO | awk '{print $2}')
USER_NAME=$(echo $USER_INFO | awk '{$1=$2=""; print $0}' | xargs)

echo "✅ User found:"
echo "   Name: $USER_NAME"
echo "   Clerk ID: $CLERK_ID"
echo ""

# Check if user already has household
EXISTING_HOUSEHOLD=$(psql -d permoney -t -c "SELECT COUNT(*) FROM household_members WHERE \"userId\" = '$USER_ID';")

if [ "$EXISTING_HOUSEHOLD" -gt 0 ]; then
  echo "⚠️  User already has household membership:"
  psql -d permoney -c "
    SELECT 
      h.id as household_id,
      h.name as household_name,
      hm.role,
      h.\"baseCurrency\"
    FROM household_members hm
    JOIN households h ON h.id = hm.\"householdId\"
    WHERE hm.\"userId\" = '$USER_ID';
  "
  echo ""
  read -p "❓ User already has household. Create another? (y/n): " CONFIRM
  if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "❌ Cancelled"
    exit 0
  fi
fi

# Prompt for household details
echo "📝 Enter household name:"
read -p "   Name (default: ${USER_NAME}'s Household): " HOUSEHOLD_NAME

if [ -z "$HOUSEHOLD_NAME" ]; then
  HOUSEHOLD_NAME="${USER_NAME}'s Household"
fi

echo ""
echo "📝 Enter base currency (3-letter code):"
echo "   Supported: IDR, USD, EUR, SGD, MYR"
read -p "   Currency (default: IDR): " CURRENCY

if [ -z "$CURRENCY" ]; then
  CURRENCY="IDR"
fi

# Confirm
echo ""
echo "📋 Summary:"
echo "   User: $USER_NAME ($USER_EMAIL)"
echo "   Household: $HOUSEHOLD_NAME"
echo "   Currency: $CURRENCY"
echo "   Role: ADMIN"
echo ""
read -p "❓ Create household? (y/n): " CONFIRM

if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
  echo "❌ Cancelled"
  exit 0
fi

# Create household and membership
echo ""
echo "🔄 Creating household..."

RESULT=$(psql -d permoney -t -A -c "
DO \$\$
DECLARE
  v_household_id UUID;
BEGIN
  -- Create household
  INSERT INTO households (id, name, \"baseCurrency\", settings, \"createdAt\", \"updatedAt\")
  VALUES (
    gen_random_uuid(),
    '$HOUSEHOLD_NAME',
    '$CURRENCY',
    '{}',
    NOW(),
    NOW()
  )
  RETURNING id INTO v_household_id;
  
  -- Add user as admin
  INSERT INTO household_members (\"id\", \"userId\", \"householdId\", role, permissions, \"joinedAt\")
  VALUES (gen_random_uuid(), '$USER_ID', v_household_id, 'ADMIN', '[]', NOW());
  
  -- Output household ID
  RAISE NOTICE 'HOUSEHOLD_ID:%', v_household_id;
END \$\$;
")

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Success! Household created"
  echo ""
  
  # Get household details
  echo "📊 Household Details:"
  psql -d permoney -c "
    SELECT 
      h.id as household_id,
      h.name,
      h.\"baseCurrency\",
      hm.role,
      h.\"createdAt\"
    FROM household_members hm
    JOIN households h ON h.id = hm.\"householdId\"
    WHERE hm.\"userId\" = '$USER_ID'
    ORDER BY h.\"createdAt\" DESC
    LIMIT 1;
  "
  
  # Extract household ID for metadata
  HOUSEHOLD_ID=$(psql -d permoney -t -A -c "
    SELECT h.id
    FROM household_members hm
    JOIN households h ON h.id = hm.\"householdId\"
    WHERE hm.\"userId\" = '$USER_ID'
    ORDER BY h.\"createdAt\" DESC
    LIMIT 1;
  ")
  
  echo ""
  echo "🎉 Done! Household created successfully."
  echo ""
  echo "⚠️  IMPORTANT: Update Clerk metadata for this user:"
  echo ""
  echo "   1. Go to: https://dashboard.clerk.com"
  echo "   2. Navigate to: Users → $USER_EMAIL"
  echo "   3. Click: 'Metadata' tab"
  echo "   4. In 'Unsafe metadata' section, add:"
  echo ""
  echo "   {"
  echo "     \"onboardingComplete\": true,"
  echo "     \"primaryHouseholdId\": \"$HOUSEHOLD_ID\""
  echo "   }"
  echo ""
  echo "   5. Click 'Save'"
  echo ""
  echo "📋 Quick copy (Clerk metadata):"
  echo "{\"onboardingComplete\":true,\"primaryHouseholdId\":\"$HOUSEHOLD_ID\"}"
  echo ""
else
  echo ""
  echo "❌ Error: Failed to create household"
  echo "   Please check database connection and try again"
  exit 1
fi
