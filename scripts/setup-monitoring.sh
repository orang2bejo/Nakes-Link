#!/bin/bash

# Nakes Link Monitoring Setup Script
# This script sets up monitoring dashboards and alerts for the Nakes Link application

set -e

# Configuration
GRAFANA_URL="http://localhost:3001"
PROMETHEUS_URL="http://localhost:9090"
GRAFANA_USER="admin"
ALERT_MANAGER_URL="http://localhost:9093"
SETUP_LOG="./logs/monitoring-setup.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create logs directory if it doesn't exist
mkdir -p "$(dirname "$SETUP_LOG")"

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "INFO")
            echo -e "${GREEN}[INFO]${NC} $message"
            ;;
        "WARN")
            echo -e "${YELLOW}[WARN]${NC} $message"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} $message"
            ;;
        "DEBUG")
            echo -e "${BLUE}[DEBUG]${NC} $message"
            ;;
    esac
    
    echo "[$timestamp] [$level] $message" >> "$SETUP_LOG"
}

# Error handling
error_exit() {
    log "ERROR" "$1"
    exit 1
}

# Function to wait for service to be ready
wait_for_service() {
    local service_name=$1
    local service_url=$2
    local max_attempts=30
    local attempt=1
    
    log "INFO" "Waiting for $service_name to be ready..."
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -f -s "$service_url" > /dev/null 2>&1; then
            log "INFO" "$service_name is ready!"
            return 0
        fi
        
        log "DEBUG" "Attempt $attempt/$max_attempts - $service_name not ready yet"
        sleep 10
        ((attempt++))
    done
    
    error_exit "$service_name failed to become ready after $max_attempts attempts"
}

# Function to get Grafana password from environment
get_grafana_password() {
    if [[ -f ".env" ]]; then
        grep "^GRAFANA_PASSWORD=" .env | cut -d'=' -f2 | tr -d '"'
    else
        echo "admin"
    fi
}

# Function to create Grafana API key
create_grafana_api_key() {
    local grafana_password=$(get_grafana_password)
    
    log "INFO" "Creating Grafana API key..."
    
    local api_key_response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -u "$GRAFANA_USER:$grafana_password" \
        -d '{
            "name": "monitoring-setup",
            "role": "Admin",
            "secondsToLive": 3600
        }' \
        "$GRAFANA_URL/api/auth/keys")
    
    if echo "$api_key_response" | jq -e '.key' > /dev/null 2>&1; then
        echo "$api_key_response" | jq -r '.key'
    else
        error_exit "Failed to create Grafana API key: $api_key_response"
    fi
}

# Function to create Nakes Link Application Dashboard
create_application_dashboard() {
    local api_key=$1
    
    log "INFO" "Creating Nakes Link Application Dashboard..."
    
    local dashboard_json='{
        "dashboard": {
            "id": null,
            "title": "Nakes Link - Application Overview",
            "tags": ["nakes-link", "application"],
            "timezone": "browser",
            "panels": [
                {
                    "id": 1,
                    "title": "API Response Time",
                    "type": "stat",
                    "targets": [
                        {
                            "expr": "histogram_quantile(0.95, rate(http_request_duration_ms_bucket[5m]))",
                            "legendFormat": "95th percentile"
                        }
                    ],
                    "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0}
                },
                {
                    "id": 2,
                    "title": "Request Rate",
                    "type": "stat",
                    "targets": [
                        {
                            "expr": "rate(http_requests_total[5m])",
                            "legendFormat": "Requests/sec"
                        }
                    ],
                    "gridPos": {"h": 8, "w": 12, "x": 12, "y": 0}
                },
                {
                    "id": 3,
                    "title": "Error Rate",
                    "type": "timeseries",
                    "targets": [
                        {
                            "expr": "rate(http_requests_total{status=~\"4..|5..\"}[5m]) / rate(http_requests_total[5m]) * 100",
                            "legendFormat": "Error Rate %"
                        }
                    ],
                    "gridPos": {"h": 8, "w": 24, "x": 0, "y": 8}
                },
                {
                    "id": 4,
                    "title": "Active Users",
                    "type": "stat",
                    "targets": [
                        {
                            "expr": "active_users_total",
                            "legendFormat": "Active Users"
                        }
                    ],
                    "gridPos": {"h": 8, "w": 8, "x": 0, "y": 16}
                },
                {
                    "id": 5,
                    "title": "Database Connections",
                    "type": "stat",
                    "targets": [
                        {
                            "expr": "pg_stat_activity_count",
                            "legendFormat": "DB Connections"
                        }
                    ],
                    "gridPos": {"h": 8, "w": 8, "x": 8, "y": 16}
                },
                {
                    "id": 6,
                    "title": "Queue Length",
                    "type": "stat",
                    "targets": [
                        {
                            "expr": "notification_queue_length",
                            "legendFormat": "Queue Length"
                        }
                    ],
                    "gridPos": {"h": 8, "w": 8, "x": 16, "y": 16}
                }
            ],
            "time": {
                "from": "now-1h",
                "to": "now"
            },
            "refresh": "30s"
        },
        "overwrite": true
    }'
    
    local response=$(curl -s -X POST \
        -H "Authorization: Bearer $api_key" \
        -H "Content-Type: application/json" \
        -d "$dashboard_json" \
        "$GRAFANA_URL/api/dashboards/db")
    
    if echo "$response" | jq -e '.status' | grep -q "success"; then
        log "INFO" "Application dashboard created successfully"
    else
        log "WARN" "Failed to create application dashboard: $response"
    fi
}

# Function to create System Metrics Dashboard
create_system_dashboard() {
    local api_key=$1
    
    log "INFO" "Creating System Metrics Dashboard..."
    
    local dashboard_json='{
        "dashboard": {
            "id": null,
            "title": "Nakes Link - System Metrics",
            "tags": ["nakes-link", "system"],
            "timezone": "browser",
            "panels": [
                {
                    "id": 1,
                    "title": "CPU Usage",
                    "type": "timeseries",
                    "targets": [
                        {
                            "expr": "100 - (avg by (instance) (rate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)",
                            "legendFormat": "CPU Usage %"
                        }
                    ],
                    "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0}
                },
                {
                    "id": 2,
                    "title": "Memory Usage",
                    "type": "timeseries",
                    "targets": [
                        {
                            "expr": "(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100",
                            "legendFormat": "Memory Usage %"
                        }
                    ],
                    "gridPos": {"h": 8, "w": 12, "x": 12, "y": 0}
                },
                {
                    "id": 3,
                    "title": "Disk Usage",
                    "type": "timeseries",
                    "targets": [
                        {
                            "expr": "(1 - (node_filesystem_avail_bytes{fstype!=\"tmpfs\"} / node_filesystem_size_bytes{fstype!=\"tmpfs\"})) * 100",
                            "legendFormat": "Disk Usage % - {{mountpoint}}"
                        }
                    ],
                    "gridPos": {"h": 8, "w": 12, "x": 0, "y": 8}
                },
                {
                    "id": 4,
                    "title": "Network I/O",
                    "type": "timeseries",
                    "targets": [
                        {
                            "expr": "rate(node_network_receive_bytes_total[5m])",
                            "legendFormat": "Receive - {{device}}"
                        },
                        {
                            "expr": "rate(node_network_transmit_bytes_total[5m])",
                            "legendFormat": "Transmit - {{device}}"
                        }
                    ],
                    "gridPos": {"h": 8, "w": 12, "x": 12, "y": 8}
                }
            ],
            "time": {
                "from": "now-1h",
                "to": "now"
            },
            "refresh": "30s"
        },
        "overwrite": true
    }'
    
    local response=$(curl -s -X POST \
        -H "Authorization: Bearer $api_key" \
        -H "Content-Type: application/json" \
        -d "$dashboard_json" \
        "$GRAFANA_URL/api/dashboards/db")
    
    if echo "$response" | jq -e '.status' | grep -q "success"; then
        log "INFO" "System dashboard created successfully"
    else
        log "WARN" "Failed to create system dashboard: $response"
    fi
}

# Function to create Database Dashboard
create_database_dashboard() {
    local api_key=$1
    
    log "INFO" "Creating Database Dashboard..."
    
    local dashboard_json='{
        "dashboard": {
            "id": null,
            "title": "Nakes Link - Database Metrics",
            "tags": ["nakes-link", "database", "postgresql"],
            "timezone": "browser",
            "panels": [
                {
                    "id": 1,
                    "title": "Database Connections",
                    "type": "timeseries",
                    "targets": [
                        {
                            "expr": "pg_stat_activity_count",
                            "legendFormat": "Active Connections"
                        },
                        {
                            "expr": "pg_settings_max_connections",
                            "legendFormat": "Max Connections"
                        }
                    ],
                    "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0}
                },
                {
                    "id": 2,
                    "title": "Query Performance",
                    "type": "timeseries",
                    "targets": [
                        {
                            "expr": "rate(pg_stat_database_tup_returned[5m])",
                            "legendFormat": "Rows Returned/sec"
                        },
                        {
                            "expr": "rate(pg_stat_database_tup_fetched[5m])",
                            "legendFormat": "Rows Fetched/sec"
                        }
                    ],
                    "gridPos": {"h": 8, "w": 12, "x": 12, "y": 0}
                },
                {
                    "id": 3,
                    "title": "Database Size",
                    "type": "stat",
                    "targets": [
                        {
                            "expr": "pg_database_size_bytes{datname=\"nakes_link\"}",
                            "legendFormat": "Database Size"
                        }
                    ],
                    "gridPos": {"h": 8, "w": 8, "x": 0, "y": 8}
                },
                {
                    "id": 4,
                    "title": "Cache Hit Ratio",
                    "type": "stat",
                    "targets": [
                        {
                            "expr": "pg_stat_database_blks_hit / (pg_stat_database_blks_hit + pg_stat_database_blks_read) * 100",
                            "legendFormat": "Cache Hit %"
                        }
                    ],
                    "gridPos": {"h": 8, "w": 8, "x": 8, "y": 8}
                },
                {
                    "id": 5,
                    "title": "Slow Queries",
                    "type": "stat",
                    "targets": [
                        {
                            "expr": "pg_stat_activity_max_tx_duration",
                            "legendFormat": "Longest Query (s)"
                        }
                    ],
                    "gridPos": {"h": 8, "w": 8, "x": 16, "y": 8}
                }
            ],
            "time": {
                "from": "now-1h",
                "to": "now"
            },
            "refresh": "30s"
        },
        "overwrite": true
    }'
    
    local response=$(curl -s -X POST \
        -H "Authorization: Bearer $api_key" \
        -H "Content-Type: application/json" \
        -d "$dashboard_json" \
        "$GRAFANA_URL/api/dashboards/db")
    
    if echo "$response" | jq -e '.status' | grep -q "success"; then
        log "INFO" "Database dashboard created successfully"
    else
        log "WARN" "Failed to create database dashboard: $response"
    fi
}

# Function to setup notification channels
setup_notification_channels() {
    local api_key=$1
    
    log "INFO" "Setting up notification channels..."
    
    # Email notification channel
    local email_channel='{
        "name": "email-alerts",
        "type": "email",
        "settings": {
            "addresses": "admin@nakeslink.com",
            "subject": "Nakes Link Alert"
        }
    }'
    
    local response=$(curl -s -X POST \
        -H "Authorization: Bearer $api_key" \
        -H "Content-Type: application/json" \
        -d "$email_channel" \
        "$GRAFANA_URL/api/alert-notifications")
    
    if echo "$response" | jq -e '.id' > /dev/null 2>&1; then
        log "INFO" "Email notification channel created successfully"
    else
        log "WARN" "Failed to create email notification channel: $response"
    fi
}

# Function to validate Prometheus configuration
validate_prometheus_config() {
    log "INFO" "Validating Prometheus configuration..."
    
    local config_check=$(curl -s "$PROMETHEUS_URL/api/v1/status/config")
    
    if echo "$config_check" | jq -e '.status' | grep -q "success"; then
        log "INFO" "Prometheus configuration is valid"
    else
        log "WARN" "Prometheus configuration validation failed"
    fi
    
    # Check if targets are up
    local targets=$(curl -s "$PROMETHEUS_URL/api/v1/targets")
    local active_targets=$(echo "$targets" | jq -r '.data.activeTargets[] | select(.health == "up") | .labels.job' | wc -l)
    
    log "INFO" "Active Prometheus targets: $active_targets"
}

# Function to test alert rules
test_alert_rules() {
    log "INFO" "Testing alert rules..."
    
    local rules=$(curl -s "$PROMETHEUS_URL/api/v1/rules")
    local rule_count=$(echo "$rules" | jq -r '.data.groups[].rules | length' | awk '{sum += $1} END {print sum}')
    
    log "INFO" "Loaded alert rules: $rule_count"
    
    # Check for any firing alerts
    local alerts=$(curl -s "$PROMETHEUS_URL/api/v1/alerts")
    local firing_alerts=$(echo "$alerts" | jq -r '.data.alerts[] | select(.state == "firing") | .labels.alertname' | wc -l)
    
    if [[ $firing_alerts -gt 0 ]]; then
        log "WARN" "Currently firing alerts: $firing_alerts"
    else
        log "INFO" "No firing alerts"
    fi
}

# Function to show monitoring summary
show_monitoring_summary() {
    log "INFO" "=== MONITORING SETUP SUMMARY ==="
    
    log "INFO" "Grafana Dashboard: $GRAFANA_URL"
    log "INFO" "Prometheus Metrics: $PROMETHEUS_URL"
    
    log "INFO" "Created Dashboards:"
    log "INFO" "  - Nakes Link - Application Overview"
    log "INFO" "  - Nakes Link - System Metrics"
    log "INFO" "  - Nakes Link - Database Metrics"
    
    log "INFO" "Default Credentials:"
    log "INFO" "  - Grafana: admin / $(get_grafana_password)"
    
    log "INFO" "Next Steps:"
    log "INFO" "  1. Configure additional notification channels (Slack, SMS)"
    log "INFO" "  2. Customize alert thresholds based on your requirements"
    log "INFO" "  3. Set up log aggregation (ELK stack or similar)"
    log "INFO" "  4. Configure backup monitoring"
    log "INFO" "  5. Set up external monitoring (uptime checks)"
}

# Main function
main() {
    log "INFO" "=== NAKES LINK MONITORING SETUP ==="
    log "INFO" "Starting monitoring setup at $(date)"
    
    # Check prerequisites
    if ! command -v curl &> /dev/null; then
        error_exit "curl is required but not installed"
    fi
    
    if ! command -v jq &> /dev/null; then
        error_exit "jq is required but not installed"
    fi
    
    # Wait for services to be ready
    wait_for_service "Grafana" "$GRAFANA_URL/api/health"
    wait_for_service "Prometheus" "$PROMETHEUS_URL/api/v1/status/config"
    
    # Create Grafana API key
    local api_key=$(create_grafana_api_key)
    
    # Create dashboards
    create_application_dashboard "$api_key"
    create_system_dashboard "$api_key"
    create_database_dashboard "$api_key"
    
    # Setup notification channels
    setup_notification_channels "$api_key"
    
    # Validate Prometheus
    validate_prometheus_config
    test_alert_rules
    
    # Show summary
    show_monitoring_summary
    
    log "INFO" "=== MONITORING SETUP COMPLETED ==="
    log "INFO" "Setup finished at $(date)"
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi