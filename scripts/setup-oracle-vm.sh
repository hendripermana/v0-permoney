#!/bin/bash

echo "🚀 Setting up Oracle Cloud VM for Permoney Backend..."
echo "📊 VM Specs: 24GB RAM, 4CPU Cores - Perfect for high performance!"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're on Oracle Cloud VM
if ! command -v apt &> /dev/null; then
    echo -e "${RED}❌ This script is designed for Ubuntu/Debian systems (Oracle Cloud VM)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Detected Ubuntu/Debian system${NC}"

# Update system
echo -e "${YELLOW}📦 Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y

# Install Node.js 20 LTS (newest stable)
echo -e "${YELLOW}📦 Installing Node.js 20 LTS...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify Node.js installation
NODE_VERSION=$(node -v)
echo -e "${GREEN}✅ Node.js $NODE_VERSION installed${NC}"

# Install PM2 for process management
echo -e "${YELLOW}📦 Installing PM2 for process management...${NC}"
sudo npm install -g pm2

# Install PostgreSQL
echo -e "${YELLOW}📦 Installing PostgreSQL...${NC}"
sudo apt install -y postgresql postgresql-contrib

# Configure PostgreSQL
echo -e "${YELLOW}🔧 Configuring PostgreSQL...${NC}"
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database user and database
sudo -u postgres psql -c "CREATE USER permoney WITH PASSWORD 'your-secure-password-here';"
sudo -u postgres psql -c "CREATE DATABASE permoney OWNER permoney;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE permoney TO permoney;"

echo -e "${GREEN}✅ PostgreSQL configured${NC}"

# Install Redis
echo -e "${YELLOW}📦 Installing Redis...${NC}"
sudo apt install -y redis-server

# Configure Redis for maximum performance
echo -e "${YELLOW}🔧 Optimizing Redis configuration...${NC}"
sudo sed -i 's/supervised no/supervised systemd/' /etc/redis/redis.conf
sudo sed -i 's/bind 127.0.0.1 ::1/bind 0.0.0.0/' /etc/redis/redis.conf
sudo sed -i 's/protected-mode yes/protected-mode no/' /etc/redis/redis.conf

sudo systemctl restart redis
sudo systemctl enable redis

echo -e "${GREEN}✅ Redis configured with network access${NC}"

# Install Nginx (optional, for reverse proxy)
echo -e "${YELLOW}📦 Installing Nginx (optional)...${NC}"
sudo apt install -y nginx

# Configure firewall
echo -e "${YELLOW}🔧 Configuring firewall...${NC}"
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

echo -e "${GREEN}✅ Firewall configured${NC}"

# Setup Node.js application directory
echo -e "${YELLOW}📁 Setting up application directory...${NC}"
sudo mkdir -p /opt/permoney
sudo chown $USER:$USER /opt/permoney

# Create deployment script
cat > /opt/permoney/deploy.sh << 'EOF'
#!/bin/bash
echo "🚀 Deploying Permoney to Oracle Cloud VM..."

# Navigate to app directory
cd /opt/permoney

# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Run database migrations
npm run db:migrate

# Seed database (optional)
# npm run db:seed

# Build application
npm run build

# Restart services with PM2
pm2 restart permoney-backend || pm2 start dist/main.js --name permoney-backend

echo "✅ Deployment completed!"
EOF

chmod +x /opt/permoney/deploy.sh

echo -e "${GREEN}✅ Deployment script created${NC}"

# Create environment file template
cat > /opt/permoney/.env.example << 'EOF'
# Database
DATABASE_URL="postgresql://permoney:your-secure-password-here@localhost:5432/permoney"

# JWT
JWT_SECRET="your-super-secure-jwt-secret-here-min-32-chars"

# Redis
REDIS_URL="redis://localhost:6379"

# App Configuration
NODE_ENV="production"
PORT=3001

# CORS (for Cloudflare frontend)
CORS_ORIGIN="https://your-frontend-domain.pages.dev"

# File Upload
UPLOAD_DIR="/opt/permoney/uploads"
MAX_FILE_SIZE="10485760"

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF

echo -e "${GREEN}✅ Environment template created${NC}"

# Setup PM2 startup script
echo -e "${YELLOW}🔧 Setting up PM2 startup...${NC}"
pm2 startup
pm2 save

# Create systemd service for better management (optional)
cat > /etc/systemd/system/permoney.service << 'EOF'
[Unit]
Description=Permoney Personal Finance Backend
After=network.target postgresql.service redis-server.service

[Service]
Type=simple
User=opc
WorkingDirectory=/opt/permoney
ExecStart=/usr/bin/npm start
ExecReload=/bin/kill -s HUP $MAINPID
Restart=always
RestartSec=10

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=/opt/permoney /tmp
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload

echo -e "${GREEN}✅ Systemd service created${NC}"

# Display final instructions
echo ""
echo -e "${GREEN}🎉 Oracle Cloud VM setup completed!${NC}"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "1. Copy your application files to /opt/permoney"
echo "2. Copy .env.example to .env and configure:"
echo "   - Database password"
echo "   - JWT secret"
echo "   - Frontend domain"
echo ""
echo -e "${YELLOW}🚀 Deployment Commands:${NC}"
echo "cd /opt/permoney"
echo "./deploy.sh                    # Deploy application"
echo ""
echo -e "${YELLOW}🔧 Management Commands:${NC}"
echo "pm2 status                     # Check service status"
echo "pm2 logs permoney-backend      # View logs"
echo "pm2 restart permoney-backend   # Restart service"
echo "sudo systemctl status permoney # Check systemd status"
echo ""
echo -e "${YELLOW}📊 Performance Monitoring:${NC}"
echo "htop                           # CPU/RAM usage"
echo "redis-cli monitor              # Redis commands"
echo "psql -U permoney -d permoney   # Database access"
echo ""
echo -e "${GREEN}✅ Your Oracle Cloud VM is ready for high-performance backend!${NC}"
