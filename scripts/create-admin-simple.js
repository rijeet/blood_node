#!/usr/bin/env node

/**
 * Create admin user script - Simple version
 * 
 * Usage:
 *   - Single user (CLI args override env):
 *       node scripts/create-admin-simple.js --email you@example.com --password secret --role admin
 *   - Seed default admin, moderator, analyst:
 *       node scripts/create-admin-simple.js --seed-defaults
 */

const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = ((process.env.MONGODB_DATABASE || process.env.DB_NAME || 'blood_node') + '').trim();

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
    // Parse CLI args
    const args = process.argv.slice(2);
    const argMap = args.reduce((acc, cur, idx) => {
      if (cur.startsWith('--')) {
        const key = cur.replace(/^--/, '');
        const value = args[idx + 1] && !args[idx + 1].startsWith('--') ? args[idx + 1] : true;
        acc[key] = value;
      }
      return acc;
    }, {});

    const isSeedDefaults = Boolean(argMap['seed-defaults']);

    console.log(isSeedDefaults ? '🌱 Seeding default admin users...' : '🔧 Creating admin user...');
    
    // Get user details from CLI args or environment
    const email = (argMap.email && String(argMap.email)) || process.env.ADMIN_EMAIL || 'admin@bloodnode.com';
    const password = (argMap.password && String(argMap.password)) || process.env.ADMIN_PASSWORD || 'admin123456';
    const role = (argMap.role && String(argMap.role)) || process.env.ADMIN_ROLE || 'super_admin';
    
    console.log('📧 Email:', email);
    console.log('👤 Role:', role);
    
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const adminUsersCollection = db.collection('admin_users');
    
    async function createOne({ email, password, role }) {
      // Check if user already exists
      const existing = await adminUsersCollection.findOne({ email });
      if (existing) {
        console.log(`⚠️  User already exists: ${email} (${role})`);
        return existing._id;
      }

      const emailHash = hashEmail(email);
      const passwordHash = await hashPassword(password);
      const permissions = getDefaultPermissionsForRole(role);

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
      console.log(`✅ Created: ${email} (${role})  id=${result.insertedId}`);
      return result.insertedId;
    }

    if (isSeedDefaults) {
      const defaultPassword = typeof argMap.password === 'string' ? String(argMap.password) : 'admin123456';
      await createOne({ email: 'admin@bloodnode.com', role: 'super_admin', password: defaultPassword });
      await createOne({ email: 'moderator@bloodnode.com', role: 'moderator', password: defaultPassword });
      await createOne({ email: 'analyst@bloodnode.com', role: 'analyst', password: defaultPassword });
      console.log('🌐 Access admin dashboard at: http://localhost:3000/admin/login');
      console.log('🔑 Default password (change after login):', defaultPassword);
    } else {
      await createOne({ email, password, role });
      console.log('');
      console.log('🔐 Credentials:');
      console.log('   Email:', email);
      console.log('   Password:', password);
      console.log('');
      console.log('🌐 Access admin dashboard at: http://localhost:3000/admin/login');
    }
    
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
