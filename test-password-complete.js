// Complete test: Create user, login, update password, verify email
// This script tests the complete password update flow

const API_BASE = 'http://localhost:3000';

async function testCompletePasswordFlow() {
  console.log('🧪 Complete Password Update Test');
  console.log('='.repeat(50));

  try {
    // Step 1: Create a test user
    console.log('📝 Step 1: Creating test user...');
    const signupResponse = await fetch(`${API_BASE}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test-password@example.com',
        password: 'TestPassword123!@#',
        name: 'Test User',
        phone: '+1234567890',
        blood_group_public: 'A+',
        location_geohash: '23.7023000,90.3511500',
        location_address: 'Test Location',
        public_profile: true
      })
    });

    if (!signupResponse.ok) {
      const error = await signupResponse.text();
      console.error('❌ Signup failed:', error);
      return;
    }

    const signupData = await signupResponse.json();
    console.log('✅ User created successfully');
    console.log('   User Code:', signupData.user_code);

    // Step 2: Login with the new user
    console.log('\n📝 Step 2: Logging in...');
    const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test-password@example.com',
        password: 'TestPassword123!@#'
      })
    });

    if (!loginResponse.ok) {
      const error = await loginResponse.text();
      console.error('❌ Login failed:', error);
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login successful');
    console.log('   User Code:', loginData.user_code);
    console.log('   Access Token:', loginData.access_token ? 'Present' : 'Missing');

    // Step 3: Update password
    console.log('\n📝 Step 3: Updating password...');
    const passwordUpdateResponse = await fetch(`${API_BASE}/api/profile/password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${loginData.access_token}`
      },
      body: JSON.stringify({
        currentPassword: 'TestPassword123!@#',
        newPassword: 'NewTestPassword123!@#',
        confirmPassword: 'NewTestPassword123!@#'
      })
    });

    if (!passwordUpdateResponse.ok) {
      const error = await passwordUpdateResponse.text();
      console.error('❌ Password update failed:', error);
      return;
    }

    const passwordUpdateData = await passwordUpdateResponse.json();
    console.log('✅ Password update successful');
    console.log('   Message:', passwordUpdateData.message);

    // Step 4: Test login with new password
    console.log('\n📝 Step 4: Testing login with new password...');
    const newLoginResponse = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test-password@example.com',
        password: 'NewTestPassword123!@#'
      })
    });

    if (!newLoginResponse.ok) {
      const error = await newLoginResponse.text();
      console.error('❌ New password login failed:', error);
      return;
    }

    const newLoginData = await newLoginResponse.json();
    console.log('✅ New password login successful');
    console.log('   User Code:', newLoginData.user_code);

    // Step 5: Test old password (should fail)
    console.log('\n📝 Step 5: Testing old password (should fail)...');
    const oldLoginResponse = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test-password@example.com',
        password: 'TestPassword123!@#'
      })
    });

    if (oldLoginResponse.ok) {
      console.log('❌ Old password still works (this is unexpected)');
    } else {
      console.log('✅ Old password correctly rejected');
    }

    console.log('\n🎉 Complete password update test successful!');
    console.log('📧 Check your email (rijeet2025@gmail.com) for the password change notification');
    console.log('   The email should contain:');
    console.log('   - User Code:', signupData.user_code);
    console.log('   - Change Time');
    console.log('   - IP Address');
    console.log('   - Security notice');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testCompletePasswordFlow();
