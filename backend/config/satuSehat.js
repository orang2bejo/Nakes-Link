/**
 * SatuSehat API Configuration
 * Configuration for integrating with Indonesia's SatuSehat health data platform
 */

module.exports = {
  // Base URL for SatuSehat API
  baseUrl: process.env.SATUSEHAT_BASE_URL || 'https://api.satusehat.kemkes.go.id',
  
  // OAuth2 credentials
  clientId: process.env.SATUSEHAT_CLIENT_ID,
  clientSecret: process.env.SATUSEHAT_CLIENT_SECRET,
  
  // API endpoints
  endpoints: {
    // OAuth2 token endpoint
    token: '/oauth2/v1/accesstoken?grant_type=client_credentials',
    
    // NIK verification endpoint
    nikVerification: '/fhir-r4/v1/Patient',
    
    // STR verification endpoint
    strVerification: '/fhir-r4/v1/Practitioner',
    
    // Practitioner qualification endpoint
    practitionerQualification: '/fhir-r4/v1/PractitionerRole',
    
    // Organization endpoint
    organization: '/fhir-r4/v1/Organization'
  },
  
  // Request timeout in milliseconds
  timeout: 30000,
  
  // Retry configuration
  retry: {
    attempts: 3,
    delay: 1000 // milliseconds
  },
  
  // Cache configuration for access tokens
  cache: {
    tokenExpiry: 3600 // seconds (1 hour)
  },
  
  // Validation rules
  validation: {
    nik: {
      length: 16,
      pattern: /^\d{16}$/
    },
    str: {
      minLength: 10,
      maxLength: 20,
      pattern: /^[A-Z0-9]+$/
    }
  },
  
  // Error codes mapping
  errorCodes: {
    INVALID_CREDENTIALS: 'SATUSEHAT_INVALID_CREDENTIALS',
    NIK_NOT_FOUND: 'SATUSEHAT_NIK_NOT_FOUND',
    STR_NOT_FOUND: 'SATUSEHAT_STR_NOT_FOUND',
    STR_EXPIRED: 'SATUSEHAT_STR_EXPIRED',
    STR_SUSPENDED: 'SATUSEHAT_STR_SUSPENDED',
    NETWORK_ERROR: 'SATUSEHAT_NETWORK_ERROR',
    RATE_LIMIT: 'SATUSEHAT_RATE_LIMIT',
    SERVER_ERROR: 'SATUSEHAT_SERVER_ERROR'
  },
  
  // Status mappings
  practitionerStatus: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    SUSPENDED: 'suspended',
    EXPIRED: 'expired'
  },
  
  // FHIR resource types
  resourceTypes: {
    PATIENT: 'Patient',
    PRACTITIONER: 'Practitioner',
    PRACTITIONER_ROLE: 'PractitionerRole',
    ORGANIZATION: 'Organization'
  }
};