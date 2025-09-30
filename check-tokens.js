const { MongoClient } = require('mongodb');

async function checkTokens() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('blood_node');
    const tokens = await db.collection('verification_tokens').find({}).sort({created_at: -1}).limit(5).toArray();
    
    console.log('Latest verification tokens:');
    tokens.forEach((token, i) => {
      console.log(`${i+1}. Type: ${token.token_type}, Created: ${token.created_at}, Token: ${token.token.substring(0, 20)}...`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkTokens();
