# 📧 Email Testing Guide

## ✅ **Fixed: Resend Domain Issue**

I've updated all email sending to use Resend's sandbox domain `onboarding@resend.dev` instead of the unverified `noreply@bloodnode.com`.

## 🔧 **Changes Made:**

1. **Updated Email Service** (`lib/email/service.ts`):
   - Changed default `from` address to `Blood Node <onboarding@resend.dev>`
   - Updated all email sending functions

2. **Updated API Routes** (`app/api/emails/route.ts`):
   - Changed hardcoded domain references

3. **Updated Documentation** (`BLOOD_NODE_README.md`):
   - Updated example environment variables

## 🚀 **How to Test Email Functionality:**

### **1. Set up your Resend API Key:**
```bash
# Add to your .env.local file
RESEND_API_KEY=re_your_actual_resend_api_key_here
```

### **2. Test Email Sending:**
```bash
# Run the test script
node test-email.js
```

### **3. Test Through the App:**
1. **Login** with `test@example.com` and any password
2. **Click "Invite Family Member"** button
3. **Fill out the form** with a real email address
4. **Click "Send Invitation"**

### **4. Test Emergency Alerts:**
1. Go to **Emergency tab** in the dashboard
2. Fill out the emergency alert form
3. Click **"Send Emergency Alert"**

## 📬 **What to Expect:**

- **Emails will be sent from:** `Blood Node <onboarding@resend.dev>`
- **Emails will arrive in:** Your Gmail inbox (or specified email)
- **No domain verification needed:** Resend's sandbox domain works immediately

## 🎯 **Email Types Available:**

1. **Family Invitations** - Send invites to family members
2. **Verification Codes** - 6-digit numeric codes
3. **Recovery Codes** - Password recovery codes
4. **Emergency Alerts** - Urgent blood donation requests
5. **Welcome Emails** - New user onboarding

## 🔍 **Troubleshooting:**

### **If emails don't arrive:**
1. Check your **spam/junk folder**
2. Verify your **RESEND_API_KEY** is correct
3. Check the **browser console** for error messages
4. Verify the **email address** is valid

### **If you get "Missing API key" error:**
1. Make sure `.env.local` exists in the project root
2. Add `RESEND_API_KEY=re_your_key_here`
3. Restart the development server

## 🎉 **Ready to Test!**

Your Blood Node application now has fully functional email sending using Resend's sandbox domain. All email features should work without any domain verification issues!

---

**Note:** For production, you'll want to:
1. Verify your own domain with Resend
2. Update the `from` addresses to use your verified domain
3. Set up proper DNS records for email authentication
