#!/usr/bin/env node

/**
 * Test Admin Alert System
 */

const http = require('http');

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      hostname: 'localhost',
      port: 3000,
      path: url,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Admin-Alert-Test/1.0',
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

async function testAdminAlerts() {
  console.log('🚨 Testing Admin Alert System...\n');
  
  // Test 1: Trigger multiple failed login attempts to generate alerts
  console.log('1. Triggering multiple failed login attempts...');
  
  const testEmail = 'alert-test@example.com';
  const wrongPassword = 'wrongpassword';
  
  for (let i = 1; i <= 12; i++) {
    console.log(`   Attempt ${i}...`);
    
    const response = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: { email: testEmail, password: wrongPassword }
    });
    
    console.log(`   Status: ${response.status} - ${response.data.error || 'OK'}`);
    
    // Wait 2 seconds between attempts
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n2. Waiting for alerts to be processed...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Test 2: Check admin alerts API
  console.log('\n3. Checking admin alerts API...');
  
  const alertsResponse = await makeRequest('/api/admin/security/alerts', {
    method: 'GET',
    headers: { 'Authorization': 'Bearer test-admin-token' }
  });
  
  console.log(`   Alerts API Status: ${alertsResponse.status}`);
  if (alertsResponse.data.success) {
    console.log(`   Total Alerts: ${alertsResponse.data.data.statistics.total}`);
    console.log(`   Unread Alerts: ${alertsResponse.data.data.statistics.unread}`);
    console.log(`   Recent 24h: ${alertsResponse.data.data.statistics.recent_24h}`);
    console.log(`   Alerts by Severity:`, alertsResponse.data.data.statistics.by_severity);
    console.log(`   Alerts by Type:`, alertsResponse.data.data.statistics.by_type);
  } else {
    console.log(`   Error: ${alertsResponse.data.error}`);
  }
  
  // Test 3: Check admin alert preferences API
  console.log('\n4. Checking admin alert preferences API...');
  
  const preferencesResponse = await makeRequest('/api/admin/security/alert-preferences', {
    method: 'GET',
    headers: { 'Authorization': 'Bearer test-admin-token' }
  });
  
  console.log(`   Preferences API Status: ${preferencesResponse.status}`);
  if (preferencesResponse.data.success) {
    console.log(`   Preferences:`, preferencesResponse.data.data);
  } else {
    console.log(`   Error: ${preferencesResponse.data.error}`);
  }
  
  console.log('\n✅ Admin Alert System Test Complete!');
  console.log('\n📊 Summary:');
  console.log('   - Multiple failed login attempts triggered');
  console.log('   - IP blacklisting should have occurred after 10+ attempts');
  console.log('   - Admin alerts should have been generated');
  console.log('   - Check admin dashboard at: http://localhost:3000/admin/security/alerts');
}

testAdminAlerts().catch(console.error);
