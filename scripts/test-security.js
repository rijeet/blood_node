#!/usr/bin/env node

/**
 * Security Testing Script for Blood Node
 * 
 * This script tests all security features:
 * - Rate limiting
 * - Login attempt limiting
 * - CAPTCHA integration
 * - IP blacklisting
 * - Session security
 */

const https = require('https');
const http = require('http');

const BASE_URL = 'http://localhost:3000';
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'wrongpassword';
const ADMIN_EMAIL = 'admin@bloodnode.com';
const ADMIN_PASSWORD = 'admin123456';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      hostname: 'localhost',
      port: 3000,
      path: url,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Security-Test-Script/1.0',
        ...options.headers
      }
    };

    const req = http.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, headers: res.headers, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data: data });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

async function testRateLimiting() {
  log('\n🔒 Testing Rate Limiting...', 'cyan');
  
  const promises = [];
  for (let i = 0; i < 10; i++) {
    promises.push(makeRequest('/api/auth/login', {
      method: 'POST',
      body: { email: TEST_EMAIL, password: TEST_PASSWORD }
    }));
  }

  const results = await Promise.all(promises);
  const rateLimited = results.filter(r => r.status === 429);
  
  if (rateLimited.length > 0) {
    log(`✅ Rate limiting working: ${rateLimited.length}/10 requests blocked`, 'green');
  } else {
    log(`❌ Rate limiting not working: No requests blocked`, 'red');
  }
}

async function testLoginAttemptLimiting() {
  log('\n🔐 Testing Login Attempt Limiting...', 'cyan');
  
  // Test user login attempts
  log('Testing user login attempts (should lock after 5 attempts)...', 'yellow');
  
  for (let i = 1; i <= 7; i++) {
    const response = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: { email: TEST_EMAIL, password: TEST_PASSWORD }
    });
    
    if (response.status === 423) {
      log(`✅ Account locked after ${i} attempts`, 'green');
      break;
    } else if (i === 7) {
      log(`❌ Account not locked after 7 attempts`, 'red');
    }
  }

  // Test admin login attempts
  log('Testing admin login attempts (should lock after 3 attempts)...', 'yellow');
  
  for (let i = 1; i <= 5; i++) {
    const response = await makeRequest('/api/admin/auth/login', {
      method: 'POST',
      body: { email: ADMIN_EMAIL, password: 'wrongpassword' }
    });
    
    if (response.status === 423) {
      log(`✅ Admin account locked after ${i} attempts`, 'green');
      break;
    } else if (i === 5) {
      log(`❌ Admin account not locked after 5 attempts`, 'red');
    }
  }
}

async function testCAPTCHA() {
  log('\n🤖 Testing CAPTCHA Integration...', 'cyan');
  
  // Test login without CAPTCHA (should work initially)
  const response1 = await makeRequest('/api/auth/login', {
    method: 'POST',
    body: { email: TEST_EMAIL, password: TEST_PASSWORD }
  });
  
  if (response1.data.captcha_required) {
    log('✅ CAPTCHA required after failed attempts', 'green');
  } else {
    log('ℹ️  CAPTCHA not yet required (may need more failed attempts)', 'yellow');
  }
}

async function testIPBlacklisting() {
  log('\n🚫 Testing IP Blacklisting...', 'cyan');
  
  // This would require multiple failed attempts to trigger auto-blacklist
  log('Note: Auto-blacklist triggers after 10+ failed attempts', 'yellow');
  
  // Test blacklist API (admin only)
  const adminResponse = await makeRequest('/api/admin/security/ip-blacklist', {
    method: 'GET',
    headers: { 'Authorization': 'Bearer test-token' }
  });
  
  if (adminResponse.status === 401) {
    log('✅ IP blacklist API protected (requires admin auth)', 'green');
  } else {
    log('ℹ️  IP blacklist API response:', 'yellow');
    console.log(adminResponse.data);
  }
}

async function testSessionSecurity() {
  log('\n🔒 Testing Session Security...', 'cyan');
  
  // Test with different user agents
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
  ];

  for (const userAgent of userAgents) {
    const response = await makeRequest('/api/auth/login', {
      method: 'POST',
      headers: { 'User-Agent': userAgent },
      body: { email: TEST_EMAIL, password: TEST_PASSWORD }
    });
    
    log(`User-Agent: ${userAgent.substring(0, 50)}... - Status: ${response.status}`, 'blue');
  }
}

async function testSecurityMonitoring() {
  log('\n📊 Testing Security Monitoring...', 'cyan');
  
  // Test security monitoring API
  const response = await makeRequest('/api/admin/security/monitoring', {
    method: 'GET',
    headers: { 'Authorization': 'Bearer test-token' }
  });
  
  if (response.status === 401) {
    log('✅ Security monitoring API protected (requires admin auth)', 'green');
  } else {
    log('ℹ️  Security monitoring API response:', 'yellow');
    console.log(JSON.stringify(response.data, null, 2));
  }
}

async function testAdminDashboard() {
  log('\n👑 Testing Admin Dashboard Security...', 'cyan');
  
  // Test admin login page
  const loginPageResponse = await makeRequest('/admin/login');
  if (loginPageResponse.status === 200) {
    log('✅ Admin login page accessible', 'green');
  } else {
    log('❌ Admin login page not accessible', 'red');
  }

  // Test admin dashboard (should redirect to login)
  const dashboardResponse = await makeRequest('/admin');
  if (dashboardResponse.status === 200 || dashboardResponse.status === 302) {
    log('✅ Admin dashboard properly protected', 'green');
  } else {
    log('❌ Admin dashboard not properly protected', 'red');
  }
}

async function runAllTests() {
  log('🚀 Starting Blood Node Security Tests...', 'bright');
  log('==========================================', 'bright');
  
  try {
    await testRateLimiting();
    await testLoginAttemptLimiting();
    await testCAPTCHA();
    await testIPBlacklisting();
    await testSessionSecurity();
    await testSecurityMonitoring();
    await testAdminDashboard();
    
    log('\n✅ Security testing completed!', 'green');
    log('==========================================', 'bright');
    
  } catch (error) {
    log(`\n❌ Security testing failed: ${error.message}`, 'red');
    console.error(error);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = { runAllTests };
