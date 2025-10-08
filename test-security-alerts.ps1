# Test script for security alerts and IP blacklisting
# This script simulates multiple failed login attempts to trigger security alerts

Write-Host "🧪 Testing Security Alert System" -ForegroundColor Green
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
if (-not (Test-Path "test-security-alerts.js")) {
    Write-Host "❌ Test file not found: test-security-alerts.js" -ForegroundColor Red
    exit 1
}

Write-Host "`n🚀 Running security alert test..." -ForegroundColor Yellow
Write-Host "This will simulate multiple failed login attempts to trigger:" -ForegroundColor Cyan
Write-Host "  - Failed login alerts" -ForegroundColor Cyan
Write-Host "  - IP blacklisting after 10+ attempts" -ForegroundColor Cyan
Write-Host "  - Account lockout alerts" -ForegroundColor Cyan
Write-Host "  - Admin email notifications" -ForegroundColor Cyan

Write-Host "`n⚠️  WARNING: This test will make multiple failed login attempts!" -ForegroundColor Yellow
Write-Host "Make sure the development server is running on localhost:3000" -ForegroundColor Yellow

$confirmation = Read-Host "`nDo you want to continue? (y/N)"
if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
    Write-Host "Test cancelled." -ForegroundColor Yellow
    exit 0
}

# Run the test
node test-security-alerts.js

Write-Host "`n📱 Next steps:" -ForegroundColor Cyan
Write-Host "1. Check the web interface for security alerts" -ForegroundColor White
Write-Host "2. Check admin email for security notifications" -ForegroundColor White
Write-Host "3. Check server logs for IP blacklisting messages" -ForegroundColor White
Write-Host "4. Try logging in with correct credentials to see if IP is blocked" -ForegroundColor White
