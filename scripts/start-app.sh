#!/bin/bash

# Permoney Application Startup Script
# This script starts both frontend and backend services

set -e

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Permoney Application...${NC}"

# Check if .env exists
if [ ! -f "$PROJECT_ROOT/.env" ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo -e "${YELLOW}Please copy env.example to .env and configure it:${NC}"
    echo "  cp env.example .env"
    echo "  Then edit .env with your database credentials"
    exit 1
fi

# Kill any existing processes on ports 3000 and 3001
echo -e "${BLUE}🔧 Cleaning up existing processes...${NC}"
lsof -ti:3000,3001 2>/dev/null | xargs kill -9 2>/dev/null || true

# Start backend
echo -e "${BLUE}🎯 Starting Backend on port 3001...${NC}"
cd "$PROJECT_ROOT/backend"
npm run start:dev > /tmp/permoney-backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend to be ready
echo -e "${BLUE}⏳ Waiting for backend to be ready...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:3001/api/auth/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend is ready!${NC}"
        break
    fi
    sleep 1
done

# Start frontend
echo -e "${BLUE}🎨 Starting Frontend on port 3000...${NC}"
cd "$PROJECT_ROOT/frontend"
npm run dev > /tmp/permoney-frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

# Wait for frontend to be ready
echo -e "${BLUE}⏳ Waiting for frontend to be ready...${NC}"
for i in {1..30}; do
    if curl -s -I http://localhost:3000 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend is ready!${NC}"
        break
    fi
    sleep 1
done

echo ""
echo -e "${GREEN}🎉 Permoney is running!${NC}"
echo ""
echo -e "${BLUE}📱 Access the application:${NC}"
echo "  Frontend: http://localhost:3000"
echo "  Backend API: http://localhost:3001/api"
echo "  API Health: http://localhost:3001/api/auth/health"
echo ""
echo -e "${BLUE}📊 View logs:${NC}"
echo "  Backend: tail -f /tmp/permoney-backend.log"
echo "  Frontend: tail -f /tmp/permoney-frontend.log"
echo ""
echo -e "${YELLOW}⚠️  Press Ctrl+C to stop the application${NC}"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Stopping Permoney...${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo -e "${GREEN}✅ Application stopped${NC}"
    exit 0
}

# Set trap to cleanup on Ctrl+C
trap cleanup INT

# Keep script running
while true; do
    sleep 1
done