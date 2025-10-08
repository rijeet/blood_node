# PowerShell script to test password update functionality
Write-Host "🧪 Testing Password Update Fix..." -ForegroundColor Green
Write-Host ""

# Check if Node.js is available
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Test the password update with a real user
Write-Host "🚀 Testing password update with user1@example.com..." -ForegroundColor Yellow

# Create a simple test script
$testScript = @"
const fetch = globalThis.fetch || require('node-fetch');

async function testPasswordUpdate() {
  console.log('🧪 Testing Password Update Fix...\n');

  try {
    // First, login to get a valid token
    console.log('1. Logging in...');
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'user1@example.com',
        password: '12345678'
      }),
    });

    if (!loginResponse.ok) {
      console.log('❌ Login failed. Status:', loginResponse.status);
      const error = await loginResponse.text();
      console.log('Error:', error);
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login successful');

    // Test password update
    console.log('\n2. Testing password update...');
    const passwordUpdateResponse = await fetch('http://localhost:3000/api/profile/password', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${loginData.access_token}\`
      },
      body: JSON.stringify({
        currentPassword: '12345678',
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
      console.log('   Status:', passwordUpdateResponse.status);
      console.log('   Error:', passwordUpdateData.error);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testPasswordUpdate();
"@

# Write the test script to a temporary file
$testScript | Out-File -FilePath "temp-test.js" -Encoding UTF8

# Run the test
node temp-test.js

# Clean up
Remove-Item "temp-test.js" -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "✅ Test completed!" -ForegroundColor Green
