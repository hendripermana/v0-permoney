#!/bin/bash

# Permoney Monitoring Infrastructure Startup Script
# This script sets up and starts the complete observability stack

set -e

echo "🚀 Starting Permoney Monitoring Infrastructure..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose and try again."
    exit 1
fi

# Create monitoring directories if they don't exist
print_status "Creating monitoring directories..."
mkdir -p monitoring/prometheus/rules
mkdir -p monitoring/grafana/provisioning/datasources
mkdir -p monitoring/grafana/provisioning/dashboards
mkdir -p monitoring/grafana/dashboards
mkdir -p monitoring/alertmanager
mkdir -p logs

# Set proper permissions for Grafana
print_status "Setting up Grafana permissions..."
sudo chown -R 472:472 monitoring/grafana/ 2>/dev/null || print_warning "Could not set Grafana permissions (may require sudo)"

# Create logs directory for application
mkdir -p logs

# Check if monitoring configuration files exist
if [ ! -f "monitoring/prometheus/prometheus.yml" ]; then
    print_error "Prometheus configuration not found. Please ensure monitoring/prometheus/prometheus.yml exists."
    exit 1
fi

if [ ! -f "monitoring/alertmanager/alertmanager.yml" ]; then
    print_error "AlertManager configuration not found. Please ensure monitoring/alertmanager/alertmanager.yml exists."
    exit 1
fi

# Stop any existing monitoring services
print_status "Stopping existing monitoring services..."
docker-compose -f docker-compose.monitoring.yml down --remove-orphans 2>/dev/null || true

# Pull latest images
print_status "Pulling latest monitoring images..."
docker-compose -f docker-compose.monitoring.yml pull

# Start monitoring services
print_status "Starting monitoring services..."
docker-compose -f docker-compose.monitoring.yml up -d

# Wait for services to be ready
print_status "Waiting for services to start..."
sleep 10

# Check service health
print_status "Checking service health..."

services=(
    "prometheus:9090"
    "grafana:3000"
    "elasticsearch:9200"
    "kibana:5601"
    "alertmanager:9093"
    "node-exporter:9100"
)

all_healthy=true

for service in "${services[@]}"; do
    name=$(echo $service | cut -d: -f1)
    port=$(echo $service | cut -d: -f2)
    
    if curl -f -s "http://localhost:$port" > /dev/null 2>&1; then
        print_success "$name is healthy"
    else
        print_error "$name is not responding"
        all_healthy=false
    fi
done

if [ "$all_healthy" = true ]; then
    print_success "All monitoring services are healthy!"
    echo ""
    echo "📊 Access your monitoring dashboards:"
    echo "   • Grafana:      http://localhost:3001 (admin/admin123)"
    echo "   • Prometheus:   http://localhost:9090"
    echo "   • Kibana:       http://localhost:5601"
    echo "   • AlertManager: http://localhost:9093"
    echo ""
    echo "🔧 Service endpoints:"
    echo "   • Node Exporter: http://localhost:9100"
    echo "   • Redis Exporter: http://localhost:9121"
    echo "   • Postgres Exporter: http://localhost:9187"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Configure your application with monitoring environment variables"
    echo "   2. Start your Permoney application"
    echo "   3. Check the Grafana dashboards for metrics"
    echo "   4. Review logs in Kibana"
    echo ""
else
    print_error "Some services are not healthy. Check the logs:"
    echo "   docker-compose -f docker-compose.monitoring.yml logs"
    exit 1
fi

# Create index patterns in Kibana (optional)
print_status "Setting up Kibana index patterns..."
sleep 30  # Wait for Kibana to be fully ready

# Create index pattern for application logs
curl -X POST "localhost:5601/api/saved_objects/index-pattern/permoney-logs" \
  -H "kbn-xsrf: true" \
  -H "Content-Type: application/json" \
  -d '{
    "attributes": {
      "title": "permoney-logs-*",
      "timeFieldName": "@timestamp"
    }
  }' 2>/dev/null || print_warning "Could not create Kibana index pattern (Kibana may not be ready yet)"

print_success "Monitoring infrastructure is ready!"
print_status "Run 'docker-compose -f docker-compose.monitoring.yml logs -f' to view logs"
