#!/usr/bin/env node

/**
 * Database initialization script for Blood Node
 * Run this script to set up all required collections and indexes
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DATABASE = process.env.MONGODB_DATABASE;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is required');
  process.exit(1);
}

if (!MONGODB_DATABASE) {
  console.error('❌ MONGODB_DATABASE environment variable is required');
  process.exit(1);
}

const COLLECTIONS = [
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

async function initializeDatabase() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🚀 Connecting to MongoDB...');
    await client.connect();
    
    const db = client.db(MONGODB_DATABASE);
    console.log(`📊 Connected to database: ${MONGODB_DATABASE}`);
    
    const results = {
      success: true,
      collections: [],
      errors: []
    };

    // Create collections and indexes
    for (const collectionInfo of COLLECTIONS) {
      try {
        console.log(`\n📁 Creating collection: ${collectionInfo.name}`);
        
        const collection = db.collection(collectionInfo.name);
        
        // Create indexes
        if (collectionInfo.indexes.length > 0) {
          console.log(`  📋 Creating ${collectionInfo.indexes.length} indexes...`);
          await collection.createIndexes(collectionInfo.indexes);
        }
        
        results.collections.push(collectionInfo.name);
        console.log(`  ✅ Collection '${collectionInfo.name}' ready`);
        
      } catch (error) {
        const errorMsg = `Failed to create collection '${collectionInfo.name}': ${error.message}`;
        results.errors.push(errorMsg);
        console.error(`  ❌ ${errorMsg}`);
        results.success = false;
      }
    }

    // Create default plan
    try {
      console.log('\n💳 Creating default plan...');
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
      
      console.log('  ✅ Default plan created/verified');
    } catch (error) {
      console.error('  ❌ Failed to create default plan:', error.message);
      results.errors.push(`Failed to create default plan: ${error.message}`);
      results.success = false;
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    if (results.success) {
      console.log('🎉 Database initialization completed successfully!');
      console.log(`📊 Created ${results.collections.length} collections`);
    } else {
      console.log('⚠️  Database initialization completed with errors');
      console.log(`❌ ${results.errors.length} errors occurred`);
    }
    
    if (results.errors.length > 0) {
      console.log('\nErrors:');
      results.errors.forEach(error => console.log(`  • ${error}`));
    }

    return results;

  } catch (error) {
    console.error('💥 Database initialization failed:', error);
    return { success: false, collections: [], errors: [error.message] };
  } finally {
    await client.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the initialization
if (require.main === module) {
  initializeDatabase()
    .then((results) => {
      process.exit(results.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { initializeDatabase, COLLECTIONS };
