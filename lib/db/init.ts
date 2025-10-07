// Database initialization and collection setup

import { MongoClient, Db } from 'mongodb';
import clientPromise from '@/lib/mongodb';

export interface CollectionInfo {
  name: string;
  indexes: Array<{
    key: Record<string, 1 | -1 | 'text'>;
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
      { key: { user_code: 1 }, options: { unique: true } },
      { key: { email_hash: 1 }, options: { unique: true } },
      { key: { location_geohash: 1 } },
      { key: { blood_group_public: 1 } },
      { key: { public_profile: 1 } },
      { key: { last_donation_date: 1 } },
      { key: { created_at: 1 } },
      { key: { plan: 1 } }
    ]
  },
  {
    name: 'verification_tokens',
    indexes: [
      { key: { token: 1 }, options: { unique: true } },
      { key: { email_hash: 1 } },
      { key: { token_type: 1 } },
      { key: { expires_at: 1 }, options: { expireAfterSeconds: 0 } },
      { key: { created_at: 1 } }
    ]
  },
  {
    name: 'refresh_tokens',
    indexes: [
      { key: { token: 1 }, options: { unique: true } },
      { key: { user_id: 1 } },
      { key: { expires_at: 1 }, options: { expireAfterSeconds: 0 } },
      { key: { created_at: 1 } }
    ]
  },
  {
    name: 'relatives',
    indexes: [
      { key: { user_id: 1 } },
      { key: { relative_user_id: 1 } },
      { key: { relation: 1 } },
      { key: { status: 1 } },
      { key: { created_at: 1 } },
      { key: { user_id: 1, relative_user_id: 1 }, options: { unique: true } }
    ]
  },
  {
    name: 'invites',
    indexes: [
      { key: { invite_code: 1 }, options: { unique: true } },
      { key: { inviter_user_id: 1 } },
      { key: { email_hash: 1 } },
      { key: { status: 1 } },
      { key: { expires_at: 1 }, options: { expireAfterSeconds: 0 } },
      { key: { created_at: 1 } }
    ]
  },
  {
    name: 'plans',
    indexes: [
      { key: { name: 1 }, options: { unique: true } },
      { key: { active: 1 } },
      { key: { created_at: 1 } }
    ]
  },
  {
    name: 'emergency_alerts',
    indexes: [
      { key: { _id: 1 } },
      { key: { user_id: 1 } },
      { key: { blood_type: 1 } },
      { key: { location_geohash: 1 } },
      { key: { status: 1 } },
      { key: { urgency_level: 1 } },
      { key: { created_at: 1 } },
      { key: { expires_at: 1 }, options: { expireAfterSeconds: 0 } },
      { key: { location_geohash: 1, blood_type: 1, status: 1 } }
    ]
  },
  {
    name: 'donation_records',
    indexes: [
      { key: { record_id: 1 }, options: { unique: true } },
      { key: { user_id: 1 } },
      { key: { donation_date: 1 } },
      { key: { blood_group: 1 } },
      { key: { location: 1 } },
      { key: { created_at: 1 } }
    ]
  },
  {
    name: 'notifications',
    indexes: [
      { key: { _id: 1 } },
      { key: { user_id: 1 } },
      { key: { type: 1 } },
      { key: { read: 1 } },
      { key: { created_at: 1 } },
      { key: { expires_at: 1 }, options: { expireAfterSeconds: 0 } },
      { key: { emergency_alert_id: 1 } },
      { key: { location_geohash: 1 } },
      { key: { user_id: 1, read: 1 } },
      { key: { user_id: 1, type: 1 } }
    ]
  },
  {
    name: 'audit_logs',
    indexes: [
      { key: { log_id: 1 }, options: { unique: true } },
      { key: { user_id: 1 } },
      { key: { action: 1 } },
      { key: { resource_type: 1 } },
      { key: { created_at: 1 }, options: { expireAfterSeconds: 31536000 } } // 1 year TTL
    ]
  },
  {
    name: 'connection_test',
    indexes: [
      { key: { test_id: 1 }, options: { unique: true } },
      { key: { created_at: 1 } }
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
        const documentCount = await collection.countDocuments();
        const indexes = await collection.indexes();
        
        results.collections.push({
          name: collectionInfo.name,
          exists: true,
          documentCount: documentCount,
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
