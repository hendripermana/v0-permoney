#!/bin/bash

# Permoney Database Setup Script
# This script sets up the PostgreSQL database with optional TimescaleDB extension

set -e

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Load .env variables from project root
if [ -f "$PROJECT_ROOT/.env" ]; then
  export $(grep -v '^#' "$PROJECT_ROOT/.env" | xargs -d '\n' 2>/dev/null || grep -v '^#' "$PROJECT_ROOT/.env" | xargs)
fi

# Set database variables with fallbacks
DB_HOST=${DB_HOST:-${POSTGRES_HOST:-localhost}}
DB_PORT=${DB_PORT:-${POSTGRES_PORT:-5432}}
DB_USER=${DB_USERNAME:-${POSTGRES_USER:-postgres}}
DB_PASSWORD=${DB_PASSWORD:-${POSTGRES_PASSWORD:-postgres}}
DB_NAME=${DB_NAME:-${POSTGRES_DB:-permoney}}

export PGPASSWORD=$DB_PASSWORD

echo "🚀 Setting up Permoney database..."
echo "Using: Host: $DB_HOST, Port: $DB_PORT, User: $DB_USER, DB: $DB_NAME"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if PostgreSQL is running
if ! pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER -q; then
    echo -e "${RED}❌ PostgreSQL is not running or credentials invalid. Please start PostgreSQL and check credentials.${NC}"
    echo "On macOS with Homebrew: brew services start postgresql"
    echo "On Ubuntu/Debian: sudo systemctl start postgresql"
    echo "Ensure the password in .env matches your Postgres setup."
    exit 1
fi

echo -e "${GREEN}✅ PostgreSQL is running${NC}"

# Check if database exists
if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -ltq | cut -d'|' -f1 | grep -qw $DB_NAME; then
    echo -e "${YELLOW}⚠️  Database '$DB_NAME' already exists${NC}"
    read -p "Do you want to recreate it? This will delete all existing data. (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}🗑️  Dropping existing database...${NC}"
        dropdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME 2>/dev/null || true
    else
        echo -e "${BLUE}ℹ️  Using existing database${NC}"
    fi
fi

# Create database if it doesn't exist
if ! psql -h $DB_HOST -p $DB_PORT -U $DB_USER -ltq | cut -d'|' -f1 | grep -qw $DB_NAME; then
    echo -e "${BLUE}📦 Creating database '$DB_NAME'...${NC}"
    createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME
fi

# Enable TimescaleDB extension (optional)
echo -e "${BLUE}⚡ Checking for TimescaleDB extension...${NC}"
if command -v timescaledb-tune &> /dev/null; then
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;" 2>/dev/null && {
        echo -e "${GREEN}✅ TimescaleDB extension enabled${NC}"
    } || {
        echo -e "${YELLOW}⚠️  TimescaleDB not available, continuing with standard PostgreSQL${NC}"
    }
else
    echo -e "${BLUE}ℹ️  TimescaleDB not installed (optional). Continuing with standard PostgreSQL${NC}"
fi

# Navigate to backend directory for Prisma operations
cd "$PROJECT_ROOT/backend"

# Generate Prisma client
echo -e "${BLUE}🔧 Generating Prisma client...${NC}"
npx prisma generate

# Run database migrations
echo -e "${BLUE}🔄 Running database migrations...${NC}"
npx prisma migrate deploy 2>/dev/null || {
    echo -e "${YELLOW}⚠️  No existing migrations found. Creating initial migration...${NC}"
    npx prisma migrate dev --name init --skip-seed
}

echo -e "${GREEN}✅ Database setup completed successfully!${NC}"
echo ""
echo -e "${BLUE}📊 Database Information:${NC}"
echo "  Database Name: $DB_NAME"
echo "  Connection URL: postgresql://$DB_USER:****@$DB_HOST:$DB_PORT/$DB_NAME"
echo ""
echo -e "${BLUE}🛠️  Available Commands:${NC}"
echo "  npm run db:studio    - Open Prisma Studio"
echo "  npm run db:migrate   - Run new migrations"
echo "  npm run db:seed      - Seed database with sample data"
echo "  npm run db:reset     - Reset database (destructive)"
echo ""
echo -e "${GREEN}🎉 Database is ready! Run 'npm run db:seed' if you want to add sample data.${NC}"