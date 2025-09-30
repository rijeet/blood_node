const { MongoClient } = require('mongodb');
const crypto = require('crypto');

function hashEmail(email) {
  const secret = process.env.EMAIL_HASH_SECRET || 'default-email-secret';
  return crypto
    .createHmac('sha256', secret)
    .update(email.toLowerCase())
    .digest('hex');
}

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyUsers() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('blood_node');
    
    console.log('🔍 Verifying users in database...\n');
    
    // Check total count
    const totalUsers = await db.collection('users').countDocuments();
    console.log(`📊 Total users: ${totalUsers}`);
    
    // Check verification status
    const verifiedUsers = await db.collection('users').countDocuments({ email_verified: true });
    const usersWithPasswordHash = await db.collection('users').countDocuments({ 
      password_hash: { $exists: true, $ne: null } 
    });
    
    console.log(`✅ Email verified: ${verifiedUsers}/${totalUsers} (${Math.round(verifiedUsers/totalUsers*100)}%)`);
    console.log(`🔐 Password hash present: ${usersWithPasswordHash}/${totalUsers} (${Math.round(usersWithPasswordHash/totalUsers*100)}%)`);
    
    // Test specific users
    const testUsers = [
      'user1@example.com',
      'user50@example.com', 
      'user99@example.com'
    ];
    
    console.log('\n🧪 Testing specific users:');
    console.log('=' .repeat(60));
    
    for (const testEmail of testUsers) {
      const testPassword = '12345678';
      
      const emailHash = hashEmail(testEmail);
      const passwordHash = await hashPassword(testPassword);
      
      console.log(`\n📧 Testing: ${testEmail}`);
      console.log(`   Email hash: ${emailHash}`);
      console.log(`   Password hash: ${passwordHash}`);
      
      const user = await db.collection('users').findOne({ email_hash: emailHash });
      
      if (user) {
        console.log(`   ✅ User found: ${user.name}`);
        console.log(`   📧 Email verified: ${user.email_verified}`);
        console.log(`   🔐 Password hash present: ${!!user.password_hash}`);
        console.log(`   🎯 Password match: ${user.password_hash === passwordHash ? 'YES' : 'NO'}`);
        console.log(`   🩸 Blood group: ${user.blood_group_public || 'Not set'}`);
        console.log(`   📍 Location: ${user.location_address || 'Not set'}`);
      } else {
        console.log(`   ❌ User not found in database`);
      }
    }
    
    // Show sample of users
    console.log('\n📋 Sample users (first 10):');
    console.log('=' .repeat(60));
    const users = await db.collection('users').find({}).limit(10).toArray();
    users.forEach((user, i) => {
      console.log(`${(i+1).toString().padStart(2)}. ${user.name || 'No name'}`);
      console.log(`    📧 Email verified: ${user.email_verified}`);
      console.log(`    🔐 Password hash: ${user.password_hash ? 'Present' : 'Missing'}`);
      console.log(`    🩸 Blood group: ${user.blood_group_public || 'Not set'}`);
      console.log(`    📍 Location: ${user.location_address || 'Not set'}`);
      console.log('');
    });
    
    // Check for any issues
    console.log('🔍 Checking for potential issues:');
    console.log('=' .repeat(60));
    
    const usersWithoutPasswordHash = await db.collection('users').countDocuments({ 
      password_hash: { $exists: false } 
    });
    const usersNotVerified = await db.collection('users').countDocuments({ 
      email_verified: { $ne: true } 
    });
    const usersWithoutNames = await db.collection('users').countDocuments({ 
      name: { $exists: false } 
    });
    
    if (usersWithoutPasswordHash > 0) {
      console.log(`⚠️  Users without password hash: ${usersWithoutPasswordHash}`);
    }
    if (usersNotVerified > 0) {
      console.log(`⚠️  Users not email verified: ${usersNotVerified}`);
    }
    if (usersWithoutNames > 0) {
      console.log(`⚠️  Users without names: ${usersWithoutNames}`);
    }
    
    if (usersWithoutPasswordHash === 0 && usersNotVerified === 0 && usersWithoutNames === 0) {
      console.log('✅ No issues found - all users are properly configured!');
    }
    
    console.log('\n🎉 User verification completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

verifyUsers();
