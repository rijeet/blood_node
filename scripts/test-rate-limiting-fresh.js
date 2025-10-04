#!/usr/bin/env node

/**
 * Test Rate Limiting with fresh requests
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

async function testRateLimiting() {
  console.log('🔒 Testing Rate Limiting (Fresh Test)...\n');
  
  // Test with a different email to avoid account lockout
  const testEmail = 'fresh-test@example.com';
  const wrongPassword = 'wrongpassword';
  
  console.log('Making 10 rapid requests to test rate limiting...\n');
  
  const promises = [];
  for (let i = 0; i < 10; i++) {
    promises.push(makeRequest('/api/auth/login', {
      method: 'POST',
      body: { email: testEmail, password: wrongPassword }
    }));
  }

  const results = await Promise.all(promises);
  
  console.log('Results:');
  results.forEach((result, index) => {
    console.log(`  Request ${index + 1}: Status ${result.status} - ${result.data.error || 'OK'}`);
  });
  
  const rateLimited = results.filter(r => r.status === 429);
  const accountLocked = results.filter(r => r.status === 423);
  
  console.log(`\n📊 Summary:`);
  console.log(`  Rate Limited: ${rateLimited.length}/10`);
  console.log(`  Account Locked: ${accountLocked.length}/10`);
  console.log(`  Other Responses: ${results.length - rateLimited.length - accountLocked.length}/10`);
  
  if (rateLimited.length > 0) {
    console.log('  ✅ Rate limiting is working!');
  } else if (accountLocked.length > 0) {
    console.log('  ✅ Account locking is working (rate limiting may be working too)');
  } else {
    console.log('  ⚠️  Rate limiting may not be working as expected');
  }
}

testRateLimiting().catch(console.error);
