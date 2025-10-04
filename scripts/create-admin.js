#!/usr/bin/env node

/**
 * Create admin user script
 * 
 * Usage: node scripts/create-admin.js
 */

// Import using dynamic import for ES modules
async function createAdmin() {
  try {
    // Dynamic imports for ES modules
    const { createAdminUser, findAdminByEmail } = await import('../lib/db/admin.js');
    const { hashEmail } = await import('../lib/auth/jwt.js');
    const { getDefaultPermissionsForRole } = await import('../lib/auth/admin.js');

    console.log('🔧 Creating admin user...');
    
    // Get admin details from environment or prompt
    const email = process.env.ADMIN_EMAIL || 'admin@bloodnode.com';
    const password = process.env.ADMIN_PASSWORD || 'admin123456';
    const role = process.env.ADMIN_ROLE || 'super_admin';
    
    console.log('📧 Email:', email);
    console.log('👤 Role:', role);
    
    // Check if admin already exists
    const existingAdmin = await findAdminByEmail(email);
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists with this email');
      return;
    }
    
    // Hash email
    const emailHash = hashEmail(email);
    
    // Create admin user
    const result = await createAdminUser({
      email,
      email_hash: emailHash,
      password,
      role
    });
    
    if (result.success) {
      console.log('✅ Admin user created successfully!');
      console.log('🆔 Admin ID:', result.admin_id);
      console.log('📧 Email:', email);
      console.log('👤 Role:', role);
      console.log('');
      console.log('🔐 Default credentials:');
      console.log('   Email:', email);
      console.log('   Password:', password);
      console.log('');
      console.log('⚠️  Please change the password after first login!');
    } else {
      console.log('❌ Failed to create admin user');
    }
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

// Run if this script is executed directly
if (require.main === module) {
  createAdmin();
}

module.exports = { createAdmin };