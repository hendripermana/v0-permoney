#!/bin/bash

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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

# Install monitoring tools
install_monitoring_tools() {
    log "Installing monitoring tools..."
    
    # Install Prometheus
    if ! command -v prometheus &> /dev/null; then
        log "Installing Prometheus..."
        wget https://github.com/prometheus/prometheus/releases/download/v2.40.0/prometheus-2.40.0.linux-amd64.tar.gz
        tar xvfz prometheus-*.tar.gz
        sudo mv prometheus-*/prometheus /usr/local/bin/
        sudo mv prometheus-*/promtool /usr/local/bin/
        sudo mkdir -p /etc/prometheus /var/lib/prometheus
        sudo mv prometheus-*/consoles /etc/prometheus/
        sudo mv prometheus-*/console_libraries /etc/prometheus/
        rm -rf prometheus-*
    fi
    
    # Install Grafana
    if ! command -v grafana-server &> /dev/null; then
        log "Installing Grafana..."
        sudo apt-get install -y software-properties-common
        sudo add-apt-repository "deb https://packages.grafana.com/oss/deb stable main"
        wget -q -O - https://packages.grafana.com/gpg.key | sudo apt-key add -
        sudo apt-get update
        sudo apt-get install -y grafana
    fi
    
    # Install Node Exporter
    if ! command -v node_exporter &> /dev/null; then
        log "Installing Node Exporter..."
        wget https://github.com/prometheus/node_exporter/releases/download/v1.5.0/node_exporter-1.5.0.linux-amd64.tar.gz
        tar xvfz node_exporter-*.tar.gz
        sudo mv node_exporter-*/node_exporter /usr/local/bin/
        rm -rf node_exporter-*
    fi
    
    log "Monitoring tools installed successfully"
}

# Configure Prometheus
configure_prometheus() {
    log "Configuring Prometheus..."
    
    sudo tee /etc/prometheus/prometheus.yml > /dev/null << EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "/etc/prometheus/rules/*.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node'
    static_configs:
      - targets: ['localhost:9100']

  - job_name: 'permoney-backend'
    static_configs:
      - targets: ['localhost:3001']
    metrics_path: '/api/metrics'

  - job_name: 'permoney-frontend'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/api/metrics'
EOF

    # Create alert rules
    sudo mkdir -p /etc/prometheus/rules
    sudo tee /etc/prometheus/rules/permoney.yml > /dev/null << EOF
groups:
  - name: permoney.rules
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ \$value | humanizePercentage }} for {{ \$labels.job }}"

      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High response time detected"
          description: "95th percentile response time is {{ \$value }}s for {{ \$labels.job }}"

      - alert: DatabaseConnectionFailure
        expr: up{job="permoney-backend"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Database connection failure"
          description: "Backend service is down or database is unreachable"

      - alert: HighMemoryUsage
        expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes > 0.85
        for: 15m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage"
          description: "Memory usage is {{ \$value | humanizePercentage }}"
EOF

    log "Prometheus configured successfully"
}

# Configure Grafana
configure_grafana() {
    log "Configuring Grafana..."
    
    # Create Grafana configuration
    sudo tee /etc/grafana/grafana.ini > /dev/null << EOF
[server]
http_port = 3000
domain = localhost

[security]
admin_user = admin
admin_password = ${GRAFANA_PASSWORD:-admin123}

[database]
type = sqlite3
path = grafana.db

[session]
provider = file

[analytics]
reporting_enabled = false
check_for_updates = false

[log]
mode = file
level = info
EOF

    # Create datasource configuration
    sudo mkdir -p /etc/grafana/provisioning/datasources
    sudo tee /etc/grafana/provisioning/datasources/prometheus.yml > /dev/null << EOF
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://localhost:9090
    isDefault: true
EOF

    # Create dashboard configuration
    sudo mkdir -p /etc/grafana/provisioning/dashboards
    sudo tee /etc/grafana/provisioning/dashboards/permoney.yml > /dev/null << EOF
apiVersion: 1

providers:
  - name: 'permoney'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /var/lib/grafana/dashboards
EOF

    log "Grafana configured successfully"
}

# Create systemd services
create_services() {
    log "Creating systemd services..."
    
    # Prometheus service
    sudo tee /etc/systemd/system/prometheus.service > /dev/null << EOF
[Unit]
Description=Prometheus
Wants=network-online.target
After=network-online.target

[Service]
User=prometheus
Group=prometheus
Type=simple
ExecStart=/usr/local/bin/prometheus \\
    --config.file /etc/prometheus/prometheus.yml \\
    --storage.tsdb.path /var/lib/prometheus/ \\
    --web.console.templates=/etc/prometheus/consoles \\
    --web.console.libraries=/etc/prometheus/console_libraries \\
    --web.listen-address=0.0.0.0:9090 \\
    --web.enable-lifecycle

[Install]
WantedBy=multi-user.target
EOF

    # Node Exporter service
    sudo tee /etc/systemd/system/node_exporter.service > /dev/null << EOF
[Unit]
Description=Node Exporter
Wants=network-online.target
After=network-online.target

[Service]
User=node_exporter
Group=node_exporter
Type=simple
ExecStart=/usr/local/bin/node_exporter

[Install]
WantedBy=multi-user.target
EOF

    # Create users
    sudo useradd --no-create-home --shell /bin/false prometheus || true
    sudo useradd --no-create-home --shell /bin/false node_exporter || true
    
    # Set permissions
    sudo chown -R prometheus:prometheus /etc/prometheus /var/lib/prometheus
    sudo chmod -R 755 /etc/prometheus /var/lib/prometheus
    
    log "Systemd services created successfully"
}

# Start services
start_services() {
    log "Starting monitoring services..."
    
    sudo systemctl daemon-reload
    sudo systemctl enable prometheus node_exporter grafana-server
    sudo systemctl start prometheus node_exporter grafana-server
    
    # Wait for services to start
    sleep 10
    
    # Check service status
    if systemctl is-active --quiet prometheus; then
        log "Prometheus is running"
    else
        error "Failed to start Prometheus"
    fi
    
    if systemctl is-active --quiet node_exporter; then
        log "Node Exporter is running"
    else
        error "Failed to start Node Exporter"
    fi
    
    if systemctl is-active --quiet grafana-server; then
        log "Grafana is running"
    else
        error "Failed to start Grafana"
    fi
    
    log "All monitoring services started successfully"
}

# Main execution
main() {
    log "Starting monitoring setup..."
    
    install_monitoring_tools
    configure_prometheus
    configure_grafana
    create_services
    start_services
    
    log "Monitoring setup completed successfully!"
    log "Access Grafana at: http://localhost:3000 (admin/admin123)"
    log "Access Prometheus at: http://localhost:9090"
    log "Node Exporter metrics at: http://localhost:9100/metrics"
}

# Run main function
main "$@"
