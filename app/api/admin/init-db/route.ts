// Database initialization API endpoint

import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase, checkDatabaseHealth } from '@/lib/db/init';

export async function POST(request: NextRequest) {
  try {
    // In production, you should add proper admin authentication here
    const { action } = await request.json();

    if (action === 'init') {
      const result = await initializeDatabase();
      
      return NextResponse.json({
        success: result.success,
        message: result.success 
          ? 'Database initialized successfully' 
          : 'Database initialization completed with errors',
        collections: result.collections,
        errors: result.errors
      });
    }

    if (action === 'health') {
      const health = await checkDatabaseHealth();
      
      return NextResponse.json({
        success: true,
        healthy: health.healthy,
        collections: health.collections,
        errors: health.errors
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "init" or "health"' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Database admin error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const health = await checkDatabaseHealth();
    
    return NextResponse.json({
      success: true,
      healthy: health.healthy,
      collections: health.collections,
      errors: health.errors,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Database health check error:', error);
    return NextResponse.json(
      { error: 'Health check failed', details: error.message },
      { status: 500 }
    );
  }
}
