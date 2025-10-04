#!/usr/bin/env node

/**
 * Test Rate Limiting on a different endpoint
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
        'User-Agent': 'Rate-Limit-Test/1.0',
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

async function testRateLimiting() {
  console.log('🔒 Testing Rate Limiting on General API...\n');
  
  // Test on a general API endpoint that should have rate limiting
  const endpoint = '/api/admin/dashboard/stats';
  
  console.log('Making 15 rapid requests to test rate limiting...\n');
  
  const promises = [];
  for (let i = 0; i < 15; i++) {
    promises.push(makeRequest(endpoint, {
      method: 'GET',
      headers: { 'Authorization': 'Bearer test-token' }
    }));
  }

  const results = await Promise.all(promises);
  
  console.log('Results:');
  results.forEach((result, index) => {
    console.log(`  Request ${index + 1}: Status ${result.status} - ${result.data.error || 'OK'}`);
    if (result.rateLimitHeaders['X-RateLimit-Remaining']) {
      console.log(`    Rate Limit Remaining: ${result.rateLimitHeaders['X-RateLimit-Remaining']}`);
    }
  });
  
  const rateLimited = results.filter(r => r.status === 429);
  const unauthorized = results.filter(r => r.status === 401);
  
  console.log(`\n📊 Summary:`);
  console.log(`  Rate Limited: ${rateLimited.length}/15`);
  console.log(`  Unauthorized: ${unauthorized.length}/15`);
  console.log(`  Other Responses: ${results.length - rateLimited.length - unauthorized.length}/15`);
  
  if (rateLimited.length > 0) {
    console.log('  ✅ Rate limiting is working!');
  } else if (unauthorized.length > 0) {
    console.log('  ✅ Authentication is working (rate limiting may be working too)');
  } else {
    console.log('  ℹ️  No rate limiting detected (may be working correctly)');
  }
}

testRateLimiting().catch(console.error);
