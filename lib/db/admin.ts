// Admin database operations
import { MongoClient, ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { AdminUser, AdminSession, AdminActivityLog, UserActivity, PaymentAnalytics, PageHitStats, AdminDashboardStats } from '@/lib/models/admin';
import { hashAdminPassword, verifyAdminPassword } from '@/lib/auth/admin';

const DB_NAME = process.env.MONGODB_DATABASE || process.env.DB_NAME || 'blood_node';

/**
 * Get admin users collection
 */
async function getAdminUsersCollection() {
  const client = await clientPromise;
  if (!client) {
    throw new Error('Database connection failed');
  }
  return client.db(DB_NAME).collection<AdminUser>('admin_users');
}

/**
 * Get admin sessions collection
 */
async function getAdminSessionsCollection() {
  const client = await clientPromise;
  if (!client) {
    throw new Error('Database connection failed');
  }
  return client.db(DB_NAME).collection<AdminSession>('admin_sessions');
}

/**
 * Get admin activity logs collection
 */
async function getAdminActivityLogsCollection() {
  const client = await clientPromise;
  if (!client) {
    throw new Error('Database connection failed');
  }
  return client.db(DB_NAME).collection<AdminActivityLog>('admin_activity_logs');
}

/**
 * Get user activity collection
 */
async function getUserActivityCollection() {
  const client = await clientPromise;
  if (!client) {
    throw new Error('Database connection failed');
  }
  return client.db(DB_NAME).collection<UserActivity>('user_activity');
}

/**
 * Get payment analytics collection
 */
async function getPaymentAnalyticsCollection() {
  const client = await clientPromise;
  if (!client) {
    throw new Error('Database connection failed');
  }
  return client.db(DB_NAME).collection<PaymentAnalytics>('payment_analytics');
}

/**
 * Get page hit stats collection
 */
async function getPageHitStatsCollection() {
  const client = await clientPromise;
  if (!client) {
    throw new Error('Database connection failed');
  }
  return client.db(DB_NAME).collection<PageHitStats>('page_hit_stats');
}

/**
 * Create admin user
 */
export async function createAdminUser(data: {
  email: string;
  email_hash: string;
  password: string;
  role: AdminUser['role'];
  created_by?: ObjectId;
}): Promise<{ admin_id: ObjectId; success: boolean }> {
  const collection = await getAdminUsersCollection();
  
  try {
    // Check if admin already exists
    const existingAdmin = await collection.findOne({ email: data.email });
    if (existingAdmin) {
      throw new Error('Admin user already exists');
    }

    // Hash password
    const password_hash = await hashAdminPassword(data.password);

    // Create admin user
    const adminUser: Omit<AdminUser, '_id'> = {
      email: data.email,
      email_hash: data.email_hash,
      password_hash,
      role: data.role,
      permissions: [], // Will be set based on role
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
      created_by: data.created_by
    };

    const result = await collection.insertOne(adminUser);
    
    return {
      admin_id: result.insertedId,
      success: true
    };
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw error;
  }
}

/**
 * Find admin user by email
 */
export async function findAdminByEmail(email: string): Promise<AdminUser | null> {
  const collection = await getAdminUsersCollection();
  return collection.findOne({ email, is_active: true });
}

/**
 * Find admin user by ID
 */
export async function findAdminById(adminId: string): Promise<AdminUser | null> {
  const collection = await getAdminUsersCollection();
  return collection.findOne({ _id: new ObjectId(adminId), is_active: true });
}

/**
 * Verify admin login
 */
export async function verifyAdminLogin(email: string, password: string): Promise<AdminUser | null> {
  const admin = await findAdminByEmail(email);
  if (!admin) {
    return null;
  }

  const isValidPassword = await verifyAdminPassword(password, admin.password_hash);
  if (!isValidPassword) {
    return null;
  }

  // Update last login
  await updateAdminLastLogin(admin._id!);
  
  return admin;
}

/**
 * Update admin last login
 */
export async function updateAdminLastLogin(adminId: ObjectId): Promise<void> {
  const collection = await getAdminUsersCollection();
  await collection.updateOne(
    { _id: adminId },
    { $set: { last_login: new Date(), updated_at: new Date() } }
  );
}

/**
 * Create admin session
 */
export async function createAdminSession(sessionData: Omit<AdminSession, '_id' | 'created_at'>): Promise<ObjectId> {
  const collection = await getAdminSessionsCollection();
  
  const session: Omit<AdminSession, '_id'> = {
    ...sessionData,
    created_at: new Date()
  };

  const result = await collection.insertOne(session);
  return result.insertedId;
}

/**
 * Find admin session
 */
export async function findAdminSession(sessionToken: string): Promise<AdminSession | null> {
  const collection = await getAdminSessionsCollection();
  return collection.findOne({ 
    session_token: sessionToken, 
    is_active: true,
    expires_at: { $gt: new Date() }
  });
}

/**
 * Deactivate admin session
 */
export async function deactivateAdminSession(sessionToken: string): Promise<boolean> {
  const collection = await getAdminSessionsCollection();
  const result = await collection.updateOne(
    { session_token: sessionToken },
    { $set: { is_active: false } }
  );
  return result.modifiedCount === 1;
}

/**
 * Log admin activity
 */
export async function logAdminActivity(data: {
  admin_id: ObjectId;
  action: string;
  resource: string;
  resource_id?: string;
  details: Record<string, any>;
  ip_address: string;
  user_agent: string;
}): Promise<void> {
  const collection = await getAdminActivityLogsCollection();
  
  const activityLog: Omit<AdminActivityLog, '_id'> = {
    admin_id: data.admin_id,
    action: data.action,
    resource: data.resource,
    resource_id: data.resource_id,
    details: data.details,
    ip_address: data.ip_address,
    user_agent: data.user_agent,
    created_at: new Date()
  };

  await collection.insertOne(activityLog);
}

/**
 * Log user activity
 */
export async function logUserActivity(data: {
  user_id: ObjectId;
  action: UserActivity['action'];
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
}): Promise<void> {
  const collection = await getUserActivityCollection();
  
  const activity: Omit<UserActivity, '_id'> = {
    user_id: data.user_id,
    action: data.action,
    page: data.page,
    endpoint: data.endpoint,
    method: data.method,
    status_code: data.status_code,
    duration_ms: data.duration_ms,
    ip_address: data.ip_address,
    user_agent: data.user_agent,
    device_fingerprint: data.device_fingerprint,
    session_id: data.session_id,
    metadata: data.metadata,
    created_at: new Date()
  };

  await collection.insertOne(activity);
}

/**
 * Record payment analytics
 */
export async function recordPaymentAnalytics(data: {
  user_id: ObjectId;
  amount: number;
  currency: string;
  status: PaymentAnalytics['status'];
  payment_method: string;
  stripe_payment_intent_id?: string;
  plan_type: PaymentAnalytics['plan_type'];
  completed_at?: Date;
}): Promise<void> {
  const collection = await getPaymentAnalyticsCollection();
  
  const payment: Omit<PaymentAnalytics, '_id'> = {
    user_id: data.user_id,
    amount: data.amount,
    currency: data.currency,
    status: data.status,
    payment_method: data.payment_method,
    stripe_payment_intent_id: data.stripe_payment_intent_id,
    plan_type: data.plan_type,
    created_at: new Date(),
    completed_at: data.completed_at
  };

  await collection.insertOne(payment);
}

/**
 * Update page hit statistics
 */
export async function updatePageHitStats(page: string, durationMs: number, isBounce: boolean = false): Promise<void> {
  const collection = await getPageHitStatsCollection();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await collection.updateOne(
    { page, date: today },
    {
      $inc: {
        hits: 1,
        unique_users: 0, // This should be calculated separately
        total_duration: durationMs
      },
      $setOnInsert: {
        page,
        date: today,
        bounce_rate: 0
      }
    },
    { upsert: true }
  );

  // Update bounce rate
  if (isBounce) {
    await collection.updateOne(
      { page, date: today },
      { $inc: { bounces: 1 } }
    );
  }
}

/**
 * Get admin dashboard statistics
 */
export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const client = await clientPromise;
  if (!client) {
    throw new Error('Database connection failed');
  }

  const db = client.db(DB_NAME);
  const usersCollection = db.collection('users');
  const userActivityCollection = await getUserActivityCollection();
  const paymentCollection = await getPaymentAnalyticsCollection();
  const pageHitCollection = await getPageHitStatsCollection();
  const verificationTokensCollection = db.collection('verification_tokens');
  const refreshTokensCollection = db.collection('refresh_tokens');
  const emergencyAlertsCollection = db.collection('emergency_alerts');
  const relativesCollection = db.collection('relatives');

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - 7);

    const thisMonth = new Date();
    thisMonth.setMonth(thisMonth.getMonth() - 1);

    // User statistics
    const [totalUsers, verifiedUsers, newThisWeek, activeToday] = await Promise.all([
      usersCollection.countDocuments({}),
      usersCollection.countDocuments({ email_verified: true }),
      usersCollection.countDocuments({ created_at: { $gte: thisWeek } }),
      userActivityCollection.countDocuments({ 
        action: 'login',
        created_at: { $gte: today }
      })
    ]);

    // Payment statistics
    const [totalRevenue, monthlyRevenue, successfulPayments, failedPayments, refunds] = await Promise.all([
      paymentCollection.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]).toArray(),
      paymentCollection.aggregate([
        { $match: { status: 'completed', created_at: { $gte: thisMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]).toArray(),
      paymentCollection.countDocuments({ status: 'completed' }),
      paymentCollection.countDocuments({ status: 'failed' }),
      paymentCollection.countDocuments({ status: 'refunded' })
    ]);

    // Activity statistics
    const [totalPageViews, uniqueVisitorsToday, topPages] = await Promise.all([
      userActivityCollection.countDocuments({ action: 'page_view' }),
      userActivityCollection.distinct('user_id', { 
        action: 'page_view',
        created_at: { $gte: today }
      }),
      pageHitCollection.aggregate([
        { $match: { date: { $gte: thisWeek } } },
        { $group: { _id: '$page', hits: { $sum: '$hits' } } },
        { $sort: { hits: -1 } },
        { $limit: 10 }
      ]).toArray()
    ]);

    // System statistics
    const [totalVerificationTokens, totalRefreshTokens, emergencyAlerts, familyConnections] = await Promise.all([
      verificationTokensCollection.countDocuments({}),
      refreshTokensCollection.countDocuments({}),
      emergencyAlertsCollection.countDocuments({}),
      relativesCollection.countDocuments({})
    ]);

    return {
      users: {
        total: totalUsers,
        active_today: activeToday,
        new_this_week: newThisWeek,
        verified: verifiedUsers,
        unverified: totalUsers - verifiedUsers
      },
      payments: {
        total_revenue: totalRevenue[0]?.total || 0,
        monthly_revenue: monthlyRevenue[0]?.total || 0,
        successful_payments: successfulPayments,
        failed_payments: failedPayments,
        refunds: refunds
      },
      activity: {
        total_page_views: totalPageViews,
        unique_visitors_today: uniqueVisitorsToday.length,
        avg_session_duration: 0, // Calculate from session data
        top_pages: topPages.map((p: any) => ({ page: p._id, hits: p.hits }))
      },
      system: {
        total_verification_tokens: totalVerificationTokens,
        total_refresh_tokens: totalRefreshTokens,
        emergency_alerts: emergencyAlerts,
        family_connections: familyConnections
      }
    };
  } catch (error) {
    console.error('Error getting admin dashboard stats:', error);
    throw error;
  }
}

/**
 * Get user activity analytics
 */
export async function getUserActivityAnalytics(
  startDate: Date,
  endDate: Date,
  limit: number = 100
): Promise<UserActivity[]> {
  const collection = await getUserActivityCollection();
  
  return collection.find({
    created_at: { $gte: startDate, $lte: endDate }
  })
  .sort({ created_at: -1 })
  .limit(limit)
  .toArray();
}

/**
 * Get payment analytics
 */
export async function getPaymentAnalytics(
  startDate: Date,
  endDate: Date
): Promise<PaymentAnalytics[]> {
  const collection = await getPaymentAnalyticsCollection();
  
  return collection.find({
    created_at: { $gte: startDate, $lte: endDate }
  })
  .sort({ created_at: -1 })
  .toArray();
}
