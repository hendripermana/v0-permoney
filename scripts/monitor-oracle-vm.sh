#!/bin/bash

echo "📊 Oracle Cloud VM Performance Monitor"
echo "🚀 Permoney Backend - 24GB RAM, 4CPU Cores"
echo "========================================"

# Configuration
VM_USER="opc"
VM_HOST="your-oracle-vm-ip"
APP_DIR="/opt/permoney"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to check VM connectivity
check_vm_connection() {
    if ! ping -c 1 $VM_HOST &> /dev/null; then
        echo -e "${RED}❌ Cannot reach Oracle Cloud VM at $VM_HOST${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ VM is accessible${NC}"
}

# Function to display system resources
show_system_resources() {
    echo ""
    echo -e "${BLUE}🔧 System Resources:${NC}"
    ssh $VM_USER@$VM_HOST "echo '=== CPU Information ===' && nproc && echo '=== Memory Information ===' && free -h && echo '=== Disk Usage ===' && df -h && echo '=== Load Average ===' && uptime"
}

# Function to check service status
show_service_status() {
    echo ""
    echo -e "${BLUE}🔧 Service Status:${NC}"
    echo "PM2 Services:"
    ssh $VM_USER@$VM_HOST "pm2 status"

    echo ""
    echo "System Services:"
    ssh $VM_USER@$VM_HOST "systemctl status postgresql redis-server nginx --no-pager -l"
}

# Function to show application logs
show_application_logs() {
    echo ""
    echo -e "${BLUE}📜 Recent Application Logs:${NC}"
    ssh $VM_USER@$VM_HOST "cd $APP_DIR && pm2 logs permoney-backend --lines 20 --nostream"
}

# Function to show database status
show_database_status() {
    echo ""
    echo -e "${BLUE}🗄️ Database Status:${NC}"
    ssh $VM_USER@$VM_HOST "cd $APP_DIR && npx prisma studio --port 5555" &
    echo "Prisma Studio starting on port 5555..."
    echo "Access: http://$VM_HOST:5555"

    echo ""
    echo "Database connections:"
    ssh $VM_USER@$VM_HOST "ss -tuln | grep :5432"

    echo ""
    echo "Database size:"
    ssh $VM_USER@$VM_HOST "psql -U permoney -d permoney -c 'SELECT schemaname, tablename, attname, n_distinct, correlation FROM pg_stats WHERE schemaname = '\''public'\'' ORDER BY tablename, attname;' | head -20"
}

# Function to show Redis cache status
show_redis_status() {
    echo ""
    echo -e "${BLUE}🚀 Redis Cache Status:${NC}"
    ssh $VM_USER@$VM_HOST "redis-cli INFO server | grep -E '(redis_version|uptime_in_days|connected_clients|used_memory_human|used_memory_peak_human|maxmemory_human|evicted_keys|keyspace_hits|keyspace_misses)'"

    echo ""
    echo "Cache hit rate:"
    ssh $VM_USER@$VM_HOST "redis-cli INFO stats | grep -E '(keyspace_hits|keyspace_misses)' | awk '{print \$1, \$2}'"
}

# Function to show network performance
show_network_performance() {
    echo ""
    echo -e "${BLUE}🌐 Network Performance:${NC}"
    ssh $VM_USER@$VM_HOST "echo '=== Network Interfaces ===' && ip addr show | grep 'inet ' && echo '=== Active Connections ===' && ss -tuln | wc -l && echo '=== Network Statistics ===' && cat /proc/net/dev | grep eth0"
}

# Function to show performance metrics
show_performance_metrics() {
    echo ""
    echo -e "${BLUE}⚡ Performance Metrics:${NC}"

    # CPU usage
    echo "Top CPU consuming processes:"
    ssh $VM_USER@$VM_HOST "ps aux --sort=-%cpu | head -10"

    echo ""
    echo "Top memory consuming processes:"
    ssh $VM_USER@$VM_HOST "ps aux --sort=-%mem | head -10"

    echo ""
    echo "Disk I/O statistics:"
    ssh $VM_USER@$VM_HOST "iostat -x 1 2 | tail -3"

    echo ""
    echo "Network I/O statistics:"
    ssh $VM_USER@$VM_HOST "sar -n DEV 1 2 | tail -3"
}

# Function to run health checks
run_health_checks() {
    echo ""
    echo -e "${BLUE}🏥 Health Checks:${NC}"

    # API health check
    echo "API Health Check:"
    if curl -s http://$VM_HOST:3001/health > /dev/null; then
        echo -e "${GREEN}✅ API is healthy${NC}"
    else
        echo -e "${RED}❌ API is not responding${NC}"
    fi

    # Database health check
    echo "Database Health Check:"
    if ssh $VM_USER@$VM_HOST "pg_isready -U permoney -d permoney" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Database is healthy${NC}"
    else
        echo -e "${RED}❌ Database is not responding${NC}"
    fi

    # Redis health check
    echo "Redis Health Check:"
    if ssh $VM_USER@$VM_HOST "redis-cli ping" | grep -q PONG; then
        echo -e "${GREEN}✅ Redis is healthy${NC}"
    else
        echo -e "${RED}❌ Redis is not responding${NC}"
    fi
}

# Function to show recommendations
show_recommendations() {
    echo ""
    echo -e "${BLUE}💡 Optimization Recommendations:${NC}"

    # Memory usage check
    MEMORY_USAGE=$(ssh $VM_USER@$VM_HOST "free | grep Mem | awk '{printf \"%.0f\", \$3/\$2 * 100.0}'")
    if [ "$MEMORY_USAGE" -gt 80 ]; then
        echo -e "${YELLOW}⚠️ High memory usage detected (${MEMORY_USAGE}%)${NC}"
        echo "   Consider optimizing application memory usage"
    fi

    # CPU usage check
    LOAD_AVG=$(ssh $VM_USER@$VM_HOST "uptime | awk '{print \$NF}'")
    if (( $(echo "$LOAD_AVG > 4.0" | bc -l) )); then
        echo -e "${YELLOW}⚠️ High CPU load detected (${LOAD_AVG})${NC}"
        echo "   Consider scaling or optimizing CPU-intensive operations"
    fi

    # Disk space check
    DISK_USAGE=$(ssh $VM_USER@$VM_HOST "df / | tail -1 | awk '{print \$5}' | sed 's/%//'")
    if [ "$DISK_USAGE" -gt 85 ]; then
        echo -e "${YELLOW}⚠️ High disk usage detected (${DISK_USAGE}%)${NC}"
        echo "   Consider cleaning up logs or adding storage"
    fi

    echo ""
    echo -e "${GREEN}✅ Performance monitoring complete!${NC}"
}

# Main monitoring function
main() {
    check_vm_connection

    case "${1:-all}" in
        "system")
            show_system_resources
            ;;
        "services")
            show_service_status
            ;;
        "logs")
            show_application_logs
            ;;
        "database")
            show_database_status
            ;;
        "redis")
            show_redis_status
            ;;
        "network")
            show_network_performance
            ;;
        "performance")
            show_performance_metrics
            ;;
        "health")
            run_health_checks
            ;;
        "recommend")
            show_recommendations
            ;;
        "all")
            show_system_resources
            show_service_status
            show_application_logs
            show_database_status
            show_redis_status
            show_network_performance
            show_performance_metrics
            run_health_checks
            show_recommendations
            ;;
        *)
            echo "Usage: $0 {system|services|logs|database|redis|network|performance|health|recommend|all}"
            echo ""
            echo "Examples:"
            echo "  $0 all          # Complete monitoring report"
            echo "  $0 health       # Quick health check"
            echo "  $0 performance  # Detailed performance metrics"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
