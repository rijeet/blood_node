#!/usr/bin/env node

/**
 * Test IP Blacklist Actions
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

async function testIPBlacklistActions() {
  console.log('🧪 Testing IP Blacklist Actions...\n');
  
  try {
    // First login as admin
    console.log('1. Logging in as admin...');
    const loginResponse = await makeRequest('/api/admin/auth/login', {
      method: 'POST',
      body: {
        email: 'admin@bloodnode.com',
        password: 'admin123456'
      }
    });
    
    if (loginResponse.status !== 200) {
      console.log('❌ Admin login failed:', loginResponse.data);
      return;
    }
    
    const adminToken = loginResponse.data.token;
    console.log('✅ Admin login successful');
    
    // Test adding IP to blacklist
    console.log('\n2. Testing add IP to blacklist...');
    const addResponse = await makeRequest('/api/admin/security/ip-blacklist', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      },
      body: {
        ip_address: '192.168.1.999',
        reason: 'test_manual_action',
        severity: 'high',
        description: 'Test IP for blacklist management'
      }
    });
    
    console.log(`   Add Status: ${addResponse.status}`);
    console.log(`   Add Response:`, addResponse.data);
    
    if (addResponse.status === 200) {
      console.log('✅ IP added to blacklist successfully');
    }
    
    // Test getting blacklist
    console.log('\n3. Testing get blacklist...');
    const getResponse = await makeRequest('/api/admin/security/ip-blacklist', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    console.log(`   Get Status: ${getResponse.status}`);
    console.log(`   Get Response:`, getResponse.data);
    
    if (getResponse.status === 200) {
      console.log('✅ Blacklist retrieved successfully');
      console.log(`   Found ${getResponse.data.data?.length || 0} blacklisted IPs`);
    }
    
    // Test removing IP from blacklist
    console.log('\n4. Testing remove IP from blacklist...');
    const removeResponse = await makeRequest('/api/admin/security/ip-blacklist?ip_address=192.168.1.999', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    console.log(`   Remove Status: ${removeResponse.status}`);
    console.log(`   Remove Response:`, removeResponse.data);
    
    if (removeResponse.status === 200) {
      console.log('✅ IP removed from blacklist successfully');
    }
    
    console.log('\n✅ IP Blacklist Actions Test Complete!');
    
  } catch (error) {
    console.error('❌ Error testing IP blacklist actions:', error);
  }
}

testIPBlacklistActions();
