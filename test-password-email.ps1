# Test password update with email notification
# This script tests the password update functionality with proper email handling

Write-Host "🧪 Testing Password Update with Email Notification" -ForegroundColor Green
Write-Host "=" * 50 -ForegroundColor Green

# Check if Node.js is available
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check if the test file exists
if (-not (Test-Path "test-password-email.js")) {
    Write-Host "❌ Test file not found: test-password-email.js" -ForegroundColor Red
    exit 1
}

# Run the test
Write-Host "`n🚀 Running password update test..." -ForegroundColor Yellow
node test-password-email.js

Write-Host "`n📧 Check your email (rijeet2025@gmail.com) for the password change notification" -ForegroundColor Cyan
Write-Host "The email should contain details about the password change including:" -ForegroundColor Cyan
Write-Host "  - User Code" -ForegroundColor Cyan
Write-Host "  - Change Time" -ForegroundColor Cyan
Write-Host "  - IP Address" -ForegroundColor Cyan
Write-Host "  - Security notice" -ForegroundColor Cyan
