#!/usr/bin/env node

/**
 * Complete Delete Account Test
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

async function testCompleteDeleteFlow() {
  console.log('🧪 Testing Complete Delete Account Flow...\n');
  
  try {
    // Step 1: Create a test user
    console.log('1. Creating test user...');
    const signupResponse = await makeRequest('/api/auth/signup', {
      method: 'POST',
      body: {
        email: 'test-delete-complete@example.com',
        password: 'testpassword123',
        name: 'Test Delete Complete',
        blood_group_public: 'O+',
        public_profile: true
      }
    });
    
    if (signupResponse.status !== 200) {
      console.log('❌ User creation failed:', signupResponse.data);
      return;
    }
    
    const userCode = signupResponse.data.user_code;
    console.log('✅ Test user created successfully');
    console.log(`   User Code: ${userCode}`);
    
    // Step 2: Login as the test user
    console.log('\n2. Logging in as test user...');
    const loginResponse = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'test-delete-complete@example.com',
        password: 'testpassword123'
      }
    });
    
    if (loginResponse.status !== 200) {
      console.log('❌ Login failed:', loginResponse.data);
      return;
    }
    
    const accessToken = loginResponse.data.access_token;
    console.log('✅ Login successful');
    
    // Step 3: Test profile access
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
    
    // Step 4: Test delete account with correct details
    console.log('\n4. Testing delete account with correct details...');
    const deleteResponse = await makeRequest('/api/profile/delete', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      body: {
        user_code: userCode,
        confirmation_text: `DELETE ${userCode}`
      }
    });
    
    console.log(`   Delete Status: ${deleteResponse.status}`);
    console.log(`   Delete Response:`, deleteResponse.data);
    
    if (deleteResponse.status === 200) {
      console.log('✅ Account deleted successfully!');
    } else {
      console.log('❌ Account deletion failed');
      console.log('   This might be due to missing database collections or other issues');
    }
    
    // Step 5: Test that profile is no longer accessible
    console.log('\n5. Testing that profile is no longer accessible...');
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
      console.log('⚠️  Profile still accessible after deletion (this might be expected if deletion failed)');
    }
    
    console.log('\n✅ Complete Delete Account Test Finished!');
    console.log('\n📝 To test in the browser:');
    console.log('   1. Start the server: npm run dev');
    console.log('   2. Open http://localhost:3000');
    console.log('   3. Login with your account');
    console.log('   4. Go to Profile Settings');
    console.log('   5. Scroll to "Danger Zone"');
    console.log('   6. Click "Delete Account"');
    console.log('   7. Type your User Code and confirmation text');
    console.log('   8. Check browser console for debug logs');
    
  } catch (error) {
    console.error('❌ Error in complete test:', error);
  }
}

testCompleteDeleteFlow();
