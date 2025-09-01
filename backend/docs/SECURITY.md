# Nakes Link Security Documentation

## Overview

This document outlines the comprehensive security measures implemented in the Nakes Link healthcare platform to protect sensitive patient data, ensure HIPAA compliance, and maintain the highest standards of information security.

## Table of Contents

1. [Security Architecture](#security-architecture)
2. [Data Encryption](#data-encryption)
3. [Authentication & Authorization](#authentication--authorization)
4. [Input Validation & Sanitization](#input-validation--sanitization)
5. [API Security](#api-security)
6. [Database Security](#database-security)
7. [File Upload Security](#file-upload-security)
8. [Session Management](#session-management)
9. [Audit Logging](#audit-logging)
10. [Security Testing](#security-testing)
11. [Incident Response](#incident-response)
12. [Compliance](#compliance)

## Security Architecture

### Defense in Depth

Nakes Link implements a multi-layered security approach:

```
┌─────────────────────────────────────────┐
│              WAF/CDN Layer              │
├─────────────────────────────────────────┤
│           Load Balancer/Proxy           │
├─────────────────────────────────────────┤
│          Application Security           │
│  • Rate Limiting                        │
│  • Input Validation                     │
│  • Authentication                       │
│  • Authorization                        │
├─────────────────────────────────────────┤
│            Data Layer Security          │
│  • Encryption at Rest                   │
│  • Encryption in Transit                │
│  • Database Access Controls             │
└─────────────────────────────────────────┘
```

### Security Components

- **Encryption Service**: AES-256-GCM encryption for sensitive data
- **Authentication**: JWT-based with refresh tokens
- **Authorization**: Role-based access control (RBAC)
- **Input Validation**: Comprehensive sanitization and validation
- **Rate Limiting**: Multiple tiers of rate limiting
- **Audit Logging**: Comprehensive security event logging

## Data Encryption

### Encryption at Rest

#### Sensitive Fields

The following fields are automatically encrypted before storage:

**User Model:**
- `nik` (National ID Number)
- `phone` (Phone number)
- `address` (Physical address)
- `emergencyContact` (Emergency contact information)

**Nakes Model:**
- `str` (Medical license number)
- `sipNumber` (Practice permit number)
- `bankAccount` (Bank account details)

**Medical Records:**
- `diagnosis` (Medical diagnosis)
- `treatment` (Treatment information)
- `notes` (Medical notes)
- `prescription` (Prescription details)

**Payment Information:**
- `cardNumber` (Credit card numbers)
- `bankAccount` (Bank account numbers)

**Chat Messages:**
- `message` (Chat message content)

#### Implementation

```javascript
const { FieldEncryption } = require('../utils/encryption');
const fieldEncryption = new FieldEncryption();

// Encrypt before saving
const encryptedData = await fieldEncryption.encryptFields('User', userData);

// Decrypt after retrieval
const decryptedData = await fieldEncryption.decryptFields('User', encryptedData);
```

### Encryption in Transit

- **TLS 1.3**: All communications use TLS 1.3 encryption
- **HSTS**: HTTP Strict Transport Security enforced
- **Certificate Pinning**: API clients use certificate pinning

### Key Management

- **Master Key**: Stored securely in environment variables
- **Key Derivation**: PBKDF2 with 100,000 iterations
- **Key Rotation**: Automated key rotation every 90 days
- **Key Validation**: Entropy and strength validation

```javascript
const { KeyManagement } = require('../utils/encryption');
const keyManager = new KeyManagement();

// Validate key strength
const validation = keyManager.validateKeyStrength(key);

// Rotate keys
const rotation = await keyManager.rotateKeys();
```

## Authentication & Authorization

### Authentication Flow

1. **User Registration**:
   - Email verification required
   - Strong password policy enforced
   - Account activation via secure token

2. **Login Process**:
   - Rate limiting (5 attempts per 15 minutes)
   - Account lockout after failed attempts
   - JWT token generation with refresh token

3. **Token Management**:
   - Access tokens: 15 minutes expiry
   - Refresh tokens: 7 days expiry
   - Token blacklisting on logout

### Authorization (RBAC)

#### Roles

- **Patient**: Basic user with access to own data
- **Nakes**: Healthcare provider with extended permissions
- **Admin**: Administrative access to system management

#### Permissions Matrix

| Resource | Patient | Nakes | Admin |
|----------|---------|-------|-------|
| Own Profile | R/W | R/W | R/W |
| Other Profiles | - | R (limited) | R/W |
| Medical Records | R (own) | R/W | R/W |
| Appointments | R/W (own) | R/W | R/W |
| Payments | R (own) | R (own) | R/W |
| System Settings | - | - | R/W |

### Implementation

```javascript
const { authenticate, authorize } = require('../middleware/auth');

// Protect route with authentication
router.get('/profile', authenticate, getProfile);

// Protect route with role-based authorization
router.get('/admin/users', authenticate, authorize(['admin']), getUsers);
```

## Input Validation & Sanitization

### Validation Rules

#### Email Validation
```javascript
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
```

#### Phone Number Validation
```javascript
const phoneRegex = /^(\+62|62|0)[0-9]{9,13}$/;
```

#### NIK Validation
```javascript
const nikRegex = /^[0-9]{16}$/;
```

#### Password Policy
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character
- No common passwords

### XSS Prevention

```javascript
const { InputSanitizer } = require('../config/security');

// Sanitize user input
const sanitized = InputSanitizer.sanitizeString(userInput);
```

### SQL Injection Prevention

- **Parameterized Queries**: All database queries use parameterization
- **ORM Usage**: Mongoose ODM provides built-in protection
- **Input Validation**: All inputs validated before database operations

## API Security

### Rate Limiting

#### Tiers

1. **General API**: 100 requests per 15 minutes
2. **Authentication**: 5 requests per 15 minutes
3. **Strict Endpoints**: 10 requests per hour
4. **File Upload**: 5 uploads per hour

```javascript
const { rateLimitGeneral, rateLimitAuth } = require('../middleware/security');

app.use('/api/', rateLimitGeneral);
app.use('/api/auth/', rateLimitAuth);
```

### CORS Configuration

```javascript
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
```

### Security Headers

```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

## Database Security

### MongoDB Security

1. **Authentication**: Database user authentication enabled
2. **Authorization**: Role-based database access
3. **Encryption**: MongoDB encryption at rest
4. **Network Security**: Database accessible only from application servers

### Connection Security

```javascript
const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  ssl: true,
  sslValidate: true,
  authSource: 'admin',
  retryWrites: true,
  w: 'majority'
};
```

### Data Masking

```javascript
const { DataSanitization } = require('../utils/encryption');

// Mask sensitive data for display
const maskedNIK = DataSanitization.maskSensitiveData(nik, 'nik');
// Result: "1234********3456"
```

## File Upload Security

### File Type Validation

```javascript
const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
const allowedDocumentTypes = ['application/pdf', 'application/msword'];
```

### File Size Limits

- **Images**: 5MB maximum
- **Documents**: 10MB maximum
- **Total per request**: 25MB maximum

### File Scanning

- **Virus Scanning**: All uploaded files scanned for malware
- **Content Validation**: File headers validated
- **Filename Sanitization**: Filenames sanitized to prevent path traversal

```javascript
const multer = require('multer');
const { fileFilter, limits } = require('../config/security');

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits
});
```

## Session Management

### JWT Configuration

```javascript
const jwtOptions = {
  expiresIn: '15m', // Access token
  issuer: 'nakes-link',
  audience: 'nakes-link-users',
  algorithm: 'HS256'
};

const refreshTokenOptions = {
  expiresIn: '7d', // Refresh token
  issuer: 'nakes-link',
  audience: 'nakes-link-users'
};
```

### Token Blacklisting

```javascript
const blacklistedTokens = new Set();

// Blacklist token on logout
const blacklistToken = (token) => {
  blacklistedTokens.add(token);
};

// Check if token is blacklisted
const isTokenBlacklisted = (token) => {
  return blacklistedTokens.has(token);
};
```

## Audit Logging

### Security Events

The following events are logged for security monitoring:

- Authentication attempts (success/failure)
- Authorization failures
- Data access (sensitive data)
- Data modifications
- Administrative actions
- File uploads/downloads
- API rate limit violations
- Security policy violations

### Log Format

```javascript
const securityLog = {
  timestamp: new Date().toISOString(),
  event: 'authentication_failure',
  userId: 'user123',
  ip: '192.168.1.100',
  userAgent: 'Mozilla/5.0...',
  details: {
    reason: 'invalid_password',
    attempts: 3
  },
  severity: 'medium'
};
```

### Log Storage

- **Local Storage**: Application logs stored locally
- **Centralized Logging**: Logs forwarded to centralized system
- **Log Retention**: 1 year retention for security logs
- **Log Encryption**: Sensitive log data encrypted

## Security Testing

### Automated Testing

1. **Unit Tests**: Security function testing
2. **Integration Tests**: API security testing
3. **OWASP ZAP**: Automated vulnerability scanning
4. **Dependency Scanning**: Regular dependency vulnerability checks

### Manual Testing

1. **Penetration Testing**: Quarterly external pen tests
2. **Code Review**: Security-focused code reviews
3. **Configuration Review**: Security configuration audits

### Running Security Tests

```bash
# Run security test suite
npm run test:security

# Run OWASP ZAP scan
node scripts/security-audit.js

# Check for vulnerable dependencies
npm audit

# Run static security analysis
npm run security:scan
```

## Incident Response

### Security Incident Classification

1. **Critical**: Data breach, system compromise
2. **High**: Unauthorized access, service disruption
3. **Medium**: Security policy violation, suspicious activity
4. **Low**: Failed authentication attempts, minor policy violations

### Response Procedures

1. **Detection**: Automated monitoring and manual reporting
2. **Assessment**: Incident severity and impact evaluation
3. **Containment**: Immediate threat containment
4. **Investigation**: Forensic analysis and root cause identification
5. **Recovery**: System restoration and security improvements
6. **Documentation**: Incident documentation and lessons learned

### Contact Information

- **Security Team**: security@nakeslink.com
- **Emergency Contact**: +62-XXX-XXXX-XXXX
- **Incident Reporting**: incidents@nakeslink.com

## Compliance

### Healthcare Regulations

1. **HIPAA Compliance**: Health Insurance Portability and Accountability Act
2. **Indonesian Health Data Protection**: Local healthcare data regulations
3. **GDPR**: General Data Protection Regulation (for EU users)

### Data Protection Measures

- **Data Minimization**: Collect only necessary data
- **Purpose Limitation**: Use data only for stated purposes
- **Storage Limitation**: Retain data only as long as necessary
- **Accuracy**: Ensure data accuracy and completeness
- **Security**: Implement appropriate security measures
- **Accountability**: Demonstrate compliance with regulations

### Regular Audits

- **Internal Audits**: Monthly security audits
- **External Audits**: Annual compliance audits
- **Penetration Testing**: Quarterly security assessments
- **Vulnerability Assessments**: Continuous vulnerability monitoring

## Security Checklist

### Development

- [ ] Input validation implemented
- [ ] Output encoding implemented
- [ ] Authentication required for protected endpoints
- [ ] Authorization checks implemented
- [ ] Sensitive data encrypted
- [ ] Security headers configured
- [ ] Rate limiting implemented
- [ ] Error handling secure
- [ ] Logging implemented
- [ ] Dependencies updated

### Deployment

- [ ] HTTPS configured
- [ ] Security headers enabled
- [ ] Database secured
- [ ] Environment variables secured
- [ ] Monitoring configured
- [ ] Backup procedures tested
- [ ] Incident response plan ready
- [ ] Security documentation updated

### Maintenance

- [ ] Regular security updates
- [ ] Dependency vulnerability checks
- [ ] Log monitoring
- [ ] Performance monitoring
- [ ] Backup verification
- [ ] Security training completed
- [ ] Compliance audits scheduled
- [ ] Incident response drills conducted

## Security Contacts

- **Security Team Lead**: security-lead@nakeslink.com
- **Development Security**: dev-security@nakeslink.com
- **Compliance Officer**: compliance@nakeslink.com
- **Data Protection Officer**: dpo@nakeslink.com

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [HIPAA Security Rule](https://www.hhs.gov/hipaa/for-professionals/security/)
- [Indonesian Data Protection Regulation](https://www.kominfo.go.id/)

---

**Document Version**: 1.0  
**Last Updated**: 2024-01-XX  
**Next Review**: 2024-04-XX  
**Owner**: Security Team