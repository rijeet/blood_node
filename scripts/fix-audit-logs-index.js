#!/usr/bin/env node

/**
 * Fix audit_logs collection duplicate index issue
 * This script removes the duplicate created_at index and recreates it properly
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DATABASE || process.env.DB_NAME || 'blood_node';

async function fixAuditLogsIndex() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const collection = db.collection('audit_logs');
    
    // Get all indexes
    const indexes = await collection.indexes();
    console.log('📋 Current indexes:', indexes.map(idx => idx.name));
    
    // Find and remove duplicate created_at indexes
    const createdAtIndexes = indexes.filter(idx => 
      idx.name === 'created_at_1' || 
      (idx.key && idx.key.created_at === 1 && !idx.expireAfterSeconds)
    );
    
    if (createdAtIndexes.length > 1) {
      console.log('🔧 Found duplicate created_at indexes, removing...');
      
      for (const index of createdAtIndexes) {
        if (index.name !== 'created_at_1') {
          try {
            await collection.dropIndex(index.name);
            console.log(`✅ Removed index: ${index.name}`);
          } catch (error) {
            console.log(`⚠️  Could not remove index ${index.name}:`, error.message);
          }
        }
      }
    }
    
    // Check if the TTL index exists
    const ttlIndex = indexes.find(idx => 
      idx.key && idx.key.created_at === 1 && idx.expireAfterSeconds
    );
    
    if (!ttlIndex) {
      console.log('🔧 Creating TTL index for created_at...');
      await collection.createIndex(
        { created_at: 1 }, 
        { expireAfterSeconds: 31536000 } // 1 year TTL
      );
      console.log('✅ Created TTL index for created_at');
    } else {
      console.log('✅ TTL index already exists');
    }
    
    // Verify final state
    const finalIndexes = await collection.indexes();
    console.log('📋 Final indexes:', finalIndexes.map(idx => ({
      name: idx.name,
      key: idx.key,
      expireAfterSeconds: idx.expireAfterSeconds
    })));
    
    console.log('✅ Audit logs index fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing audit logs index:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run the fix
fixAuditLogsIndex();
