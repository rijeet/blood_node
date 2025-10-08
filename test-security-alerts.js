// Test script for security alerts and IP blacklisting
// This script simulates multiple failed login attempts to trigger security alerts

const API_BASE = 'http://localhost:3000';

async function testSecurityAlerts() {
  console.log('🧪 Testing Security Alert System');
  console.log('='.repeat(50));

  try {
    // Test 1: Multiple failed login attempts to trigger alerts
    console.log('📝 Test 1: Simulating multiple failed login attempts...');
    
    const testEmail = 'rijeet2025@gmail.com';
    const wrongPasswords = [
      'wrong1', 'wrong2', 'wrong3', 'wrong4', 'wrong5',
      'wrong6', 'wrong7', 'wrong8', 'wrong9', 'wrong10',
      'wrong11', 'wrong12', 'wrong13', 'wrong14', 'wrong15'
    ];

    let attemptCount = 0;
    const maxAttempts = 15; // This should trigger IP blacklisting

    for (const password of wrongPasswords) {
      if (attemptCount >= maxAttempts) break;
      
      attemptCount++;
      console.log(`   Attempt ${attemptCount}: Trying password "${password}"`);
      
      try {
        const response = await fetch(`${API_BASE}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: testEmail,
            password: password
          })
        });

        const result = await response.json();
        
        if (response.ok) {
          console.log('   ✅ Unexpected success!');
          break;
        } else {
          console.log(`   ❌ Failed: ${result.error}`);
        }

        // Small delay between attempts
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.log(`   ❌ Request failed: ${error.message}`);
      }
    }

    console.log(`\n📊 Completed ${attemptCount} failed login attempts`);
    console.log('🔍 Expected results:');
    console.log('   - Failed login alerts should appear in the UI');
    console.log('   - IP should be blacklisted after 10+ attempts');
    console.log('   - Account lockout alerts should be generated');
    console.log('   - Admin alerts should be sent');

    // Test 2: Try to login with correct password after blacklisting
    console.log('\n📝 Test 2: Attempting login with correct password after blacklisting...');
    
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testEmail,
          password: '12345678' // Correct password
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log('   ✅ Login successful despite previous attempts');
      } else {
        console.log(`   ❌ Login blocked: ${result.error}`);
        console.log('   🔒 This is expected if IP is blacklisted');
      }
    } catch (error) {
      console.log(`   ❌ Request failed: ${error.message}`);
    }

    // Test 3: Check if we can access other endpoints
    console.log('\n📝 Test 3: Testing access to other endpoints...');
    
    try {
      const response = await fetch(`${API_BASE}/api/debug/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        console.log('   ✅ Other endpoints still accessible');
      } else {
        console.log(`   ❌ Other endpoints blocked: ${response.status}`);
      }
    } catch (error) {
      console.log(`   ❌ Request failed: ${error.message}`);
    }

    console.log('\n🎉 Security alert test completed!');
    console.log('📱 Check the web interface for security alerts');
    console.log('📧 Check admin email for security notifications');
    console.log('🔍 Check server logs for IP blacklisting messages');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testSecurityAlerts();
