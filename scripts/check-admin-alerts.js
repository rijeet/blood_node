#!/usr/bin/env node

/**
 * Check Admin Alerts in Database
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Vercel-Admin-BloodNodeDB:M1o5iRdHgY85g8o6@bloodnodedb.1kpzuyh.mongodb.net/?retryWrites=true&w=majority';
const DB_NAME = process.env.MONGODB_DATABASE || process.env.DB_NAME || 'blood_node';

async function checkAdminAlerts() {
  let client;
  
  try {
    console.log('🔍 Checking Admin Alerts in Database...\n');
    
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    
    // Check admin alerts collection
    const alertsCollection = db.collection('admin_alerts');
    const alertsCount = await alertsCollection.countDocuments();
    console.log(`📊 Total Admin Alerts: ${alertsCount}`);
    
    if (alertsCount > 0) {
      const recentAlerts = await alertsCollection.find({})
        .sort({ created_at: -1 })
        .limit(5)
        .toArray();
      
      console.log('\n📋 Recent Alerts:');
      recentAlerts.forEach((alert, index) => {
        console.log(`\n${index + 1}. ${alert.title}`);
        console.log(`   Type: ${alert.alert_type}`);
        console.log(`   Severity: ${alert.severity}`);
        console.log(`   Read: ${alert.is_read ? 'Yes' : 'No'}`);
        console.log(`   Created: ${alert.created_at}`);
        if (alert.details.ip_address) {
          console.log(`   IP: ${alert.details.ip_address}`);
        }
        if (alert.details.attempt_count) {
          console.log(`   Attempts: ${alert.details.attempt_count}`);
        }
      });
    }
    
    // Check IP blacklist collection
    const blacklistCollection = db.collection('ip_blacklist');
    const blacklistCount = await blacklistCollection.countDocuments({ is_active: true });
    console.log(`\n🚫 Active IP Blacklist Entries: ${blacklistCount}`);
    
    if (blacklistCount > 0) {
      const blacklistedIPs = await blacklistCollection.find({ is_active: true })
        .sort({ created_at: -1 })
        .limit(3)
        .toArray();
      
      console.log('\n🚫 Recent Blacklisted IPs:');
      blacklistedIPs.forEach((entry, index) => {
        console.log(`\n${index + 1}. IP: ${entry.ip_address}`);
        console.log(`   Reason: ${entry.reason}`);
        console.log(`   Severity: ${entry.severity}`);
        console.log(`   Created: ${entry.created_at}`);
        if (entry.expires_at) {
          console.log(`   Expires: ${entry.expires_at}`);
        }
      });
    }
    
    // Check login attempts collection
    const loginAttemptsCollection = db.collection('login_attempts');
    const recentAttempts = await loginAttemptsCollection.countDocuments({
      created_at: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    });
    console.log(`\n🔐 Login Attempts (Last 24h): ${recentAttempts}`);
    
    // Check account lockouts collection
    const lockoutsCollection = db.collection('account_lockouts');
    const activeLockouts = await lockoutsCollection.countDocuments({
      is_active: true,
      locked_until: { $gt: new Date() }
    });
    console.log(`🔒 Active Account Lockouts: ${activeLockouts}`);
    
    console.log('\n✅ Database Check Complete!');
    console.log('\n📊 Summary:');
    console.log(`   - Admin Alerts: ${alertsCount}`);
    console.log(`   - Blacklisted IPs: ${blacklistCount}`);
    console.log(`   - Recent Login Attempts: ${recentAttempts}`);
    console.log(`   - Active Lockouts: ${activeLockouts}`);
    
  } catch (error) {
    console.error('❌ Error checking admin alerts:', error);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

checkAdminAlerts();
