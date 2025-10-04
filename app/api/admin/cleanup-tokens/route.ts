// Cleanup expired tokens API route (verification + refresh tokens)
import { NextRequest, NextResponse } from 'next/server';
import { cleanupAllExpiredTokens, getTokenStatistics } from '@/lib/db/verification';

export async function POST(request: NextRequest) {
  try {
    // Optional: Add admin authentication here
    // const authHeader = request.headers.get('authorization');
    // if (!authHeader || !isValidAdminToken(authHeader)) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    console.log('Starting comprehensive token cleanup...');
    
    // Clean up expired and used tokens (verification + refresh)
    const cleanupResult = await cleanupAllExpiredTokens();
    
    // Get current statistics
    const stats = await getTokenStatistics();
    
    console.log(`Token cleanup completed. Deleted ${cleanupResult.total} tokens (${cleanupResult.verification} verification, ${cleanupResult.refresh} refresh).`);
    console.log('Current token statistics:', stats);
    
    return NextResponse.json({
      success: true,
      deletedCount: cleanupResult.total,
      verificationDeleted: cleanupResult.verification,
      refreshDeleted: cleanupResult.refresh,
      statistics: stats,
      message: `Successfully cleaned up ${cleanupResult.total} expired tokens (${cleanupResult.verification} verification, ${cleanupResult.refresh} refresh)`
    });
    
  } catch (error) {
    console.error('Token cleanup error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Token cleanup failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get current token statistics without cleaning
    const stats = await getTokenStatistics();
    
    return NextResponse.json({
      success: true,
      statistics: stats,
      message: 'Token statistics retrieved successfully'
    });
    
  } catch (error) {
    console.error('Error getting token statistics:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get token statistics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
