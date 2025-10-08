// Test password update with email notification
// This script tests the password update functionality with proper email handling

const API_BASE = 'http://localhost:3000';

async function testPasswordUpdate() {
  console.log('🧪 Testing Password Update with Email Notification');
  console.log('='.repeat(50));

  try {
    // Step 1: Login to get tokens
    console.log('📝 Step 1: Logging in...');
    const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'rijeet2025@gmail.com',
        password: 'Test123!@#'
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

    // Step 2: Update password
    console.log('\n📝 Step 2: Updating password...');
    const passwordUpdateResponse = await fetch(`${API_BASE}/api/profile/password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${loginData.access_token}`
      },
      body: JSON.stringify({
        currentPassword: 'NewPassword123!@#',
        newPassword: 'NewPassword123!@#',
        confirmPassword: 'NewPassword123!@#'
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

    // Step 3: Test login with new password
    console.log('\n📝 Step 3: Testing login with new password...');
    const newLoginResponse = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'rijeet2025@gmail.com',
        password: 'NewPassword123!@#'
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

    // Step 4: Test old password (should fail)
    console.log('\n📝 Step 4: Testing old password (should fail)...');
    const oldLoginResponse = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'rijeet2025@gmail.com',
        password: 'Test123!@#'
      })
    });

    if (oldLoginResponse.ok) {
      console.log('❌ Old password still works (this is unexpected)');
    } else {
      console.log('✅ Old password correctly rejected');
    }

    console.log('\n🎉 Password update test completed successfully!');
    console.log('📧 Check your email (rijeet2025@gmail.com) for the password change notification');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testPasswordUpdate();
