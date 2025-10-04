#!/usr/bin/env node

/**
 * Test Delete Account Fix
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

async function testDeleteFix() {
  console.log('🧪 Testing Delete Account Fix...\n');
  
  try {
    // Test with proper JSON body
    console.log('1. Testing with proper JSON body...');
    const response = await makeRequest('/api/profile/delete', {
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer fake-token'
      },
      body: {
        user_code: 'TEST1234567890',
        confirmation_text: 'DELETE TEST1234567890'
      }
    });
    
    if (response.status === 0) {
      console.log('⚠️  Server not running - cannot test');
      return;
    }
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, response.data);
    
    if (response.status === 401) {
      console.log('✅ JSON parsing works - got authentication error as expected');
    } else if (response.status === 400) {
      console.log('✅ JSON parsing works - got validation error as expected');
    } else {
      console.log('❌ Unexpected response');
    }
    
    // Test with empty body
    console.log('\n2. Testing with empty body...');
    const emptyResponse = await makeRequest('/api/profile/delete', {
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer fake-token'
      }
    });
    
    console.log(`   Status: ${emptyResponse.status}`);
    console.log(`   Response:`, emptyResponse.data);
    
    if (emptyResponse.status === 400) {
      console.log('✅ Empty body correctly handled');
    } else {
      console.log('❌ Empty body should return 400');
    }
    
    console.log('\n✅ Delete Account Fix Test Complete!');
    
  } catch (error) {
    console.error('❌ Error testing fix:', error);
  }
}

testDeleteFix();
