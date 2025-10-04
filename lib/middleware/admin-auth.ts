// Admin authentication middleware
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/auth/admin';
import { findAdminById, findAdminSession } from '@/lib/db/admin';
import { ObjectId } from 'mongodb';

export interface AdminRequest extends NextRequest {
  admin?: {
    id: string;
    email: string;
    role: string;
    permissions: any[];
  };
}

/**
 * Admin authentication middleware
 */
export async function authenticateAdmin(request: NextRequest): Promise<{
  success: boolean;
  admin?: any;
  error?: string;
}> {
  try {
    // Get admin token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false, error: 'No admin token provided' };
    }

    const token = authHeader.substring(7);
    const payload = verifyAdminToken(token);

    if (!payload) {
      return { success: false, error: 'Invalid admin token' };
    }

    // Check if admin exists and is active
    const admin = await findAdminById(payload.admin_id);
    if (!admin) {
      return { success: false, error: 'Admin not found' };
    }

    if (!admin.is_active) {
      return { success: false, error: 'Admin account is inactive' };
    }

    return {
      success: true,
      admin: {
        id: admin._id!.toString(),
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions
      }
    };
  } catch (error) {
    console.error('Admin authentication error:', error);
    return { success: false, error: 'Authentication failed' };
  }
}

/**
 * Admin authorization middleware
 */
export function authorizeAdmin(
  admin: any,
  resource: string,
  action: string
): { allowed: boolean; error?: string } {
  // Check if admin has permission for this resource and action
  const hasPermission = admin.permissions.some((permission: any) => 
    permission.resource === resource && 
    permission.actions.includes(action)
  );

  if (!hasPermission) {
    return { 
      allowed: false, 
      error: `Insufficient permissions for ${action} on ${resource}` 
    };
  }

  return { allowed: true };
}

/**
 * Create admin authentication response
 */
export function createAdminAuthResponse(
  success: boolean,
  admin?: any,
  error?: string
): NextResponse {
  if (!success) {
    return NextResponse.json(
      { error: error || 'Authentication failed' },
      { status: 401 }
    );
  }

  return NextResponse.json({ admin });
}

/**
 * Admin route handler wrapper
 */
export function withAdminAuth(
  handler: (request: AdminRequest) => Promise<NextResponse>,
  requiredResource?: string,
  requiredAction?: string
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Authenticate admin
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) {
      return createAdminAuthResponse(false, undefined, authResult.error);
    }

    // Check authorization if required
    if (requiredResource && requiredAction) {
      const authzResult = authorizeAdmin(
        authResult.admin,
        requiredResource,
        requiredAction
      );
      
      if (!authzResult.allowed) {
        return NextResponse.json(
          { error: authzResult.error },
          { status: 403 }
        );
      }
    }

    // Add admin to request
    const adminRequest = request as AdminRequest;
    adminRequest.admin = authResult.admin;

    // Call the actual handler
    return handler(adminRequest);
  };
}

/**
 * Session-based admin authentication
 */
export async function authenticateAdminSession(request: NextRequest): Promise<{
  success: boolean;
  admin?: any;
  error?: string;
}> {
  try {
    // Get session token from cookie
    const sessionToken = request.cookies.get('admin_session')?.value;
    if (!sessionToken) {
      return { success: false, error: 'No admin session found' };
    }

    // Find session in database
    const session = await findAdminSession(sessionToken);
    if (!session) {
      return { success: false, error: 'Invalid or expired session' };
    }

    // Get admin user
    const admin = await findAdminById(session.admin_id.toString());
    if (!admin || !admin.is_active) {
      return { success: false, error: 'Admin not found or inactive' };
    }

    return {
      success: true,
      admin: {
        id: admin._id!.toString(),
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions
      }
    };
  } catch (error) {
    console.error('Admin session authentication error:', error);
    return { success: false, error: 'Session authentication failed' };
  }
}
