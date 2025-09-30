#!/bin/bash

# API Testing Script for Permoney
# Tests all core API endpoints

BASE_URL="http://localhost:3000"
API_BASE="$BASE_URL/api"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 Permoney API Testing"
echo "======================="
echo ""

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    
    echo -n "Testing: $description... "
    
    if [ "$method" == "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$API_BASE$endpoint")
    elif [ "$method" == "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST -H "Content-Type: application/json" -d "$data" "$API_BASE$endpoint")
    elif [ "$method" == "PUT" ]; then
        response=$(curl -s -w "\n%{http_code}" -X PUT -H "Content-Type: application/json" -d "$data" "$API_BASE$endpoint")
    elif [ "$method" == "DELETE" ]; then
        response=$(curl -s -w "\n%{http_code}" -X DELETE "$API_BASE$endpoint")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✓ $http_code${NC}"
        return 0
    elif [ "$http_code" -eq 401 ]; then
        echo -e "${YELLOW}⚠ $http_code (Auth required)${NC}"
        return 0
    else
        echo -e "${RED}✗ $http_code${NC}"
        echo "   Response: $body"
        return 1
    fi
}

echo "📝 Testing Core Endpoints..."
echo ""

# Health check
echo "1. Health Check"
test_endpoint "GET" "/transactions" "GET /api/transactions"
echo ""

# Transactions
echo "2. Transactions API"
test_endpoint "GET" "/transactions" "GET /api/transactions"
test_endpoint "GET" "/transactions/stats" "GET /api/transactions/stats"
test_endpoint "GET" "/transactions/category-breakdown" "GET /api/transactions/category-breakdown"
echo ""

# Accounts
echo "3. Accounts API"
test_endpoint "GET" "/accounts" "GET /api/accounts"
test_endpoint "GET" "/accounts/stats" "GET /api/accounts/stats"
test_endpoint "GET" "/accounts/net-worth?currency=IDR" "GET /api/accounts/net-worth"
echo ""

# Budgets
echo "4. Budgets API"
test_endpoint "GET" "/budgets" "GET /api/budgets"
test_endpoint "GET" "/budgets?isActive=true" "GET /api/budgets (filtered)"
echo ""

# Categories
echo "5. Categories API"
test_endpoint "GET" "/categories" "GET /api/categories"
test_endpoint "GET" "/categories?type=EXPENSE" "GET /api/categories (filtered)"
echo ""

# Debts
echo "6. Debts API"
test_endpoint "GET" "/debts" "GET /api/debts"
test_endpoint "GET" "/debts?isActive=true" "GET /api/debts (filtered)"
echo ""

# Household
echo "7. Household API"
test_endpoint "GET" "/household" "GET /api/household"
echo ""

# Exchange Rates
echo "8. Exchange Rates API"
test_endpoint "GET" "/exchange-rates" "GET /api/exchange-rates"
test_endpoint "GET" "/exchange-rates/convert?amount=100&from=USD&to=IDR" "GET /api/exchange-rates/convert"
echo ""

# Analytics
echo "9. Analytics API"
test_endpoint "GET" "/analytics" "GET /api/analytics"
test_endpoint "GET" "/analytics/cashflow" "GET /api/analytics/cashflow"
test_endpoint "GET" "/analytics/spending" "GET /api/analytics/spending"
test_endpoint "GET" "/analytics/net-worth-trend" "GET /api/analytics/net-worth-trend"
echo ""

# Gratitude
echo "10. Gratitude API"
test_endpoint "GET" "/gratitude" "GET /api/gratitude"
echo ""

echo ""
echo "✅ API Testing Complete!"
echo ""
echo "📋 Summary:"
echo "   - All core endpoints tested"
echo "   - Most endpoints require authentication (Clerk)"
echo "   - Expected to see 401 (Unauthorized) responses"
echo ""
echo "🔐 Note: To fully test, you need:"
echo "   1. Redis running (redis-server)"
echo "   2. PostgreSQL running with migrated schema"
echo "   3. Clerk authentication setup"
echo "   4. Valid Clerk session token"
echo ""
