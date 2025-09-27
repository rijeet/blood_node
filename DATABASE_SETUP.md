# Blood Node Database Setup

This document explains how to set up and manage the MongoDB database for the Blood Node application.

## 🗄️ Database Collections

The Blood Node application requires the following MongoDB collections:

### Core Collections
- **`users`** - User accounts, profiles, and authentication data
- **`verification_tokens`** - Email verification and password reset tokens
- **`refresh_tokens`** - JWT refresh tokens for session management

### Feature Collections
- **`relatives`** - Family relationships and connections
- **`invites`** - Family invitation system
- **`plans`** - Subscription plans and billing
- **`emergency_alerts`** - Emergency blood donation alerts
- **`donation_records`** - Blood donation history tracking
- **`notifications`** - User notifications and alerts
- **`audit_logs`** - System audit and activity logs

### System Collections
- **`connection_test`** - Database connection health checks

## 🚀 Quick Setup

### 1. Environment Variables

Make sure you have the following environment variables in your `.env.local` file:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
MONGODB_DATABASE=blood_node
```

### 2. Initialize Database

Run the database initialization script:

```bash
# Using npm script
npm run init-db

# Or directly with node
node scripts/init-database.js
```

### 3. Verify Setup

Check the database status:

```bash
# Using npm script
npm run db:status

# Or visit the admin page
http://localhost:3000/admin/database
```

## 📊 Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  user_code: "D5RDMOWTAF0BUD0D",           // 16-char unique identifier
  email_hash: "sha256_hash",               // Hashed email for privacy
  email_verified: true,                    // Email verification status
  public_profile: false,                   // Profile visibility
  name: "John Doe",                        // Display name
  phone: "+1-555-123-4567",               // Phone number
  blood_group_public: "O+",               // Public blood group
  location_geohash: "40.7128,-74.0060",   // Location coordinates
  location_address: "New York, NY",       // Human-readable address
  last_donation_date: "2024-01-15",       // Last donation date
  plan: "free",                           // Subscription plan
  public_key: "base64_jwk",               // Encryption public key
  encrypted_private_key: "aes_gcm_ct",     // Encrypted private key
  master_salt: "kdf_salt",                // Key derivation salt
  sss_server_share: "sss_share",          // Shamir's Secret Sharing
  recovery_email_sent: false,             // Recovery email status
  created_at: Date,
  updated_at: Date
}
```

### Verification Tokens Collection
```javascript
{
  _id: ObjectId,
  token: "uuid_or_6_digit_code",          // Verification token
  email_hash: "sha256_hash",              // Associated email hash
  token_type: "email_verification",       // Token purpose
  used: false,                            // Usage status
  expires_at: Date,                       // Expiration time
  created_at: Date
}
```

### Relatives Collection
```javascript
{
  _id: ObjectId,
  user_id: ObjectId,                      // User who created the relationship
  relative_user_id: ObjectId,             // Related user
  relation: "parent",                     // Relationship type
  status: "active",                       // Relationship status
  created_at: Date,
  updated_at: Date
}
```

## 🔧 Management Commands

### Initialize Database
```bash
npm run init-db
```

### Check Database Status
```bash
npm run db:status
```

### Access Admin Panel
Visit `http://localhost:3000/admin/database` to:
- View collection status
- Initialize missing collections
- Monitor database health
- View detailed collection information

## 📈 Indexes

Each collection has optimized indexes for:
- **Unique constraints** (user_code, email_hash, tokens)
- **Query performance** (location, blood_group, dates)
- **TTL expiration** (tokens, logs, notifications)
- **Compound queries** (user relationships, search filters)

## 🔒 Security Features

- **Email Hashing**: User emails are hashed for privacy
- **Token Expiration**: All tokens have automatic expiration
- **Audit Logging**: All actions are logged for security
- **Data Encryption**: Sensitive data is encrypted at rest
- **Access Control**: Proper authentication and authorization

## 🚨 Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check MONGODB_URI environment variable
   - Verify network connectivity
   - Check MongoDB Atlas IP whitelist

2. **Collection Not Found**
   - Run `npm run init-db` to create collections
   - Check database permissions

3. **Index Creation Failed**
   - Check MongoDB user permissions
   - Verify collection exists first

4. **Token Expiration Issues**
   - Check system clock synchronization
   - Verify TTL index creation

### Health Check

The database health check verifies:
- ✅ Connection status
- ✅ Collection existence
- ✅ Index presence
- ✅ Document counts
- ✅ Error reporting

## 📝 Development Notes

- Collections are created automatically on first access
- Indexes are created during initialization
- TTL indexes automatically clean up expired documents
- All operations include proper error handling
- Database operations are optimized for performance

## 🔄 Maintenance

### Regular Tasks
- Monitor collection sizes
- Check index performance
- Review audit logs
- Update expired tokens
- Backup critical data

### Scaling Considerations
- Shard by user_id for large datasets
- Use read replicas for queries
- Implement connection pooling
- Monitor query performance
- Set up alerts for issues
