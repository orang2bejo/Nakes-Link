// Load Testing Configuration for Nakes Link Platform
// This configuration defines various load testing scenarios

const config = {
  // Base configuration
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  apiUrl: process.env.API_URL || 'http://localhost:3001/api',
  
  // Test environment settings
  environment: process.env.NODE_ENV || 'testing',
  
  // Database configuration for test data
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || 'nakeslink_test',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password'
  },
  
  // Load testing scenarios
  scenarios: {
    // Basic load test - normal usage
    basic: {
      name: 'Basic Load Test',
      description: 'Simulates normal user behavior',
      duration: '5m',
      users: {
        rampUp: 50,
        steady: 100,
        rampDown: 50
      },
      thresholds: {
        http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
        http_req_failed: ['rate<0.1'],     // Error rate under 10%
        http_reqs: ['rate>10']             // At least 10 requests per second
      }
    },
    
    // Stress test - high load
    stress: {
      name: 'Stress Test',
      description: 'Tests system under high load',
      duration: '10m',
      users: {
        rampUp: 100,
        steady: 500,
        rampDown: 100
      },
      thresholds: {
        http_req_duration: ['p(95)<5000'], // 95% of requests under 5s
        http_req_failed: ['rate<0.2'],     // Error rate under 20%
        http_reqs: ['rate>50']             // At least 50 requests per second
      }
    },
    
    // Spike test - sudden load increase
    spike: {
      name: 'Spike Test',
      description: 'Tests system response to sudden load spikes',
      duration: '3m',
      users: {
        rampUp: 10,
        steady: 1000,
        rampDown: 10
      },
      thresholds: {
        http_req_duration: ['p(95)<10000'], // 95% of requests under 10s
        http_req_failed: ['rate<0.3'],      // Error rate under 30%
        http_reqs: ['rate>100']             // At least 100 requests per second
      }
    },
    
    // Volume test - large data processing
    volume: {
      name: 'Volume Test',
      description: 'Tests system with large amounts of data',
      duration: '15m',
      users: {
        rampUp: 20,
        steady: 200,
        rampDown: 20
      },
      thresholds: {
        http_req_duration: ['p(95)<3000'], // 95% of requests under 3s
        http_req_failed: ['rate<0.15'],    // Error rate under 15%
        http_reqs: ['rate>20']             // At least 20 requests per second
      }
    },
    
    // Endurance test - long duration
    endurance: {
      name: 'Endurance Test',
      description: 'Tests system stability over extended period',
      duration: '60m',
      users: {
        rampUp: 30,
        steady: 150,
        rampDown: 30
      },
      thresholds: {
        http_req_duration: ['p(95)<2500'], // 95% of requests under 2.5s
        http_req_failed: ['rate<0.1'],     // Error rate under 10%
        http_reqs: ['rate>15']             // At least 15 requests per second
      }
    }
  },
  
  // User behavior patterns
  userBehaviors: {
    patient: {
      name: 'Patient User',
      weight: 60, // 60% of users are patients
      actions: [
        { name: 'register', weight: 5 },
        { name: 'login', weight: 20 },
        { name: 'searchDoctors', weight: 15 },
        { name: 'bookConsultation', weight: 10 },
        { name: 'joinConsultation', weight: 8 },
        { name: 'viewHistory', weight: 12 },
        { name: 'updateProfile', weight: 5 },
        { name: 'makePayment', weight: 8 },
        { name: 'downloadPrescription', weight: 7 },
        { name: 'logout', weight: 10 }
      ]
    },
    
    healthcare: {
      name: 'Healthcare Professional',
      weight: 35, // 35% of users are healthcare professionals
      actions: [
        { name: 'login', weight: 25 },
        { name: 'viewSchedule', weight: 15 },
        { name: 'acceptConsultation', weight: 12 },
        { name: 'conductConsultation', weight: 10 },
        { name: 'writePrescription', weight: 8 },
        { name: 'updateAvailability', weight: 8 },
        { name: 'viewPatientHistory', weight: 10 },
        { name: 'generateReport', weight: 7 },
        { name: 'logout', weight: 5 }
      ]
    },
    
    admin: {
      name: 'Admin User',
      weight: 5, // 5% of users are admins
      actions: [
        { name: 'login', weight: 20 },
        { name: 'viewDashboard', weight: 15 },
        { name: 'verifyHealthcare', weight: 12 },
        { name: 'manageUsers', weight: 10 },
        { name: 'viewReports', weight: 15 },
        { name: 'manageContent', weight: 8 },
        { name: 'systemMonitoring', weight: 10 },
        { name: 'auditLogs', weight: 5 },
        { name: 'logout', weight: 5 }
      ]
    }
  },
  
  // API endpoints to test
  endpoints: {
    auth: {
      login: '/auth/login',
      register: '/auth/register',
      logout: '/auth/logout',
      refresh: '/auth/refresh',
      verify: '/auth/verify'
    },
    
    users: {
      profile: '/users/profile',
      update: '/users/update',
      list: '/users/list',
      search: '/users/search'
    },
    
    healthcare: {
      list: '/healthcare/list',
      profile: '/healthcare/profile',
      availability: '/healthcare/availability',
      verification: '/healthcare/verification'
    },
    
    consultations: {
      create: '/consultations/create',
      list: '/consultations/list',
      join: '/consultations/join',
      end: '/consultations/end',
      history: '/consultations/history'
    },
    
    payments: {
      create: '/payments/create',
      process: '/payments/process',
      history: '/payments/history',
      refund: '/payments/refund'
    },
    
    prescriptions: {
      create: '/prescriptions/create',
      list: '/prescriptions/list',
      download: '/prescriptions/download'
    },
    
    admin: {
      dashboard: '/admin/dashboard',
      users: '/admin/users',
      reports: '/admin/reports',
      audit: '/admin/audit'
    },
    
    emergency: {
      trigger: '/emergency/trigger',
      status: '/emergency/status',
      history: '/emergency/history'
    }
  },
  
  // Test data configuration
  testData: {
    patients: {
      count: 1000,
      template: {
        name: 'Patient {{index}}',
        email: 'patient{{index}}@test.com',
        phone: '+6281{{randomDigits(8)}}',
        nik: '{{randomDigits(16)}}',
        dateOfBirth: '{{randomDate}}',
        gender: '{{randomGender}}',
        address: 'Test Address {{index}}'
      }
    },
    
    healthcare: {
      count: 200,
      template: {
        name: 'Dr. {{firstName}} {{lastName}}',
        email: 'doctor{{index}}@test.com',
        phone: '+6281{{randomDigits(8)}}',
        nik: '{{randomDigits(16)}}',
        str: 'STR{{randomDigits(10)}}',
        sip: 'SIP{{randomDigits(10)}}',
        specialization: '{{randomSpecialization}}',
        experience: '{{randomNumber(1,30)}}',
        hospital: 'Hospital {{randomNumber(1,50)}}'
      }
    },
    
    admins: {
      count: 10,
      template: {
        name: 'Admin {{index}}',
        email: 'admin{{index}}@test.com',
        phone: '+6281{{randomDigits(8)}}',
        role: 'admin'
      }
    }
  },
  
  // Performance metrics to collect
  metrics: {
    response_time: {
      p50: 'Response time 50th percentile',
      p90: 'Response time 90th percentile',
      p95: 'Response time 95th percentile',
      p99: 'Response time 99th percentile'
    },
    
    throughput: {
      rps: 'Requests per second',
      rpm: 'Requests per minute'
    },
    
    errors: {
      rate: 'Error rate percentage',
      count: 'Total error count',
      types: 'Error types breakdown'
    },
    
    resources: {
      cpu: 'CPU utilization',
      memory: 'Memory usage',
      disk: 'Disk I/O',
      network: 'Network I/O'
    },
    
    database: {
      connections: 'Active database connections',
      queries: 'Database queries per second',
      slow_queries: 'Slow query count'
    }
  },
  
  // Monitoring and alerting
  monitoring: {
    enabled: true,
    interval: 5000, // 5 seconds
    
    alerts: {
      response_time_threshold: 5000, // 5 seconds
      error_rate_threshold: 0.1,     // 10%
      cpu_threshold: 80,             // 80%
      memory_threshold: 85,          // 85%
      disk_threshold: 90             // 90%
    },
    
    notifications: {
      email: {
        enabled: true,
        recipients: ['admin@nakeslink.com', 'devops@nakeslink.com']
      },
      
      slack: {
        enabled: false,
        webhook: process.env.SLACK_WEBHOOK
      }
    }
  },
  
  // Report configuration
  reporting: {
    enabled: true,
    formats: ['html', 'json', 'csv'],
    outputDir: './performance/reports',
    
    charts: {
      enabled: true,
      types: ['line', 'bar', 'pie'],
      metrics: ['response_time', 'throughput', 'errors', 'resources']
    },
    
    comparison: {
      enabled: true,
      baseline: './performance/baseline',
      threshold: 0.1 // 10% degradation threshold
    }
  },
  
  // Integration settings
  integrations: {
    grafana: {
      enabled: false,
      url: process.env.GRAFANA_URL,
      apiKey: process.env.GRAFANA_API_KEY
    },
    
    prometheus: {
      enabled: false,
      url: process.env.PROMETHEUS_URL,
      pushGateway: process.env.PROMETHEUS_PUSH_GATEWAY
    },
    
    newrelic: {
      enabled: false,
      apiKey: process.env.NEWRELIC_API_KEY,
      appId: process.env.NEWRELIC_APP_ID
    }
  }
};

// Helper functions for test data generation
const helpers = {
  randomDigits: (length) => {
    return Math.random().toString().substr(2, length);
  },
  
  randomDate: () => {
    const start = new Date(1970, 0, 1);
    const end = new Date(2005, 11, 31);
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  },
  
  randomGender: () => {
    return Math.random() > 0.5 ? 'male' : 'female';
  },
  
  randomSpecialization: () => {
    const specializations = [
      'General Practice', 'Internal Medicine', 'Pediatrics', 'Cardiology',
      'Dermatology', 'Neurology', 'Psychiatry', 'Orthopedics',
      'Gynecology', 'Ophthalmology', 'ENT', 'Radiology'
    ];
    return specializations[Math.floor(Math.random() * specializations.length)];
  },
  
  randomNumber: (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
  
  randomFirstName: () => {
    const names = [
      'Ahmad', 'Budi', 'Citra', 'Dewi', 'Eko', 'Fitri', 'Gunawan', 'Hani',
      'Indra', 'Joko', 'Kartika', 'Lestari', 'Made', 'Novi', 'Omar', 'Putri'
    ];
    return names[Math.floor(Math.random() * names.length)];
  },
  
  randomLastName: () => {
    const names = [
      'Pratama', 'Sari', 'Wijaya', 'Kusuma', 'Santoso', 'Lestari',
      'Permana', 'Handayani', 'Setiawan', 'Rahayu', 'Kurniawan', 'Safitri'
    ];
    return names[Math.floor(Math.random() * names.length)];
  }
};

module.exports = {
  config,
  helpers
};