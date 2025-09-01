// K6 Load Testing Script for Nakes Link Platform
// This script implements comprehensive load testing scenarios

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { SharedArray } from 'k6/data';
import { randomString, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Import configuration
const config = JSON.parse(open('./load-testing-config.js').replace('module.exports = {', '{').replace('};', '}'));

// Custom metrics
const loginRate = new Rate('login_success_rate');
const consultationRate = new Rate('consultation_success_rate');
const paymentRate = new Rate('payment_success_rate');
const apiResponseTime = new Trend('api_response_time');
const dbQueryTime = new Trend('db_query_time');
const errorCounter = new Counter('custom_errors');

// Test data
const patients = new SharedArray('patients', function() {
  const data = [];
  for (let i = 1; i <= config.config.testData.patients.count; i++) {
    data.push({
      id: i,
      name: `Patient ${i}`,
      email: `patient${i}@test.com`,
      phone: `+6281${randomString(8, '0123456789')}`,
      nik: randomString(16, '0123456789'),
      password: 'TestPassword123!',
      dateOfBirth: '1990-01-01',
      gender: Math.random() > 0.5 ? 'male' : 'female',
      address: `Test Address ${i}`
    });
  }
  return data;
});

const healthcare = new SharedArray('healthcare', function() {
  const data = [];
  const specializations = [
    'General Practice', 'Internal Medicine', 'Pediatrics', 'Cardiology',
    'Dermatology', 'Neurology', 'Psychiatry', 'Orthopedics'
  ];
  
  for (let i = 1; i <= config.config.testData.healthcare.count; i++) {
    data.push({
      id: i,
      name: `Dr. ${randomString(6)} ${randomString(8)}`,
      email: `doctor${i}@test.com`,
      phone: `+6281${randomString(8, '0123456789')}`,
      nik: randomString(16, '0123456789'),
      str: `STR${randomString(10, '0123456789')}`,
      sip: `SIP${randomString(10, '0123456789')}`,
      password: 'TestPassword123!',
      specialization: specializations[randomIntBetween(0, specializations.length - 1)],
      experience: randomIntBetween(1, 30),
      hospital: `Hospital ${randomIntBetween(1, 50)}`
    });
  }
  return data;
});

// Test scenario configuration
const scenarioName = __ENV.SCENARIO || 'basic';
const scenario = config.config.scenarios[scenarioName];

export const options = {
  scenarios: {
    [scenarioName]: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: scenario.users.rampUp },
        { duration: scenario.duration, target: scenario.users.steady },
        { duration: '2m', target: scenario.users.rampDown },
      ],
    },
  },
  thresholds: scenario.thresholds,
  
  // Additional thresholds for custom metrics
  'login_success_rate': ['rate>0.9'],
  'consultation_success_rate': ['rate>0.85'],
  'payment_success_rate': ['rate>0.95'],
  'api_response_time': ['p(95)<3000'],
  'custom_errors': ['count<100'],
};

// Global variables
let authToken = '';
let userId = '';
let userType = '';

// Setup function - runs once per VU
export function setup() {
  console.log(`Starting ${scenario.name} - ${scenario.description}`);
  console.log(`Target: ${scenario.users.steady} users for ${scenario.duration}`);
  
  // Warm up the system
  const warmupResponse = http.get(`${config.config.baseUrl}/health`);
  check(warmupResponse, {
    'warmup successful': (r) => r.status === 200,
  });
  
  return {
    baseUrl: config.config.baseUrl,
    apiUrl: config.config.apiUrl,
    scenario: scenario
  };
}

// Main test function
export default function(data) {
  // Determine user type based on weights
  const userTypeRandom = Math.random();
  if (userTypeRandom < 0.6) {
    userType = 'patient';
  } else if (userTypeRandom < 0.95) {
    userType = 'healthcare';
  } else {
    userType = 'admin';
  }
  
  // Execute user journey based on type
  switch (userType) {
    case 'patient':
      patientJourney(data);
      break;
    case 'healthcare':
      healthcareJourney(data);
      break;
    case 'admin':
      adminJourney(data);
      break;
  }
  
  // Random sleep between 1-5 seconds
  sleep(randomIntBetween(1, 5));
}

// Patient user journey
function patientJourney(data) {
  group('Patient Journey', function() {
    // Login or Register
    if (Math.random() > 0.8) {
      registerPatient(data);
    } else {
      loginUser(data, 'patient');
    }
    
    if (authToken) {
      // Search for doctors
      searchDoctors(data);
      
      // Book consultation (30% chance)
      if (Math.random() < 0.3) {
        bookConsultation(data);
        
        // Make payment if consultation booked
        if (Math.random() < 0.8) {
          makePayment(data);
        }
      }
      
      // View history (40% chance)
      if (Math.random() < 0.4) {
        viewConsultationHistory(data);
      }
      
      // Update profile (20% chance)
      if (Math.random() < 0.2) {
        updateProfile(data);
      }
      
      // Logout
      logout(data);
    }
  });
}

// Healthcare professional journey
function healthcareJourney(data) {
  group('Healthcare Journey', function() {
    loginUser(data, 'healthcare');
    
    if (authToken) {
      // View schedule
      viewSchedule(data);
      
      // Accept consultation (50% chance)
      if (Math.random() < 0.5) {
        acceptConsultation(data);
        
        // Conduct consultation
        conductConsultation(data);
        
        // Write prescription (70% chance)
        if (Math.random() < 0.7) {
          writePrescription(data);
        }
      }
      
      // Update availability (30% chance)
      if (Math.random() < 0.3) {
        updateAvailability(data);
      }
      
      // View patient history (40% chance)
      if (Math.random() < 0.4) {
        viewPatientHistory(data);
      }
      
      // Logout
      logout(data);
    }
  });
}

// Admin user journey
function adminJourney(data) {
  group('Admin Journey', function() {
    loginUser(data, 'admin');
    
    if (authToken) {
      // View dashboard
      viewAdminDashboard(data);
      
      // Verify healthcare professionals (60% chance)
      if (Math.random() < 0.6) {
        verifyHealthcareProfessional(data);
      }
      
      // Manage users (40% chance)
      if (Math.random() < 0.4) {
        manageUsers(data);
      }
      
      // View reports (50% chance)
      if (Math.random() < 0.5) {
        viewReports(data);
      }
      
      // System monitoring (30% chance)
      if (Math.random() < 0.3) {
        systemMonitoring(data);
      }
      
      // Logout
      logout(data);
    }
  });
}

// Authentication functions
function registerPatient(data) {
  group('Register Patient', function() {
    const patient = patients[randomIntBetween(0, patients.length - 1)];
    
    const payload = {
      name: patient.name,
      email: `${randomString(8)}@test.com`,
      phone: patient.phone,
      nik: patient.nik,
      password: patient.password,
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
      address: patient.address,
      userType: 'patient'
    };
    
    const response = http.post(
      `${data.apiUrl}${config.config.endpoints.auth.register}`,
      JSON.stringify(payload),
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    const success = check(response, {
      'registration successful': (r) => r.status === 201,
      'response time < 3s': (r) => r.timings.duration < 3000,
    });
    
    if (success && response.json('token')) {
      authToken = response.json('token');
      userId = response.json('user.id');
    }
    
    apiResponseTime.add(response.timings.duration);
    loginRate.add(success);
  });
}

function loginUser(data, type) {
  group('Login User', function() {
    let user;
    
    switch (type) {
      case 'patient':
        user = patients[randomIntBetween(0, patients.length - 1)];
        break;
      case 'healthcare':
        user = healthcare[randomIntBetween(0, healthcare.length - 1)];
        break;
      case 'admin':
        user = { email: 'admin@test.com', password: 'AdminPassword123!' };
        break;
    }
    
    const payload = {
      email: user.email,
      password: user.password
    };
    
    const response = http.post(
      `${data.apiUrl}${config.config.endpoints.auth.login}`,
      JSON.stringify(payload),
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    const success = check(response, {
      'login successful': (r) => r.status === 200,
      'response time < 2s': (r) => r.timings.duration < 2000,
      'has auth token': (r) => r.json('token') !== undefined,
    });
    
    if (success && response.json('token')) {
      authToken = response.json('token');
      userId = response.json('user.id');
    }
    
    apiResponseTime.add(response.timings.duration);
    loginRate.add(success);
  });
}

function logout(data) {
  group('Logout', function() {
    const response = http.post(
      `${data.apiUrl}${config.config.endpoints.auth.logout}`,
      null,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    check(response, {
      'logout successful': (r) => r.status === 200,
      'response time < 1s': (r) => r.timings.duration < 1000,
    });
    
    authToken = '';
    userId = '';
    apiResponseTime.add(response.timings.duration);
  });
}

// Patient-specific functions
function searchDoctors(data) {
  group('Search Doctors', function() {
    const specializations = ['General Practice', 'Cardiology', 'Dermatology', 'Pediatrics'];
    const specialization = specializations[randomIntBetween(0, specializations.length - 1)];
    
    const response = http.get(
      `${data.apiUrl}${config.config.endpoints.healthcare.list}?specialization=${specialization}&available=true`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );
    
    check(response, {
      'search successful': (r) => r.status === 200,
      'response time < 2s': (r) => r.timings.duration < 2000,
      'has results': (r) => r.json('data.length') > 0,
    });
    
    apiResponseTime.add(response.timings.duration);
  });
}

function bookConsultation(data) {
  group('Book Consultation', function() {
    const doctorId = randomIntBetween(1, 50);
    const consultationType = Math.random() > 0.5 ? 'video' : 'chat';
    
    const payload = {
      doctorId: doctorId,
      type: consultationType,
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      symptoms: 'Test symptoms for load testing',
      urgency: 'normal'
    };
    
    const response = http.post(
      `${data.apiUrl}${config.config.endpoints.consultations.create}`,
      JSON.stringify(payload),
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const success = check(response, {
      'booking successful': (r) => r.status === 201,
      'response time < 3s': (r) => r.timings.duration < 3000,
      'has consultation id': (r) => r.json('consultationId') !== undefined,
    });
    
    consultationRate.add(success);
    apiResponseTime.add(response.timings.duration);
  });
}

function makePayment(data) {
  group('Make Payment', function() {
    const amount = randomIntBetween(50000, 200000);
    
    const payload = {
      consultationId: randomIntBetween(1, 1000),
      amount: amount,
      paymentMethod: 'virtual_account',
      bank: 'bca'
    };
    
    const response = http.post(
      `${data.apiUrl}${config.config.endpoints.payments.create}`,
      JSON.stringify(payload),
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const success = check(response, {
      'payment created': (r) => r.status === 201,
      'response time < 5s': (r) => r.timings.duration < 5000,
      'has payment url': (r) => r.json('paymentUrl') !== undefined,
    });
    
    paymentRate.add(success);
    apiResponseTime.add(response.timings.duration);
  });
}

function viewConsultationHistory(data) {
  group('View Consultation History', function() {
    const response = http.get(
      `${data.apiUrl}${config.config.endpoints.consultations.history}?limit=10&page=1`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );
    
    check(response, {
      'history loaded': (r) => r.status === 200,
      'response time < 2s': (r) => r.timings.duration < 2000,
    });
    
    apiResponseTime.add(response.timings.duration);
  });
}

function updateProfile(data) {
  group('Update Profile', function() {
    const payload = {
      phone: `+6281${randomString(8, '0123456789')}`,
      address: `Updated Address ${randomString(10)}`
    };
    
    const response = http.put(
      `${data.apiUrl}${config.config.endpoints.users.update}`,
      JSON.stringify(payload),
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    check(response, {
      'profile updated': (r) => r.status === 200,
      'response time < 2s': (r) => r.timings.duration < 2000,
    });
    
    apiResponseTime.add(response.timings.duration);
  });
}

// Healthcare professional functions
function viewSchedule(data) {
  group('View Schedule', function() {
    const response = http.get(
      `${data.apiUrl}${config.config.endpoints.healthcare.availability}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );
    
    check(response, {
      'schedule loaded': (r) => r.status === 200,
      'response time < 2s': (r) => r.timings.duration < 2000,
    });
    
    apiResponseTime.add(response.timings.duration);
  });
}

function acceptConsultation(data) {
  group('Accept Consultation', function() {
    const consultationId = randomIntBetween(1, 1000);
    
    const response = http.post(
      `${data.apiUrl}${config.config.endpoints.consultations.join}`,
      JSON.stringify({ consultationId: consultationId }),
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    check(response, {
      'consultation accepted': (r) => r.status === 200,
      'response time < 3s': (r) => r.timings.duration < 3000,
    });
    
    apiResponseTime.add(response.timings.duration);
  });
}

function conductConsultation(data) {
  group('Conduct Consultation', function() {
    // Simulate consultation duration
    sleep(randomIntBetween(5, 15));
    
    const consultationId = randomIntBetween(1, 1000);
    
    const payload = {
      consultationId: consultationId,
      diagnosis: 'Test diagnosis for load testing',
      notes: 'Test consultation notes',
      recommendations: 'Test recommendations'
    };
    
    const response = http.post(
      `${data.apiUrl}${config.config.endpoints.consultations.end}`,
      JSON.stringify(payload),
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    check(response, {
      'consultation completed': (r) => r.status === 200,
      'response time < 3s': (r) => r.timings.duration < 3000,
    });
    
    apiResponseTime.add(response.timings.duration);
  });
}

function writePrescription(data) {
  group('Write Prescription', function() {
    const payload = {
      consultationId: randomIntBetween(1, 1000),
      medications: [
        {
          name: 'Paracetamol',
          dosage: '500mg',
          frequency: '3x daily',
          duration: '5 days'
        }
      ],
      instructions: 'Take after meals'
    };
    
    const response = http.post(
      `${data.apiUrl}${config.config.endpoints.prescriptions.create}`,
      JSON.stringify(payload),
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    check(response, {
      'prescription created': (r) => r.status === 201,
      'response time < 2s': (r) => r.timings.duration < 2000,
    });
    
    apiResponseTime.add(response.timings.duration);
  });
}

function updateAvailability(data) {
  group('Update Availability', function() {
    const payload = {
      available: Math.random() > 0.5,
      schedule: [
        {
          day: 'monday',
          startTime: '09:00',
          endTime: '17:00'
        }
      ]
    };
    
    const response = http.put(
      `${data.apiUrl}${config.config.endpoints.healthcare.availability}`,
      JSON.stringify(payload),
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    check(response, {
      'availability updated': (r) => r.status === 200,
      'response time < 2s': (r) => r.timings.duration < 2000,
    });
    
    apiResponseTime.add(response.timings.duration);
  });
}

function viewPatientHistory(data) {
  group('View Patient History', function() {
    const patientId = randomIntBetween(1, 1000);
    
    const response = http.get(
      `${data.apiUrl}/patients/${patientId}/history`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );
    
    check(response, {
      'patient history loaded': (r) => r.status === 200,
      'response time < 2s': (r) => r.timings.duration < 2000,
    });
    
    apiResponseTime.add(response.timings.duration);
  });
}

// Admin functions
function viewAdminDashboard(data) {
  group('View Admin Dashboard', function() {
    const response = http.get(
      `${data.apiUrl}${config.config.endpoints.admin.dashboard}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );
    
    check(response, {
      'dashboard loaded': (r) => r.status === 200,
      'response time < 3s': (r) => r.timings.duration < 3000,
    });
    
    apiResponseTime.add(response.timings.duration);
  });
}

function verifyHealthcareProfessional(data) {
  group('Verify Healthcare Professional', function() {
    const doctorId = randomIntBetween(1, 200);
    
    const payload = {
      verified: true,
      verificationNotes: 'Verified during load testing'
    };
    
    const response = http.put(
      `${data.apiUrl}${config.config.endpoints.healthcare.verification}/${doctorId}`,
      JSON.stringify(payload),
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    check(response, {
      'verification updated': (r) => r.status === 200,
      'response time < 2s': (r) => r.timings.duration < 2000,
    });
    
    apiResponseTime.add(response.timings.duration);
  });
}

function manageUsers(data) {
  group('Manage Users', function() {
    const response = http.get(
      `${data.apiUrl}${config.config.endpoints.admin.users}?page=1&limit=20`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );
    
    check(response, {
      'users loaded': (r) => r.status === 200,
      'response time < 3s': (r) => r.timings.duration < 3000,
    });
    
    apiResponseTime.add(response.timings.duration);
  });
}

function viewReports(data) {
  group('View Reports', function() {
    const response = http.get(
      `${data.apiUrl}${config.config.endpoints.admin.reports}?type=consultations&period=week`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );
    
    check(response, {
      'reports loaded': (r) => r.status === 200,
      'response time < 5s': (r) => r.timings.duration < 5000,
    });
    
    apiResponseTime.add(response.timings.duration);
  });
}

function systemMonitoring(data) {
  group('System Monitoring', function() {
    const response = http.get(
      `${data.apiUrl}/system/health`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );
    
    check(response, {
      'system health loaded': (r) => r.status === 200,
      'response time < 2s': (r) => r.timings.duration < 2000,
    });
    
    apiResponseTime.add(response.timings.duration);
  });
}

// Teardown function
export function teardown(data) {
  console.log(`Completed ${scenario.name}`);
  console.log('Test summary will be generated...');
}

// Handle summary for custom reporting
export function handleSummary(data) {
  return {
    'performance/reports/summary.json': JSON.stringify(data, null, 2),
    'performance/reports/summary.html': generateHtmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

// Generate HTML report
function generateHtmlReport(data) {
  const template = `
<!DOCTYPE html>
<html>
<head>
    <title>Nakes Link Load Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f4f4f4; padding: 20px; border-radius: 5px; }
        .metric { margin: 10px 0; padding: 10px; border-left: 4px solid #007bff; }
        .success { border-left-color: #28a745; }
        .warning { border-left-color: #ffc107; }
        .error { border-left-color: #dc3545; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Nakes Link Load Test Report</h1>
        <p><strong>Scenario:</strong> ${scenario.name}</p>
        <p><strong>Duration:</strong> ${scenario.duration}</p>
        <p><strong>Target Users:</strong> ${scenario.users.steady}</p>
        <p><strong>Generated:</strong> ${new Date().toISOString()}</p>
    </div>
    
    <h2>Key Metrics</h2>
    <div class="metric success">
        <strong>Total Requests:</strong> ${data.metrics.http_reqs.count}
    </div>
    <div class="metric ${data.metrics.http_req_failed.rate < 0.1 ? 'success' : 'error'}">
        <strong>Error Rate:</strong> ${(data.metrics.http_req_failed.rate * 100).toFixed(2)}%
    </div>
    <div class="metric ${data.metrics.http_req_duration.p95 < 3000 ? 'success' : 'warning'}">
        <strong>95th Percentile Response Time:</strong> ${data.metrics.http_req_duration.p95.toFixed(2)}ms
    </div>
    
    <h2>Detailed Metrics</h2>
    <table>
        <tr><th>Metric</th><th>Value</th><th>Threshold</th><th>Status</th></tr>
        ${Object.entries(data.metrics).map(([key, value]) => {
          const thresholds = scenario.thresholds[key] || [];
          return `<tr><td>${key}</td><td>${JSON.stringify(value)}</td><td>${thresholds.join(', ')}</td><td>✓</td></tr>`;
        }).join('')}
    </table>
</body>
</html>`;
  
  return template;
}

// Text summary helper
function textSummary(data, options) {
  let summary = `\n${options.indent}✓ ${scenario.name} completed\n`;
  summary += `${options.indent}  Total requests: ${data.metrics.http_reqs.count}\n`;
  summary += `${options.indent}  Error rate: ${(data.metrics.http_req_failed.rate * 100).toFixed(2)}%\n`;
  summary += `${options.indent}  95th percentile: ${data.metrics.http_req_duration.p95.toFixed(2)}ms\n`;
  return summary;
}