#!/usr/bin/env node
const { MongoClient } = require('mongodb');

(async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  const dbName = ((process.env.MONGODB_DATABASE || process.env.DB_NAME || 'blood_node') + '').trim();
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const docs = await db.collection('admin_users').find({}, { projection: { email: 1, role: 1 } }).toArray();
    console.log(JSON.stringify(docs, null, 2));
  } catch (e) {
    console.error('list failed:', e);
    process.exit(1);
  } finally {
    await client.close();
  }
})();
