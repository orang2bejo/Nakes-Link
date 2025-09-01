# Nakes Link - Production Deployment Guide

This guide provides comprehensive instructions for deploying the Nakes Link application to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [SSL Certificate Configuration](#ssl-certificate-configuration)
4. [Database Initialization](#database-initialization)
5. [Deployment Process](#deployment-process)
6. [Monitoring Setup](#monitoring-setup)
7. [Backup Configuration](#backup-configuration)
8. [Security Considerations](#security-considerations)
9. [Troubleshooting](#troubleshooting)
10. [Maintenance](#maintenance)

## Prerequisites

### System Requirements

- **Operating System**: Ubuntu 20.04 LTS or CentOS 8+ (recommended)
- **CPU**: Minimum 4 cores, 8 cores recommended
- **RAM**: Minimum 8GB, 16GB recommended
- **Storage**: Minimum 100GB SSD, 500GB recommended
- **Network**: Static IP address with ports 80, 443, 22 accessible

### Required Software

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install additional tools
sudo apt update
sudo apt install -y curl jq git htop
```

### Domain and DNS Setup

1. **Domain Registration**: Register a domain (e.g., `nakeslink.com`)
2. **DNS Configuration**:
   ```
   A     nakeslink.com           -> YOUR_SERVER_IP
   A     www.nakeslink.com       -> YOUR_SERVER_IP
   A     api.nakeslink.com       -> YOUR_SERVER_IP
   A     monitor.nakeslink.com   -> YOUR_SERVER_IP
   ```

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-org/nakes-link.git
cd nakes-link
```

### 2. Environment Configuration

```bash
# Copy production environment template
cp .env.production .env

# Edit environment variables
nano .env
```

### 3. Required Environment Variables

Update the following critical variables in `.env`:

```bash
# Application
NODE_ENV=production
APP_URL=https://nakeslink.com
API_URL=https://api.nakeslink.com

# Database
DB_HOST=postgres
DB_PASSWORD=STRONG_PASSWORD_HERE

# Security
JWT_SECRET=GENERATE_STRONG_JWT_SECRET
ENCRYPTION_KEY=GENERATE_32_CHAR_ENCRYPTION_KEY
SESSION_SECRET=GENERATE_SESSION_SECRET

# Redis
REDIS_PASSWORD=STRONG_REDIS_PASSWORD

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890

# Push Notifications (Firebase)
FIREBASE_PROJECT_ID=your-firebase-project
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com

# SatuSehat API
SATUSEHAT_CLIENT_ID=your_satusehat_client_id
SATUSEHAT_CLIENT_SECRET=your_satusehat_secret

# PSC 119
PSC119_API_KEY=your_psc119_api_key

# Payment Gateway (Midtrans)
MIDTRANS_SERVER_KEY=your_midtrans_server_key
MIDTRANS_CLIENT_KEY=your_midtrans_client_key

# Monitoring
GRAFANA_PASSWORD=STRONG_GRAFANA_PASSWORD
```

### 4. Generate Secrets

```bash
# Generate JWT Secret (64 characters)
openssl rand -hex 32

# Generate Encryption Key (32 characters)
openssl rand -hex 16

# Generate Session Secret
openssl rand -base64 32
```

## SSL Certificate Configuration

### Option 1: Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt install certbot

# Generate certificates
sudo certbot certonly --standalone -d nakeslink.com -d www.nakeslink.com -d api.nakeslink.com -d monitor.nakeslink.com

# Copy certificates to nginx directory
sudo mkdir -p nginx/ssl
sudo cp /etc/letsencrypt/live/nakeslink.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/nakeslink.com/privkey.pem nginx/ssl/
sudo chown -R $USER:$USER nginx/ssl/
```

### Option 2: Self-Signed Certificates (Development)

```bash
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/privkey.pem \
  -out nginx/ssl/fullchain.pem \
  -subj "/C=ID/ST=Jakarta/L=Jakarta/O=NakesLink/CN=nakeslink.com"
```

### 3. Auto-Renewal Setup (Let's Encrypt)

```bash
# Add cron job for certificate renewal
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

## Database Initialization

### 1. Initialize Database Schema

```bash
# Start only the database service first
docker-compose -f docker-compose.prod.yml up -d postgres

# Wait for database to be ready
sleep 30

# Run initialization script
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d nakes_link -f /docker-entrypoint-initdb.d/init-db.sql
```

### 2. Run Database Migrations

```bash
# Start the application temporarily to run migrations
docker-compose -f docker-compose.prod.yml up -d nakes-link-api

# Run migrations
docker-compose -f docker-compose.prod.yml exec nakes-link-api npm run migrate

# Stop the application
docker-compose -f docker-compose.prod.yml down
```

## Deployment Process

### 1. Automated Deployment

```bash
# Make deployment script executable
chmod +x scripts/deploy.sh

# Run deployment
./scripts/deploy.sh
```

### 2. Manual Deployment Steps

If you prefer manual deployment:

```bash
# 1. Build images
docker-compose -f docker-compose.prod.yml build --no-cache

# 2. Start services
docker-compose -f docker-compose.prod.yml up -d

# 3. Check service status
docker-compose -f docker-compose.prod.yml ps

# 4. View logs
docker-compose -f docker-compose.prod.yml logs -f nakes-link-api
```

### 3. Verify Deployment

```bash
# Check application health
curl -f http://localhost:3000/health

# Check API endpoints
curl -f http://localhost:3000/api/health

# Check database connectivity
docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U postgres

# Check Redis connectivity
docker-compose -f docker-compose.prod.yml exec redis redis-cli ping
```

## Monitoring Setup

### 1. Automated Monitoring Setup

```bash
# Make monitoring setup script executable
chmod +x scripts/setup-monitoring.sh

# Run monitoring setup
./scripts/setup-monitoring.sh
```

### 2. Access Monitoring Dashboards

- **Grafana**: https://monitor.nakeslink.com (admin / your_grafana_password)
- **Prometheus**: http://your-server:9090
- **Application**: https://nakeslink.com

### 3. Configure Alerts

1. **Email Notifications**:
   - Update SMTP settings in `.env`
   - Configure notification channels in Grafana

2. **Slack Integration** (Optional):
   ```bash
   # Add Slack webhook URL to Grafana notification channels
   # Webhook URL: https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
   ```

## Backup Configuration

### 1. Automated Backup Setup

```bash
# Make backup script executable
chmod +x scripts/backup.sh

# Test backup
./scripts/backup.sh

# Setup daily backup cron job
echo "0 2 * * * /path/to/nakes-link/scripts/backup.sh" | crontab -
```

### 2. Backup Storage

```bash
# Configure backup retention
export BACKUP_RETENTION_DAYS=30

# Configure backup location
export BACKUP_DIR="/var/backups/nakes-link"

# Setup remote backup (optional)
# Configure AWS S3, Google Cloud Storage, or similar
```

### 3. Restore from Backup

```bash
# Stop application
docker-compose -f docker-compose.prod.yml down

# Restore database
docker-compose -f docker-compose.prod.yml up -d postgres
cat backups/db_backup_YYYYMMDD_HHMMSS.sql | docker-compose -f docker-compose.prod.yml exec -T postgres psql -U postgres -d nakes_link

# Restore application files
tar -xzf backups/pre_deploy_backup_YYYYMMDD_HHMMSS.tar.gz

# Start application
docker-compose -f docker-compose.prod.yml up -d
```

## Security Considerations

### 1. Firewall Configuration

```bash
# Install and configure UFW
sudo ufw enable
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Optional: Allow specific monitoring ports from specific IPs
# sudo ufw allow from MONITORING_SERVER_IP to any port 9090
```

### 2. Security Headers

The Nginx configuration includes security headers:
- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- X-Frame-Options
- X-Content-Type-Options
- Referrer-Policy

### 3. Database Security

```bash
# Change default PostgreSQL passwords
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -c "ALTER USER postgres PASSWORD 'new_strong_password';"

# Create application-specific database user
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -c "CREATE USER nakes_app WITH PASSWORD 'app_password';"
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE nakes_link TO nakes_app;"
```

### 4. Regular Security Updates

```bash
# Setup automatic security updates
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades

# Update Docker images regularly
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

## Troubleshooting

### Common Issues

#### 1. Application Won't Start

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs nakes-link-api

# Check environment variables
docker-compose -f docker-compose.prod.yml exec nakes-link-api env | grep -E "DB_|REDIS_|JWT_"

# Check database connectivity
docker-compose -f docker-compose.prod.yml exec nakes-link-api npm run test:db
```

#### 2. Database Connection Issues

```bash
# Check PostgreSQL status
docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U postgres

# Check database logs
docker-compose -f docker-compose.prod.yml logs postgres

# Reset database connection
docker-compose -f docker-compose.prod.yml restart postgres
```

#### 3. SSL Certificate Issues

```bash
# Check certificate validity
openssl x509 -in nginx/ssl/fullchain.pem -text -noout

# Test SSL configuration
curl -I https://nakeslink.com

# Renew Let's Encrypt certificates
sudo certbot renew --force-renewal
```

#### 4. Performance Issues

```bash
# Check resource usage
docker stats

# Check application metrics
curl http://localhost:3000/metrics

# Analyze slow queries
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d nakes_link -c "SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"
```

### Log Locations

- **Application Logs**: `docker-compose -f docker-compose.prod.yml logs nakes-link-api`
- **Database Logs**: `docker-compose -f docker-compose.prod.yml logs postgres`
- **Nginx Logs**: `docker-compose -f docker-compose.prod.yml logs nginx`
- **Deployment Logs**: `./logs/deploy.log`
- **Backup Logs**: `./logs/backup.log`

## Maintenance

### Regular Maintenance Tasks

#### Daily
- Monitor application health and performance
- Check backup completion
- Review error logs

#### Weekly
- Update Docker images
- Review security alerts
- Analyze performance metrics
- Clean up old logs and backups

#### Monthly
- Security audit
- Performance optimization
- Capacity planning review
- Update dependencies

### Maintenance Scripts

```bash
# Weekly maintenance script
#!/bin/bash

# Update images
docker-compose -f docker-compose.prod.yml pull

# Restart services with new images
docker-compose -f docker-compose.prod.yml up -d

# Clean up old images
docker image prune -f

# Clean up old logs
find ./logs -name "*.log" -mtime +30 -delete

# Clean up old backups
find ./backups -name "*.tar.gz" -mtime +30 -delete
```

### Scaling Considerations

#### Horizontal Scaling

```yaml
# docker-compose.prod.yml - Scale API instances
nakes-link-api:
  deploy:
    replicas: 3
  # ... rest of configuration
```

#### Database Scaling

- **Read Replicas**: Configure PostgreSQL read replicas
- **Connection Pooling**: Use PgBouncer for connection pooling
- **Caching**: Implement Redis caching for frequently accessed data

#### Load Balancing

- Configure Nginx upstream for multiple API instances
- Use external load balancer (AWS ALB, Google Cloud Load Balancer)
- Implement health checks for load balancer targets

## Support and Documentation

- **Application Documentation**: `/docs`
- **API Documentation**: `https://api.nakeslink.com/docs`
- **Monitoring Dashboards**: `https://monitor.nakeslink.com`
- **Support Email**: `support@nakeslink.com`

---

**Note**: This deployment guide assumes a production environment. For development or staging deployments, adjust the configuration accordingly and use appropriate environment files.

For additional support or questions, please contact the development team or refer to the project documentation.