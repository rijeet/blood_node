import { ObjectId } from 'mongodb';

export interface AdminUser {
  _id?: ObjectId;
  email: string;
  email_hash: string; // HMAC_SHA256(email, server_secret)
  password_hash: string; // bcrypt hash
  role: 'super_admin' | 'admin' | 'moderator' | 'analyst';
  permissions: AdminPermission[];
  is_active: boolean;
  last_login?: Date;
  created_at: Date;
  updated_at: Date;
  created_by?: ObjectId; // Who created this admin user
}

export interface AdminPermission {
  resource: 'users' | 'payments' | 'analytics' | 'system' | 'tokens' | 'emergency';
  actions: ('read' | 'write' | 'delete' | 'export')[];
}

export interface AdminSession {
  _id?: ObjectId;
  admin_id: ObjectId;
  session_token: string; // JWT token
  device_fingerprint: string;
  ip_address: string;
  user_agent: string;
  expires_at: Date;
  is_active: boolean;
  created_at: Date;
  last_activity: Date;
}

export interface AdminActivityLog {
  _id?: ObjectId;
  admin_id: ObjectId;
  action: string;
  resource: string;
  resource_id?: string;
  details: Record<string, any>;
  ip_address: string;
  user_agent: string;
  created_at: Date;
}

export interface UserActivity {
  _id?: ObjectId;
  user_id: ObjectId;
  action: 'page_view' | 'api_call' | 'login' | 'logout' | 'signup' | 'verification' | 'donation_record' | 'emergency_alert';
  page?: string;
  endpoint?: string;
  method?: string;
  status_code?: number;
  duration_ms?: number;
  ip_address: string;
  user_agent: string;
  device_fingerprint?: string;
  session_id?: string;
  metadata?: Record<string, any>;
  created_at: Date;
}

export interface PaymentAnalytics {
  _id?: ObjectId;
  user_id: ObjectId;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_method: string;
  stripe_payment_intent_id?: string;
  plan_type: 'free' | 'paid_block' | 'unlimited';
  created_at: Date;
  completed_at?: Date;
}

export interface PageHitStats {
  _id?: ObjectId;
  page: string;
  hits: number;
  unique_users: number;
  avg_duration_ms: number;
  bounce_rate: number;
  date: Date; // Daily aggregation
}

export interface AdminDashboardStats {
  users: {
    total: number;
    active_today: number;
    new_this_week: number;
    verified: number;
    unverified: number;
  };
  payments: {
    total_revenue: number;
    monthly_revenue: number;
    successful_payments: number;
    failed_payments: number;
    refunds: number;
  };
  activity: {
    total_page_views: number;
    unique_visitors_today: number;
    avg_session_duration: number;
    top_pages: Array<{ page: string; hits: number }>;
  };
  system: {
    total_verification_tokens: number;
    total_refresh_tokens: number;
    emergency_alerts: number;
    family_connections: number;
  };
}

export const ADMIN_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin', 
  MODERATOR: 'moderator',
  ANALYST: 'analyst'
} as const;

export const ADMIN_PERMISSIONS = {
  USERS_READ: { resource: 'users', actions: ['read'] },
  USERS_WRITE: { resource: 'users', actions: ['read', 'write'] },
  USERS_DELETE: { resource: 'users', actions: ['read', 'write', 'delete'] },
  PAYMENTS_READ: { resource: 'payments', actions: ['read'] },
  PAYMENTS_EXPORT: { resource: 'payments', actions: ['read', 'export'] },
  ANALYTICS_READ: { resource: 'analytics', actions: ['read'] },
  SYSTEM_READ: { resource: 'system', actions: ['read'] },
  SYSTEM_WRITE: { resource: 'system', actions: ['read', 'write'] },
  TOKENS_READ: { resource: 'tokens', actions: ['read'] },
  TOKENS_WRITE: { resource: 'tokens', actions: ['read', 'write'] },
  EMERGENCY_READ: { resource: 'emergency', actions: ['read'] },
  EMERGENCY_WRITE: { resource: 'emergency', actions: ['read', 'write'] }
} as const;
