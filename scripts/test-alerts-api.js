#!/usr/bin/env node

/**
 * Test Admin Alerts API
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
        'Authorization': 'Bearer test-admin-token', // This will fail, but we can see the response
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

async function testAlertsAPI() {
  console.log('🧪 Testing Admin Alerts API...\n');
  
  try {
    console.log('1. Testing alerts API without authentication...');
    const response = await makeRequest('/api/admin/security/alerts');
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, response.data);
    
    if (response.status === 401) {
      console.log('   ✅ API is properly protected (401 Unauthorized)');
    } else {
      console.log('   ⚠️  API should require authentication');
    }
    
    console.log('\n2. Testing with admin login first...');
    
    // Try to login as admin
    const loginResponse = await makeRequest('/api/admin/auth/login', {
      method: 'POST',
      body: {
        email: 'admin@bloodnode.com',
        password: 'admin123456'
      }
    });
    
    console.log(`   Login Status: ${loginResponse.status}`);
    
    if (loginResponse.status === 200 && loginResponse.data.token) {
      console.log('   ✅ Admin login successful');
      
      // Now test alerts API with token
      const alertsResponse = await makeRequest('/api/admin/security/alerts', {
        headers: {
          'Authorization': `Bearer ${loginResponse.data.token}`
        }
      });
      
      console.log(`   Alerts Status: ${alertsResponse.status}`);
      console.log(`   Alerts Response:`, alertsResponse.data);
      
      if (alertsResponse.status === 200) {
        console.log('   ✅ Alerts API working with authentication');
        console.log(`   📊 Found ${alertsResponse.data.data?.alerts?.length || 0} alerts`);
      }
    } else {
      console.log('   ❌ Admin login failed');
      console.log('   Response:', loginResponse.data);
    }
    
  } catch (error) {
    console.error('❌ Error testing alerts API:', error);
  }
}

testAlertsAPI();
