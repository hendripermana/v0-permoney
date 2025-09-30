#!/bin/bash

# Quick script to sync existing Clerk user to database
# Usage: ./scripts/sync-clerk-user.sh

echo "🔄 Clerk User Sync Script"
echo "=========================="
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
read -p "❓ Confirm and create user? (y/n): " CONFIRM

if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
  echo "❌ Cancelled"
  exit 0
fi

# Insert user
echo ""
echo "🔄 Creating user in database..."

psql -d permoney <<EOF
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
  "updatedAt" = NOW();
EOF

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Success! User created/updated in database"
  echo ""
  echo "📊 Verify user:"
  psql -d permoney -c "SELECT \"clerkId\", email, name, \"createdAt\" FROM users WHERE \"clerkId\" = '$CLERK_ID';"
  echo ""
  echo "🎉 Done! Boss can now login!"
else
  echo ""
  echo "❌ Error: Failed to create user"
  echo "   Please check database connection and try again"
  exit 1
fi
