// Simple password update test using existing user
// This script tests password update with a known user

const API_BASE = 'http://localhost:3000';

async function testSimplePasswordUpdate() {
  console.log('🧪 Simple Password Update Test');
  console.log('='.repeat(50));

  try {
    // Step 1: Try to login with a test user
    console.log('📝 Step 1: Attempting login...');
    
    // Try different possible passwords
    const passwords = ['12345678', 'Test123!@#', 'NewPassword123!@#', 'password'];
    
    let loginData = null;
    let workingPassword = null;
    
    for (const password of passwords) {
      console.log(`   Trying password: ${password}`);
      const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'rijeet2025@gmail.com',
          password: password
        })
      });

      if (loginResponse.ok) {
        loginData = await loginResponse.json();
        workingPassword = password;
        console.log('✅ Login successful with password:', password);
        break;
      } else {
        const error = await loginResponse.text();
        console.log(`   ❌ Failed: ${error}`);
      }
    }

    if (!loginData) {
      console.error('❌ Could not login with any password');
      console.log('   Please check the user exists and password is correct');
      return;
    }

    console.log('   User Code:', loginData.user_code);
    console.log('   Access Token:', loginData.access_token ? 'Present' : 'Missing');

    // Step 2: Update password
    console.log('\n📝 Step 2: Updating password...');
    const newPassword = 'UpdatedPassword123!@#' + Date.now();
    console.log('   New password:', newPassword);
    
    const passwordUpdateResponse = await fetch(`${API_BASE}/api/profile/password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${loginData.access_token}`
      },
      body: JSON.stringify({
        currentPassword: workingPassword,
        newPassword: newPassword,
        confirmPassword: newPassword
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
        password: newPassword
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
        password: workingPassword
      })
    });

    if (oldLoginResponse.ok) {
      console.log('❌ Old password still works (this is unexpected)');
    } else {
      console.log('✅ Old password correctly rejected');
    }

    console.log('\n🎉 Password update test successful!');
    console.log('📧 Check your email (rijeet2025@gmail.com) for the password change notification');
    console.log('   The email should contain:');
    console.log('   - User Code:', loginData.user_code);
    console.log('   - Change Time');
    console.log('   - IP Address');
    console.log('   - Security notice');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testSimplePasswordUpdate();
