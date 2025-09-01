#!/bin/bash

# Nakes Link Backup Script
# This script creates backups of PostgreSQL database and application data

set -e

# Configuration
BACKUP_DIR="/backups"
DATE=$(date +"%Y%m%d_%H%M%S")
RETENTION_DAYS=30
DB_HOST="postgres"
DB_PORT="5432"
DB_NAME="${DB_NAME:-nakes_link}"
DB_USER="${DB_USER:-postgres}"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "Starting backup process at $(date)"

# Function to log messages
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to create database backup
backup_database() {
    log "Creating database backup..."
    
    local backup_file="$BACKUP_DIR/db_backup_${DATE}.sql"
    local compressed_file="$backup_file.gz"
    
    # Create database dump
    if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        --no-password --verbose --clean --if-exists --create > "$backup_file"; then
        
        # Compress the backup
        gzip "$backup_file"
        
        log "Database backup created: $compressed_file"
        log "Backup size: $(du -h "$compressed_file" | cut -f1)"
        
        # Verify backup integrity
        if gunzip -t "$compressed_file"; then
            log "Backup integrity verified"
        else
            log "ERROR: Backup integrity check failed"
            exit 1
        fi
    else
        log "ERROR: Database backup failed"
        exit 1
    fi
}

# Function to backup application files
backup_app_data() {
    log "Creating application data backup..."
    
    local app_backup_file="$BACKUP_DIR/app_data_${DATE}.tar.gz"
    
    # Backup uploads, logs, and configuration
    if tar -czf "$app_backup_file" \
        -C /app \
        --exclude='node_modules' \
        --exclude='*.log' \
        --exclude='temp/*' \
        uploads/ logs/ || true; then
        
        log "Application data backup created: $app_backup_file"
        log "Backup size: $(du -h "$app_backup_file" | cut -f1)"
    else
        log "WARNING: Application data backup had issues"
    fi
}

# Function to cleanup old backups
cleanup_old_backups() {
    log "Cleaning up backups older than $RETENTION_DAYS days..."
    
    # Remove old database backups
    find "$BACKUP_DIR" -name "db_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
    
    # Remove old application data backups
    find "$BACKUP_DIR" -name "app_data_*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete
    
    log "Cleanup completed"
}

# Function to send backup notification
send_notification() {
    local status=$1
    local message=$2
    
    # You can integrate with your notification system here
    log "Backup notification: $status - $message"
    
    # Example: Send to webhook or email service
    # curl -X POST "$WEBHOOK_URL" -H "Content-Type: application/json" \
    #   -d "{\"status\": \"$status\", \"message\": \"$message\", \"timestamp\": \"$(date -Iseconds)\"}"
}

# Function to create backup manifest
create_manifest() {
    log "Creating backup manifest..."
    
    local manifest_file="$BACKUP_DIR/backup_manifest_${DATE}.json"
    
    cat > "$manifest_file" << EOF
{
  "backup_date": "$(date -Iseconds)",
  "database": {
    "host": "$DB_HOST",
    "database": "$DB_NAME",
    "backup_file": "db_backup_${DATE}.sql.gz"
  },
  "application_data": {
    "backup_file": "app_data_${DATE}.tar.gz"
  },
  "retention_days": $RETENTION_DAYS,
  "backup_script_version": "1.0"
}
EOF
    
    log "Backup manifest created: $manifest_file"
}

# Main backup process
main() {
    log "=== Nakes Link Backup Process Started ==="
    
    # Check if PostgreSQL is available
    if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME"; then
        log "ERROR: PostgreSQL is not available"
        send_notification "FAILED" "Database is not available for backup"
        exit 1
    fi
    
    # Perform backups
    backup_database
    backup_app_data
    create_manifest
    cleanup_old_backups
    
    # Calculate total backup size
    local total_size=$(du -sh "$BACKUP_DIR" | cut -f1)
    log "Total backup directory size: $total_size"
    
    log "=== Backup Process Completed Successfully ==="
    send_notification "SUCCESS" "Backup completed successfully. Total size: $total_size"
}

# Error handling
trap 'log "ERROR: Backup process failed at line $LINENO"; send_notification "FAILED" "Backup process failed"; exit 1' ERR

# Run main function
main

exit 0