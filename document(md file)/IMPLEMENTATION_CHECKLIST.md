# Invitation System Implementation Checklist

## Pre-Implementation Review

### Code Review
- [x] Schema changes reviewed
- [x] API endpoints implemented
- [x] Email templates created
- [x] Password hashing utilities created
- [x] Frontend UI updated
- [x] Security implications reviewed

### Architecture Review
- [x] Token generation is cryptographically secure (256-bit)
- [x] Password hashing uses bcryptjs (12 rounds)
- [x] Email service is abstracted (can integrate various providers)
- [x] Error handling is comprehensive
- [x] Logging is appropriate for audit trail
- [x] Database indexes created for performance

## Step 1: Database Migration (DO THIS FIRST)

### Execute Migration
```bash
# Option A: Using psql directly
psql -U postgres -d ahadufile -f migrations/add-invitation-system.sql

# Option B: Using Drizzle (if available)
npm run db:push

# Option C: Manual verification
# Connect to database and run:
# ALTER TABLE "user" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'invited';
# ... (see migration file)
```

### Verify Migration
```sql
-- Check columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user';

-- Check indexes exist
SELECT indexname FROM pg_indexes WHERE tablename = 'user';

-- Check constraints exist
SELECT constraint_name FROM information_schema.table_constraints 
WHERE table_name = 'user';
```

### Verification Checklist
- [ ] All 8 new columns added
- [ ] All 4 indexes created
- [ ] Check constraint added
- [ ] Existing users updated to status = 'active'
- [ ] Database is healthy

## Step 2: Environment Configuration

### Set Up Email Service
Choose one service and configure:

**Option A: SendGrid (Recommended)**
```bash
# Install dependency
npm install @sendgrid/mail

# Add to .env.local
SENDGRID_API_KEY=sg_your_api_key_here
SENDGRID_FROM_EMAIL=noreply@company.com
```

**Option B: AWS SES**
```bash
# Install dependency
npm install @aws-sdk/client-ses

# Add to .env.local
AWS_SES_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_SES_FROM_EMAIL=noreply@company.com
```

**Option C: Mailgun**
```bash
# Install dependency
npm install mailgun.js

# Add to .env.local
MAILGUN_API_KEY=...
MAILGUN_DOMAIN=...
MAILGUN_FROM_EMAIL=noreply@company.com
```

**Option D: Resend.dev**
```bash
# Install dependency
npm install resend

# Add to .env.local
RESEND_API_KEY=re_...
```

### Update Email Service
- [ ] Update `lib/email.ts` `sendEmail()` function with chosen provider
- [ ] Test email sending works
- [ ] Verify emails are not going to spam
- [ ] Set up email templates in provider dashboard

### Environment Configuration Checklist
- [ ] Email API key added to .env.local
- [ ] FROM email address configured
- [ ] BETTER_AUTH_URL set correctly
- [ ] DATABASE_URL verified
- [ ] .env.local is in .gitignore

## Step 3: Code Integration

### Verify New Files Exist
- [ ] `lib/email.ts` created
- [ ] `lib/password.ts` created
- [ ] `app/api/users/set-password/route.ts` created
- [ ] `app/api/users/resend-invitation/route.ts` created
- [ ] `app/accept-invitation/page.tsx` created

### Verify Updated Files
- [ ] `lib/db/schema.ts` updated with new fields
- [ ] `app/api/users/route.ts` updated for invitation flow
- [ ] `app/admin/users/page.tsx` updated to show invitation status

### Code Integration Checklist
- [ ] All imports resolve correctly
- [ ] TypeScript compilation succeeds
- [ ] No lint errors
- [ ] All dependencies installed

## Step 4: Build & Test

### Build Verification
```bash
npm run build
```

Checklist:
- [ ] Build succeeds with no errors
- [ ] Build completes in <5 minutes
- [ ] No TypeScript errors
- [ ] No ESLint warnings

### Testing the Flow

#### 1. Create User
- [ ] Go to Admin > Users
- [ ] Click "Add User"
- [ ] Enter name and email
- [ ] Select role(s)
- [ ] Click "Create User"
- [ ] Success message appears

#### 2. Check Invitation Email
- [ ] Email received with subject "Welcome to Enterprise Banking Platform"
- [ ] Email contains invitation link
- [ ] Email explains 24-hour expiry
- [ ] Link format: `http://localhost:3000/accept-invitation?token=xxx`

#### 3. Accept Invitation
- [ ] Click invitation link in email
- [ ] Redirected to `/accept-invitation?token=xxx`
- [ ] Page shows password requirements
- [ ] Real-time password strength validation works

#### 4. Set Password
- [ ] Enter password that meets all requirements
- [ ] Confirm password
- [ ] Click "Complete Setup"
- [ ] Success screen appears
- [ ] Redirected to sign-in page

#### 5. Sign In
- [ ] Go to sign-in page
- [ ] Enter email and password
- [ ] Successfully logged in
- [ ] User profile shows (name, role, department)

#### 6. Verify Database
```sql
-- Check user status is now 'active'
SELECT id, email, status, passwordChangedAt 
FROM "user" 
WHERE email = 'test@example.com';

-- Verify invitation token was cleared
SELECT invitationToken FROM "user" WHERE email = 'test@example.com';
-- Should be NULL

-- Verify password hash exists
SELECT passwordHash FROM "user" WHERE email = 'test@example.com';
-- Should contain bcryptjs hash
```

#### 7. Test Resend Invitation
- [ ] Create new user (don't accept invitation)
- [ ] Go to admin users page
- [ ] Click "More" menu for invited user
- [ ] Click "Resend Invitation"
- [ ] New email arrives with new token
- [ ] Old token no longer works
- [ ] New token works

#### 8. Test Expired Token
- [ ] Create user
- [ ] Wait (or manually modify `invitationExpiresAt` to past time)
- [ ] Try to accept invitation with expired token
- [ ] Get error: "Invitation token has expired"
- [ ] Admin can resend

### Test Results Checklist
- [ ] All 8 scenarios pass
- [ ] No unexpected errors
- [ ] Database state is correct
- [ ] Emails contain correct information
- [ ] User status changes from "invited" → "active"

## Step 5: Security Audit

### Password Security
- [ ] Password hashing uses bcryptjs (check lib/password.ts)
- [ ] Hash rounds set to 12
- [ ] Verify password uses bcrypt.compare()
- [ ] No plain passwords stored

### Token Security
- [ ] generateSecureToken() uses randomBytes
- [ ] Token length is 64 characters (256 bits)
- [ ] Token is unique in database
- [ ] Token expires in 24 hours
- [ ] Token cleared after one use

### Email Security
- [ ] Email contains no sensitive data (password, token shown in URL instead)
- [ ] Email templates escaped to prevent XSS
- [ ] From address is legitimate
- [ ] Links use HTTPS (check baseURL)

### API Security
- [ ] POST /api/users requires `users.create` permission
- [ ] POST /api/users/set-password does NOT require auth (invitation is auth)
- [ ] POST /api/users/resend-invitation requires `users.create` permission
- [ ] All inputs are validated
- [ ] All errors don't leak sensitive info

### Security Audit Checklist
- [ ] No plain passwords logged
- [ ] No tokens logged in full (only prefix if needed)
- [ ] Error messages don't reveal sensitive info
- [ ] Email service credentials in .env.local (not in code)
- [ ] Database has proper constraints
- [ ] All security checks implemented

## Step 6: Deployment

### Pre-Deployment
- [ ] All tests passing
- [ ] Security audit complete
- [ ] Code review approved
- [ ] Email service configured and tested
- [ ] Database migration tested on staging

### Deployment Steps
```bash
# 1. Create feature branch
git checkout -b feature/invitation-system

# 2. Commit all changes
git add .
git commit -m "feat: implement enterprise invitation-based user creation

- Add invitation system with 24-hour token expiry
- Implement password hashing with bcryptjs
- Create set-password endpoint
- Add resend-invitation functionality
- Update admin UI to show invitation status
- Add email service integration (template)

BREAKING: Temporary password flow replaced with invitation flow"

# 3. Push and create PR
git push origin feature/invitation-system

# 4. After approval, merge to main
git checkout main
git pull origin main
git merge --no-ff feature/invitation-system

# 5. Tag release
git tag -a v2.0.0 -m "Invitation-based user creation system"

# 6. Push to production
git push origin main
git push origin --tags

# 7. Deploy
npm run build
# Deploy to production environment
```

### Post-Deployment
- [ ] Monitor error logs for issues
- [ ] Check email delivery logs
- [ ] Verify users can complete invitation flow
- [ ] Monitor database performance (check indexes)

### Deployment Checklist
- [ ] Database migration ran successfully
- [ ] All new files deployed
- [ ] Email service is operational
- [ ] First test user can complete flow
- [ ] No errors in logs
- [ ] Performance is acceptable

## Step 7: Documentation & Training

### Internal Documentation
- [ ] Update API docs
- [ ] Update admin guide
- [ ] Update troubleshooting guide
- [ ] Document password requirements
- [ ] Document token expiry policies

### Training
- [ ] Train admins on new flow
- [ ] Prepare FAQ for users
- [ ] Create video walkthrough
- [ ] Document resend invitation process
- [ ] Create emergency procedures

### Documentation Checklist
- [ ] INVITATION_SYSTEM_MIGRATION.md reviewed
- [ ] All admins trained
- [ ] Help desk has instructions
- [ ] FAQ is available to users
- [ ] Emergency contact list updated

## Step 8: Monitoring & Maintenance

### Set Up Monitoring
```typescript
// Monitor in logs
- Track invitation emails sent
- Track successful password sets
- Track expired tokens
- Track failed authentication attempts
```

### Scheduled Maintenance
```sql
-- Weekly: Check for expired invitations
SELECT COUNT(*) FROM "user" 
WHERE status = 'invited' AND invitationExpiresAt < NOW();

-- Weekly: Check for stale invited users
SELECT email, invitationExpiresAt 
FROM "user" 
WHERE status = 'invited' AND invitationExpiresAt < NOW() - INTERVAL 7 days;

-- Monthly: Check password change audit trail
SELECT COUNT(*), DATE(passwordChangedAt) 
FROM "user" 
WHERE passwordChangedAt IS NOT NULL 
GROUP BY DATE(passwordChangedAt);
```

### Maintenance Checklist
- [ ] Set up automated monitoring
- [ ] Create alert for email delivery failures
- [ ] Create backup procedures
- [ ] Document recovery procedures
- [ ] Test recovery procedures monthly

## Step 9: Gathering Feedback

### User Feedback
- [ ] Collect feedback from test group
- [ ] Monitor support tickets
- [ ] Track completion rates
- [ ] Track failure rates
- [ ] Iterate based on feedback

### Metrics to Track
- [ ] Invitations sent: _____
- [ ] Invitations accepted: _____
- [ ] Invitations failed: _____
- [ ] Average time to acceptance: _____ hours
- [ ] Email delivery rate: _____%

### Feedback Checklist
- [ ] Gathered user feedback
- [ ] Identified pain points
- [ ] Planned iterations
- [ ] Documented lessons learned

## Completion

### Final Verification
- [ ] All checklist items complete
- [ ] System is stable
- [ ] Users are satisfied
- [ ] Docs are up to date
- [ ] Team is trained

### Sign-Off
- [ ] Product Owner: ___________
- [ ] Tech Lead: ___________
- [ ] Security Lead: ___________
- [ ] Date Completed: ___________

---

**Next Steps After Completion:**
1. Monitor system for 1 week
2. Gather user feedback
3. Plan Phase 2 enhancements (bulk import, reminder emails, etc.)
4. Document lessons learned for future migrations
