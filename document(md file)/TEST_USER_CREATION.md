# 🧪 Test User Creation & Email Verification

## Goal
Create test user with email: `tamrat.assu23@gmail.com` and verify invitation email is received.

---

## How to Create User (Manual Steps)

### Step 1: Go to Admin Users Page
```
URL: http://localhost:3000/admin/users
```

### Step 2: Click "Add New User" Button
You should see a form to create new user.

### Step 3: Fill User Details
```
Name: Tamrat Test User
Email: tamrat.assu23@gmail.com
```

### Step 4: Click "Create User" Button

### Step 5: Verify User Created
You should see:
- ✅ Success message: "User created successfully. Invitation email sent."
- ✅ New user appears in list with status "invited"
- ✅ Response shows created user details

---

## What Happens Next (Automatic)

**System automatically:**
1. Creates user in database with status "invited"
2. Generates secure invitation token (24-hour expiry)
3. Sends invitation email via Nodemailer SMTP to: `tamrat.assu23@gmail.com`
4. Email includes:
   - Professional HTML template
   - Activation button with secure link
   - Company branding
   - Security notice

---

## Step 6: Check Email Inbox

### Check Your Email
Go to: `tamrat.assu23@gmail.com` inbox

### Look For
- **From:** Enterprise Banking Platform <noreply@ahadubank.com>
- **Subject:** Welcome to Enterprise Banking Platform - Complete Your Setup
- **Contains:** Activation link and button

### If Not In Inbox
1. Check **Spam/Junk** folder
2. Check **All Mail** folder
3. Check email address spelling (case-sensitive for some providers)

---

## Expected Email Contents

### Email Header
```
From: Enterprise Banking Platform <noreply@ahadubank.com>
To: tamrat.assu23@gmail.com
Subject: Welcome to Enterprise Banking Platform - Complete Your Setup
```

### Email Body (HTML)
- Professional gradient header with company branding
- Welcome message with user's name
- Clear call-to-action: "Activate Your Account"
- Activation button/link (clickable)
- Plain text alternative with link
- Security notice: "Link expires in 24 hours"
- Company footer

### Email Link
```
http://localhost:3000/accept-invitation?token=<secure-token>
```
- Token is unique and secure (256-bit)
- Expires after 24 hours
- Only works for this specific user

---

## Test Verification Checklist

### ✅ User Creation
- [ ] Go to admin/users page
- [ ] Click "Add New User"
- [ ] Enter: Name = "Tamrat Test User"
- [ ] Enter: Email = "tamrat.assu23@gmail.com"
- [ ] Click: "Create User"
- [ ] Verify: User appears in list
- [ ] Verify: Status is "invited"

### ✅ Email Delivery
- [ ] Open email inbox: tamrat.assu23@gmail.com
- [ ] Look for: Email from "Enterprise Banking Platform"
- [ ] Check: Spam folder if not in inbox
- [ ] Verify: Subject line is correct
- [ ] Verify: Email contains activation link

### ✅ Email Content
- [ ] Email has professional HTML template
- [ ] Email shows user's name "Tamrat Test User"
- [ ] Email has "Activate Your Account" button
- [ ] Email shows "Link expires in 24 hours"
- [ ] Email has company branding

### ✅ Complete Flow (Optional)
- [ ] Click activation link in email
- [ ] Set password on the form
- [ ] Click "Set Password & Activate"
- [ ] Verify: Success message
- [ ] Try to log in with email + password
- [ ] Verify: Account is active

---

## Console Log Verification

While creating user, check dev server console for:

### Expected Good Logs
```
[Users API] Created new user: user_xxx with email: tamrat.assu23@gmail.com
[Users API] 📧 Sending invitation email...
[Users API]    Email: tamrat.assu23@gmail.com
[Users API]    Link: http://localhost:3000/accept-invitation?token=xxx
[Email Service] ✅ Nodemailer transporter initialized
[Email Service] 📧 Sending email...
[Email Service]    To: tamrat.assu23@gmail.com
[Email Service]    From: Enterprise Banking Platform <noreply@ahadubank.com>
[Email Service] ✅ Email sent successfully!
[Email Service]    Message ID: <xxx@gmail.com>
[Users API] 📧 Email result: ✅ SUCCESS
POST /api/users 201
```

### If You See Error
Look for: `[Email Service] ❌` messages
- Check app password configuration
- Check SMTP credentials
- Check internet connection

---

## Success Criteria

### ✅ Everything Working
```
Create User → Email Sent ✅ → Email Received ✅ → User can activate → Account active ✅
```

All steps complete:
1. User created with status "invited" ✅
2. Invitation email sent successfully ✅
3. Email received in inbox ✅
4. User can click link and set password ✅
5. User account becomes active ✅

### Result
🎉 **Email system is fully operational!**

---

## Troubleshooting

### Email Not Received

**Check 1: Verify User Was Created**
- Go to: http://localhost:3000/admin/users
- Look for: "Tamrat Test User"
- Check status: Should be "invited"

**Check 2: Check Spam Folder**
- Gmail puts automated emails in spam initially
- Mark as "Not Spam" to train Gmail

**Check 3: Check Dev Console**
- Look for: `[Email Service]` messages
- If error: Check SMTP password
- If error: Check internet connection

**Check 4: Check Email Address**
- Verify: tamrat.assu23@gmail.com is correct spelling
- Check: No typos

**Check 5: Restart Server & Try Again**
```bash
Press: Ctrl+C
Type: npm run dev
Try: Creating user again
```

---

## Manual Testing Steps

1. **Login to admin:** http://localhost:3000/admin/users
2. **Create user:** Name = "Tamrat Test User", Email = "tamrat.assu23@gmail.com"
3. **Note:** System automatically sends email
4. **Check inbox:** tamrat.assu23@gmail.com
5. **Verify email received** from "Enterprise Banking Platform"
6. **Click link** in email to test onboarding

---

## What You're Testing

✅ User creation system works  
✅ Database stores user correctly  
✅ Permission system allows creation  
✅ Email service initializes  
✅ SMTP connects to Gmail  
✅ Email credentials authenticate  
✅ Email sent to recipient  
✅ Email received in inbox  

If all pass → **System is production-ready!**

---

## Next Steps After Test

### If Email Works ✅
- Create more test users
- Test user onboarding flow
- System ready for production

### If Email Fails ❌
- Check dev console for error details
- Verify SMTP credentials in .env.local
- Check Gmail app password is correct (16 chars, no spaces)
- Restart dev server
- Try again

---

## Time Estimate

- Create user: 1 minute
- Email delivery: 5-10 seconds
- Check email: 1 minute
- **Total: 2-3 minutes**

---

**Ready to test?** 👉 Go to `http://localhost:3000/admin/users` and create the test user!
