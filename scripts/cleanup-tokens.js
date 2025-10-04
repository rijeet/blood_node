#!/usr/bin/env node

/**
 * Cleanup script for expired verification tokens
 * 
 * Usage:
 * - Manual: node scripts/cleanup-tokens.js
 * - Cron: Add to crontab to run every hour
 * - PM2: Use PM2 cron for production
 */

const { cleanupAllExpiredTokens, getTokenStatistics } = require('../lib/db/verification');

async function runCleanup() {
  try {
    console.log('🔄 Starting comprehensive token cleanup (verification + refresh)...');
    console.log('Time:', new Date().toISOString());
    
    // Get statistics before cleanup
    const statsBefore = await getTokenStatistics();
    console.log('📊 Statistics before cleanup:', {
      verification: statsBefore.verification,
      refresh: statsBefore.refresh,
      combined: statsBefore.combined
    });
    
    // Run comprehensive cleanup
    const cleanupResult = await cleanupAllExpiredTokens();
    
    // Get statistics after cleanup
    const statsAfter = await getTokenStatistics();
    console.log('📊 Statistics after cleanup:', {
      verification: statsAfter.verification,
      refresh: statsAfter.refresh,
      combined: statsAfter.combined
    });
    
    console.log(`✅ Cleanup completed successfully!`);
    console.log(`🗑️  Deleted ${cleanupResult.total} tokens:`);
    console.log(`   - Verification tokens: ${cleanupResult.verification}`);
    console.log(`   - Refresh tokens: ${cleanupResult.refresh}`);
    console.log(`📈 Total tokens reduced from ${statsBefore.combined.total} to ${statsAfter.combined.total}`);
    
    // Exit with success code
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

// Run cleanup if this script is executed directly
if (require.main === module) {
  runCleanup();
}

module.exports = { runCleanup };
