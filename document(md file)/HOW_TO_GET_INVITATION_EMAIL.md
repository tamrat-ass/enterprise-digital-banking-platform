# 📧 How to Get Invitation Emails - Development Guide

**Important:** In development mode, invitation emails are **logged to the server console**, not sent via email.

---

## Where to Find Your Invitation Emails

### Method 1: Check the Server Console (BEST)

When you create a user, the invitation email is logged to the server terminal with all details:

**Steps:**
1. Create a user via Admin → Users
2. **Look in the dev server terminal window**
3. You'll see logs like this:

```
[Email Service] 🔧 Development mode active - logging email to console
[Email Service] 📧 Email record:
[Email Service]    To: newuser@example.com
[Email Service]    From: noreply@sendgrid.com
[Email Service]    Subject: Welcome to Enterprise Banking Platform - Complete Your Setup
[Email Service]    Sent at: 2026-07-16T05:15:09.625Z
[Email Service] 📧 Email HTML preview:
(HTML content showing the invitation link and setup instructions)
```

### Method 2: View Complete Email Details

Look for the `[Email Service]` prefix logs in your terminal. They contain:
- ✅ **To:** The user's email address
- ✅ **From:** The sender email
- ✅ **Subject:** Email title
- ✅ **Timestamp:** When sent
- ✅ **Preview:** First 300 characters of HTML

---

## Understanding the Email Logs

### Log Example

```
[Users API] Created new user: user_abc123def456 with email: john@example.com status: invited
[Users API] 📧 Sending invitation email...
[Users API]    Email: john@example.com
[Users API]    Link: http://localhost:3000/accept-invitation?token=xyz123...
[Email Service] 🔧 Development mode active - logging email to console
[Email Service] 📧 Email record:
[Email Service]    To: john@example.com
[Email Service]    From: noreply@sendgrid.com
[Email Service]    Subject: Welcome to Enterprise Banking Platform - Complete Your Setup
[Email Service]    Sent at: 2026-07-16T05:15:09.625Z
[Email Service] 📧 Email HTML preview:
Welcome, John Doe!
Your account has been created in the Enterprise Banking Platform...
Activate Your Account
[Users API] 📧 Email result: ✅ SUCCESS
```

### What Each Line Means

| Log | Meaning |
|-----|---------|
| `[Users API] Created new user` | User was successfully created in database |
| `[Users API] Sending invitation email` | About to send invitation |
| `[Email Service] 🔧 Development mode` | Using console logging (not SendGrid) |
| `[Email Service] 📧 Email record:` | Here comes the email details |
| `To:` | The user who will receive this email |
| `From:` | Sender address |
| `Subject:` | Email title |
| `Sent at:` | When the email was "sent" |
| `Email HTML preview:` | First 300 chars of email content |
| `[Users API] Email result: ✅ SUCCESS` | Email was successfully logged |

---

## How to Get the Invitation Link

### The Link is in the Server Logs!

When you create a user, you'll see:

```
[Users API] 📧 Sending invitation email...
[Users API]    Email: newuser@example.com
[Users API]    Link: http://localhost:3000/accept-invitation?token=<LONG_TOKEN_HERE>
```

**Copy that link!** That's the activation link the user would receive in their email.

### Step-by-Step:

1. **Create User** → Admin → Users → Fill form → Click "Create"
2. **Check Server Logs** → Look for `[Users API] Link:`
3. **Copy the link**
4. **Visit the link in your browser**
5. **Set password** → User account activates ✅

---

## Complete Workflow with Logs

### Step 1: Create User

**In Admin UI:**
```
Name: Test User
Email: test@example.com
Role: Select a role
Click: Create
```

**In Server Console:**
```
[Users API] Created new user: user_xyz with email: test@example.com status: invited
[Users API] 📧 Sending invitation email...
[Users API]    Email: test@example.com
[Users API]    Link: http://localhost:3000/accept-invitation?token=abc123def456...
[Email Service] 🔧 Development mode active - logging email to console
[Email Service] 📧 Email record:
[Email Service]    To: test@example.com
[Email Service]    From: noreply@sendgrid.com
[Email Service]    Subject: Welcome to Enterprise Banking Platform - Complete Your Setup
[Email Service]    Sent at: 2026-07-16T05:15:09.625Z
[Users API] 📧 Email result: ✅ SUCCESS
```

### Step 2: Copy Invitation Link

From the logs above, copy:
```
http://localhost:3000/accept-invitation?token=abc123def456...
```

### Step 3: Visit Link in Browser

Paste the link into your browser address bar:
```
http://localhost:3000/accept-invitation?token=abc123def456...
```

You'll see:
```
Set Password Page
Email: test@example.com (prefilled)
Password: [Enter secure password]
Confirm Password: [Repeat password]
Button: Accept Invitation
```

### Step 4: Set Password

1. Enter a secure password
2. Confirm the password
3. Click "Accept Invitation"
4. User status changes to "active" ✅

### Step 5: Log In

Now you can log in with:
```
Email: test@example.com
Password: [The one you just set]
```

You're in! ✅

---

## Why Emails Are Logged to Console (Development)

### This is by Design:

**Benefits:**
- ✅ No external service dependency (SendGrid)
- ✅ Fast - no API calls
- ✅ All details visible for debugging
- ✅ No real emails sent during testing
- ✅ Free - no SendGrid usage charges
- ✅ Can test any number of invitations

**Tradeoff:**
- ❌ Emails don't actually get delivered
- ❌ Must manually copy link from logs

---

## Screenshots Guide

### 1. Creating a User
```
Admin → Users
Click: "Create User"
Fill: Name, Email, Role
Click: "Create"
```

### 2. Success Modal
```
✓ User Created
Shows: User details
Button: Done
```

### 3. Check Server Console
```
Look for: [Email Service] 📧 Email record:
See: To, From, Subject, Link
Copy: The invitation link
```

### 4. Visit Invitation Link
```
Paste link in browser
See: "Set Password" page
Enter: New password
Click: "Accept Invitation"
```

### 5. Log In
```
Email: [created email]
Password: [password you set]
Click: Login
```

---

## Troubleshooting

### I don't see email logs

**Check:**
1. Is the dev server running? (`npm run dev`)
2. Look in the **dev server terminal**, not browser console
3. Create a fresh user to trigger new logs
4. Logs appear immediately after clicking "Create"

### I can't find the invitation link

**Look for this line in logs:**
```
[Users API]    Link: http://localhost:3000/accept-invitation?token=...
```

Copy everything starting with `http://`

### The link doesn't work

**Check:**
1. Copy the ENTIRE link including `?token=...`
2. Don't modify the link
3. Make sure dev server is still running
4. Try creating a new user and using that link

### The password doesn't set

**Check:**
1. Password must be at least 8 characters
2. Both password fields must match
3. Try a simpler password for testing
4. Check for error messages in the form

---

## Production Mode

When deployed to production (NODE_ENV=production):

**If SendGrid is configured:**
- Emails will be sent via SendGrid ✅
- Users receive real invitation emails ✅
- No logs needed ✅

**If SendGrid is not configured:**
- Falls back to console logging (like development) ⚠️
- Emails won't be delivered ❌
- You need to configure SendGrid

### To Set Up for Production:

1. Configure SendGrid sender domain authentication
2. Update `.env` with verified email
3. Set `NODE_ENV=production`
4. Deploy
5. Emails will send automatically ✅

---

## Quick Reference

| What | Where to Find |
|-----|---------------|
| **Invitation Link** | Server console: `[Users API] Link:` |
| **User Email Address** | Server console: `[Email Service] To:` |
| **Activation Status** | Server console: `[Users API] Email result:` |
| **Email Subject** | Server console: `[Email Service] Subject:` |
| **Email Content** | Server console: `[Email Service] Email HTML preview:` |

---

## Summary

### What's Happening:

✅ **User created successfully**  
✅ **Invitation email generated**  
✅ **Email logged to server console**  
❌ **Email NOT sent to actual inbox** (development mode)  
✅ **Invitation link visible in logs**  
✅ **User can still complete setup** (copy link from logs)  

### The Process:

1. Create user in Admin UI
2. Check server console for email logs
3. Copy invitation link from logs
4. Visit link in browser
5. Set password
6. User activated ✅

### That's It!

The system is working perfectly. The email flow is just displayed in console instead of SendGrid for development purposes.

---

**Status:** ✅ Email system working as designed  
**Mode:** Development (console logging)  
**Ready for Use:** ✅ Yes  
**Production Mode:** Configure SendGrid for real emails
