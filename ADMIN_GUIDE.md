# Blood Node Admin System

This guide explains how to set up and use the admin system for Blood Node SaaS application.

## Overview

The admin system provides:
- **Role-based access control** - Different permission levels for different admin types
- **Analytics dashboard** - User activity, payment tracking, and system metrics
- **User management** - View and manage user accounts
- **Payment analytics** - Revenue tracking and payment statistics
- **System monitoring** - Token cleanup, emergency alerts, and system health

## Admin Roles

### Super Admin
- Full system access
- Can create other admin users
- Access to all features and data
- System configuration rights

### Admin
- User management
- Payment analytics
- Emergency alert management
- System monitoring

### Moderator
- User management (read-only)
- Emergency alert management
- Basic analytics

### Analyst
- Read-only access to analytics
- Payment data export
- User statistics

## Setup

### 1. Create Admin User

```bash
# Create super admin user
npm run create-admin

# Or with custom credentials
ADMIN_EMAIL=admin@yourcompany.com ADMIN_PASSWORD=securepassword npm run create-admin
```

### 2. Access Admin Dashboard

1. Navigate to `/admin/login`
2. Enter admin credentials
3. Access dashboard at `/admin`

## Features

### Dashboard Analytics

#### User Statistics
- Total users
- Active users today
- New users this week
- Verified vs unverified users

#### Payment Analytics
- Total revenue
- Monthly revenue
- Successful/failed payments
- Refund tracking

#### Activity Metrics
- Page views
- Unique visitors
- Top pages
- Session duration

#### System Status
- Token counts
- Emergency alerts
- Family connections
- System health

### User Activity Tracking

The system automatically tracks:
- Page views
- API calls
- Login/logout events
- Signup/verification
- Donation records
- Emergency alerts

### Payment Tracking

Monitors:
- Payment amounts
- Payment methods
- Success/failure rates
- Refunds
- Plan upgrades

## API Endpoints

### Authentication
- `POST /api/admin/auth/login` - Admin login
- `POST /api/admin/auth/logout` - Admin logout

### Dashboard
- `GET /api/admin/dashboard/stats` - Dashboard statistics
- `GET /api/admin/dashboard/activity` - User activity data
- `GET /api/admin/dashboard/payments` - Payment analytics

### User Management
- `GET /api/admin/users` - List users
- `GET /api/admin/users/:id` - Get user details
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user

### Analytics
- `GET /api/admin/analytics/users` - User analytics
- `GET /api/admin/analytics/payments` - Payment analytics
- `GET /api/admin/analytics/activity` - Activity analytics

## Security

### Authentication
- JWT-based authentication
- Session management
- Device fingerprinting
- IP address tracking

### Authorization
- Role-based permissions
- Resource-level access control
- Action-specific permissions

### Activity Logging
- All admin actions are logged
- IP address and user agent tracking
- Audit trail for compliance

## Monitoring

### Real-time Metrics
- Live user activity
- Payment processing
- System performance
- Error rates

### Alerts
- Failed payment notifications
- High error rates
- System issues
- Security events

## Best Practices

### Security
1. **Strong passwords** - Use complex passwords for admin accounts
2. **Regular rotation** - Change admin passwords regularly
3. **Limited access** - Only give necessary permissions
4. **Monitor activity** - Review admin activity logs regularly

### Data Management
1. **Regular backups** - Backup admin and user data
2. **Data retention** - Set appropriate retention policies
3. **Privacy compliance** - Follow data protection regulations
4. **Access control** - Limit data access to necessary personnel

### Performance
1. **Monitor metrics** - Watch system performance
2. **Optimize queries** - Ensure efficient database queries
3. **Cache data** - Use caching for frequently accessed data
4. **Scale resources** - Adjust resources based on usage

## Troubleshooting

### Common Issues

#### Admin Login Fails
- Check email/password
- Verify admin account is active
- Check database connection
- Review error logs

#### Dashboard Not Loading
- Verify admin token
- Check API endpoints
- Review network connectivity
- Check browser console

#### Missing Data
- Verify data collection is enabled
- Check database connections
- Review activity logging
- Check permission settings

### Debug Mode

Enable debug logging:
```bash
export DEBUG=blood-node:admin
npm run dev
```

### Logs

Check logs for issues:
- Application logs: Console output
- Database logs: MongoDB logs
- Error logs: Error tracking service
- Activity logs: Admin activity collection

## Development

### Adding New Features

1. **Create API endpoint** in `/app/api/admin/`
2. **Add database functions** in `/lib/db/admin.ts`
3. **Update permissions** in `/lib/models/admin.ts`
4. **Add UI components** in `/app/admin/`
5. **Update documentation**

### Testing

```bash
# Test admin login
curl -X POST http://localhost:3000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bloodnode.com","password":"admin123456"}'

# Test dashboard stats
curl -X GET http://localhost:3000/api/admin/dashboard/stats \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## Deployment

### Environment Variables

```bash
# Admin JWT secret
ADMIN_JWT_SECRET=your-admin-jwt-secret

# Admin email (for initial setup)
ADMIN_EMAIL=admin@yourcompany.com
ADMIN_PASSWORD=secure-password
ADMIN_ROLE=super_admin
```

### Production Setup

1. **Create admin user**:
   ```bash
   ADMIN_EMAIL=admin@yourcompany.com ADMIN_PASSWORD=securepassword npm run create-admin
   ```

2. **Set up monitoring**:
   - Configure log aggregation
   - Set up error tracking
   - Enable performance monitoring

3. **Security hardening**:
   - Use strong JWT secrets
   - Enable HTTPS
   - Configure firewall rules
   - Set up intrusion detection

## Support

For admin system issues:
1. Check this documentation
2. Review error logs
3. Test with debug mode
4. Contact development team

## Changelog

### v1.0.0
- Initial admin system implementation
- Role-based access control
- Dashboard analytics
- User activity tracking
- Payment analytics
- System monitoring
