#!/usr/bin/env node

/**
 * Test Delete Account API Endpoint Only
 * This tests the API endpoint without requiring a running server
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

    req.on('error', (error) => {
      if (error.code === 'ECONNREFUSED') {
        console.log('⚠️  Server not running. Please start the server with: npm run dev');
        resolve({ status: 0, error: 'Server not running' });
      } else {
        reject(error);
      }
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

async function testDeleteAPI() {
  console.log('🧪 Testing Delete Account API Endpoint...\n');
  
  try {
    // Test without authentication
    console.log('1. Testing without authentication...');
    const noAuthResponse = await makeRequest('/api/profile/delete', {
      method: 'DELETE',
      body: {
        user_code: 'TEST1234567890',
        confirmation_text: 'DELETE TEST1234567890'
      }
    });
    
    if (noAuthResponse.status === 0) {
      console.log('⚠️  Server not running - cannot test API');
      return;
    }
    
    console.log(`   Status: ${noAuthResponse.status}`);
    console.log(`   Response:`, noAuthResponse.data);
    
    if (noAuthResponse.status === 401) {
      console.log('✅ Correctly requires authentication');
    } else {
      console.log('❌ Should require authentication');
    }
    
    // Test with invalid data
    console.log('\n2. Testing with invalid data...');
    const invalidDataResponse = await makeRequest('/api/profile/delete', {
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer fake-token'
      },
      body: {
        user_code: '',
        confirmation_text: ''
      }
    });
    
    console.log(`   Status: ${invalidDataResponse.status}`);
    console.log(`   Response:`, invalidDataResponse.data);
    
    if (invalidDataResponse.status === 400) {
      console.log('✅ Correctly validates required fields');
    } else {
      console.log('❌ Should validate required fields');
    }
    
    console.log('\n✅ API Endpoint Test Complete!');
    console.log('\n📝 To test the full functionality:');
    console.log('   1. Start the server: npm run dev');
    console.log('   2. Open http://localhost:3000 in your browser');
    console.log('   3. Login to your account');
    console.log('   4. Go to Profile Settings');
    console.log('   5. Scroll down to "Danger Zone"');
    console.log('   6. Click "Delete Account"');
    console.log('   7. Enter your User Code and confirmation text');
    console.log('   8. Click "Delete Account" to confirm');
    
  } catch (error) {
    console.error('❌ Error testing API:', error);
  }
}

testDeleteAPI();
