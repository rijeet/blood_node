// Database initialization and collection setup

import { MongoClient, Db } from 'mongodb';
import clientPromise from '@/lib/mongodb';

export interface CollectionInfo {
  name: string;
  indexes: Array<{
    keys: Record<string, 1 | -1 | 'text'>;
    options?: {
      unique?: boolean;
      sparse?: boolean;
      background?: boolean;
      name?: string;
      expireAfterSeconds?: number;
    };
  }>;
}

export const COLLECTIONS: CollectionInfo[] = [
  {
    name: 'users',
    indexes: [
      { keys: { user_code: 1 }, options: { unique: true } },
      { keys: { email_hash: 1 }, options: { unique: true } },
      { keys: { location_geohash: 1 } },
      { keys: { blood_group_public: 1 } },
      { keys: { public_profile: 1 } },
      { keys: { last_donation_date: 1 } },
      { keys: { created_at: 1 } },
      { keys: { plan: 1 } }
    ]
  },
  {
    name: 'verification_tokens',
    indexes: [
      { keys: { token: 1 }, options: { unique: true } },
      { keys: { email_hash: 1 } },
      { keys: { token_type: 1 } },
      { keys: { expires_at: 1 }, options: { expireAfterSeconds: 0 } },
      { keys: { created_at: 1 } }
    ]
  },
  {
    name: 'refresh_tokens',
    indexes: [
      { keys: { token: 1 }, options: { unique: true } },
      { keys: { user_id: 1 } },
      { keys: { expires_at: 1 }, options: { expireAfterSeconds: 0 } },
      { keys: { created_at: 1 } }
    ]
  },
  {
    name: 'relatives',
    indexes: [
      { keys: { user_id: 1 } },
      { keys: { relative_user_id: 1 } },
      { keys: { relation: 1 } },
      { keys: { status: 1 } },
      { keys: { created_at: 1 } },
      { keys: { user_id: 1, relative_user_id: 1 }, options: { unique: true } }
    ]
  },
  {
    name: 'invites',
    indexes: [
      { keys: { invite_code: 1 }, options: { unique: true } },
      { keys: { inviter_user_id: 1 } },
      { keys: { email_hash: 1 } },
      { keys: { status: 1 } },
      { keys: { expires_at: 1 }, options: { expireAfterSeconds: 0 } },
      { keys: { created_at: 1 } }
    ]
  },
  {
    name: 'plans',
    indexes: [
      { keys: { name: 1 }, options: { unique: true } },
      { keys: { active: 1 } },
      { keys: { created_at: 1 } }
    ]
  },
  {
    name: 'emergency_alerts',
    indexes: [
      { keys: { alert_id: 1 }, options: { unique: true } },
      { keys: { user_id: 1 } },
      { keys: { blood_group: 1 } },
      { keys: { location_geohash: 1 } },
      { keys: { status: 1 } },
      { keys: { created_at: 1 } },
      { keys: { expires_at: 1 }, options: { expireAfterSeconds: 0 } }
    ]
  },
  {
    name: 'donation_records',
    indexes: [
      { keys: { record_id: 1 }, options: { unique: true } },
      { keys: { user_id: 1 } },
      { keys: { donation_date: 1 } },
      { keys: { blood_group: 1 } },
      { keys: { location: 1 } },
      { keys: { created_at: 1 } }
    ]
  },
  {
    name: 'notifications',
    indexes: [
      { keys: { notification_id: 1 }, options: { unique: true } },
      { keys: { user_id: 1 } },
      { keys: { type: 1 } },
      { keys: { read: 1 } },
      { keys: { created_at: 1 } },
      { keys: { expires_at: 1 }, options: { expireAfterSeconds: 0 } }
    ]
  },
  {
    name: 'audit_logs',
    indexes: [
      { keys: { log_id: 1 }, options: { unique: true } },
      { keys: { user_id: 1 } },
      { keys: { action: 1 } },
      { keys: { resource_type: 1 } },
      { keys: { created_at: 1 } },
      { keys: { created_at: 1 }, options: { expireAfterSeconds: 31536000 } } // 1 year TTL
    ]
  },
  {
    name: 'connection_test',
    indexes: [
      { keys: { test_id: 1 }, options: { unique: true } },
      { keys: { created_at: 1 } }
    ]
  }
];

/**
 * Initialize database with all collections and indexes
 */
export async function initializeDatabase(): Promise<{
  success: boolean;
  collections: string[];
  errors: string[];
}> {
  const client = await clientPromise;
  if (!client) {
    return {
      success: false,
      collections: [],
      errors: ['Database connection failed']
    };
  }
  const db = client.db(process.env.MONGODB_DATABASE);
  
  const results = {
    success: true,
    collections: [] as string[],
    errors: [] as string[]
  };

  try {
    console.log('🚀 Initializing Blood Node database...');

    for (const collectionInfo of COLLECTIONS) {
      try {
        // Create collection if it doesn't exist
        const collection = db.collection(collectionInfo.name);
        await collection.createIndexes(collectionInfo.indexes);
        
        results.collections.push(collectionInfo.name);
        console.log(`✅ Collection '${collectionInfo.name}' initialized with ${collectionInfo.indexes.length} indexes`);
      } catch (error: any) {
        const errorMsg = `Failed to initialize collection '${collectionInfo.name}': ${error.message}`;
        results.errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
        results.success = false;
      }
    }

    // Create default plan if it doesn't exist
    await createDefaultPlan(db);

    console.log(`🎉 Database initialization complete! ${results.collections.length} collections ready.`);
    
    if (results.errors.length > 0) {
      console.warn(`⚠️  ${results.errors.length} errors occurred during initialization`);
    }

  } catch (error: any) {
    const errorMsg = `Database initialization failed: ${error.message}`;
    results.errors.push(errorMsg);
    results.success = false;
    console.error(`💥 ${errorMsg}`);
  }

  return results;
}

/**
 * Create default plan if it doesn't exist
 */
async function createDefaultPlan(db: Db): Promise<void> {
  try {
    const plansCollection = db.collection('plans');
    
    const defaultPlan = {
      name: 'free',
      display_name: 'Free Plan',
      description: 'Basic blood network features',
      max_family_members: 5,
      max_emergency_alerts: 3,
      max_donation_records: 10,
      features: [
        'Basic family network',
        'Blood group compatibility',
        'Location-based search',
        'Emergency alerts (limited)',
        'Donation tracking'
      ],
      price: 0,
      currency: 'USD',
      billing_cycle: 'monthly',
      active: true,
      created_at: new Date(),
      updated_at: new Date()
    };

    await plansCollection.updateOne(
      { name: 'free' },
      { $setOnInsert: defaultPlan },
      { upsert: true }
    );

    console.log('✅ Default plan created/verified');
  } catch (error) {
    console.error('❌ Failed to create default plan:', error);
  }
}

/**
 * Check database health and collection status
 */
export async function checkDatabaseHealth(): Promise<{
  healthy: boolean;
  collections: Array<{
    name: string;
    exists: boolean;
    documentCount: number;
    indexCount: number;
  }>;
  errors: string[];
}> {
  const client = await clientPromise;
  if (!client) {
    return {
      healthy: false,
      collections: [],
      errors: ['Database connection failed']
    };
  }
  const db = client.db(process.env.MONGODB_DATABASE);
  
  const results = {
    healthy: true,
    collections: [] as Array<{
      name: string;
      exists: boolean;
      documentCount: number;
      indexCount: number;
    }>,
    errors: [] as string[]
  };

  try {
    for (const collectionInfo of COLLECTIONS) {
      try {
        const collection = db.collection(collectionInfo.name);
        const stats = await collection.stats();
        const indexes = await collection.indexes();
        
        results.collections.push({
          name: collectionInfo.name,
          exists: true,
          documentCount: stats.count || 0,
          indexCount: indexes.length
        });
      } catch (error: any) {
        results.collections.push({
          name: collectionInfo.name,
          exists: false,
          documentCount: 0,
          indexCount: 0
        });
        results.errors.push(`Collection '${collectionInfo.name}' not accessible: ${error.message}`);
        results.healthy = false;
      }
    }
  } catch (error: any) {
    results.errors.push(`Database health check failed: ${error.message}`);
    results.healthy = false;
  }

  return results;
}

/**
 * Drop all collections (use with caution!)
 */
export async function dropAllCollections(): Promise<{
  success: boolean;
  dropped: string[];
  errors: string[];
}> {
  const client = await clientPromise;
  if (!client) {
    return {
      success: false,
      dropped: [],
      errors: ['Database connection failed']
    };
  }
  const db = client.db(process.env.MONGODB_DATABASE);
  
  const results = {
    success: true,
    dropped: [] as string[],
    errors: [] as string[]
  };

  try {
    console.log('⚠️  Dropping all collections...');
    
    for (const collectionInfo of COLLECTIONS) {
      try {
        await db.collection(collectionInfo.name).drop();
        results.dropped.push(collectionInfo.name);
        console.log(`🗑️  Dropped collection '${collectionInfo.name}'`);
      } catch (error: any) {
        if (error.code !== 26) { // Collection doesn't exist
          results.errors.push(`Failed to drop '${collectionInfo.name}': ${error.message}`);
          results.success = false;
        }
      }
    }
    
    console.log(`🎯 Dropped ${results.dropped.length} collections`);
  } catch (error: any) {
    results.errors.push(`Drop operation failed: ${error.message}`);
    results.success = false;
  }

  return results;
}
