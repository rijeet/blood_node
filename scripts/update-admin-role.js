#!/usr/bin/env node

const { MongoClient } = require('mongodb');

async function run() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  const dbName = ((process.env.MONGODB_DATABASE || process.env.DB_NAME || 'blood_node') + '').trim();
  const email = process.env.UPDATE_EMAIL || 'admin@bloodnode.com';
  const role = process.env.UPDATE_ROLE || 'admin';

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const res = await db.collection('admin_users').updateOne(
      { email },
      { $set: { role, updated_at: new Date() } }
    );
    console.log(`updated matched=${res.matchedCount} modified=${res.modifiedCount} for ${email} -> ${role}`);
  } catch (e) {
    console.error('update failed:', e);
    process.exit(1);
  } finally {
    await client.close();
  }
}

run();


