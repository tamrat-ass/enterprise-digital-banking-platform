# Enterprise Invitation-Based User Creation System

## Overview

This document describes the migration from temporary password-based user creation to an enterprise-grade invitation-based system.

**Benefits:**
- ✅ Users set their own secure passwords
- ✅ No plain passwords displayed or transmitted to admins
- ✅ Invitation links expire (24 hours default)
- ✅ Resendable invitations (one-time tokens)
- ✅ Secure password hashing with bcryptjs (12 rounds)
- ✅ Enterprise password strength requirements
- ✅ Email verification built-in
- ✅ Full audit trail (who created user, when)

## Architecture

```
Admin UI (Create User)
        ↓
POST /api/users
        ↓
Create user with status="invited"
Generate invitation token (256-bit)
        ↓
Send invitation email
        ↓
User receives email with activation link
        ↓
User clicks link → /accept-invitation?token=xxx
        ↓
POST /api/users/set-password
Validate password strength
Hash password with bcryptjs
        ↓
User account activated (status="active")
```

## Database Changes

### Schema Updates (lib/db/schema.ts)

Added to `user` table:

```typescript
status: text("status").notNull().default("invited")  // "invited" | "active" | "disabled"
invitationToken: text("invitationToken").unique()     // Token for accepting invitation
invitationExpiresAt: timestamp("invitationExpiresAt")  // When invitation expires
passwordHash: text("passwordHash")                      // Argon2/Bcrypt hash
requirePasswordChange: boolean("requirePasswordChange") // Force password change on next login
passwordChangedAt: timestamp("passwordChangedAt")       // When password was last changed
passwordResetToken: text("passwordResetToken").unique() // For password reset flow
passwordResetExpiresAt: timestamp("passwordResetExpiresAt") // When reset token expires
```

### Required Database Migration

```sql
-- Add columns to user table
ALTER TABLE "user" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'invited';
ALTER TABLE "user" ADD COLUMN "invitationToken" TEXT UNIQUE;
ALTER TABLE "user" ADD COLUMN "invitationExpiresAt" TIMESTAMP;
ALTER TABLE "user" ADD COLUMN "passwordHash" TEXT;
ALTER TABLE "user" ADD COLUMN "requirePasswordChange" BOOLEAN DEFAULT FALSE;
ALTER TABLE "user" ADD COLUMN "passwordChangedAt" TIMESTAMP;
ALTER TABLE "user" ADD COLUMN "passwordResetToken" TEXT UNIQUE;
ALTER TABLE "user" ADD COLUMN "passwordResetExpiresAt" TIMESTAMP;

-- Create index for faster lookups
CREATE INDEX idx_user_invitationToken ON "user"("invitationToken");
CREATE INDEX idx_user_passwordResetToken ON "user"("passwordResetToken");
CREATE INDEX idx_user_status ON "user"("status");
```

## New Files Created

### 1. **lib/email.ts**
Email service for sending invitations and password reset emails.

**Functions:**
- `sendEmail(options)` - Send transactional email (template)
- `sendInvitationEmail(email, name, link)` - Send invitation
- `sendPasswordResetEmail(email, name, link)` - Send password reset

**Configuration needed:**
- Set up SMTP service (SendGrid, AWS SES, Mailgun, Resend.dev, or Nodemailer)
- Update `sendEmail()` with actual implementation

### 2. **lib/password.ts**
Password security utilities using bcryptjs.

**Functions:**
- `hashPassword(password)` - Hash with bcryptjs (12 rounds)
- `verifyPassword(password, hash)` - Compare password to hash
- `generateSecureToken()` - Generate 256-bit invitation tokens
- `validatePasswordStrength(password)` - Validate enterprise requirements
- `generateDisplayToken()` - User-friendly token for display

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character
- No 3+ repeated characters
- No sequential characters

### 3. **app/api/users/route.ts** (Updated)
Modified POST endpoint:
- Creates user with status = "invited"
- Generates invitation token (expires in 24 hours)
- Sends invitation email
- No password in response
- Returns only user ID, name, email, status

### 4. **app/api/users/set-password/route.ts** (New)
Allows invited users to set their password:
- Validates invitation token
- Checks token expiry
- Validates password strength
- Hashes password with bcryptjs
- Activates user account
- Clears invitation token (one-time use)

**Request:**
```json
{
  "invitationToken": "abc123...",
  "password": "SecurePass123!"
}
```

### 5. **app/api/users/resend-invitation/route.ts** (New)
Resend invitation to invited users:
- Requires `users.create` permission
- Generates new invitation token
- Invalidates previous token
- Sends new invitation email
- Only works for status = "invited"

**Request:**
```json
{
  "userId": "user_abc123..."
}
```

### 6. **app/accept-invitation/page.tsx** (New)
Public page for users to accept invitation and set password:
- Validates invitation token from URL
- Real-time password strength validation
- Shows all password requirements
- Password confirmation field
- Success screen redirects to sign-in

**URL:** `/accept-invitation?token=xxx`

## Updated Files

### **app/admin/users/page.tsx**
- Updated to show "Invitation Sent" status
- Removed temporary password display
- Changed success message to explain invitation flow
- Added resend invitation option (via "More" menu)
- Updated user status display with icons

## Environment Configuration

Required env vars (in .env.local):
```bash
# Existing
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=...

# For email service (add one of the below)
# SendGrid
SENDGRID_API_KEY=sg_...

# AWS SES
AWS_SES_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

# Mailgun
MAILGUN_API_KEY=...
MAILGUN_DOMAIN=...

# Resend.dev
RESEND_API_KEY=...
```

## Implementation Steps

### Step 1: Database Migration
Run the SQL migration to add new columns:
```bash
psql -f migrations/add-invitation-system.sql
```

Or if using Drizzle migrations, update schema and push.

### Step 2: Install Dependencies (Already installed)
Already in package.json:
- `bcryptjs` - Password hashing
- `postgres` - Database client

### Step 3: Set Up Email Service
1. Choose email provider (SendGrid recommended)
2. Add API key to .env.local
3. Update `lib/email.ts` `sendEmail()` function with actual implementation

### Step 4: Deploy Changes
```bash
# Install dependencies
npm install

# Run migrations
npm run db:push  # if using Drizzle

# Build and test
npm run build

# Deploy
git push origin main
```

### Step 5: Test the Flow
1. Create a new user in admin panel
2. Check email inbox for invitation
3. Click invitation link
4. Set password with strong requirements
5. Verify user can sign in

## Security Considerations

### Token Security
- ✅ 256-bit (32-byte) entropy for invitation tokens
- ✅ Tokens are stored as unique in database
- ✅ Tokens expire after 24 hours
- ✅ One-time use (cleared after password set)
- ✅ Not included in API response to admin

### Password Security
- ✅ Never transmitted as plain text
- ✅ Hashed with bcryptjs 12 rounds (~100ms)
- ✅ Strong requirements enforced
- ✅ bcryptjs handles salt automatically
- ✅ verifyPassword() uses secure compare

### Email Security
- ✅ Links are time-limited (24 hours)
- ✅ Link uses secure token, not user ID
- ✅ No sensitive data in email
- ✅ Email templates have security warnings

### Database Security
- ✅ Indexes on token columns for performance
- ✅ Unique constraints prevent token reuse
- ✅ Status field prevents wrong-state operations
- ✅ Timestamps track user account lifecycle

## Monitoring & Auditing

### Recommended Logs to Track
```typescript
// Log successful invitations
console.log('[Users API] Created new user:', userId, 'with email:', email)

// Log invitation resends
console.log('[Resend Invitation] Email sent to:', email)

// Log password sets
console.log('[Set Password] User activated:', email)

// Log failures
console.warn('[Set Password] Invalid or expired token')
```

### Database Queries for Audits
```sql
-- Find all invited users
SELECT id, name, email, invitationExpiresAt 
FROM "user" 
WHERE status = 'invited';

-- Find expired invitations
SELECT id, email, invitationExpiresAt 
FROM "user" 
WHERE status = 'invited' AND invitationExpiresAt < NOW();

-- Users with no password yet
SELECT id, email 
FROM "user" 
WHERE passwordHash IS NULL;

-- Last password changes
SELECT id, email, passwordChangedAt 
FROM "user" 
ORDER BY passwordChangedAt DESC 
LIMIT 10;
```

## Troubleshooting

### Email Not Sending
1. Check email service is configured in .env.local
2. Verify API key is valid
3. Check logs in `lib/email.ts` console output
4. Use resend-invitation endpoint to retry

### Token Expired
1. User can request new invitation via resend endpoint (requires admin)
2. Default expiry is 24 hours (configurable in route.ts)
3. Token is cleared after successful password set

### User Stuck in "Invited" Status
1. Check `invitationExpiresAt` timestamp
2. Admin can resend invitation (generates new token)
3. Or use database to manually update status if needed

### Password Validation Fails
1. Password must meet all 5 requirements
2. Check error message returned by `/api/users/set-password`
3. Frontend shows real-time validation errors

## Future Enhancements

### Phase 2
- [ ] Email template customization
- [ ] Custom invitation expiry time (admin setting)
- [ ] Bulk user import with invitations
- [ ] Invitation status dashboard
- [ ] Automated reminder emails (24h before expiry)

### Phase 3
- [ ] MFA setup during invitation acceptance
- [ ] Department/team assignment during onboarding
- [ ] Welcome workflow/checklist
- [ ] Invitation templates by user role

## Rollback Plan

If needed to revert to temporary passwords:

1. Keep GET /api/users endpoint working (shows both systems)
2. Temporarily update POST /api/users to generate temp password
3. Users with "invited" status continue invitation flow
4. New users get temporary passwords
5. Migrate invited users to active status manually

## Support

For issues or questions:
1. Check logs in API routes
2. Review password strength errors
3. Verify email service configuration
4. Check database for token/status values
5. Review this document's troubleshooting section
