#!/bin/bash

echo "🚀 Setting up Astro + Cloudflare development environment..."

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

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "⚠️  Wrangler CLI not found. Installing globally..."
    npm install -g wrangler
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from example..."
    cp env.example .env 2>/dev/null || echo "No env.example found"
    echo "⚠️  Please update .env file with your actual configuration"
fi

# Start development server
echo "🌟 Starting Astro development server..."
echo "📱 Frontend: http://localhost:4321"
echo "⚡ API: Cloudflare Workers (when deployed)"
echo ""
echo "Press Ctrl+C to stop the development server"
echo ""

# Start Astro dev server
npm run dev
