#!/bin/bash

# Comprehensive Test Script for Clerk Integration
# Tests all authentication and onboarding flows

echo "🧪 Clerk Integration Test Suite"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track test results
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function for test results
test_result() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✓ PASS${NC}: $2"
    ((TESTS_PASSED++))
  else
    echo -e "${RED}✗ FAIL${NC}: $2"
    ((TESTS_FAILED++))
  fi
}

# Test 1: Check Environment Variables
echo "📋 Test 1: Environment Configuration"
echo "------------------------------------"

check_env_var() {
  if [ -n "$1" ]; then
    return 0
  else
    return 1
  fi
}

source .env 2>/dev/null

check_env_var "$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
test_result $? "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is set"

check_env_var "$CLERK_SECRET_KEY"
test_result $? "CLERK_SECRET_KEY is set"

check_env_var "$CLERK_WEBHOOK_SECRET"
test_result $? "CLERK_WEBHOOK_SECRET is set"

check_env_var "$NEXT_PUBLIC_CLERK_SIGN_IN_URL"
test_result $? "NEXT_PUBLIC_CLERK_SIGN_IN_URL is set"

check_env_var "$NEXT_PUBLIC_CLERK_SIGN_UP_URL"
test_result $? "NEXT_PUBLIC_CLERK_SIGN_UP_URL is set"

echo ""

# Test 2: Database Schema
echo "📋 Test 2: Database Schema"
echo "--------------------------"

# Check users table has clerkId column
DB_CHECK=$(psql -d permoney -t -A -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'clerkId';" 2>/dev/null)

if [ "$DB_CHECK" = "clerkId" ]; then
  test_result 0 "users.clerkId column exists"
else
  test_result 1 "users.clerkId column exists"
fi

# Check clerkId has unique constraint
UNIQUE_CHECK=$(psql -d permoney -t -A -c "SELECT constraint_name FROM information_schema.table_constraints WHERE table_name = 'users' AND constraint_name = 'users_clerkId_key';" 2>/dev/null)

if [ -n "$UNIQUE_CHECK" ]; then
  test_result 0 "users.clerkId has unique constraint"
else
  test_result 1 "users.clerkId has unique constraint"
fi

# Check clerkId index exists
INDEX_CHECK=$(psql -d permoney -t -A -c "SELECT indexname FROM pg_indexes WHERE tablename = 'users' AND indexname = 'users_clerkId_idx';" 2>/dev/null)

if [ -n "$INDEX_CHECK" ]; then
  test_result 0 "users.clerkId index exists"
else
  test_result 1 "users.clerkId index exists"
fi

echo ""

# Test 3: Required Files Exist
echo "📋 Test 3: Required Files"
echo "-------------------------"

check_file() {
  if [ -f "$1" ]; then
    return 0
  else
    return 1
  fi
}

check_file "src/app/api/webhooks/clerk/route.ts"
test_result $? "Webhook handler exists"

check_file "src/app/(public)/sign-in/[[...rest]]/page.tsx"
test_result $? "Sign-in page exists"

check_file "src/app/(public)/sign-up/[[...rest]]/page.tsx"
test_result $? "Sign-up page exists"

check_file "src/app/(onboarding)/onboarding/page.tsx"
test_result $? "Onboarding page exists"

check_file "src/middleware.ts"
test_result $? "Middleware exists"

check_file "src/hooks/use-auth.tsx"
test_result $? "Auth hook exists"

check_file "src/components/onboarding-check.tsx"
test_result $? "Onboarding check exists"

echo ""

# Test 4: Webhook Handler Code Quality
echo "📋 Test 4: Webhook Handler"
echo "--------------------------"

WEBHOOK_FILE="src/app/api/webhooks/clerk/route.ts"

# Check for signature verification
if grep -q "wh.verify" "$WEBHOOK_FILE"; then
  test_result 0 "Webhook signature verification implemented"
else
  test_result 1 "Webhook signature verification implemented"
fi

# Check for user.created handler
if grep -q "case 'user.created'" "$WEBHOOK_FILE"; then
  test_result 0 "user.created event handler exists"
else
  test_result 1 "user.created event handler exists"
fi

# Check for user.updated handler
if grep -q "case 'user.updated'" "$WEBHOOK_FILE"; then
  test_result 0 "user.updated event handler exists"
else
  test_result 1 "user.updated event handler exists"
fi

# Check for user.deleted handler
if grep -q "case 'user.deleted'" "$WEBHOOK_FILE"; then
  test_result 0 "user.deleted event handler exists"
else
  test_result 1 "user.deleted event handler exists"
fi

# Check for error handling
if grep -q "try {" "$WEBHOOK_FILE" && grep -q "catch" "$WEBHOOK_FILE"; then
  test_result 0 "Error handling implemented"
else
  test_result 1 "Error handling implemented"
fi

echo ""

# Test 5: Middleware Configuration
echo "📋 Test 5: Middleware Logic"
echo "---------------------------"

MIDDLEWARE_FILE="src/middleware.ts"

# Check for Clerk middleware import
if grep -q "clerkMiddleware" "$MIDDLEWARE_FILE"; then
  test_result 0 "Clerk middleware imported"
else
  test_result 1 "Clerk middleware imported"
fi

# Check for onboarding check
if grep -q "onboardingComplete" "$MIDDLEWARE_FILE"; then
  test_result 0 "Onboarding completion check exists"
else
  test_result 1 "Onboarding completion check exists"
fi

# Check for public routes matcher
if grep -q "isPublicRoute" "$MIDDLEWARE_FILE"; then
  test_result 0 "Public routes matcher exists"
else
  test_result 1 "Public routes matcher exists"
fi

echo ""

# Test 6: Next.js Configuration
echo "📋 Test 6: Next.js Config"
echo "-------------------------"

CONFIG_FILE="next.config.js"

# Check for image domains
if grep -q "remotePatterns" "$CONFIG_FILE"; then
  test_result 0 "Image remotePatterns configured"
else
  test_result 1 "Image remotePatterns configured"
fi

# Check for Clerk avatar domain
if grep -q "img.clerk.com" "$CONFIG_FILE"; then
  test_result 0 "Clerk image domain whitelisted"
else
  test_result 1 "Clerk image domain whitelisted"
fi

# Check for flag domain
if grep -q "flagcdn.com" "$CONFIG_FILE"; then
  test_result 0 "Flag CDN domain whitelisted"
else
  test_result 1 "Flag CDN domain whitelisted"
fi

# Check for ngrok domains
if grep -q "ngrok" "$CONFIG_FILE"; then
  test_result 0 "Ngrok domains whitelisted"
else
  test_result 1 "Ngrok domains whitelisted"
fi

echo ""

# Test 7: Database Data Integrity
echo "📋 Test 7: Database Integrity"
echo "------------------------------"

# Check for users with clerkId
USER_COUNT=$(psql -d permoney -t -A -c "SELECT COUNT(*) FROM users WHERE \"clerkId\" IS NOT NULL;" 2>/dev/null)

if [ -n "$USER_COUNT" ] && [ "$USER_COUNT" -gt 0 ]; then
  test_result 0 "Users with Clerk ID exist ($USER_COUNT users)"
else
  test_result 1 "Users with Clerk ID exist"
fi

# Check for orphaned users (no household)
ORPHAN_COUNT=$(psql -d permoney -t -A -c "SELECT COUNT(*) FROM users u WHERE u.\"clerkId\" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM household_members hm WHERE hm.\"userId\" = u.id);" 2>/dev/null)

if [ -n "$ORPHAN_COUNT" ]; then
  if [ "$ORPHAN_COUNT" -eq 0 ]; then
    test_result 0 "No orphaned users (all have households)"
  else
    echo -e "${YELLOW}⚠ WARNING${NC}: $ORPHAN_COUNT users without households"
    test_result 1 "No orphaned users (found $ORPHAN_COUNT)"
  fi
else
  test_result 1 "Orphaned users check"
fi

# Check for duplicate clerkIds
DUPLICATE_CHECK=$(psql -d permoney -t -A -c "SELECT COUNT(*) FROM (SELECT \"clerkId\", COUNT(*) FROM users WHERE \"clerkId\" IS NOT NULL GROUP BY \"clerkId\" HAVING COUNT(*) > 1) AS duplicates;" 2>/dev/null)

if [ -n "$DUPLICATE_CHECK" ] && [ "$DUPLICATE_CHECK" -eq 0 ]; then
  test_result 0 "No duplicate Clerk IDs"
else
  test_result 1 "No duplicate Clerk IDs (found $DUPLICATE_CHECK)"
fi

echo ""

# Test 8: TypeScript Compilation
echo "📋 Test 8: TypeScript Check"
echo "----------------------------"

# Run TypeScript type check
echo "Running tsc --noEmit (this may take a moment)..."
if npx tsc --noEmit 2>&1 | grep -q "error TS"; then
  test_result 1 "TypeScript compilation (errors found)"
else
  test_result 0 "TypeScript compilation"
fi

echo ""

# Final Results
echo "=========================================="
echo "🎯 Test Results Summary"
echo "=========================================="
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ All tests passed! Integration is healthy.${NC}"
  exit 0
else
  echo -e "${RED}❌ Some tests failed. Please review the output above.${NC}"
  exit 1
fi
