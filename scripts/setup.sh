#!/bin/bash

echo "🚀 Setting up Permoney development environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend && npm install && cd ..

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend && npm install && cd ..

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from example..."
    cp env.example .env
    echo "⚠️  Please update .env file with your actual configuration"
fi

# Copy frontend environment file if it doesn't exist
if [ ! -f frontend/.env.local ]; then
    echo "📝 Creating frontend .env.local file..."
    cat > frontend/.env.local << EOL
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-here"
EOL
    echo "⚠️  Please update frontend/.env.local file with your actual configuration"
fi

# Generate Prisma client
echo "🗄️  Generating Prisma client..."
cd backend && npx prisma generate && cd ..

echo ""
echo "✅ Setup completed!"
echo ""
echo "Next steps:"
echo "1. Update .env and frontend/.env.local with your database and API configuration"
echo "2. Setup your PostgreSQL database"
echo "3. Run database migrations: npm run db:migrate"
echo "4. Seed the database: npm run db:seed"
echo "5. Start development: npm run dev"
echo ""
echo "Happy coding! 🎉"
