# 🔒 Blood Node Security Testing Guide

This guide helps you test all the security features implemented in Blood Node.

## 🚀 Quick Start

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Run automated security tests:**
   ```bash
   node scripts/test-security.js
   ```

3. **Manual testing:** Follow the steps below

## 🧪 Manual Testing Steps

### **1. Rate Limiting Test**

#### **Test API Rate Limiting:**
1. Open browser developer tools (F12)
2. Go to Console tab
3. Run this JavaScript code multiple times quickly:
   ```javascript
   for(let i = 0; i < 15; i++) {
     fetch('/api/auth/login', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ email: 'test@example.com', password: 'wrong' })
     }).then(r => console.log(`Request ${i+1}:`, r.status));
   }
   ```
4. **Expected Result:** After ~5 requests, you should see `429` status codes

#### **Test Login Rate Limiting:**
1. Go to `http://localhost:3000/login`
2. Try logging in with wrong credentials 6 times quickly
3. **Expected Result:** After 5 attempts, you should get rate limited

### **2. Login Attempt Limiting Test**

#### **Test User Account Lockout:**
1. Go to `http://localhost:3000/login`
2. Use email: `test@example.com` (or any non-existent email)
3. Use wrong password: `wrongpassword`
4. Try to login 6 times
5. **Expected Result:** 
   - After 3 attempts: 5-minute lockout
   - After 5 attempts: 15-minute lockout
   - After 8 attempts: 1-hour lockout
   - After 10 attempts: 24-hour lockout

#### **Test Admin Account Lockout:**
1. Go to `http://localhost:3000/admin/login`
2. Use email: `admin@bloodnode.com`
3. Use wrong password: `wrongpassword`
4. Try to login 4 times
5. **Expected Result:** After 3 attempts, admin account should be locked

### **3. CAPTCHA Test**

#### **Test CAPTCHA Requirement:**
1. Go to `http://localhost:3000/login`
2. Make 2-3 failed login attempts
3. **Expected Result:** CAPTCHA should appear after 2 failed attempts

#### **Test CAPTCHA on Admin:**
1. Go to `http://localhost:3000/admin/login`
2. Try to login (even first attempt)
3. **Expected Result:** CAPTCHA should be required immediately for admin

### **4. IP Blacklisting Test**

#### **Test Auto-Blacklist:**
1. Make 10+ failed login attempts from the same IP
2. **Expected Result:** IP should be automatically blacklisted
3. Try to access any API endpoint
4. **Expected Result:** Should get `403 Forbidden` with "IP address has been blocked"

#### **Test Manual IP Blacklist (Admin):**
1. Login to admin dashboard: `http://localhost:3000/admin/login`
   - Email: `admin@bloodnode.com`
   - Password: `admin123456`
2. Go to Security → IP Blacklist
3. Add a test IP (e.g., `192.168.1.100`)
4. **Expected Result:** IP should be added to blacklist

### **5. Session Security Test**

#### **Test Device Fingerprinting:**
1. Login from different browsers/devices
2. **Expected Result:** System should detect new devices
3. Check admin dashboard for device management

#### **Test Concurrent Session Limits:**
1. Login from 6 different browsers/tabs
2. **Expected Result:** After 5 sessions, new logins should be blocked

### **6. Admin Dashboard Test**

#### **Test Admin Login:**
1. Go to `http://localhost:3000/admin/login`
2. Login with admin credentials
3. **Expected Result:** Should access admin dashboard

#### **Test Admin Security Features:**
1. Login to admin dashboard
2. Navigate to Security section
3. **Expected Result:** Should see:
   - IP Blacklist management
   - Security monitoring
   - Login attempt logs
   - Rate limit statistics

### **7. Security Monitoring Test**

#### **Test Security Events:**
1. Make several failed login attempts
2. Go to admin dashboard → Security → Monitoring
3. **Expected Result:** Should see security events logged

#### **Test Real-time Monitoring:**
1. Open admin dashboard
2. Make failed login attempts in another tab
3. **Expected Result:** Security events should appear in real-time

## 🔍 What to Look For

### **✅ Success Indicators:**

1. **Rate Limiting:**
   - HTTP 429 status codes after limit exceeded
   - `X-RateLimit-*` headers in responses
   - Automatic retry-after delays

2. **Login Attempt Limiting:**
   - Account lockouts after failed attempts
   - Progressive lockout durations
   - Lockout messages in responses

3. **CAPTCHA:**
   - CAPTCHA appears after failed attempts
   - CAPTCHA required for admin login
   - CAPTCHA verification works

4. **IP Blacklisting:**
   - IPs blocked after repeated violations
   - HTTP 403 status for blocked IPs
   - Admin can manage blacklist

5. **Session Security:**
   - Device fingerprinting works
   - New devices detected
   - Concurrent session limits enforced

6. **Audit Logging:**
   - All security events logged
   - Admin can view security logs
   - Real-time monitoring works

### **❌ Failure Indicators:**

1. **Rate Limiting Not Working:**
   - No 429 status codes
   - Unlimited requests allowed

2. **Login Limiting Not Working:**
   - No account lockouts
   - Unlimited failed attempts allowed

3. **CAPTCHA Not Working:**
   - No CAPTCHA after failed attempts
   - CAPTCHA not required for admin

4. **IP Blacklisting Not Working:**
   - IPs not blocked after violations
   - No 403 status for blocked IPs

5. **Session Security Not Working:**
   - No device detection
   - No session limits

## 🐛 Troubleshooting

### **Common Issues:**

1. **"Database connection failed"**
   - Check MongoDB is running
   - Verify connection string in `.env`

2. **"CAPTCHA not working"**
   - Check CAPTCHA environment variables
   - Verify CAPTCHA service configuration

3. **"Rate limiting not working"**
   - Check rate limiting configuration
   - Verify middleware is applied

4. **"Admin login not working"**
   - Verify admin user exists in database
   - Check admin credentials

### **Debug Steps:**

1. **Check Console Logs:**
   - Look for security-related log messages
   - Check for error messages

2. **Check Database:**
   - Verify security collections exist
   - Check for logged security events

3. **Check Network Tab:**
   - Look for security headers
   - Check response status codes

## 📊 Expected Test Results

After running all tests, you should see:

- ✅ Rate limiting blocking excessive requests
- ✅ Account lockouts after failed attempts
- ✅ CAPTCHA appearing when needed
- ✅ IP blacklisting working
- ✅ Device fingerprinting active
- ✅ Security events being logged
- ✅ Admin dashboard showing security metrics

## 🎯 Next Steps

Once testing is complete:

1. **Review Results:** Check all security features are working
2. **Fix Issues:** Address any problems found
3. **Production Setup:** Configure for production environment
4. **Monitoring:** Set up ongoing security monitoring

## 📞 Support

If you encounter issues during testing:

1. Check the console logs for error messages
2. Verify all environment variables are set
3. Ensure MongoDB is running and accessible
4. Check that all security services are properly initialized

---

**Remember:** This is a comprehensive security system designed to protect sensitive medical data. All features should be working correctly before deploying to production.
