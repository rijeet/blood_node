#!/usr/bin/env node

/**
 * Clear Admin Account Lockout
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Vercel-Admin-BloodNodeDB:M1o5iRdHgY85g8o6@bloodnodedb.1kpzuyh.mongodb.net/?retryWrites=true&w=majority';
const DB_NAME = process.env.MONGODB_DATABASE || process.env.DB_NAME || 'blood_node';

async function clearAdminLockout() {
  let client;
  
  try {
    console.log('🔓 Clearing admin account lockouts...\n');
    
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    
    // Clear account lockouts
    const lockoutsCollection = db.collection('account_lockouts');
    const lockoutResult = await lockoutsCollection.deleteMany({});
    console.log(`🗑️  Deleted ${lockoutResult.deletedCount} account lockouts`);
    
    // Clear login attempts
    const loginAttemptsCollection = db.collection('login_attempts');
    const attemptsResult = await loginAttemptsCollection.deleteMany({});
    console.log(`🗑️  Deleted ${attemptsResult.deletedCount} login attempts`);
    
    // Clear rate limits
    const rateLimitsCollection = db.collection('rate_limits');
    const rateLimitResult = await rateLimitsCollection.deleteMany({});
    console.log(`🗑️  Deleted ${rateLimitResult.deletedCount} rate limit records`);
    
    console.log('\n✅ Admin lockout cleared successfully!');
    console.log('🔑 You can now login as admin');
    
  } catch (error) {
    console.error('❌ Error clearing admin lockout:', error);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

clearAdminLockout();
