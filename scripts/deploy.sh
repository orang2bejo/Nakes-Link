#!/bin/bash

# Nakes Link Production Deployment Script
# This script automates the deployment process for the Nakes Link application

set -e

# Configuration
APP_NAME="nakes-link"
DOCKER_COMPOSE_FILE="docker-compose.prod.yml"
BACKUP_DIR="./backups"
DEPLOY_LOG="./logs/deploy.log"
HEALTH_CHECK_URL="http://localhost:3000/health"
MAX_HEALTH_CHECK_ATTEMPTS=30
HEALTH_CHECK_INTERVAL=10

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create logs directory if it doesn't exist
mkdir -p "$(dirname "$DEPLOY_LOG")"

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
    
    echo "[$timestamp] [$level] $message" >> "$DEPLOY_LOG"
}

# Error handling
error_exit() {
    log "ERROR" "$1"
    log "ERROR" "Deployment failed. Check logs for details."
    exit 1
}

# Cleanup function
cleanup() {
    log "INFO" "Performing cleanup..."
    # Add any cleanup tasks here
}

# Trap errors and cleanup
trap 'error_exit "Deployment script failed at line $LINENO"' ERR
trap cleanup EXIT

# Function to check if required tools are installed
check_prerequisites() {
    log "INFO" "Checking prerequisites..."
    
    local tools=("docker" "docker-compose" "curl" "jq")
    
    for tool in "${tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            error_exit "Required tool '$tool' is not installed"
        fi
    done
    
    # Check Docker daemon
    if ! docker info &> /dev/null; then
        error_exit "Docker daemon is not running"
    fi
    
    log "INFO" "Prerequisites check passed"
}

# Function to validate environment file
validate_environment() {
    log "INFO" "Validating environment configuration..."
    
    if [[ ! -f ".env" ]]; then
        error_exit "Environment file .env not found. Copy .env.production to .env and configure it."
    fi
    
    # Check for required environment variables
    local required_vars=(
        "DB_PASSWORD"
        "JWT_SECRET"
        "ENCRYPTION_KEY"
        "REDIS_PASSWORD"
        "GRAFANA_PASSWORD"
    )
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^$var=" .env || grep -q "^$var=CHANGE_ME" .env; then
            error_exit "Environment variable $var is not properly configured in .env file"
        fi
    done
    
    log "INFO" "Environment validation passed"
}

# Function to create backup before deployment
create_backup() {
    log "INFO" "Creating backup before deployment..."
    
    mkdir -p "$BACKUP_DIR"
    
    local backup_timestamp=$(date +"%Y%m%d_%H%M%S")
    local backup_file="$BACKUP_DIR/pre_deploy_backup_$backup_timestamp.tar.gz"
    
    # Backup current application state
    if docker-compose -f "$DOCKER_COMPOSE_FILE" ps | grep -q "Up"; then
        log "INFO" "Creating database backup..."
        docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T postgres pg_dump -U postgres nakes_link > "$BACKUP_DIR/db_backup_$backup_timestamp.sql"
        
        log "INFO" "Creating application data backup..."
        tar -czf "$backup_file" \
            --exclude='node_modules' \
            --exclude='*.log' \
            --exclude='backups' \
            . || true
        
        log "INFO" "Backup created: $backup_file"
    else
        log "WARN" "No running containers found, skipping backup"
    fi
}

# Function to build Docker images
build_images() {
    log "INFO" "Building Docker images..."
    
    # Build the main application image
    docker-compose -f "$DOCKER_COMPOSE_FILE" build --no-cache nakes-link-api
    
    log "INFO" "Docker images built successfully"
}

# Function to deploy the application
deploy_application() {
    log "INFO" "Deploying application..."
    
    # Stop existing containers
    log "INFO" "Stopping existing containers..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" down --remove-orphans
    
    # Start the application stack
    log "INFO" "Starting application stack..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d
    
    log "INFO" "Application deployment completed"
}

# Function to wait for services to be healthy
wait_for_health() {
    log "INFO" "Waiting for services to become healthy..."
    
    local attempt=1
    
    while [[ $attempt -le $MAX_HEALTH_CHECK_ATTEMPTS ]]; do
        log "DEBUG" "Health check attempt $attempt/$MAX_HEALTH_CHECK_ATTEMPTS"
        
        if curl -f -s "$HEALTH_CHECK_URL" > /dev/null 2>&1; then
            log "INFO" "Application is healthy!"
            return 0
        fi
        
        if [[ $attempt -eq $MAX_HEALTH_CHECK_ATTEMPTS ]]; then
            error_exit "Application failed to become healthy after $MAX_HEALTH_CHECK_ATTEMPTS attempts"
        fi
        
        log "DEBUG" "Waiting ${HEALTH_CHECK_INTERVAL}s before next attempt..."
        sleep $HEALTH_CHECK_INTERVAL
        ((attempt++))
    done
}

# Function to run post-deployment tests
run_post_deployment_tests() {
    log "INFO" "Running post-deployment tests..."
    
    # Test API endpoints
    local endpoints=(
        "/health"
        "/api/health"
    )
    
    for endpoint in "${endpoints[@]}"; do
        local url="http://localhost:3000$endpoint"
        log "DEBUG" "Testing endpoint: $url"
        
        if curl -f -s "$url" > /dev/null; then
            log "INFO" "✅ $endpoint - OK"
        else
            log "WARN" "❌ $endpoint - Failed"
        fi
    done
    
    # Test database connectivity
    log "DEBUG" "Testing database connectivity..."
    if docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T postgres pg_isready -U postgres > /dev/null; then
        log "INFO" "✅ Database connectivity - OK"
    else
        log "WARN" "❌ Database connectivity - Failed"
    fi
    
    # Test Redis connectivity
    log "DEBUG" "Testing Redis connectivity..."
    if docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T redis redis-cli ping | grep -q "PONG"; then
        log "INFO" "✅ Redis connectivity - OK"
    else
        log "WARN" "❌ Redis connectivity - Failed"
    fi
    
    log "INFO" "Post-deployment tests completed"
}

# Function to show deployment summary
show_deployment_summary() {
    log "INFO" "=== DEPLOYMENT SUMMARY ==="
    
    # Show running containers
    log "INFO" "Running containers:"
    docker-compose -f "$DOCKER_COMPOSE_FILE" ps
    
    # Show application URLs
    log "INFO" "Application URLs:"
    log "INFO" "  - Main Application: http://localhost:3000"
    log "INFO" "  - Grafana Dashboard: http://localhost:3001"
    log "INFO" "  - Prometheus Metrics: http://localhost:9090"
    
    # Show logs location
    log "INFO" "Logs location: $DEPLOY_LOG"
    
    # Show next steps
    log "INFO" "Next steps:"
    log "INFO" "  1. Configure SSL certificates in nginx/ssl/"
    log "INFO" "  2. Set up domain DNS to point to this server"
    log "INFO" "  3. Configure monitoring alerts"
    log "INFO" "  4. Set up automated backups"
    log "INFO" "  5. Run load tests"
}

# Function to rollback deployment
rollback_deployment() {
    log "WARN" "Rolling back deployment..."
    
    # Stop current containers
    docker-compose -f "$DOCKER_COMPOSE_FILE" down
    
    # Restore from backup if available
    local latest_backup=$(ls -t "$BACKUP_DIR"/pre_deploy_backup_*.tar.gz 2>/dev/null | head -n1)
    
    if [[ -n "$latest_backup" ]]; then
        log "INFO" "Restoring from backup: $latest_backup"
        # Add restore logic here
    fi
    
    log "WARN" "Rollback completed"
}

# Main deployment function
main() {
    log "INFO" "=== NAKES LINK PRODUCTION DEPLOYMENT ==="
    log "INFO" "Starting deployment at $(date)"
    
    # Parse command line arguments
    local skip_backup=false
    local skip_tests=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-backup)
                skip_backup=true
                shift
                ;;
            --skip-tests)
                skip_tests=true
                shift
                ;;
            --rollback)
                rollback_deployment
                exit 0
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo "Options:"
                echo "  --skip-backup    Skip pre-deployment backup"
                echo "  --skip-tests     Skip post-deployment tests"
                echo "  --rollback       Rollback to previous deployment"
                echo "  --help           Show this help message"
                exit 0
                ;;
            *)
                error_exit "Unknown option: $1"
                ;;
        esac
    done
    
    # Run deployment steps
    check_prerequisites
    validate_environment
    
    if [[ "$skip_backup" != true ]]; then
        create_backup
    fi
    
    build_images
    deploy_application
    wait_for_health
    
    if [[ "$skip_tests" != true ]]; then
        run_post_deployment_tests
    fi
    
    show_deployment_summary
    
    log "INFO" "=== DEPLOYMENT COMPLETED SUCCESSFULLY ==="
    log "INFO" "Deployment finished at $(date)"
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi