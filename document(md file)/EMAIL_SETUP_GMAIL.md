# 📧 Setup Email with Gmail - 5 Minutes

**Your platform can now send real emails using Gmail!** Here's how to set it up in 5 minutes.

---

## Step 1: Create a Gmail Account (or use existing)

If you don't have Gmail:
1. Go to https://accounts.google.com/signup
2. Create a new Gmail account
3. Verify your email

If you already have Gmail, skip this step.

---

## Step 2: Enable 2-Factor Authentication

Gmail requires 2-Factor Authentication for app passwords.

1. Go to https://myaccount.google.com/security
2. Find "2-Step Verification"
3. Click "Enable 2-Step Verification"
4. Follow the setup steps
5. **Verify your phone number**

---

## Step 3: Create Gmail App Password

Once 2-Factor is enabled:

1. Go to https://myaccount.google.com/apppasswords
2. Select:
   - **App:** Mail
   - **Device:** Windows (or your OS)
3. Click **Generate**
4. Copy the generated 16-character password
   - Example: `abcd efgh ijkl mnop`
5. **Keep this safe!** You'll need it

---

## Step 4: Update .env.local

Edit `.env.local` in the project root:

```env
# Gmail SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=abcd efgh ijkl mnop
SMTP_FROM_EMAIL=your-email@gmail.com
SMTP_FROM_NAME=Enterprise Banking Platform
```

Replace:
- `your-email@gmail.com` with your Gmail address
- `abcd efgh ijkl mnop` with the 16-character app password you generated

**Example (filled):**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=john.doe.dev@gmail.com
SMTP_PASSWORD=abcd efgh ijkl mnop
SMTP_FROM_EMAIL=john.doe.dev@gmail.com
SMTP_FROM_NAME=Enterprise Banking Platform
```

---

## Step 5: Restart Dev Server

1. Kill the current dev server: **Ctrl+C** in terminal
2. Start it again:
   ```bash
   npm run dev
   ```

---

## Step 6: Test Email

1. Open: http://localhost:3000/api/admin/test-email
2. You should see: **"Email sent successfully"** ✅

---

## Step 7: Create a User and Check Email

1. Go to: http://localhost:3000/admin/users
2. Click: "Create User"
3. Fill in:
   - **Name:** Test User
   - **Email:** your-test-email@gmail.com (use a Gmail or any email)
   - **Role:** Select any role
4. Click: "Create"
5. **Check the email inbox** for the invitation email ✅

---

## Troubleshooting

### Email not sending?

**Error: "Bad credentials"**
- Check: App password is correct (16 characters with spaces)
- Check: SMTP_USER matches your Gmail address
- Fix: Double-check both values in `.env.local`

**Error: "Invalid login"**
- Check: 2-Factor Authentication is enabled
- Check: App password was generated (not regular password)
- Fix: Go to https://myaccount.google.com/apppasswords and regenerate

**Error: "Connection refused"**
- Check: SMTP_PORT is 587
- Check: SMTP_HOST is smtp.gmail.com
- Fix: Verify spelling in `.env.local`

### Email takes 10-30 seconds

This is normal! Gmail's servers may be slow. Just wait.

### Test email works but user emails don't

1. Kill and restart dev server
2. Make sure `.env.local` is saved
3. Try creating a new user
4. Wait 30 seconds for email

---

## Email Security Note

**Your app password is secure because:**
- ✅ Only works with SMTP (can't log into Google account)
- ✅ Only works on your machine
- ✅ Can be revoked anytime
- ✅ Keep `.env.local` out of Git (it's in .gitignore)

**To revoke access later:**
1. Go to https://myaccount.google.com/apppasswords
2. Select the app password
3. Click "Delete"

---

## Using a Different Email Service

### Outlook/Office365
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-password
SMTP_FROM_EMAIL=your-email@outlook.com
SMTP_FROM_NAME=Enterprise Banking Platform
```

### Custom SMTP Server
```env
SMTP_HOST=your-smtp-host.com
SMTP_PORT=587
SMTP_USER=your-username
SMTP_PASSWORD=your-password
SMTP_FROM_EMAIL=sender@example.com
SMTP_FROM_NAME=Your Company Name
```

---

## What Happens Now

Once configured with Gmail:

1. ✅ User invitations are **sent to real email addresses**
2. ✅ Users receive **actual invitation emails**
3. ✅ Users can click **real email links**
4. ✅ Password reset emails are **delivered**
5. ✅ All email features **work perfectly**

---

## Complete Workflow

**Before (Development):**
- Email logged to console ❌

**After (With Gmail):**
- Emails sent to real inbox ✅
- User receives invitation link ✅
- Can activate account immediately ✅
- Can reset password via email ✅

---

## Quick Checklist

- [ ] Gmail account created
- [ ] 2-Factor Authentication enabled
- [ ] App password generated (16 characters)
- [ ] `.env.local` updated with Gmail credentials
- [ ] Dev server restarted
- [ ] Test email sent: /api/admin/test-email
- [ ] User created and email received

---

## FAQ

**Q: Is Gmail free?**
A: Yes! Free tier includes enough email sending for development and small deployments.

**Q: How many emails can I send per day?**
A: Gmail allows up to 500 emails per day for free accounts.

**Q: Will my regular Gmail password work?**
A: No! You MUST use an app password (16 characters). Regular passwords won't work with SMTP.

**Q: Can I use my company email?**
A: If it's Gmail-based, yes! Use the same process.

**Q: What if I don't have Gmail?**
A: You can:
- Create a free Gmail account
- Use Outlook (Microsoft 365)
- Use any SMTP-supporting email service

---

## Status Check

After setup:

```
Email Configuration:    ✅ Configured
SMTP Service:           ✅ Gmail
Email Sending:          ✅ Active
User Invitations:       ✅ Working
Password Reset:         ✅ Working
Test Endpoint:          ✅ /api/admin/test-email
```

---

**Setup Time:** ~5 minutes  
**Cost:** FREE  
**Emails per day:** 500  
**Ready:** Yes, after restart  

Go create a user and check your inbox! 📧
