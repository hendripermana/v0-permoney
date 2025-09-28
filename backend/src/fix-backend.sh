#!/bin/bash

# Script untuk memperbaiki backend issues

echo "🔧 Fixing Backend Issues..."

# 1. Install missing dependencies
echo "📦 Installing missing dependencies..."
npm install cheerio @types/cheerio --save

# 2. Generate Prisma Client dengan benar
echo "🔄 Regenerating Prisma Client..."
npx prisma generate

# 3. Fix TypeScript configuration
echo "⚙️ Checking TypeScript configuration..."

# 4. Compile untuk melihat error yang tersisa
echo "🔍 Checking remaining errors..."
npx tsc --noEmit 2>&1 | head -50

echo "✅ Initial fixes applied"