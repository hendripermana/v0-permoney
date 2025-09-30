# ⚡ Quick Test - 5 Minutes Setup

## Prerequisites Check

```bash
# 1. Check Node.js version (need >= 18)
node --version

# 2. Check if PostgreSQL is installed
psql --version

# 3. Check if Redis is installed
redis-cli --version
```

---

## 🚀 Quick Setup (5 Steps)

### Step 1: Install Dependencies
```bash
cd /Users/p/Project/v0-permoney
npm install
```

### Step 2: Setup Environment
```bash
# .env file should already exist
# Verify it has:
cat .env | grep -E "DATABASE_URL|REDIS_URL|CLERK"
```

### Step 3: Start Services
```bash
# Terminal 1: Start PostgreSQL (if not running)
brew services start postgresql@14
# or: sudo systemctl start postgresql

# Terminal 2: Start Redis (REQUIRED!)
redis-server

# Verify Redis is running
redis-cli ping
# Should return: PONG
```

### Step 4: Setup Database
```bash
# Generate Prisma Client
npm run db:generate

# Run migrations
npm run db:migrate:dev

# Optional: Seed with test data
npm run db:seed
```

### Step 5: Start Development Server
```bash
npm run dev
```

Server will start on: **http://localhost:3000**

---

## 🧪 Quick API Test

### Test 1: Server is Running
```bash
curl http://localhost:3000/api/transactions
```

**Expected Response:**
```json
{
  "error": "Unauthorized"
}
```

✅ This is **CORRECT**! It means:
- Server is running
- API routes are working  
- Authentication is protecting routes

### Test 2: Run All Tests
```bash
./scripts/test-api.sh
```

This will test all 34+ endpoints automatically.

---

## 🎯 Expected Results

### ✅ Success Indicators:
1. No TypeScript errors
2. Server starts without crashes
3. Redis connection: `✅ Redis connected successfully`
4. Database connection: Working
5. API endpoints return 401 (Unauthorized) - **This is correct!**

### ❌ Common Issues:

**Issue:** "Cannot find module '@prisma/client'"
```bash
npm run db:generate
```

**Issue:** "Redis connection failed"
```bash
redis-server &
```

**Issue:** "Database connection error"
```bash
# Check PostgreSQL is running
pg_isready

# Check .env DATABASE_URL
cat .env | grep DATABASE_URL
```

---

## 📊 System Status Check

```bash
# Check all services
echo "Node.js: $(node --version)"
echo "PostgreSQL: $(pg_isready && echo '✅ Running' || echo '❌ Not running')"
echo "Redis: $(redis-cli ping 2>/dev/null && echo '✅ Running' || echo '❌ Not running')"
echo "Prisma Client: $([ -d node_modules/@prisma/client ] && echo '✅ Generated' || echo '❌ Not generated')"
```

---

## ✅ You're Ready When:

- [x] `npm run dev` starts without errors
- [x] Redis shows: `✅ Redis connected successfully`
- [x] API returns 401 responses (means it's protected, working!)
- [x] No TypeScript compilation errors
- [x] Can see logs in terminal

---

## 🚀 Next: Frontend Integration

Once API testing passes, continue with:

1. **Move Frontend Pages**
   ```bash
   cp -r frontend/src/app/(public) src/app/
   cp -r frontend/src/app/(app) src/app/
   ```

2. **Move Components**
   ```bash
   cp -r frontend/src/components/* src/components/
   ```

3. **Test Full App**
   ```bash
   npm run dev
   # Open http://localhost:3000
   ```

---

**Need Help?** Check `TESTING_GUIDE.md` for detailed instructions.
