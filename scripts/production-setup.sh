#!/bin/bash

# Production setup script
set -e

echo "🚀 Setting up production environment..."

# Check if running as root
if [ "$EUID" -eq 0 ]; then
  echo "❌ Please don't run this script as root"
  exit 1
fi

# Check required environment variables
required_vars=(
  "DATABASE_URL"
  "JWT_SECRET"
  "SESSION_SECRET"
  "REDIS_URL"
  "FRONTEND_URL"
)

echo "🔍 Checking required environment variables..."
for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ Missing required environment variable: $var"
    exit 1
  fi
done

echo "✅ All required environment variables are set"

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p logs
mkdir -p exports
mkdir -p uploads
mkdir -p backups

# Set proper permissions
chmod 755 logs exports uploads backups

# Install production dependencies
echo "📦 Installing production dependencies..."
npm ci --only=production

# Build applications
echo "🔨 Building applications..."
npm run build:backend
npm run build:client

# Run database migrations
echo "🗄️ Running database migrations..."
npm run db:migrate:prod

# Seed initial data if needed
if [ "$SEED_DATABASE" = "true" ]; then
  echo "🌱 Seeding database..."
  npm run db:seed:prod
fi

# Set up SSL certificates (if not using a reverse proxy)
if [ "$SETUP_SSL" = "true" ]; then
  echo "🔒 Setting up SSL certificates..."
  # Add your SSL setup logic here
  # This could be Let's Encrypt, custom certificates, etc.
fi

# Set up log rotation
echo "📝 Setting up log rotation..."
sudo tee /etc/logrotate.d/permoney > /dev/null <<EOF
/app/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 nestjs nodejs
    postrotate
        systemctl reload permoney || true
    endscript
}
EOF

# Set up systemd service
echo "⚙️ Setting up systemd service..."
sudo tee /etc/systemd/system/permoney.service > /dev/null <<EOF
[Unit]
Description=PerMoney Financial Management App
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=nestjs
WorkingDirectory=/app
ExecStart=/usr/bin/node dist/backend/src/main.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
EnvironmentFile=/app/.env

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/app/logs /app/exports /app/uploads

# Resource limits
LimitNOFILE=65536
LimitNPROC=4096

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and enable service
sudo systemctl daemon-reload
sudo systemctl enable permoney

# Set up monitoring
if [ "$SETUP_MONITORING" = "true" ]; then
  echo "📊 Setting up monitoring..."
  
  # Install and configure Prometheus Node Exporter
  if ! command -v node_exporter &> /dev/null; then
    echo "Installing Prometheus Node Exporter..."
    wget https://github.com/prometheus/node_exporter/releases/download/v1.6.1/node_exporter-1.6.1.linux-amd64.tar.gz
    tar xvfz node_exporter-1.6.1.linux-amd64.tar.gz
    sudo mv node_exporter-1.6.1.linux-amd64/node_exporter /usr/local/bin/
    rm -rf node_exporter-1.6.1.linux-amd64*
    
    # Create systemd service for node_exporter
    sudo tee /etc/systemd/system/node_exporter.service > /dev/null <<EOF
[Unit]
Description=Node Exporter
After=network.target

[Service]
User=nobody
Group=nobody
Type=simple
ExecStart=/usr/local/bin/node_exporter

[Install]
WantedBy=multi-user.target
EOF
    
    sudo systemctl daemon-reload
    sudo systemctl enable node_exporter
    sudo systemctl start node_exporter
  fi
fi

# Set up backup script
echo "💾 Setting up backup script..."
tee /app/scripts/backup.sh > /dev/null <<'EOF'
#!/bin/bash
set -e

BACKUP_DIR="/app/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_BACKUP="$BACKUP_DIR/db_backup_$DATE.sql"
FILES_BACKUP="$BACKUP_DIR/files_backup_$DATE.tar.gz"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Database backup
echo "Creating database backup..."
pg_dump "$DATABASE_URL" > "$DB_BACKUP"
gzip "$DB_BACKUP"

# Files backup
echo "Creating files backup..."
tar -czf "$FILES_BACKUP" logs exports uploads

# Clean old backups (keep last 7 days)
find "$BACKUP_DIR" -name "*.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /app/scripts/backup.sh

# Set up cron job for backups
echo "⏰ Setting up backup cron job..."
(crontab -l 2>/dev/null; echo "0 2 * * * /app/scripts/backup.sh >> /app/logs/backup.log 2>&1") | crontab -

# Final security check
echo "🔒 Running final security check..."
npm audit --audit-level=high

echo "✅ Production setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Review the configuration in /app/.env"
echo "2. Start the service: sudo systemctl start permoney"
echo "3. Check the status: sudo systemctl status permoney"
echo "4. View logs: journalctl -u permoney -f"
echo "5. Set up reverse proxy (nginx/apache) if needed"
echo "6. Configure firewall rules"
echo "7. Set up monitoring dashboards"
echo ""
echo "🎉 Your PerMoney application is ready for production!"
