// Test script for password update functionality
// Note: This requires node-fetch to be installed: npm install node-fetch
// For Node.js 18+, you can use the built-in fetch instead

const fetch = globalThis.fetch || require('node-fetch');

const API_BASE = 'http://localhost:3000';

async function testPasswordUpdate() {
  console.log('🧪 Testing Password Update Functionality...\n');

  try {
    // First, let's try to login to get a valid token
    console.log('1. Testing login...');
    const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testpassword123'
      }),
    });

    if (!loginResponse.ok) {
      console.log('❌ Login failed. Please make sure you have a test user created.');
      console.log('   You can create one using: node create-test-user.js');
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login successful');

    // Test password update
    console.log('\n2. Testing password update...');
    const passwordUpdateResponse = await fetch(`${API_BASE}/api/profile/password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${loginData.access_token}`
      },
      body: JSON.stringify({
        currentPassword: 'testpassword123',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123'
      }),
    });

    const passwordUpdateData = await passwordUpdateResponse.json();

    if (passwordUpdateResponse.ok) {
      console.log('✅ Password update successful');
      console.log('   Response:', passwordUpdateData.message);
    } else {
      console.log('❌ Password update failed');
      console.log('   Error:', passwordUpdateData.error);
    }

    // Test with wrong current password
    console.log('\n3. Testing with wrong current password...');
    const wrongPasswordResponse = await fetch(`${API_BASE}/api/profile/password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${loginData.access_token}`
      },
      body: JSON.stringify({
        currentPassword: 'wrongpassword',
        newPassword: 'anotherpassword123',
        confirmPassword: 'anotherpassword123'
      }),
    });

    const wrongPasswordData = await wrongPasswordResponse.json();

    if (!wrongPasswordResponse.ok) {
      console.log('✅ Correctly rejected wrong current password');
      console.log('   Error:', wrongPasswordData.error);
    } else {
      console.log('❌ Should have rejected wrong current password');
    }

    // Test with password mismatch
    console.log('\n4. Testing with password mismatch...');
    const mismatchResponse = await fetch(`${API_BASE}/api/profile/password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${loginData.access_token}`
      },
      body: JSON.stringify({
        currentPassword: 'newpassword123',
        newPassword: 'mismatchpassword123',
        confirmPassword: 'differentpassword123'
      }),
    });

    const mismatchData = await mismatchResponse.json();

    if (!mismatchResponse.ok) {
      console.log('✅ Correctly rejected password mismatch');
      console.log('   Error:', mismatchData.error);
    } else {
      console.log('❌ Should have rejected password mismatch');
    }

    console.log('\n🎉 Password update functionality test completed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testPasswordUpdate();
