#!/bin/bash

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root for security reasons"
    fi
}

# Generate secure random string
generate_secret() {
    local length=${1:-64}
    openssl rand -base64 $length | tr -d "=+/" | cut -c1-$length
}

# Create secure environment file
create_env_file() {
    log "Creating secure environment configuration..."
    
    if [[ -f .env ]]; then
        warn ".env file already exists. Creating backup..."
        cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    fi

    # Generate secure secrets
    JWT_SECRET=$(generate_secret 64)
    SESSION_SECRET=$(generate_secret 64)
    POSTGRES_PASSWORD=$(generate_secret 32)
    GRAFANA_PASSWORD=$(generate_secret 16)

    cat > .env << EOF
# =============================================================================
# PRODUCTION ENVIRONMENT CONFIGURATION
# Generated on $(date)
# =============================================================================

# Application
NODE_ENV=production
BACKEND_PORT=3001
PORT=3001
API_PREFIX=api
ENABLE_SWAGGER=false
LOG_LEVEL=warn
LOG_FORMAT=json
LOG_FILE_PATH=/var/log/permoney/app.log

# URLs
FRONTEND_URL=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://api.yourdomain.com

# Security
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
SESSION_SECRET=${SESSION_SECRET}
SESSION_MAX_AGE=86400000
PASSKEY_CHALLENGE_TIMEOUT=300000

# Database
DATABASE_URL=postgresql://permoney:${POSTGRES_PASSWORD}@localhost:5432/permoney_prod
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
DB_MAX_CONNECTIONS=20
DB_CONNECTION_TIMEOUT=30000

# Redis
REDIS_URL=redis://localhost:6379
REDIS_MAX_RETRIES=3
REDIS_RETRY_DELAY=1000

# Cache
CACHE_DEFAULT_TTL=3600
CACHE_MAX_ITEMS=10000
CACHE_ENABLE_COMPRESSION=true

# Security Headers
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
ENABLE_HELMET=true
ENABLE_CSRF=true

# External APIs
EXCHANGE_RATE_API_URL=https://api.exchangerate-api.com/v4/latest
EXCHANGE_RATE_API_KEY=your_exchange_rate_api_key
EXCHANGE_RATE_API_TIMEOUT=5000

# OCR Service
OCR_SERVICE_URL=https://api.ocr.space/parse/image
OCR_SERVICE_API_KEY=your_ocr_api_key
OCR_SERVICE_TIMEOUT=30000

# Email
EMAIL_PROVIDER=sendgrid
EMAIL_API_KEY=your_sendgrid_api_key
FROM_EMAIL=noreply@yourdomain.com

# Monitoring
ENABLE_METRICS=true
METRICS_PORT=9090
GRAFANA_PASSWORD=${GRAFANA_PASSWORD}

# File Storage
EXPORT_DIR=/var/lib/permoney/exports

# PWA
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
EOF

    log "Environment file created successfully"
    log "Please update the placeholder values with your actual configuration"
}

# Set secure file permissions
set_permissions() {
    log "Setting secure file permissions..."
    
    # Environment files should be readable only by owner
    chmod 600 .env 2>/dev/null || true
    chmod 600 .env.* 2>/dev/null || true
    
    # Log directory
    sudo mkdir -p /var/log/permoney
    sudo chown $USER:$USER /var/log/permoney
    chmod 755 /var/log/permoney
    
    # Export directory
    sudo mkdir -p /var/lib/permoney/exports
    sudo chown $USER:$USER /var/lib/permoney/exports
    chmod 755 /var/lib/permoney/exports
    
    log "File permissions set successfully"
}

# Install security tools
install_security_tools() {
    log "Installing security tools..."
    
    # Check if tools are already installed
    if command -v fail2ban-client &> /dev/null; then
        log "fail2ban already installed"
    else
        sudo apt-get update
        sudo apt-get install -y fail2ban
    fi
    
    if command -v ufw &> /dev/null; then
        log "ufw already installed"
    else
        sudo apt-get install -y ufw
    fi
    
    log "Security tools installed successfully"
}

# Configure firewall
configure_firewall() {
    log "Configuring firewall..."
    
    # Reset UFW to defaults
    sudo ufw --force reset
    
    # Default policies
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    
    # Allow SSH (be careful with this)
    sudo ufw allow ssh
    
    # Allow HTTP and HTTPS
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    
    # Allow application ports
    sudo ufw allow 3000/tcp  # Frontend
    sudo ufw allow 3001/tcp  # Backend API
    
    # Allow database (only from localhost)
    sudo ufw allow from 127.0.0.1 to any port 5432
    
    # Allow Redis (only from localhost)
    sudo ufw allow from 127.0.0.1 to any port 6379
    
    # Allow monitoring
    sudo ufw allow 9090/tcp  # Prometheus
    sudo ufw allow 3000/tcp  # Grafana
    
    # Enable firewall
    sudo ufw --force enable
    
    log "Firewall configured successfully"
}

# Configure fail2ban
configure_fail2ban() {
    log "Configuring fail2ban..."
    
    sudo tee /etc/fail2ban/jail.local > /dev/null << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3
backend = systemd

[sshd]
enabled = true
port = ssh
logpath = %(sshd_log)s
backend = %(sshd_backend)s

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10

[nginx-botsearch]
enabled = true
port = http,https
logpath = /var/log/nginx/access.log
maxretry = 2
EOF

    sudo systemctl enable fail2ban
    sudo systemctl restart fail2ban
    
    log "fail2ban configured successfully"
}

# Generate SSL certificates (Let's Encrypt)
setup_ssl() {
    log "Setting up SSL certificates..."
    
    if command -v certbot &> /dev/null; then
        log "certbot already installed"
    else
        sudo apt-get install -y certbot python3-certbot-nginx
    fi
    
    warn "SSL certificate generation requires manual domain configuration"
    warn "Run: sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com"
    
    log "SSL setup prepared"
}

# Security audit
run_security_audit() {
    log "Running security audit..."
    
    # Check for common security issues
    local issues=0
    
    # Check file permissions
    if [[ -f .env && $(stat -c %a .env) != "600" ]]; then
        warn "Environment file has insecure permissions"
        ((issues++))
    fi
    
    # Check for default passwords
    if grep -q "password123\|admin\|root" .env 2>/dev/null; then
        warn "Default passwords detected in environment file"
        ((issues++))
    fi
    
    # Check Node.js version
    if command -v node &> /dev/null; then
        local node_version=$(node --version | cut -d'v' -f2)
        local major_version=$(echo $node_version | cut -d'.' -f1)
        if [[ $major_version -lt 18 ]]; then
            warn "Node.js version is outdated (current: $node_version, recommended: 18+)"
            ((issues++))
        fi
    fi
    
    # Check for security headers in nginx config
    if [[ -f /etc/nginx/sites-available/default ]]; then
        if ! grep -q "X-Frame-Options" /etc/nginx/sites-available/default; then
            warn "Security headers not configured in nginx"
            ((issues++))
        fi
    fi
    
    if [[ $issues -eq 0 ]]; then
        log "Security audit passed with no issues"
    else
        warn "Security audit found $issues potential issues"
    fi
}

# Main execution
main() {
    log "Starting production security setup..."
    
    check_root
    create_env_file
    set_permissions
    install_security_tools
    configure_firewall
    configure_fail2ban
    setup_ssl
    run_security_audit
    
    log "Security setup completed successfully!"
    log "Next steps:"
    log "1. Update .env file with your actual configuration values"
    log "2. Configure SSL certificates: sudo certbot --nginx -d yourdomain.com"
    log "3. Review firewall rules: sudo ufw status"
    log "4. Monitor fail2ban: sudo fail2ban-client status"
    log "5. Test your application security"
}

# Run main function
main "$@"
