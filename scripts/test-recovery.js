const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bloodnode';

async function testRecovery() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('bloodnode');
    const usersCollection = db.collection('users');
    
    // Find a user with recovery shares
    const user = await usersCollection.findOne({
      recovery_shares: { $exists: true, $ne: [] }
    });
    
    if (!user) {
      console.log('No user with recovery shares found. Creating test user...');
      
      // Create a test user with recovery shares
      const testUser = {
        email: 'test@example.com',
        name: 'Test User',
        password_hash: 'test_hash',
        recovery_shares: [
          'share1_test_123456789',
          'share2_test_987654321', 
          'share3_test_555666777'
        ],
        created_at: new Date(),
        updated_at: new Date()
      };
      
      const result = await usersCollection.insertOne(testUser);
      console.log('Test user created with ID:', result.insertedId);
      
      // Test the recovery flow
      await testRecoveryFlow('test@example.com', testUser.recovery_shares);
    } else {
      console.log('Found user with recovery shares:', user.email);
      console.log('Recovery shares:', user.recovery_shares);
      
      // Test the recovery flow
      await testRecoveryFlow(user.email, user.recovery_shares);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await client.close();
  }
}

async function testRecoveryFlow(email, recoveryShares) {
  console.log('\n=== Testing Recovery Flow ===');
  
  try {
    // Step 1: Test sending recovery shares
    console.log('1. Testing recovery request...');
    const recoverResponse = await fetch('http://localhost:3000/api/auth/recover', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    
    const recoverResult = await recoverResponse.json();
    console.log('Recovery request result:', recoverResult);
    
    if (!recoverResponse.ok) {
      throw new Error(`Recovery request failed: ${recoverResult.error}`);
    }
    
    // Step 2: Test verifying recovery shares
    console.log('2. Testing recovery shares verification...');
    const verifyResponse = await fetch('http://localhost:3000/api/auth/recovery-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        recovery_shares: recoveryShares
      }),
    });
    
    const verifyResult = await verifyResponse.json();
    console.log('Recovery verification result:', verifyResult);
    
    if (!verifyResponse.ok) {
      throw new Error(`Recovery verification failed: ${verifyResult.error}`);
    }
    
    // Step 3: Test password reset
    console.log('3. Testing password reset...');
    const resetResponse = await fetch('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recovery_token: verifyResult.recovery_token,
        new_password: 'newTestPassword123'
      }),
    });
    
    const resetResult = await resetResponse.json();
    console.log('Password reset result:', resetResult);
    
    if (!resetResponse.ok) {
      throw new Error(`Password reset failed: ${resetResult.error}`);
    }
    
    console.log('✅ All recovery tests passed!');
    
  } catch (error) {
    console.error('❌ Recovery test failed:', error.message);
  }
}

// Run the test
testRecovery().catch(console.error);
