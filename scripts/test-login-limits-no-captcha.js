#!/usr/bin/env node

/**
 * Test Login Attempt Limiting without CAPTCHA
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
        'User-Agent': 'Test-Script/1.0',
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

async function testLoginLimits() {
  console.log('🔐 Testing Login Attempt Limiting (with CAPTCHA bypass)...\n');
  
  const testEmail = 'test@example.com';
  const wrongPassword = 'wrongpassword';
  
  for (let i = 1; i <= 8; i++) {
    console.log(`Attempt ${i}:`);
    
    const response = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: { 
        email: testEmail, 
        password: wrongPassword,
        captcha_token: 'test-captcha-token' // Bypass CAPTCHA
      }
    });
    
    console.log(`  Status: ${response.status}`);
    console.log(`  Response:`, response.data);
    
    if (response.status === 423) {
      console.log(`  ✅ Account locked after ${i} attempts!`);
      break;
    }
    
    if (response.status === 400 && response.data.error === 'CAPTCHA verification failed') {
      console.log(`  ⚠️  CAPTCHA verification failed (expected)`);
    }
    
    // Wait 2 seconds between attempts
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

testLoginLimits().catch(console.error);
