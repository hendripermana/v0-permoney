#!/bin/bash

# Development Setup Script
# Kills existing processes and starts clean development environment

echo "🧹 Cleaning up existing processes..."

# Kill processes on development ports
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:4200 | xargs kill -9 2>/dev/null || true

echo "✅ Cleaned up existing processes"

# Wait a moment for ports to be freed
sleep 2

echo "🚀 Starting development servers..."

# Start the development environment
npm run dev
