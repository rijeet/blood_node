#!/usr/bin/env node

/**
 * Debug Rate Limiting
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
        'User-Agent': 'Debug-Script/1.0',
        ...options.headers
      }
    };

    const req = http.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({ 
            status: res.statusCode, 
            headers: res.headers, 
            data: jsonData,
            rateLimitHeaders: {
              'X-RateLimit-Limit': res.headers['x-ratelimit-limit'],
              'X-RateLimit-Remaining': res.headers['x-ratelimit-remaining'],
              'X-RateLimit-Reset': res.headers['x-ratelimit-reset']
            }
          });
        } catch (e) {
          resolve({ 
            status: res.statusCode, 
            headers: res.headers, 
            data: data,
            rateLimitHeaders: {
              'X-RateLimit-Limit': res.headers['x-ratelimit-limit'],
              'X-RateLimit-Remaining': res.headers['x-ratelimit-remaining'],
              'X-RateLimit-Reset': res.headers['x-ratelimit-reset']
            }
          });
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

async function debugRateLimiting() {
  console.log('🔍 Debugging Rate Limiting...\n');
  
  const testEmail = 'debug-test@example.com';
  const wrongPassword = 'wrongpassword';
  
  // Make requests one by one to see the rate limiting in action
  for (let i = 1; i <= 8; i++) {
    console.log(`Request ${i}:`);
    
    const response = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: { email: testEmail, password: wrongPassword }
    });
    
    console.log(`  Status: ${response.status}`);
    console.log(`  Error: ${response.data.error || 'None'}`);
    console.log(`  Rate Limit Headers:`, response.rateLimitHeaders);
    console.log(`  Response:`, JSON.stringify(response.data, null, 2));
    console.log('');
    
    // Wait 1 second between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

debugRateLimiting().catch(console.error);
