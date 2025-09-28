#!/usr/bin/env node

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DATABASE = process.env.MONGODB_DATABASE;

async function checkCurrentUser() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(MONGODB_DATABASE);
    const users = db.collection('users');
    
    // Find user by user_code (from the dashboard display)
    const userCode = 'M2HN9IHQ6XR5S476';
    const user = await users.findOne({ user_code: userCode });
    
    if (!user) {
      console.log('User not found with code:', userCode);
      return;
    }
    
    console.log('User found:');
    console.log('===========');
    console.log('Name:', user.name || 'Not set');
    console.log('Email Hash:', user.email_hash);
    console.log('Phone:', user.phone || 'Not set');
    console.log('Blood Group Public:', user.blood_group_public || 'Not set');
    console.log('Location Address:', user.location_address || 'Not set');
    console.log('Location Geohash:', user.location_geohash || 'Not set');
    console.log('Public Profile:', user.public_profile);
    console.log('Email Verified:', user.email_verified);
    console.log('Plan:', user.plan);
    console.log('Created At:', user.created_at);
    console.log('Updated At:', user.updated_at);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkCurrentUser();
