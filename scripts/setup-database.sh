#!/bin/bash

# Permoney Database Setup Script
# This script sets up the PostgreSQL database with TimescaleDB extension

set -e

echo "🚀 Setting up Permoney database..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if PostgreSQL is running
if ! pg_isready -q; then
    echo -e "${RED}❌ PostgreSQL is not running. Please start PostgreSQL first.${NC}"
    echo "On macOS with Homebrew: brew services start postgresql"
    echo "On Ubuntu/Debian: sudo systemctl start postgresql"
    exit 1
fi

echo -e "${GREEN}✅ PostgreSQL is running${NC}"

# Check if database exists
DB_NAME="permoney"
if psql -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    echo -e "${YELLOW}⚠️  Database '$DB_NAME' already exists${NC}"
    read -p "Do you want to recreate it? This will delete all existing data. (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}🗑️  Dropping existing database...${NC}"
        dropdb $DB_NAME 2>/dev/null || true
    else
        echo -e "${BLUE}ℹ️  Using existing database${NC}"
    fi
fi

# Create database if it doesn't exist
if ! psql -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    echo -e "${BLUE}📦 Creating database '$DB_NAME'...${NC}"
    createdb $DB_NAME
fi

# Enable TimescaleDB extension
echo -e "${BLUE}⚡ Enabling TimescaleDB extension...${NC}"
psql -d $DB_NAME -c "CREATE EXTENSION IF NOT EXISTS timescaledb;" 2>/dev/null || {
    echo -e "${YELLOW}⚠️  TimescaleDB extension not available. Installing TimescaleDB...${NC}"
    echo "Please install TimescaleDB first:"
    echo "On macOS: brew install timescaledb"
    echo "On Ubuntu/Debian: sudo apt install timescaledb-2-postgresql-14"
    echo "Then run: sudo timescaledb-tune"
    echo ""
    echo -e "${BLUE}ℹ️  Continuing without TimescaleDB (basic PostgreSQL functionality will work)${NC}"
}

# Generate Prisma client
echo -e "${BLUE}🔧 Generating Prisma client...${NC}"
npx prisma generate

# Run database migrations
echo -e "${BLUE}🔄 Running database migrations...${NC}"
npx prisma migrate dev --name init

# Seed the database
echo -e "${BLUE}🌱 Seeding database with default data...${NC}"
npm run db:seed

echo -e "${GREEN}✅ Database setup completed successfully!${NC}"
echo ""
echo -e "${BLUE}📊 Database Information:${NC}"
echo "  Database Name: $DB_NAME"
echo "  Connection URL: postgresql://user:password@localhost:5432/$DB_NAME"
echo ""
echo -e "${BLUE}🛠️  Available Commands:${NC}"
echo "  npm run db:studio    - Open Prisma Studio"
echo "  npm run db:migrate   - Run new migrations"
echo "  npm run db:seed      - Seed database with sample data"
echo "  npm run db:reset     - Reset database (destructive)"
echo ""
echo -e "${GREEN}🎉 You're ready to start developing with Permoney!${NC}"
