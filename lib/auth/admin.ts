// Admin authentication and authorization
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import { AdminUser, AdminSession, AdminPermission, ADMIN_ROLES } from '@/lib/models/admin';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'admin-secret-key';
const JWT_EXPIRES_IN = '7d'; // 7 days for admin tokens

export interface AdminJWTPayload {
  admin_id: string;
  email: string;
  role: string;
  permissions: AdminPermission[];
  iat: number;
  exp: number;
}

/**
 * Generate admin JWT token
 */
export function generateAdminToken(payload: {
  admin_id: string;
  email: string;
  role: string;
  permissions: AdminPermission[];
}): string {
  return jwt.sign(payload, ADMIN_JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify admin JWT token
 */
export function verifyAdminToken(token: string): AdminJWTPayload | null {
  try {
    return jwt.verify(token, ADMIN_JWT_SECRET) as AdminJWTPayload;
  } catch (error) {
    console.error('Admin token verification failed:', error);
    return null;
  }
}

/**
 * Hash admin password
 */
export async function hashAdminPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Verify admin password
 */
export async function verifyAdminPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Check if admin has permission
 */
export function hasAdminPermission(
  adminPermissions: AdminPermission[],
  resource: string,
  action: string
): boolean {
  return adminPermissions.some(permission => 
    permission.resource === resource && 
    permission.actions.includes(action as any)
  );
}

/**
 * Check if admin has role
 */
export function hasAdminRole(adminRole: string, requiredRole: string): boolean {
  const roleHierarchy = {
    [ADMIN_ROLES.SUPER_ADMIN]: 4,
    [ADMIN_ROLES.ADMIN]: 3,
    [ADMIN_ROLES.MODERATOR]: 2,
    [ADMIN_ROLES.ANALYST]: 1
  };
  
  const adminLevel = roleHierarchy[adminRole as keyof typeof roleHierarchy] || 0;
  const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;
  
  return adminLevel >= requiredLevel;
}

/**
 * Generate admin session token
 */
export function generateAdminSessionToken(): string {
  return jwt.sign(
    { 
      type: 'admin_session',
      timestamp: Date.now() 
    },
    ADMIN_JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Create admin session data
 */
export function createAdminSessionData(
  adminId: string,
  deviceFingerprint: string,
  ipAddress: string,
  userAgent: string
): Omit<AdminSession, '_id' | 'created_at'> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  return {
    admin_id: new ObjectId(adminId),
    session_token: generateAdminSessionToken(),
    device_fingerprint: deviceFingerprint,
    ip_address: ipAddress,
    user_agent: userAgent,
    expires_at: expiresAt,
    is_active: true,
    last_activity: new Date()
  };
}

/**
 * Generate device fingerprint for admin
 */
export function generateAdminDeviceFingerprint(userAgent: string, ipAddress: string): string {
  const crypto = require('crypto');
  const data = `${userAgent}-${ipAddress}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Validate admin permissions for resource access
 */
export function validateAdminAccess(
  admin: AdminUser,
  resource: string,
  action: string
): { allowed: boolean; reason?: string } {
  // Check if admin is active
  if (!admin.is_active) {
    return { allowed: false, reason: 'Admin account is inactive' };
  }

  // Check role-based access
  if (resource === 'system' && action === 'write' && !hasAdminRole(admin.role, ADMIN_ROLES.ADMIN)) {
    return { allowed: false, reason: 'Insufficient role for system write access' };
  }

  if (resource === 'users' && action === 'delete' && !hasAdminRole(admin.role, ADMIN_ROLES.ADMIN)) {
    return { allowed: false, reason: 'Insufficient role for user deletion' };
  }

  // Check specific permissions
  if (!hasAdminPermission(admin.permissions, resource, action)) {
    return { allowed: false, reason: `No permission for ${action} on ${resource}` };
  }

  return { allowed: true };
}

/**
 * Generate admin verification code
 */
export function generateAdminVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate admin verification token
 */
export function generateAdminVerificationToken(adminId: string, code: string): string {
  return jwt.sign(
    { 
      type: 'admin_verification',
      admin_id: adminId,
      code: code,
      timestamp: Date.now()
    },
    ADMIN_JWT_SECRET,
    { expiresIn: '15m' } // 15 minutes expiry for verification codes
  );
}

/**
 * Verify admin verification token
 */
export function verifyAdminVerificationToken(token: string): { admin_id: string; code: string } | null {
  try {
    const payload = jwt.verify(token, ADMIN_JWT_SECRET) as any;
    if (payload.type === 'admin_verification') {
      return {
        admin_id: payload.admin_id,
        code: payload.code
      };
    }
    return null;
  } catch (error) {
    console.error('Admin verification token verification failed:', error);
    return null;
  }
}

/**
 * Get default permissions for role
 */
export function getDefaultPermissionsForRole(role: string): AdminPermission[] {
  const basePermissions = [
    { resource: 'analytics' as const, actions: ['read' as const] }
  ];

  switch (role) {
    case ADMIN_ROLES.SUPER_ADMIN:
      return [
        ...basePermissions,
        { resource: 'users', actions: ['read', 'write', 'delete', 'export'] },
        { resource: 'payments', actions: ['read', 'export'] },
        { resource: 'system', actions: ['read', 'write'] },
        { resource: 'tokens', actions: ['read', 'write'] },
        { resource: 'emergency', actions: ['read', 'write'] }
      ];
    
    case ADMIN_ROLES.ADMIN:
      return [
        ...basePermissions,
        { resource: 'users', actions: ['read', 'write'] },
        { resource: 'payments', actions: ['read', 'export'] },
        { resource: 'system', actions: ['read'] },
        { resource: 'tokens', actions: ['read'] },
        { resource: 'emergency', actions: ['read', 'write'] }
      ];
    
    case ADMIN_ROLES.MODERATOR:
      return [
        ...basePermissions,
        { resource: 'users', actions: ['read'] },
        { resource: 'emergency', actions: ['read', 'write'] }
      ];
    
    case ADMIN_ROLES.ANALYST:
      return [
        ...basePermissions,
        { resource: 'users', actions: ['read'] },
        { resource: 'payments', actions: ['read', 'export'] }
      ];
    
    default:
      return basePermissions;
  }
}
