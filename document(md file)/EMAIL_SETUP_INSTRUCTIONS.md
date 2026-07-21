# 📧 Email Setup Guide - 5 Minutes to Real Email Delivery

## Problem: Emails Not Delivered to Inbox

Your system is **ready to send emails**, but **SMTP credentials are not configured** yet. 

Currently, `.env.local` has placeholder values:
```
SMTP_USER=your-email@gmail.com        ❌ Placeholder
SMTP_PASSWORD=your-app-password       ❌ Placeholder
```

**Solution:** Configure real Gmail SMTP credentials in 5 minutes.

---

## Option 1: Gmail (Recommended - Free)

### Step 1: Enable 2-Factor Authentication
1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Click **Security** (left sidebar)
3. Under "How you sign in to Google", enable **2-Step Verification**
   - You'll need your phone to verify
   - Follow the Google prompts

### Step 2: Generate App Password
1. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
   - You may need to sign in again
2. Select:
   - **App:** Mail
   - **Device:** Windows Computer (or your device)
3. Click **Generate**
4. Google will show a 16-character password in a popup
   - Example: `abcd efgh ijkl mnop`
5. **Copy this password** (without spaces)

### Step 3: Update `.env.local`
Replace these lines in `.env.local`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com          ← Replace with your Gmail
SMTP_PASSWORD=abcdefghijklmnop          ← Replace with 16-char password
SMTP_FROM_EMAIL=your-email@gmail.com    ← Replace with your Gmail
SMTP_FROM_NAME=Enterprise Banking Platform
```

Example:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=john.doe@gmail.com
SMTP_PASSWORD=xyzabcdefghijklm
SMTP_FROM_EMAIL=john.doe@gmail.com
SMTP_FROM_NAME=Enterprise Banking Platform
```

### Step 4: Restart Dev Server
Stop and restart the dev server:
```bash
# Stop: Ctrl+C
# Restart: npm run dev
```

### Step 5: Test Email Delivery
1. Go to `http://localhost:3000/api/admin/test-email`
2. Watch the browser output
3. Check your email inbox for test email

---

## Option 2: Outlook/Office365

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-outlook-password
SMTP_FROM_EMAIL=your-email@outlook.com
SMTP_FROM_NAME=Enterprise Banking Platform
```

---

## Option 3: Custom SMTP Server

```env
SMTP_HOST=mail.yourcompany.com
SMTP_PORT=587                          # or 465 for SSL
SMTP_USER=your-email@yourcompany.com
SMTP_PASSWORD=your-smtp-password
SMTP_FROM_EMAIL=your-email@yourcompany.com
SMTP_FROM_NAME=Enterprise Banking Platform
```

---

## Troubleshooting

### Error: "Authentication failed"
- Check that `SMTP_PASSWORD` is exactly correct (16 chars for Gmail app password)
- Make sure 2FA is enabled on your Gmail account
- Regenerate the app password and try again

### Error: "Connection failed"
- Verify `SMTP_HOST` is spelled correctly
- Check that `SMTP_PORT` matches your provider (587 for TLS, 465 for SSL)
- Make sure you're connected to the internet

### Error: "Invalid email from address"
- Verify `SMTP_FROM_EMAIL` matches `SMTP_USER` (for Gmail)
- Some providers require the from address to match the authenticated user

### Email still not arriving?
- Check spam/junk folder
- Verify recipient email address in user creation
- Test with `/api/admin/test-email` first before creating users

---

## How to Use After Setup

### Create a user and send invitation
1. Go to **Admin > Users**
2. Click **Add New User**
3. Enter name and email
4. Click **Create User**
5. User receives invitation email within seconds

### User completes onboarding
1. User clicks link in email
2. User sets password
3. User logs in
4. Account active

---

## Current System Status

✅ **Nodemailer SMTP configured** - Ready to send real emails
✅ **Email templates** - Professional HTML email templates
✅ **User invitation flow** - Complete invitation-based onboarding
❌ **SMTP Credentials** - Not configured yet (blocking issue)

Once you configure SMTP, all emails will be delivered to real inboxes automatically.

---

## Questions?

If emails still aren't delivering after setup:
1. Check dev server console logs for `[Email Service]` messages
2. Visit `/api/admin/test-email` to test with a known email
3. Check spam folder - some providers flag automated emails

---

**Next Step:** Follow Option 1 above to set up Gmail (takes ~5 minutes)
