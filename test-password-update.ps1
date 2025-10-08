# PowerShell script to test password update functionality
Write-Host "🧪 Testing Password Update Functionality..." -ForegroundColor Green
Write-Host ""

# Check if Node.js is available
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Run the test
Write-Host "🚀 Running password update test..." -ForegroundColor Yellow
node test-password-update.js

Write-Host ""
Write-Host "✅ Test completed!" -ForegroundColor Green
