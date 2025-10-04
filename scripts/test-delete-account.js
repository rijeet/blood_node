#!/usr/bin/env node

/**
 * Test Delete Account Functionality
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

async function testDeleteAccount() {
  console.log('🧪 Testing Delete Account Functionality...\n');
  
  try {
    // First create a test user
    console.log('1. Creating test user...');
    const signupResponse = await makeRequest('/api/auth/signup', {
      method: 'POST',
      body: {
        email: 'test-delete@example.com',
        password: 'testpassword123',
        name: 'Test Delete User',
        blood_group_public: 'O+',
        public_profile: true
      }
    });
    
    if (signupResponse.status !== 200) {
      console.log('❌ User creation failed:', signupResponse.data);
      return;
    }
    
    console.log('✅ Test user created successfully');
    const userCode = signupResponse.data.user_code;
    console.log(`   User Code: ${userCode}`);
    
    // Login as the test user
    console.log('\n2. Logging in as test user...');
    const loginResponse = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'test-delete@example.com',
        password: 'testpassword123'
      }
    });
    
    if (loginResponse.status !== 200) {
      console.log('❌ Login failed:', loginResponse.data);
      return;
    }
    
    const accessToken = loginResponse.data.access_token;
    console.log('✅ Login successful');
    
    // Test profile access
    console.log('\n3. Testing profile access...');
    const profileResponse = await makeRequest('/api/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (profileResponse.status !== 200) {
      console.log('❌ Profile access failed:', profileResponse.data);
      return;
    }
    
    console.log('✅ Profile access successful');
    console.log(`   Profile User Code: ${profileResponse.data.user.user_code}`);
    
    // Test delete account with wrong user code
    console.log('\n4. Testing delete account with wrong user code...');
    const wrongDeleteResponse = await makeRequest('/api/profile/delete', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      body: {
        user_code: 'WRONG1234567890',
        confirmation_text: 'DELETE WRONG1234567890'
      }
    });
    
    console.log(`   Wrong User Code Status: ${wrongDeleteResponse.status}`);
    console.log(`   Response:`, wrongDeleteResponse.data);
    
    if (wrongDeleteResponse.status === 400) {
      console.log('✅ Wrong user code correctly rejected');
    } else {
      console.log('❌ Wrong user code should have been rejected');
    }
    
    // Test delete account with wrong confirmation text
    console.log('\n5. Testing delete account with wrong confirmation text...');
    const wrongConfirmResponse = await makeRequest('/api/profile/delete', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      body: {
        user_code: userCode,
        confirmation_text: 'WRONG CONFIRMATION'
      }
    });
    
    console.log(`   Wrong Confirmation Status: ${wrongConfirmResponse.status}`);
    console.log(`   Response:`, wrongConfirmResponse.data);
    
    if (wrongConfirmResponse.status === 400) {
      console.log('✅ Wrong confirmation text correctly rejected');
    } else {
      console.log('❌ Wrong confirmation text should have been rejected');
    }
    
    // Test delete account with correct details
    console.log('\n6. Testing delete account with correct details...');
    const correctDeleteResponse = await makeRequest('/api/profile/delete', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      body: {
        user_code: userCode,
        confirmation_text: `DELETE ${userCode}`
      }
    });
    
    console.log(`   Correct Delete Status: ${correctDeleteResponse.status}`);
    console.log(`   Response:`, correctDeleteResponse.data);
    
    if (correctDeleteResponse.status === 200) {
      console.log('✅ Account deleted successfully');
    } else {
      console.log('❌ Account deletion failed');
    }
    
    // Test that profile is no longer accessible
    console.log('\n7. Testing that profile is no longer accessible...');
    const profileAfterDeleteResponse = await makeRequest('/api/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    console.log(`   Profile After Delete Status: ${profileAfterDeleteResponse.status}`);
    
    if (profileAfterDeleteResponse.status === 401 || profileAfterDeleteResponse.status === 404) {
      console.log('✅ Profile correctly inaccessible after deletion');
    } else {
      console.log('❌ Profile should be inaccessible after deletion');
    }
    
    console.log('\n✅ Delete Account Test Complete!');
    
  } catch (error) {
    console.error('❌ Error testing delete account:', error);
  }
}

testDeleteAccount();
