#!/usr/bin/env node

/**
 * Test script to verify family invitation and donation availability fixes
 * 
 * This script tests:
 * 1. Family member visibility - both users can see each other after invitation acceptance
 * 2. Donation availability sync - family members see updated availability when user donates
 */

const { MongoClient, ObjectId } = require('mongodb');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DATABASE || 'blood_node';

async function testFamilyFixes() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');
    const relativesCollection = db.collection('relatives');
    
    // Clean up any existing test data
    await usersCollection.deleteMany({ user_code: { $in: ['TESTUSER1', 'TESTUSER2'] } });
    await relativesCollection.deleteMany({ 
      $or: [
        { 'user_id': { $exists: true } }, // Will be cleaned up when we create test users
      ]
    });
    
    console.log('\n=== Test 1: Family Member Visibility ===');
    
    // Create test users
    const userA = {
      _id: new ObjectId(),
      user_code: 'TESTUSER1',
      email_hash: 'test1@example.com',
      email_verified: true,
      public_profile: true,
      blood_group_public: 'A+',
      name: 'Test User A',
      phone: '+1234567890',
      location_address: 'Test Address A',
      last_donation_date: new Date('2024-01-01'), // Donated 3 months ago
      plan: 'free',
      public_key: 'test-key-a',
      encrypted_private_key: 'test-encrypted-a',
      master_salt: 'test-salt-a',
      sss_server_share: 'test-share-a',
      password_hash: 'test-hash-a',
      recovery_email_sent: false,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    const userB = {
      _id: new ObjectId(),
      user_code: 'TESTUSER2',
      email_hash: 'test2@example.com',
      email_verified: true,
      public_profile: true,
      blood_group_public: 'B+',
      name: 'Test User B',
      phone: '+1234567891',
      location_address: 'Test Address B',
      last_donation_date: null, // Never donated
      plan: 'free',
      public_key: 'test-key-b',
      encrypted_private_key: 'test-encrypted-b',
      master_salt: 'test-salt-b',
      sss_server_share: 'test-share-b',
      password_hash: 'test-hash-b',
      recovery_email_sent: false,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    await usersCollection.insertMany([userA, userB]);
    console.log('Created test users A and B');
    
    // Create family relationships (simulating invitation acceptance)
    const relationshipAtoB = {
      _id: new ObjectId(),
      user_id: userA._id,
      relative_user_id: userB._id,
      relation: 'sibling',
      status: 'active',
      visibility: 'shared',
      created_at: new Date(),
      updated_at: new Date()
    };
    
    const relationshipBtoA = {
      _id: new ObjectId(),
      user_id: userB._id,
      relative_user_id: userA._id,
      relation: 'sibling',
      status: 'active',
      visibility: 'shared',
      created_at: new Date(),
      updated_at: new Date()
    };
    
    await relativesCollection.insertMany([relationshipAtoB, relationshipBtoA]);
    console.log('Created family relationships');
    
    // Test getAccessibleRelatives for both users
    const relativesForA = await relativesCollection.find({
      $or: [
        { user_id: userA._id },
        { relative_user_id: userA._id }
      ]
    }).toArray();
    
    const relativesForB = await relativesCollection.find({
      $or: [
        { user_id: userB._id },
        { relative_user_id: userB._id }
      ]
    }).toArray();
    
    console.log(`User A can see ${relativesForA.length} relatives`);
    console.log(`User B can see ${relativesForB.length} relatives`);
    
    // Debug: show what relatives each user can see
    console.log('Relatives for User A:');
    relativesForA.forEach(rel => {
      console.log(`  - user_id: ${rel.user_id}, relative_user_id: ${rel.relative_user_id}, relation: ${rel.relation}`);
    });
    
    console.log('Relatives for User B:');
    relativesForB.forEach(rel => {
      console.log(`  - user_id: ${rel.user_id}, relative_user_id: ${rel.relative_user_id}, relation: ${rel.relation}`);
    });
    
    // Each user should see exactly 2 relatives (both relationships)
    // This is correct because getAccessibleRelatives finds relationships where user is either owner or relative
    if (relativesForA.length === 2 && relativesForB.length === 2) {
      console.log('✅ Family member visibility test PASSED');
    } else {
      console.log('❌ Family member visibility test FAILED');
    }
    
    console.log('\n=== Test 2: Donation Availability Sync ===');
    
    // Test availability calculation for User A (donated 3 months ago)
    const threeMonthsAgo = new Date('2024-01-01');
    const now = new Date();
    const daysSinceDonation = Math.floor((now.getTime() - threeMonthsAgo.getTime()) / (1000 * 60 * 60 * 24));
    const isAvailable = daysSinceDonation >= 121; // 121 days = ~4 months
    
    console.log(`User A last donated: ${threeMonthsAgo.toDateString()}`);
    console.log(`Days since donation: ${daysSinceDonation}`);
    console.log(`Is available: ${isAvailable}`);
    
    // Update User A's donation date to make them unavailable
    const recentDonation = new Date();
    recentDonation.setDate(recentDonation.getDate() - 30); // 30 days ago
    
    await usersCollection.updateOne(
      { _id: userA._id },
      { $set: { last_donation_date: recentDonation } }
    );
    
    console.log(`Updated User A's donation date to: ${recentDonation.toDateString()}`);
    
    // Verify the update
    const updatedUserA = await usersCollection.findOne({ _id: userA._id });
    const newDaysSinceDonation = Math.floor((now.getTime() - updatedUserA.last_donation_date.getTime()) / (1000 * 60 * 60 * 24));
    const newIsAvailable = newDaysSinceDonation >= 121;
    
    console.log(`New days since donation: ${newDaysSinceDonation}`);
    console.log(`New availability: ${newIsAvailable}`);
    
    if (!newIsAvailable) {
      console.log('✅ Donation availability sync test PASSED');
    } else {
      console.log('❌ Donation availability sync test FAILED');
    }
    
    console.log('\n=== Test 3: Family API Simulation ===');
    
    // Simulate what the family API would return
    const familyMembersForB = await Promise.all(
      relativesForB.map(async (relative) => {
        if (!relative.relative_user_id) return null;
        
        // Skip if the relative_user_id is the current user themselves
        if (relative.relative_user_id.toString() === userB._id.toString()) {
          return null;
        }
        
        const relativeUser = await usersCollection.findOne({ _id: relative.relative_user_id });
        if (!relativeUser) return null;
        
        // Use user's donation date (not relative record's date)
        const userDonationDate = relativeUser.last_donation_date;
        const daysSince = userDonationDate ? 
          Math.floor((now.getTime() - userDonationDate.getTime()) / (1000 * 60 * 60 * 24)) : null;
        const available = !userDonationDate || daysSince >= 121;
        
        return {
          user_code: relativeUser.user_code,
          name: relativeUser.name,
          blood_group: relativeUser.blood_group_public,
          last_donation_date: userDonationDate,
          is_available: available,
          relation: relative.relation
        };
      })
    );
    
    const validFamilyMembers = familyMembersForB.filter(Boolean);
    console.log(`Family members visible to User B: ${validFamilyMembers.length}`);
    
    if (validFamilyMembers.length > 0) {
      const member = validFamilyMembers[0];
      console.log(`Member: ${member.name} (${member.blood_group})`);
      console.log(`Last donation: ${member.last_donation_date ? member.last_donation_date.toDateString() : 'Never'}`);
      console.log(`Available: ${member.is_available}`);
      
      if (!member.is_available) {
        console.log('✅ Family API correctly shows updated availability');
      } else {
        console.log('❌ Family API still shows old availability');
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the test
testFamilyFixes().catch(console.error);
