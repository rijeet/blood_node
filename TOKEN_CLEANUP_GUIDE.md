# Token Cleanup System

This guide explains how to set up and manage automatic cleanup of expired tokens in Blood Node.

## Overview

The token cleanup system automatically removes:

### Verification Tokens:
- **Expired tokens** - Tokens that have passed their expiration date
- **Used tokens** - Tokens that have been used and are older than 24 hours
- **Old verification codes** - Verification codes that are no longer needed

### Refresh Tokens:
- **Expired tokens** - Refresh tokens that have passed their expiration date
- **Revoked tokens** - Tokens that have been revoked and are older than 7 days
- **Old device sessions** - Inactive device sessions that are no longer needed

## Components

### 1. Database Functions
- **File**: `lib/db/verification.ts`
- **Functions**: 
  - `cleanupExpiredTokens()` - Deletes expired verification tokens
  - `cleanupExpiredRefreshTokens()` - Deletes expired refresh tokens
  - `cleanupAllExpiredTokens()` - Comprehensive cleanup of both token types

### 2. API Endpoint
- **File**: `app/api/admin/cleanup-tokens/route.ts`
- **Methods**: 
  - `POST` - Run cleanup and return statistics
  - `GET` - Get current token statistics without cleaning

### 3. Cleanup Script
- **File**: `scripts/cleanup-tokens.js`
- **Usage**: `npm run cleanup-tokens`
- **What it does**: Runs cleanup and logs results

### 4. Cleanup Service
- **File**: `lib/services/token-cleanup.ts`
- **What it does**: Automatic scheduled cleanup with retry logic

## Usage

### Manual Cleanup

#### Using npm script:
```bash
npm run cleanup-tokens
```

#### Using API endpoint:
```bash
# Run cleanup
curl -X POST http://localhost:3000/api/admin/cleanup-tokens

# Get statistics
curl -X GET http://localhost:3000/api/admin/cleanup-tokens
```

#### Using Node.js:
```javascript
import { cleanupExpiredTokens, getTokenStatistics } from '@/lib/db/verification';

// Run cleanup
const deletedCount = await cleanupExpiredTokens();
console.log(`Deleted ${deletedCount} tokens`);

// Get statistics
const stats = await getTokenStatistics();
console.log('Token statistics:', stats);
```

### Automatic Cleanup

#### Option 1: Cron Job (Recommended for VPS/Dedicated servers)

1. **Install crontab**:
   ```bash
   # Edit crontab
   crontab -e
   
   # Add this line (runs every hour):
   0 * * * * cd /path/to/blood-node && npm run cleanup-tokens >> /var/log/blood-node-cleanup.log 2>&1
   ```

2. **Verify crontab**:
   ```bash
   crontab -l
   ```

#### Option 2: PM2 Cron (Recommended for production)

1. **Install PM2**:
   ```bash
   npm install -g pm2
   ```

2. **Start with PM2**:
   ```bash
   pm2 start ecosystem.config.js
   ```

3. **Monitor**:
   ```bash
   pm2 status
   pm2 logs blood-node-cleanup
   ```

#### Option 3: Built-in Service (Development)

The cleanup service automatically starts in production mode:

```javascript
import { tokenCleanupService } from '@/lib/services/token-cleanup';

// Service is auto-started in production
// Manual control:
tokenCleanupService.start();  // Start automatic cleanup
tokenCleanupService.stop();   // Stop automatic cleanup
```

## Configuration

### Cleanup Service Configuration

```javascript
const cleanupService = new TokenCleanupService({
  intervalHours: 1,        // Run every hour
  maxRetries: 3,           // Retry failed cleanups 3 times
  retryDelayMs: 5000       // Wait 5 seconds between retries
});
```

### Database Cleanup Rules

#### Verification Tokens:
- `expires_at < current_time` (expired tokens)
- `used = true AND used_at < (current_time - 24_hours)` (old used tokens)

#### Refresh Tokens:
- `expires_at < current_time` (expired tokens)
- `revoked = true AND created_at < (current_time - 7_days)` (old revoked tokens)

## Monitoring

### Check Token Statistics

```bash
# Via API
curl -X GET http://localhost:3000/api/admin/cleanup-tokens

# Via script
npm run cleanup-tokens
```

### Log Files

- **Cron logs**: `/var/log/blood-node-cleanup.log`
- **PM2 logs**: `pm2 logs blood-node-cleanup`
- **Application logs**: Check console output

### Health Checks

```bash
# Check if cleanup is running (PM2)
pm2 status blood-node-cleanup

# Check cron job
grep "cleanup" /var/log/cron.log

# Check recent cleanup activity
tail -f /var/log/blood-node-cleanup.log
```

## Troubleshooting

### Common Issues

1. **Cleanup not running**:
   - Check cron job: `crontab -l`
   - Check PM2 status: `pm2 status`
   - Check logs for errors

2. **Database connection errors**:
   - Verify MongoDB connection
   - Check environment variables
   - Ensure database permissions

3. **High token count**:
   - Run manual cleanup: `npm run cleanup-tokens`
   - Check if automatic cleanup is working
   - Review token expiration settings

### Debug Mode

Enable debug logging by setting:
```bash
export DEBUG=blood-node:cleanup
npm run cleanup-tokens
```

## Security Considerations

1. **API Protection**: The cleanup API endpoint should be protected in production
2. **Log Security**: Ensure cleanup logs don't contain sensitive token data
3. **Access Control**: Limit who can trigger manual cleanups
4. **Backup**: Consider backing up important tokens before cleanup

## Performance Impact

- **Frequency**: Running every hour is usually sufficient
- **Database Load**: Cleanup is lightweight and runs quickly
- **Memory Usage**: Minimal impact on application performance
- **Log Size**: Monitor log file sizes and rotate as needed

## Best Practices

1. **Monitor regularly**: Check token statistics weekly
2. **Log rotation**: Set up log rotation for cleanup logs
3. **Alerting**: Set up alerts for cleanup failures
4. **Testing**: Test cleanup in staging environment first
5. **Documentation**: Keep this guide updated with any changes
