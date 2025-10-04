#!/usr/bin/env node

/**
 * Test Admin Alerts with Fresh IP
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
        'User-Agent': 'Fresh-IP-Test/1.0',
        'X-Forwarded-For': '203.0.113.1', // Use a different IP
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

async function testFreshIPAlerts() {
  console.log('🚨 Testing Admin Alerts with Fresh IP...\n');
  
  // Test with a fresh IP address
  const testEmail = 'fresh-ip-test@example.com';
  const wrongPassword = 'wrongpassword';
  
  console.log('1. Triggering failed login attempts with fresh IP (203.0.113.1)...');
  
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
  
  console.log('\n✅ Fresh IP Test Complete!');
  console.log('\n📊 Expected Results:');
  console.log('   - IP 203.0.113.1 should be blacklisted after 10+ attempts');
  console.log('   - Admin alerts should be generated');
  console.log('   - Check database for new alerts');
}

testFreshIPAlerts().catch(console.error);
