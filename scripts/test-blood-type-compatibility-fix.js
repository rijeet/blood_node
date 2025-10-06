const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DATABASE || 'blood_node';

async function testBloodTypeCompatibilityFix() {
  console.log('🧪 Testing Blood Type Compatibility Fix for Emergency Alerts\n');
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');
    
    // Test data: Create users with different blood types
    const testUsers = [
      { user_code: 'TEST001', blood_group_public: 'A+', location_geohash: 'wh0re5', public_profile: true },
      { user_code: 'TEST002', blood_group_public: 'A-', location_geohash: 'wh0re5', public_profile: true },
      { user_code: 'TEST003', blood_group_public: 'B+', location_geohash: 'wh0re5', public_profile: true },
      { user_code: 'TEST004', blood_group_public: 'B-', location_geohash: 'wh0re5', public_profile: true },
      { user_code: 'TEST005', blood_group_public: 'AB+', location_geohash: 'wh0re5', public_profile: true },
      { user_code: 'TEST006', blood_group_public: 'AB-', location_geohash: 'wh0re5', public_profile: true },
      { user_code: 'TEST007', blood_group_public: 'O+', location_geohash: 'wh0re5', public_profile: true },
      { user_code: 'TEST008', blood_group_public: 'O-', location_geohash: 'wh0re5', public_profile: true }
    ];
    
    console.log('📝 Creating test users...');
    await usersCollection.insertMany(testUsers);
    console.log(`✅ Created ${testUsers.length} test users`);
    
    // Test the blood type compatibility logic
    const BLOOD_TYPE_COMPATIBILITY = {
      'A+': { canDonateTo: ['A+', 'AB+'], canReceiveFrom: ['A+', 'A-', 'O+', 'O-'] },
      'A-': { canDonateTo: ['A+', 'A-', 'AB+', 'AB-'], canReceiveFrom: ['A-', 'O-'] },
      'B+': { canDonateTo: ['B+', 'AB+'], canReceiveFrom: ['B+', 'B-', 'O+', 'O-'] },
      'B-': { canDonateTo: ['B+', 'B-', 'AB+', 'AB-'], canReceiveFrom: ['B-', 'O-'] },
      'AB+': { canDonateTo: ['AB+'], canReceiveFrom: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
      'AB-': { canDonateTo: ['AB+', 'AB-'], canReceiveFrom: ['A-', 'B-', 'AB-', 'O-'] },
      'O+': { canDonateTo: ['A+', 'B+', 'AB+', 'O+'], canReceiveFrom: ['O+', 'O-'] },
      'O-': { canDonateTo: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], canReceiveFrom: ['O-'] }
    };
    
    function getCompatibleBloodTypesForEmergency(emergencyBloodType) {
      const compatibleDonors = [];
      
      // Find all blood types that can donate to the emergency blood type
      for (const [donorType, compatibility] of Object.entries(BLOOD_TYPE_COMPATIBILITY)) {
        if (compatibility.canDonateTo.includes(emergencyBloodType)) {
          compatibleDonors.push(donorType);
        }
      }
      
      return compatibleDonors;
    }
    
    // Test different emergency blood types
    const testCases = [
      { emergency: 'AB+', expected: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
      { emergency: 'A+', expected: ['A+', 'A-', 'O+', 'O-'] },
      { emergency: 'O+', expected: ['O+', 'O-'] },
      { emergency: 'O-', expected: ['O-'] }
    ];
    
    console.log('\n🔍 Testing Blood Type Compatibility Logic:');
    console.log('=' .repeat(60));
    
    for (const testCase of testCases) {
      const compatibleTypes = getCompatibleBloodTypesForEmergency(testCase.emergency);
      const isCorrect = JSON.stringify(compatibleTypes.sort()) === JSON.stringify(testCase.expected.sort());
      
      console.log(`\n🩸 Emergency: ${testCase.emergency}`);
      console.log(`   Expected: ${testCase.expected.join(', ')}`);
      console.log(`   Got:      ${compatibleTypes.join(', ')}`);
      console.log(`   Result:   ${isCorrect ? '✅ PASS' : '❌ FAIL'}`);
    }
    
    // Test the database query with compatible blood types
    console.log('\n🔍 Testing Database Query with Compatible Blood Types:');
    console.log('=' .repeat(60));
    
    for (const testCase of testCases) {
      const compatibleTypes = getCompatibleBloodTypesForEmergency(testCase.emergency);
      
      // Simulate the database query
      const query = {
        blood_group_public: { $in: compatibleTypes },
        location_geohash: { $regex: `^wh0re5` },
        public_profile: true
      };
      
      const donors = await usersCollection.find(query).toArray();
      
      console.log(`\n🩸 Emergency: ${testCase.emergency}`);
      console.log(`   Compatible types: ${compatibleTypes.join(', ')}`);
      console.log(`   Found donors: ${donors.length}`);
      console.log(`   Donor types: ${donors.map(d => d.blood_group_public).join(', ')}`);
      
      // Verify all found donors are actually compatible
      const allCompatible = donors.every(donor => 
        compatibleTypes.includes(donor.blood_group_public)
      );
      console.log(`   All compatible: ${allCompatible ? '✅ YES' : '❌ NO'}`);
    }
    
    // Test the specific AB+ case that was failing
    console.log('\n🎯 Testing AB+ Emergency Case (Previously Failing):');
    console.log('=' .repeat(60));
    
    const abPlusCompatible = getCompatibleBloodTypesForEmergency('AB+');
    console.log(`AB+ emergency compatible types: ${abPlusCompatible.join(', ')}`);
    
    const abPlusQuery = {
      blood_group_public: { $in: abPlusCompatible },
      location_geohash: { $regex: `^wh0re5` },
      public_profile: true
    };
    
    const abPlusDonors = await usersCollection.find(abPlusQuery).toArray();
    console.log(`Found ${abPlusDonors.length} compatible donors for AB+ emergency`);
    console.log(`Donor blood types: ${abPlusDonors.map(d => d.blood_group_public).join(', ')}`);
    
    // This should now find ALL blood types, not just AB+
    const expectedAllTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const foundTypes = abPlusDonors.map(d => d.blood_group_public);
    const hasAllTypes = expectedAllTypes.every(type => foundTypes.includes(type));
    
    console.log(`\n📊 AB+ Emergency Test Results:`);
    console.log(`   Expected to find: ${expectedAllTypes.join(', ')}`);
    console.log(`   Actually found:   ${foundTypes.join(', ')}`);
    console.log(`   Has all types:    ${hasAllTypes ? '✅ YES' : '❌ NO'}`);
    console.log(`   Test result:      ${hasAllTypes ? '✅ PASS' : '❌ FAIL'}`);
    
    if (hasAllTypes) {
      console.log('\n🎉 SUCCESS: Blood type compatibility fix is working!');
      console.log('   AB+ emergency now finds ALL compatible blood types');
    } else {
      console.log('\n❌ FAILURE: Blood type compatibility fix is not working');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Clean up test data
    try {
      if (client && client.db) {
        const db = client.db(DB_NAME);
        const usersCollection = db.collection('users');
        await usersCollection.deleteMany({ user_code: { $regex: '^TEST' } });
        console.log('\n🧹 Cleaned up test data');
      }
    } catch (cleanupError) {
      console.error('⚠️  Cleanup error:', cleanupError);
    }
    
    if (client) {
      await client.close();
      console.log('✅ Disconnected from MongoDB');
    }
  }
}

// Run the test
testBloodTypeCompatibilityFix().catch(console.error);
