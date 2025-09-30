# 🧪 Testing Guide - Permoney API

## Prerequisites

Before testing, make sure you have:

### 1. **PostgreSQL Running**
```bash
# Check if PostgreSQL is running
pg_isready

# If not running, start it:
# macOS (Homebrew)
brew services start postgresql@14

# Ubuntu/Linux
sudo systemctl start postgresql

# Windows
# Start PostgreSQL service from Services app
```

### 2. **Redis Running** (REQUIRED!)
```bash
# Start Redis
redis-server

# Or in background
redis-server --daemonize yes

# Check if running
redis-cli ping
# Should return: PONG
```

### 3. **Database Setup**
```bash
cd /Users/p/Project/v0-permoney

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate:dev

# Optional: Seed database with test data
npm run db:seed
```

### 4. **Environment Variables**
Make sure `.env` file has:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/permoney"
REDIS_URL="redis://localhost:6379"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your-key"
CLERK_SECRET_KEY="your-secret"
```

---

## 🚀 Quick Start Testing

### Option 1: Automated Script (Recommended)
```bash
# Run automated API tests
./scripts/test-api.sh
```

This will test all 34+ endpoints automatically.

### Option 2: Manual Testing with cURL

#### 1. Start Development Server
```bash
npm run dev
```

Server will run on: http://localhost:3000

#### 2. Test Endpoints

**Note:** Most endpoints require authentication. You'll get 401 responses without a valid Clerk session.

**Health Check:**
```bash
# Should work without auth
curl http://localhost:3000/api/transactions
```

**Expected Response (without auth):**
```json
{
  "error": "Unauthorized"
}
```

This is **correct**! It means the API is working and properly protecting routes.

---

## 🔐 Testing with Authentication

To fully test the API, you need to authenticate via Clerk.

### Method 1: Use Frontend (Easiest)

1. Start the dev server: `npm run dev`
2. Open browser: http://localhost:3000
3. Sign in with Clerk
4. Use browser DevTools → Network tab to see API calls
5. Copy the session token from headers

### Method 2: Get Session Token from Clerk

```javascript
// In browser console after signing in
const token = await window.Clerk.session.getToken();
console.log(token);
```

Then use in cURL:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  http://localhost:3000/api/transactions
```

### Method 3: Use Postman/Thunder Client

1. Install Postman or Thunder Client (VS Code extension)
2. Create a collection for Permoney API
3. Add authentication header with Clerk token
4. Test all endpoints

---

## 📋 Endpoint Testing Checklist

### ✅ Transactions API
```bash
# List transactions
curl http://localhost:3000/api/transactions

# Get transaction stats
curl http://localhost:3000/api/transactions/stats

# Get category breakdown
curl http://localhost:3000/api/transactions/category-breakdown

# Create transaction (requires auth + body)
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "accountId": "account-id",
    "amountCents": -5000000,
    "currency": "IDR",
    "description": "Test transaction",
    "date": "2024-09-30T00:00:00.000Z",
    "categoryId": "category-id"
  }'
```

### ✅ Accounts API
```bash
# List accounts
curl http://localhost:3000/api/accounts

# Get account stats
curl http://localhost:3000/api/accounts/stats

# Get net worth
curl http://localhost:3000/api/accounts/net-worth?currency=IDR

# Create account (requires auth + body)
curl -X POST http://localhost:3000/api/accounts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "BCA Checking",
    "type": "ASSET",
    "subtype": "checking",
    "currency": "IDR",
    "balanceCents": 1000000000
  }'
```

### ✅ Budgets API
```bash
# List budgets
curl http://localhost:3000/api/budgets

# Get budget progress
curl http://localhost:3000/api/budgets/BUDGET_ID/progress

# Get budget alerts
curl http://localhost:3000/api/budgets/BUDGET_ID/alerts

# Create budget (requires auth + body)
curl -X POST http://localhost:3000/api/budgets \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Monthly Budget",
    "period": "MONTHLY",
    "startDate": "2024-09-01T00:00:00.000Z",
    "endDate": "2024-09-30T00:00:00.000Z",
    "currency": "IDR",
    "categories": [
      {
        "categoryId": "category-id",
        "allocatedAmountCents": 500000000
      }
    ]
  }'
```

### ✅ Categories API
```bash
# List categories
curl http://localhost:3000/api/categories

# Filter by type
curl "http://localhost:3000/api/categories?type=EXPENSE"

# Create category
curl -X POST http://localhost:3000/api/categories \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Food & Dining",
    "slug": "food-dining",
    "type": "EXPENSE",
    "icon": "🍽️",
    "color": "#FF6B6B"
  }'
```

### ✅ Debts API
```bash
# List debts
curl http://localhost:3000/api/debts

# Create debt
curl -X POST http://localhost:3000/api/debts \
  -H "Content-Type: application/json" \
  -d '{
    "type": "PERSONAL",
    "name": "Car Loan",
    "creditor": "Bank ABC",
    "principalAmountCents": 10000000000,
    "currency": "IDR",
    "interestRate": 0.05,
    "startDate": "2024-01-01T00:00:00.000Z"
  }'

# Add payment
curl -X POST http://localhost:3000/api/debts/DEBT_ID/payments \
  -H "Content-Type: application/json" \
  -d '{
    "amountCents": 100000000,
    "principalAmountCents": 95000000,
    "interestAmountCents": 5000000,
    "paymentDate": "2024-09-30T00:00:00.000Z"
  }'
```

### ✅ Analytics API
```bash
# Get dashboard analytics
curl http://localhost:3000/api/analytics

# Get cashflow
curl http://localhost:3000/api/analytics/cashflow

# Get spending patterns
curl http://localhost:3000/api/analytics/spending

# Get net worth trend
curl http://localhost:3000/api/analytics/net-worth-trend

# With date filters
curl "http://localhost:3000/api/analytics/cashflow?startDate=2024-09-01&endDate=2024-09-30"
```

### ✅ Household API
```bash
# List user households
curl http://localhost:3000/api/household

# Create household
curl -X POST http://localhost:3000/api/household \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Family Budget",
    "baseCurrency": "IDR"
  }'
```

### ✅ Exchange Rates API
```bash
# Get rates for date
curl http://localhost:3000/api/exchange-rates

# Convert currency
curl "http://localhost:3000/api/exchange-rates/convert?amount=100&from=USD&to=IDR"
```

### ✅ Gratitude API
```bash
# List gratitude entries
curl http://localhost:3000/api/gratitude

# Create entry
curl -X POST http://localhost:3000/api/gratitude \
  -H "Content-Type: application/json" \
  -d '{
    "giver": "Mom",
    "type": "GIFT",
    "description": "Birthday gift",
    "date": "2024-09-30T00:00:00.000Z",
    "estimatedValueCents": 50000000
  }'
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Cannot find module '@prisma/client'"
**Solution:**
```bash
npm run db:generate
```

### Issue 2: "Redis connection failed"
**Solution:**
```bash
# Make sure Redis is running
redis-server

# Or check if it's already running
redis-cli ping
```

### Issue 3: "Unauthorized" errors
**Expected!** This means API protection is working. You need:
- Valid Clerk session token
- Or sign in through the frontend first

### Issue 4: "Database connection error"
**Solution:**
```bash
# Check PostgreSQL is running
pg_isready

# Check DATABASE_URL in .env
echo $DATABASE_URL

# Run migrations
npm run db:migrate:dev
```

### Issue 5: "Port 3000 already in use"
**Solution:**
```bash
# Find and kill process
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

---

## 📊 Expected Results

### ✅ **With Authentication:**
- 200 OK responses with data
- Proper JSON responses
- Cache headers in responses
- Fast response times (<100ms cached, <500ms uncached)

### ✅ **Without Authentication:**
- 401 Unauthorized (correct behavior!)
- Error message: "Unauthorized" or "No household found"

### ✅ **Invalid Data:**
- 400 Bad Request
- Error message describing the issue

---

## 🔍 Debugging Tips

### 1. Check Server Logs
```bash
npm run dev
# Watch console for errors
```

### 2. Check Redis Cache
```bash
redis-cli
> KEYS *
> GET "transactions:household-id:*"
> TTL "some-key"
```

### 3. Check Database
```bash
npm run db:studio
# Opens Prisma Studio in browser
```

### 4. Use React Query Devtools
When frontend is integrated:
- Open browser
- Look for TanStack Query devtools panel (bottom-right)
- See all queries, cache status, and refetch

---

## ✅ Success Criteria

API is working correctly if:

1. ✅ Server starts without errors
2. ✅ Redis connection successful
3. ✅ Database connection successful  
4. ✅ Endpoints return 401 without auth (correct!)
5. ✅ Endpoints return data with valid auth
6. ✅ CRUD operations work
7. ✅ Cache invalidation works
8. ✅ No TypeScript errors
9. ✅ Fast response times

---

## 🚀 Next Steps

Once API testing passes:

1. ✅ **Frontend Integration** - Move pages to /src/app
2. ✅ **Hooks Migration** - Convert to TanStack Query
3. ✅ **E2E Testing** - Test full user flows
4. ✅ **Performance Testing** - Load testing
5. ✅ **Deploy** - Deploy to production

---

## 📝 Notes

- All endpoints use Redis caching
- Cache TTL: 1min (transactions) to 1 day (exchange rates)
- Auth is required for all data operations
- Proper error handling implemented
- Type-safe end-to-end

---

**Happy Testing! 🎉**

If you encounter issues, check:
1. Server logs (`npm run dev`)
2. Redis logs (`redis-cli MONITOR`)
3. Database with Prisma Studio (`npm run db:studio`)
