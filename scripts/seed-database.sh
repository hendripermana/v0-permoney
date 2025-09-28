#!/bin/bash

# Permoney Database Seed Script
# This script seeds the database with sample data

set -e

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Load .env variables from project root
if [ -f "$PROJECT_ROOT/.env" ]; then
  export $(grep -v '^#' "$PROJECT_ROOT/.env" | xargs -d '\n' 2>/dev/null || grep -v '^#' "$PROJECT_ROOT/.env" | xargs)
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🌱 Seeding Permoney database...${NC}"

# Navigate to backend directory
cd "$PROJECT_ROOT/backend"

# Check if seed file exists
if [ ! -f "prisma/seed.ts" ]; then
    echo -e "${RED}❌ Seed file not found at prisma/seed.ts${NC}"
    exit 1
fi

# Run seed
echo -e "${BLUE}🌱 Running database seed...${NC}"
npx tsx prisma/seed.ts

echo -e "${GREEN}✅ Database seeding completed successfully!${NC}"