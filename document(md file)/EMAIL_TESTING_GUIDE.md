# 🧪 Email Testing Guide

## Current Status
✅ SMTP Configured  
✅ Email Service Ready  
✅ Dev Server Running  
❌ Need to verify emails are actually sending

---

## Step 1: Test Email Endpoint

### Visit Test URL
Go to: `http://localhost:3000/api/admin/test-email`

### What You Should See
```json
{
  "success": true,
  "message": "Test email sent successfully! Check your email (or spam folder).",
  "smtpConfig": {
    "host": "smtp.gmail.com",
    "port": "587",
    "user": "✅ Set",
    "password": "✅ Set",
    "fromEmail": "noreply@ahadubank.com",
    "fromName": "Enterprise Banking Platform"
  },
  "nextSteps": [
    "Check your email inbox (or spam folder) for the test email",
    "If received, you can now create users and they will receive invitation emails",
    "Go to /admin/users to create a new user"
  ]
}
```

### What It Means
- ✅ `"success": true` = Email service working
- ✅ `"user": "✅ Set"` = SMTP credentials configured
- ✅ Check spam folder = Sometimes Gmail marks as spam initially

---

## Step 2: Check Test Email

### Where to Look
1. **Primary Email:** `tame.assu@gmail.com` inbox
2. **Spam Folder:** Check if test email went to spam
3. **All Mail:** If not in inbox

### What Test Email Contains
- From: "Enterprise Banking Platform <noreply@ahadubank.com>"
- Subject: "Welcome to Enterprise Banking Platform - Complete Your Setup"
- Contains: Activation link for test@example.com

### Expected Result
✅ You receive email from "Enterprise Banking Platform"  
✅ Email contains professional HTML template  
✅ Email has activation button/link  

---

## Step 3: Create Real User & Test Invitation

### Go to User Creation
URL: `http://localhost:3000/admin/users`

### Create User with Unique Email

**DO NOT USE:** Emails that already exist (causes 409 error)

**TRY THESE:**
```
Email: john.smith@ahadubank.com
Name: John Smith
```

Or:
```
Email: jane.doe@ahadubank.com
Name: Jane Doe
```

Or:
```
Email: test.newuser@ahadubank.com
Name: Test New User
```

### Click Create User

### Expected Response
```json
{
  "id": "user_...",
  "name": "John Smith",
  "email": "john.smith@ahadubank.com",
  "status": "invited",
  "message": "User created successfully. Invitation email sent."
}
```

---

## Step 4: Verify User Receives Email

### Check Email Inbox
1. Go to: `john.smith@ahadubank.com` inbox (or whatever email you created)
2. Look for: Email from "Enterprise Banking Platform"
3. Subject: "Welcome to Enterprise Banking Platform - Complete Your Setup"

### What Email Contains
- ✅ User's name
- ✅ Professional HTML design
- ✅ Activation button with secure link
- ✅ Link expires in 24 hours
- ✅ Security notice
- ✅ Company branding

### If Email Not Received
See troubleshooting section below

---

## Step 5: Test Complete Onboarding Flow (Optional)

### Click Email Link
1. User opens invitation email
2. User clicks "Activate Your Account" button
3. Browser redirects to: `http://localhost:3000/accept-invitation?token=xxxxx`

### Set Password
1. Page displays password setup form
2. User enters password
3. User confirms password
4. User clicks "Set Password & Activate"

### Verify Account Active
1. System returns success message
2. User can now log in
3. Account status changes to "active"

---

## Troubleshooting

### Issue: Test Email Not Received

#### Check 1: Verify SMTP Configuration
Visit: `http://localhost:3000/api/admin/test-email`

Look for:
```json
"user": "✅ Set",
"password": "✅ Set"
```

If either shows "❌ Not set":
- Open: `.env.local`
- Verify: SMTP_USER and SMTP_PASSWORD are set
- Restart: Dev server
- Try again

#### Check 2: Gmail Settings
1. Go to: `https://myaccount.google.com/security`
2. Check: 2-Step Verification is enabled
3. Check: App password was generated
4. Verify: Right password used (16 characters)

#### Check 3: Check Spam Folder
Gmail sometimes marks automated emails as spam initially
1. Go to Gmail
2. Check: Spam/Junk folder
3. Mark as: "Not Spam" if found there
4. Future emails should go to inbox

#### Check 4: Dev Server Console Logs
Look for `[Email Service]` messages:

**Good:**
```
[Email Service] ✅ Nodemailer transporter initialized
[Email Service] 📧 Sending email...
[Email Service] ✅ Email sent successfully!
```

**Bad:**
```
[Email Service] ❌ Failed to send email
[Email Service]    Error: Invalid login
```

If you see error, verify SMTP credentials in `.env.local`

#### Check 5: Verify Email Address
- Make sure test email was typed correctly
- Make sure no typos in recipient email
- Try with different email address

### Issue: User Creation Returns 409

**Meaning:** Email already exists in database

**Solution:**
1. Use different email address
2. Examples:
   - ✅ john@ahadubank.com (if not used)
   - ✅ jane@ahadubank.com (if not used)
   - ✅ test.user@ahadubank.com

See: `EXISTING_USERS.md` for more details

### Issue: Dev Server Shows Error

**Check logs for `[Email Service]` messages**

Common errors:
1. **"SMTP credentials not configured"**
   - Fix: Check `.env.local` has real values
   - Not placeholder values

2. **"Invalid login"**
   - Fix: Verify email and password are correct
   - Gmail requires 16-char app password, not regular password

3. **"Connection failed"**
   - Fix: Verify SMTP_HOST is correct (smtp.gmail.com)
   - Verify SMTP_PORT is 587 (TLS) not 465 (SSL)

4. **"getaddrinfo ENOTFOUND"**
   - Fix: Check internet connection
   - Verify firewall not blocking SMTP

---

## Success Checklist

### ✅ Email System Working When:
- [ ] Test email endpoint returns "success": true
- [ ] Test email received in inbox
- [ ] Dev console shows "✅ Email sent successfully"
- [ ] User creation shows "Invitation email sent" message
- [ ] New user receives invitation email
- [ ] User can click link and set password
- [ ] User account becomes active

---

## What's Next

### If Email Tests Pass
1. ✅ Email system is working
2. ✅ Create real users
3. ✅ Users receive invitations
4. ✅ System ready for production

### If Email Tests Fail
1. Check troubleshooting section above
2. Verify `.env.local` configuration
3. Check Gmail security settings
4. Review dev server console logs
5. Try different email address

---

## Quick Reference

| Task | URL |
|------|-----|
| Test Email | `http://localhost:3000/api/admin/test-email` |
| Create Users | `http://localhost:3000/admin/users` |
| Dashboard | `http://localhost:3000/admin/dashboard` |
| View Users | `http://localhost:3000/api/users` |

---

## SMTP Configuration (Configured)

```
Host:     smtp.gmail.com
Port:     587 (TLS)
User:     tame.assu@gmail.com
Password: tame@4840yene@48
From:     noreply@ahadubank.com
TLS:      Enabled
```

Status: ✅ CONFIGURED & READY

---

## Next Step

👉 **Visit:** `http://localhost:3000/api/admin/test-email`

👉 **Check:** Test email in your inbox

👉 **Create:** New user with unique email

👉 **Verify:** User receives invitation email

---

**Email System Status:** 🟢 READY TO TEST

Estimated time to complete testing: 5-10 minutes
