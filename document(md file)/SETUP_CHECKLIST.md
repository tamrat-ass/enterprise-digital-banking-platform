# ✅ Email Setup Checklist - Follow Step by Step

Complete this checklist to enable email delivery in 5-10 minutes.

---

## Pre-Setup Verification

### Current State Check
- [ ] Dev server is running (http://localhost:3000 accessible)
- [ ] You're logged in as Super Admin
- [ ] You have access to Gmail account
- [ ] You can open Gmail in browser

---

## Step 1: Enable 2-Factor Authentication (2 minutes)

### 1.1 Go to Gmail Security Settings
- [ ] Open: https://myaccount.google.com/security
- [ ] You may need to sign in again
- [ ] Note: Screenshot if needed for reference

### 1.2 Find 2-Step Verification
- [ ] Look for: "How you sign in to Google" section
- [ ] Click: "2-Step Verification"
- [ ] Click: "Start setup"

### 1.3 Follow Google's Prompts
- [ ] Enter your Gmail password
- [ ] Choose phone for verification
- [ ] Enter verification code from phone
- [ ] Follow all Google prompts
- [ ] Confirm: "2-Step Verification is on"

### 1.4 Verification Complete
- [ ] Back to Google Account page
- [ ] Status shows: 2FA enabled
- [ ] ✅ Step 1 Complete

---

## Step 2: Generate Gmail App Password (2 minutes)

### 2.1 Go to App Passwords
- [ ] Open: https://myaccount.google.com/apppasswords
- [ ] Sign in again if prompted
- [ ] Note: If you don't see "App passwords", 2FA wasn't enabled properly

### 2.2 Create App Password
- [ ] Select "App": **Mail**
- [ ] Select "Device": **Windows Computer** (or your device type)
- [ ] Click: **Generate**

### 2.3 Copy Your Password
- [ ] Google shows 16-character password in popup
- [ ] Password looks like: `abcd efgh ijkl mnop`
- [ ] **Copy the password** (remove spaces: `abcdefghijklmnop`)
- [ ] Keep safe for next step
- [ ] ✅ Step 2 Complete

---

## Step 3: Update .env.local File (2 minutes)

### 3.1 Open .env.local
- [ ] File location: `d:\enterprise-digital-banking-platform\.env.local`
- [ ] Open in: Your code editor (VS Code, Sublime, etc.)
- [ ] Find: Line 40 (SMTP configuration section)

### 3.2 Update SMTP_USER
- [ ] Find: `SMTP_USER=your-email@gmail.com`
- [ ] Replace with: Your actual Gmail (example: `john.doe@gmail.com`)
- [ ] Check: No extra spaces before/after
- [ ] ✅ SMTP_USER updated

### 3.3 Update SMTP_PASSWORD
- [ ] Find: `SMTP_PASSWORD=your-app-password`
- [ ] Replace with: 16-character password from Step 2.3
- [ ] Example: `SMTP_PASSWORD=xyzabcdefghijklmn`
- [ ] Check: No extra spaces, no dashes
- [ ] ✅ SMTP_PASSWORD updated

### 3.4 Update SMTP_FROM_EMAIL
- [ ] Find: `SMTP_FROM_EMAIL=your-email@gmail.com`
- [ ] Replace with: Your actual Gmail (same as SMTP_USER)
- [ ] Example: `SMTP_FROM_EMAIL=john.doe@gmail.com`
- [ ] Check: Matches SMTP_USER
- [ ] ✅ SMTP_FROM_EMAIL updated

### 3.5 Verify and Save
- [ ] Review all three lines
- [ ] Confirm no typos
- [ ] Save file (Ctrl+S)
- [ ] ✅ Step 3 Complete

---

## Step 4: Restart Dev Server (1 minute)

### 4.1 Stop Current Server
- [ ] Go to terminal/command prompt
- [ ] Find: The window running `npm run dev`
- [ ] Press: **Ctrl+C** (one time)
- [ ] Wait: Server stops
- [ ] ✅ Server stopped

### 4.2 Start New Server
- [ ] In same terminal, type: `npm run dev`
- [ ] Press: **Enter**
- [ ] Wait: "✓ Ready in XXXms" appears
- [ ] ✅ Server running again

### 4.3 Verify Server is Ready
- [ ] Check: Terminal shows "Ready in XXXms"
- [ ] Open: http://localhost:3000
- [ ] Confirm: Website loads
- [ ] ✅ Step 4 Complete

---

## Step 5: Test Email Delivery (1 minute)

### 5.1 Visit Test Email Endpoint
- [ ] Open browser
- [ ] Go to: `http://localhost:3000/api/admin/test-email`
- [ ] Wait: Page loads with JSON response

### 5.2 Check Results
- [ ] Look for: `"success": true` or `"success": false`
- [ ] **If true**: Email system is working ✅
- [ ] **If false**: Check troubleshooting below

### 5.3 Verify Email Received
- [ ] Open your Gmail
- [ ] Check: Inbox for email from "Enterprise Banking Platform"
- [ ] Check: Spam folder if not in inbox
- [ ] If received: ✅ Email system working perfectly

### 5.4 If Email Not Received
- [ ] Check: Dev server console for `[Email Service]` logs
- [ ] Look for: Error messages
- [ ] See: Troubleshooting section below

### 5.5 Step 5 Complete
- [ ] ✅ Email test completed
- [ ] ✅ Can proceed to create users

---

## Step 6: Create Your First Test User (1 minute)

### 6.1 Navigate to Users
- [ ] Go to: http://localhost:3000/admin/users
- [ ] Click: "Add New User" button

### 6.2 Fill User Form
- [ ] Name: `Test User` (or any name)
- [ ] Email: `testuser@example.com` (or any email you can check)
- [ ] Click: "Create User"

### 6.3 Verify User Created
- [ ] Should see: Success message or user appears in list
- [ ] If 409 error: Email already exists (use different email)
- [ ] ✅ User created

### 6.4 Check Email
- [ ] Go to email inbox (testuser@example.com)
- [ ] Look for: Invitation email from "Enterprise Banking Platform"
- [ ] Open: Email and verify content
- [ ] Click: Activation link in email
- [ ] Set password and verify onboarding works
- [ ] ✅ Full flow working

---

## Troubleshooting

### Issue: Test shows "success": false

#### Check 1: Dev Console Logs
- [ ] Open dev server terminal
- [ ] Look for: `[Email Service]` messages
- [ ] Check: Error details provided
- [ ] Example errors:
  - "SMTP credentials not configured" → .env.local not saved
  - "Invalid login" → Wrong password
  - "getaddrinfo" → SMTP_HOST issue

#### Check 2: .env.local File
- [ ] Reopen: `.env.local`
- [ ] Verify: SMTP_USER has real Gmail
- [ ] Verify: SMTP_PASSWORD has 16-char password
- [ ] Verify: No extra spaces
- [ ] Verify: File saved
- [ ] Restart server again
- [ ] Test email again

#### Check 3: Gmail Settings
- [ ] Verify: 2FA is enabled (not just shown as "off")
- [ ] Verify: App password generated correctly
- [ ] Verify: App password is 16 characters
- [ ] Try: Generating new app password
- [ ] Update: .env.local with new password
- [ ] Restart: Dev server

#### Check 4: Network/Connection
- [ ] Check: Internet connection working
- [ ] Try: Different network if available
- [ ] Check: Firewall not blocking SMTP
- [ ] Note: Gmail SMTP port is 587 (TLS)

### Issue: 409 Conflict Error When Creating User

- [ ] This means: User email already exists in database
- [ ] Solution: Use different email (example: testuser2@example.com)
- [ ] Or: Delete existing user first

### Issue: Email Not in Inbox

- [ ] Check: Spam/Junk folder
- [ ] Check: Email address spelling correct
- [ ] Check: Email didn't fail (see dev console)
- [ ] Wait: Sometimes takes 30 seconds
- [ ] Try: Creating another user with different email

### Issue: Can't Access Gmail Settings

- [ ] Ensure: You're logged in to correct Gmail
- [ ] Try: Signing out and back in
- [ ] Try: Private/Incognito browser window
- [ ] Try: Different browser

---

## Success Criteria

### ✅ Email System is Working When:

- [ ] Test endpoint shows: `"success": true`
- [ ] Test email arrives in inbox
- [ ] Dev console shows: `✅ Email sent successfully`
- [ ] Created users show status: "invited"
- [ ] Users receive invitation emails
- [ ] Users can click link and set password
- [ ] No error messages in console

### ✅ Complete Email Flow Working When:

- [ ] User created with status "invited"
- [ ] Invitation email sent immediately
- [ ] User receives email in inbox
- [ ] Email contains activation link
- [ ] User clicks link
- [ ] User sets password
- [ ] Account becomes active
- [ ] User can log in

---

## What to Do Next

### After Email is Working (Confirmed Above)

1. **Test the full flow** with multiple users
2. **Verify emails** are professional and correct
3. **Test edge cases**:
   - Resend invitation (if implemented)
   - Password reset flow
   - User account activation
4. **Ready for production** - system fully operational

### For Production Deployment

1. Use production SMTP credentials (not Gmail app password)
2. Configure environment variables securely
3. Set up email logging/monitoring
4. Test email delivery with real users
5. Set up backup SMTP provider (optional)
6. Monitor email bounces and failures

---

## Estimated Timeline

| Step | Task | Time | Status |
|------|------|------|--------|
| 1 | Enable 2FA | 2 min | ⬜ To Do |
| 2 | Generate App Password | 2 min | ⬜ To Do |
| 3 | Update .env.local | 2 min | ⬜ To Do |
| 4 | Restart Dev Server | 1 min | ⬜ To Do |
| 5 | Test Email | 1 min | ⬜ To Do |
| 6 | Create Test User | 1 min | ⬜ To Do |
| **TOTAL** | **Email Setup Complete** | **9 min** | ⬜ Not Started |

---

## Quick Reference

### Gmail SMTP Settings
```
Host: smtp.gmail.com
Port: 587 (TLS)
User: your-gmail@gmail.com
Password: 16-character app password
```

### File to Edit
```
d:\enterprise-digital-banking-platform\.env.local
Lines 40-42
```

### Test Endpoint
```
http://localhost:3000/api/admin/test-email
```

### Admin Users Page
```
http://localhost:3000/admin/users
```

---

## Getting Help

### If Stuck:
1. Reread `START_EMAIL_SETUP.md`
2. Check `SMTP_CONFIGURATION_STATUS.md`
3. Look for `[Email Service]` logs in dev console
4. Verify each step above completed

### Common Issues:
- See `FIX_USER_CREATION_409_ERROR.md`
- Check dev server console for error messages
- Verify .env.local file was saved

---

## Final Confirmation

- [ ] I have enabled 2FA on my Gmail
- [ ] I have generated an app password
- [ ] I have updated .env.local with real credentials
- [ ] I have restarted the dev server
- [ ] I have tested email delivery
- [ ] Test email arrived in my inbox
- [ ] I created a test user successfully
- [ ] Test user received invitation email
- [ ] Email system is fully operational

**If all checked:** ✅ Email setup is complete and working!

---

**Next Step:** Proceed with full email delivery and user onboarding testing.

**Estimated Total Time:** 9-15 minutes (including verification)

**Current Status:** Ready to begin setup
