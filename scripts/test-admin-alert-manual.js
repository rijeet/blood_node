#!/usr/bin/env node

/**
 * Manually Test Admin Alert Creation
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Vercel-Admin-BloodNodeDB:M1o5iRdHgY85g8o6@bloodnodedb.1kpzuyh.mongodb.net/?retryWrites=true&w=majority';
const DB_NAME = process.env.MONGODB_DATABASE || process.env.DB_NAME || 'blood_node';

async function testAdminAlert() {
  let client;
  
  try {
    console.log('🧪 Manually Testing Admin Alert Creation...\n');
    
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const alertsCollection = db.collection('admin_alerts');
    
    // Create a test admin alert
    const testAlert = {
      alert_type: 'ip_blacklisted',
      severity: 'high',
      title: '🚫 Test IP Address Blacklisted: 192.168.1.100',
      message: 'IP address 192.168.1.100 has been automatically blacklisted after 12 failed login attempts. Reason: brute_force',
      details: {
        ip_address: '192.168.1.100',
        attempt_count: 12,
        location: 'Test Location',
        timestamp: new Date()
      },
      is_read: false,
      created_at: new Date()
    };
    
    console.log('📝 Creating test admin alert...');
    const result = await alertsCollection.insertOne(testAlert);
    console.log(`✅ Test alert created with ID: ${result.insertedId}`);
    
    // Check if alert was created
    const alertCount = await alertsCollection.countDocuments();
    console.log(`📊 Total Admin Alerts: ${alertCount}`);
    
    // Get the created alert
    const createdAlert = await alertsCollection.findOne({ _id: result.insertedId });
    console.log('\n📋 Created Alert Details:');
    console.log(`   Title: ${createdAlert.title}`);
    console.log(`   Type: ${createdAlert.alert_type}`);
    console.log(`   Severity: ${createdAlert.severity}`);
    console.log(`   Read: ${createdAlert.is_read ? 'Yes' : 'No'}`);
    console.log(`   Created: ${createdAlert.created_at}`);
    
    console.log('\n✅ Manual Admin Alert Test Complete!');
    
  } catch (error) {
    console.error('❌ Error testing admin alert:', error);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

testAdminAlert();
