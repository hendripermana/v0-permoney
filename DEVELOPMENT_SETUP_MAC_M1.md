# 🖥️ **DEVELOPMENT SETUP - MACBOOK PRO M1**
## **Step-by-Step Development Environment Setup**

---

## 🎯 **PREREQUISITES CHECK**

### **Check Node.js Version:**
```bash
node --version  # Should be 18+
npm --version   # Should be 9+
```

### **Install Development Dependencies:**
```bash
# Install Brew (if not installed)
curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh | bash

# Install PostgreSQL
brew install postgresql@14
brew services start postgresql@14

# Install Redis
brew install redis
brew services start redis

# Install Watchman (for file watching)
brew install watchman
```

---

## 🚀 **STEP 1: INSTALL ALL DEPENDENCIES**

```bash
# Install root dependencies (workspace tools)
npm install

# Install backend dependencies
npm run backend:install  # or cd backend && npm install

# Install frontend dependencies
npm run frontend:install  # or cd frontend && npm install

# Install Astro dependencies
npm run astro:install     # or cd astro-frontend && npm install
```

---

## ⚙️ **STEP 1.5: CONFIGURE ENVIRONMENT**

### 🏠 **Single Source of Truth Configuration**

**IMPORTANT**: This project uses a **centralized environment configuration**. All environment variables are defined in the **root `.env` file** only.

**📄 Configuration Structure:**
```
📁 v0-permoney/
├── .env                    # 🟢 Single source of truth
├── .env.backup            # 🟢 Backup file
├── backend/               # ❌ No .env files here
├── frontend/              # ❌ No .env files here
└── [other directories]    # ❌ No .env files here
```

### **Setup Environment Variables:**

1. **Copy the example file:**
   ```bash
   cp .env .env.backup  # Create backup
   ```

2. **Edit the root `.env` file:**
   ```bash
   nano .env  # or use your preferred editor
   ```

3. **Required Configuration:**
   ```env
   # Database
   DATABASE_URL="postgresql://postgres:dev123@localhost:5432/permoney"
   DB_PASSWORD=dev123

   # Clerk Authentication (get from https://dashboard.clerk.com/)
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_your-key"
   CLERK_SECRET_KEY="sk_test_your-key"
   ```

**🚫 Remember:**
- ❌ **Do not create** `.env` files in `backend/`, `frontend/`, or subdirectories
- ❌ **Do not duplicate** environment variables
- ✅ **Only modify** the root `.env` file

---

## 🚀 **STEP 2: SETUP DATABASE**

### **Create Database:**
```bash
# Create database user and database
createdb -U $(whoami) permoney
psql -d permoney -c "CREATE USER permoney WITH PASSWORD 'dev123';"
psql -d permoney -c "GRANT ALL PRIVILEGES ON DATABASE permoney TO permoney;"
psql -d permoney -c "ALTER USER permoney CREATEDB;"

# Or use psql directly:
psql -d postgres -c "CREATE DATABASE permoney OWNER $(whoami);"
```

### **Run Migrations:**
```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed with initial data
npm run db:seed
```

### **Verify Database:**
```bash
# Connect to database
psql -d permoney

# Check tables created
\dt

# Verify seed data
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM households;
```

---

## 🚀 **STEP 3: START DEVELOPMENT SERVERS**

### **Option A: All-in-One (Recommended)**
```bash
# Start both frontend and backend simultaneously
npm run dev
```

### **Option B: Separate Terminals**
```bash
# Terminal 1: Backend (NestJS)
npm run dev:backend
# Should run on http://localhost:3001

# Terminal 2: Frontend (Next.js - for comparison)
npm run dev:frontend
# Should run on http://localhost:3000

# Terminal 3: Astro Frontend (new)
npm run astro:dev
# Should run on http://localhost:4321
```

---

## 🚀 **STEP 4: VERIFY SERVICES RUNNING**

### **Check Backend API:**
```bash
# Test health endpoint
curl http://localhost:3001/health

# Test API endpoints
curl http://localhost:3001/api/households
curl http://localhost:3001/api/transactions
curl http://localhost:3001/api/accounts
```

### **Check Frontend:**
```bash
# Next.js Frontend
open http://localhost:3000

# Astro Frontend (new)
open http://localhost:4321
```

### **Check Database:**
```bash
# Prisma Studio (optional)
npm run db:studio
# Open http://localhost:5555
```

---

## 🚀 **STEP 5: TEST ASTRO INTEGRATION**

### **Test Astro Pages:**
```bash
# Test home page
curl http://localhost:4321/

# Test dashboard (if implemented)
curl http://localhost:4321/dashboard/default-household
```

### **Test API Proxy:**
```bash
# Test Astro API calls to backend
curl http://localhost:4321/api/transactions
curl http://localhost:4321/api/households
```

### **Test React Components:**
```bash
# Open browser and test:
# - Dashboard components load
# - Transaction forms work
# - shadcn/ui components render
# - TanStack Query works
```

---

## 🚀 **STEP 6: PERFORMANCE MONITORING**

### **MacBook M1 Development Monitoring:**
```bash
# Monitor processes
ps aux | grep -E "(node|npm|next|astro)"

# Monitor memory usage
top -o mem

# Monitor network
lsof -i :3000 -i :3001 -i :4321

# Monitor disk usage
df -h
```

### **Database Monitoring:**
```bash
# Check connections
psql -d permoney -c "SELECT * FROM pg_stat_activity;"

# Check table sizes
psql -d permoney -c "\dt+"
```

---

## 🚀 **STEP 7: DEVELOPMENT WORKFLOW**

### **For Next.js Development:**
```bash
# Terminal 1: Backend
npm run dev:backend

# Terminal 2: Frontend
npm run dev:frontend

# Test: http://localhost:3000
```

### **For Astro Development:**
```bash
# Terminal 1: Backend
npm run dev:backend

# Terminal 2: Astro Frontend
npm run astro:dev

# Test: http://localhost:4321
```

### **Database Development:**
```bash
# Reset database (if needed)
npm run db:migrate:reset --force
npm run db:seed

# View database
npm run db:studio
```

---

## 🚀 **STEP 8: TESTING & DEBUGGING**

### **If Backend Not Starting:**
```bash
# Check for port conflicts
lsof -i :3001

# Check logs
cd backend && npm run start:dev

# Test database connection
cd backend && npx prisma db ping
```

### **If Frontend Not Starting:**
```bash
# Check for port conflicts
lsof -i :3000  # Next.js
lsof -i :4321  # Astro

# Clear cache
cd frontend && rm -rf .next
cd astro-frontend && rm -rf .astro node_modules/.astro
```

### **If Database Issues:**
```bash
# Restart PostgreSQL
brew services restart postgresql@14

# Reset database
npm run db:migrate:reset --force
npm run db:migrate
npm run db:seed
```

---

## 🚀 **STEP 9: COMPARE PERFORMANCE**

### **Next.js vs Astro:**
```bash
# Build both for comparison
npm run build:frontend    # Next.js build
npm run astro:build       # Astro build

# Compare bundle sizes
ls -lh frontend/.next/static/
ls -lh astro-frontend/dist/
```

### **API Response Times:**
```bash
# Test API endpoints
curl -w "@curl-format.txt" -s -o /dev/null http://localhost:3001/api/transactions
curl -w "@curl-format.txt" -s -o /dev/null http://localhost:4321/api/transactions
```

---

## 🚀 **STEP 10: READY FOR PRODUCTION**

### **When Satisfied with Development:**

1. **Deploy Backend to Oracle VM:**
```bash
# When ready for production
npm run oracle:setup
npm run oracle:deploy
```

2. **Deploy Frontend to Cloudflare:**
```bash
# Build optimized Astro
npm run astro:build

# Deploy to Cloudflare Pages
# (via Cloudflare Dashboard or wrangler)
```

---

## 🎯 **EXPECTED RESULTS ON MACBOOK M1**

### **Performance:**
- ✅ **Backend**: <50ms response times (local)
- ✅ **Frontend Next.js**: <1s page loads
- ✅ **Frontend Astro**: <500ms page loads
- ✅ **Database**: <10ms query times
- ✅ **Hot Reload**: Instant updates

### **Resource Usage:**
- ✅ **Memory**: Node.js ~200MB per process
- ✅ **CPU**: Minimal usage on M1
- ✅ **Disk**: <1GB for all projects
- ✅ **Network**: Localhost communication

---

## 🚨 **TROUBLESHOOTING COMMANDS**

### **If Port Already in Use:**
```bash
# Kill processes on specific ports
kill -9 $(lsof -ti:3000)
kill -9 $(lsof -ti:3001)
kill -9 $(lsof -ti:4321)

# Or find and kill
ps aux | grep node
kill -9 <PID>
```

### **If Database Connection Issues:**
```bash
# Check PostgreSQL status
brew services list | grep postgres

# Restart if needed
brew services restart postgresql@14

# Check connections
psql -d permoney -c "SELECT * FROM pg_stat_activity;"
```

### **If Dependencies Issues:**
```bash
# Clean install
rm -rf node_modules package-lock.json
rm -rf */node_modules */package-lock.json
npm install
```

---

## 🎉 **READY FOR DEVELOPMENT!**

### **Start Development:**
```bash
# Choose your preferred setup:

# Option 1: Next.js (existing)
npm run dev:frontend  # Terminal 1
npm run dev:backend   # Terminal 2

# Option 2: Astro (new optimized)
npm run astro:dev     # Terminal 1
npm run dev:backend   # Terminal 2

# Option 3: All services
npm run dev           # Single command
```

### **Test URLs:**
- 🖥️ **Next.js**: http://localhost:3000
- 🌟 **Astro**: http://localhost:4321
- 🔧 **Backend API**: http://localhost:3001
- 📊 **Database Studio**: http://localhost:5555

**Your MacBook Pro M1 siap untuk development dengan performance optimal!** 🚀

Apakah Anda ingin saya bantu dengan langkah spesifik atau ada error yang muncul saat setup?
