const { MongoClient } = require('mongodb');

async function checkUser() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('blood_node');
    
    // Check users
    const users = await db.collection('users').find({}).toArray();
    console.log('Users in database:');
    users.forEach((user, i) => {
      console.log(`${i+1}. Name: ${user.name}, Email Hash: ${user.email_hash}, ID: ${user._id}`);
    });
    
    // Check verification tokens
    const tokens = await db.collection('verification_tokens').find({}).sort({created_at: -1}).limit(3).toArray();
    console.log('\nLatest verification tokens:');
    tokens.forEach((token, i) => {
      console.log(`${i+1}. Type: ${token.token_type}, Created: ${token.created_at}, User ID: ${token.user_id}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkUser();
