#!/usr/bin/env node

/**
 * Create admin user script - Simple version
 * 
 * Usage: node scripts/create-admin-simple.js
 */

const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DATABASE || process.env.DB_NAME || 'blood_node';

// Hash email function
function hashEmail(email) {
  const serverSecret = process.env.SERVER_SECRET || 'your-server-secret';
  return crypto.createHmac('sha256', serverSecret).update(email).digest('hex');
}

// Hash password function
async function hashPassword(password) {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

// Get default permissions for role
function getDefaultPermissionsForRole(role) {
  const basePermissions = [
    { resource: 'analytics', actions: ['read'] }
  ];

  switch (role) {
    case 'super_admin':
      return [
        ...basePermissions,
        { resource: 'users', actions: ['read', 'write', 'delete', 'export'] },
        { resource: 'payments', actions: ['read', 'export'] },
        { resource: 'system', actions: ['read', 'write'] },
        { resource: 'tokens', actions: ['read', 'write'] },
        { resource: 'emergency', actions: ['read', 'write'] }
      ];
    
    case 'admin':
      return [
        ...basePermissions,
        { resource: 'users', actions: ['read', 'write'] },
        { resource: 'payments', actions: ['read', 'export'] },
        { resource: 'system', actions: ['read'] },
        { resource: 'tokens', actions: ['read'] },
        { resource: 'emergency', actions: ['read', 'write'] }
      ];
    
    case 'moderator':
      return [
        ...basePermissions,
        { resource: 'users', actions: ['read'] },
        { resource: 'emergency', actions: ['read', 'write'] }
      ];
    
    case 'analyst':
      return [
        ...basePermissions,
        { resource: 'users', actions: ['read'] },
        { resource: 'payments', actions: ['read', 'export'] }
      ];
    
    default:
      return basePermissions;
  }
}

async function createAdmin() {
  let client;
  
  try {
    console.log('🔧 Creating admin user...');
    
    // Get admin details from environment
    const email = process.env.ADMIN_EMAIL || 'admin@bloodnode.com';
    const password = process.env.ADMIN_PASSWORD || 'admin123456';
    const role = process.env.ADMIN_ROLE || 'super_admin';
    
    console.log('📧 Email:', email);
    console.log('👤 Role:', role);
    
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const adminUsersCollection = db.collection('admin_users');
    
    // Check if admin already exists
    const existingAdmin = await adminUsersCollection.findOne({ email });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists with this email');
      return;
    }
    
    // Hash email and password
    const emailHash = hashEmail(email);
    const passwordHash = await hashPassword(password);
    
    // Get permissions for role
    const permissions = getDefaultPermissionsForRole(role);
    
    // Create admin user
    const adminUser = {
      email,
      email_hash: emailHash,
      password_hash: passwordHash,
      role,
      permissions,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    const result = await adminUsersCollection.insertOne(adminUser);
    
    console.log('✅ Admin user created successfully!');
    console.log('🆔 Admin ID:', result.insertedId);
    console.log('📧 Email:', email);
    console.log('👤 Role:', role);
    console.log('🔐 Permissions:', permissions.length, 'permission sets');
    console.log('');
    console.log('🔐 Default credentials:');
    console.log('   Email:', email);
    console.log('   Password:', password);
    console.log('');
    console.log('⚠️  Please change the password after first login!');
    console.log('');
    console.log('🌐 Access admin dashboard at: http://localhost:3000/admin/login');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Run if this script is executed directly
if (require.main === module) {
  createAdmin();
}

module.exports = { createAdmin };
