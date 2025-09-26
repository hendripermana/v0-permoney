#!/bin/bash

echo "🚀 Deploying Permoney to Oracle Cloud VM (24GB RAM, 4CPU)..."
echo ""

# Configuration
VM_USER="opc"
VM_HOST="your-oracle-vm-ip"
APP_DIR="/opt/permoney"
REMOTE_REPO="your-git-repo-url"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 Step 1: Preparing deployment...${NC}"

# Check if VM is accessible
if ! ping -c 1 $VM_HOST &> /dev/null; then
    echo -e "${RED}❌ Cannot reach Oracle Cloud VM at $VM_HOST${NC}"
    echo "Please check:"
    echo "1. VM is running"
    echo "2. IP address is correct"
    echo "3. SSH key is configured"
    exit 1
fi

echo -e "${GREEN}✅ Oracle Cloud VM is accessible${NC}"

# Create deployment directory on VM
echo -e "${YELLOW}📦 Creating application directory...${NC}"
ssh $VM_USER@$VM_HOST "mkdir -p $APP_DIR/{uploads,backups,logs}"

# Copy environment file
if [ -f "env.oracle-vm" ]; then
    echo -e "${YELLOW}📦 Copying environment configuration...${NC}"
    scp env.oracle-vm $VM_USER@$VM_HOST:$APP_DIR/.env
    ssh $VM_USER@$VM_HOST "chmod 600 $APP_DIR/.env"
fi

# Sync application files (exclude node_modules)
echo -e "${YELLOW}📦 Syncing application files...${NC}"
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'astro-frontend' --exclude '.env*' ./ $VM_USER@$VM_HOST:$APP_DIR/

echo -e "${BLUE}🔧 Step 2: Installing dependencies on VM...${NC}"

# Install Node.js dependencies
ssh $VM_USER@$VM_HOST "cd $APP_DIR && npm install"

# Generate Prisma client
ssh $VM_USER@$VM_HOST "cd $APP_DIR && npx prisma generate"

echo -e "${BLUE}🔧 Step 3: Database setup...${NC}"

# Run database migrations
echo -e "${YELLOW}📦 Running database migrations...${NC}"
ssh $VM_USER@$VM_HOST "cd $APP_DIR && npm run db:migrate"

# Seed database (optional)
echo -e "${YELLOW}📦 Seeding database with initial data...${NC}"
ssh $VM_USER@$VM_HOST "cd $APP_DIR && npm run db:seed"

echo -e "${BLUE}🔧 Step 4: Building application...${NC}"

# Build the application
ssh $VM_USER@$VM_HOST "cd $APP_DIR && npm run build"

echo -e "${BLUE}🔧 Step 5: Starting services...${NC}"

# Stop existing services
ssh $VM_USER@$VM_HOST "pm2 delete permoney-backend 2>/dev/null || true"

# Start with PM2
ssh $VM_USER@$VM_HOST "cd $APP_DIR && pm2 start dist/main.js --name permoney-backend --max-memory-restart 2G"

# Save PM2 configuration
ssh $VM_USER@$VM_HOST "pm2 save"

# Display service status
echo -e "${YELLOW}📊 PM2 Service Status:${NC}"
ssh $VM_USER@$VM_HOST "pm2 status"

echo ""
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Deployment Summary:${NC}"
echo "✅ Application files synced"
echo "✅ Dependencies installed"
echo "✅ Database migrated and seeded"
echo "✅ Application built"
echo "✅ Services started with PM2"
echo ""
echo -e "${YELLOW}🚀 Service URLs:${NC}"
echo "• Backend API: http://$VM_HOST:3001"
echo "• Health Check: http://$VM_HOST:3001/health"
echo "• PM2 Monitor: http://$VM_HOST (if Nginx configured)"
echo ""
echo -e "${YELLOW}🔧 Management Commands:${NC}"
echo "ssh $VM_USER@$VM_HOST"
echo "cd $APP_DIR"
echo "pm2 logs permoney-backend     # View logs"
echo "pm2 restart permoney-backend  # Restart service"
echo "pm2 monit                     # Monitor performance"
echo ""
echo -e "${YELLOW}📊 Performance Monitoring:${NC}"
echo "htop                          # CPU/RAM usage"
echo "psql -U permoney -d permoney  # Database access"
echo "redis-cli monitor             # Redis commands"
echo ""
echo -e "${GREEN}✅ Your Oracle Cloud VM is now running Permoney with maximum performance!${NC}"
