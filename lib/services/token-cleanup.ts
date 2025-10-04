// Token cleanup service with automatic scheduling
import { cleanupAllExpiredTokens, getTokenStatistics } from '@/lib/db/verification';

interface CleanupConfig {
  intervalHours: number;
  maxRetries: number;
  retryDelayMs: number;
}

class TokenCleanupService {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private config: CleanupConfig;

  constructor(config: Partial<CleanupConfig> = {}) {
    this.config = {
      intervalHours: config.intervalHours || 1, // Run every hour by default
      maxRetries: config.maxRetries || 3,
      retryDelayMs: config.retryDelayMs || 5000, // 5 seconds
    };
  }

  /**
   * Start the automatic cleanup service
   */
  start(): void {
    if (this.isRunning) {
      console.log('Token cleanup service is already running');
      return;
    }

    console.log(`🔄 Starting token cleanup service (every ${this.config.intervalHours} hour(s))`);
    
    this.isRunning = true;
    this.intervalId = setInterval(() => {
      this.runCleanupWithRetry();
    }, this.config.intervalHours * 60 * 60 * 1000);

    // Run cleanup immediately on start
    this.runCleanupWithRetry();
  }

  /**
   * Stop the automatic cleanup service
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('🛑 Token cleanup service stopped');
  }

  /**
   * Run cleanup with retry logic
   */
  private async runCleanupWithRetry(): Promise<void> {
    let retries = 0;
    
    while (retries < this.config.maxRetries) {
      try {
        await this.runCleanup();
        return; // Success, exit retry loop
      } catch (error) {
        retries++;
        console.error(`❌ Token cleanup attempt ${retries} failed:`, error);
        
        if (retries < this.config.maxRetries) {
          console.log(`⏳ Retrying in ${this.config.retryDelayMs}ms...`);
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelayMs));
        } else {
          console.error('❌ Token cleanup failed after all retries');
        }
      }
    }
  }

  /**
   * Run the actual cleanup process
   */
  private async runCleanup(): Promise<void> {
    const startTime = Date.now();
    console.log('🔄 Running token cleanup...');
    
    // Get statistics before cleanup
    const statsBefore = await getTokenStatistics();
    console.log('📊 Tokens before cleanup:', {
      verification: statsBefore.verification,
      refresh: statsBefore.refresh,
      combined: statsBefore.combined
    });
    
    // Run comprehensive cleanup
    const cleanupResult = await cleanupAllExpiredTokens();
    
    // Get statistics after cleanup
    const statsAfter = await getTokenStatistics();
    const duration = Date.now() - startTime;
    
    console.log('✅ Token cleanup completed:', {
      deletedCount: cleanupResult.total,
      verificationDeleted: cleanupResult.verification,
      refreshDeleted: cleanupResult.refresh,
      duration: `${duration}ms`,
      tokensBefore: statsBefore.combined.total,
      tokensAfter: statsAfter.combined.total,
      reduction: statsBefore.combined.total - statsAfter.combined.total
    });
  }

  /**
   * Get service status
   */
  getStatus(): { isRunning: boolean; intervalHours: number } {
    return {
      isRunning: this.isRunning,
      intervalHours: this.config.intervalHours
    };
  }

  /**
   * Run cleanup manually
   */
  async runManualCleanup(): Promise<{ deletedCount: number; verificationDeleted: number; refreshDeleted: number; statistics: any }> {
    const statsBefore = await getTokenStatistics();
    const cleanupResult = await cleanupAllExpiredTokens();
    const statsAfter = await getTokenStatistics();
    
    return {
      deletedCount: cleanupResult.total,
      verificationDeleted: cleanupResult.verification,
      refreshDeleted: cleanupResult.refresh,
      statistics: {
        before: statsBefore,
        after: statsAfter
      }
    };
  }
}

// Create singleton instance
export const tokenCleanupService = new TokenCleanupService();

// Auto-start in production
if (process.env.NODE_ENV === 'production') {
  // Start with 1 hour interval in production
  tokenCleanupService.start();
}

export default TokenCleanupService;
