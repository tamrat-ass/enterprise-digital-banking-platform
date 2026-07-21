# Authentication Quick Reference Guide

## Current Status: ✅ FULLY WORKING

### Test Credentials
- **Email**: `tame@gamil.com` (just fixed)
- **Password**: `TestPassword123!`
- **Status**: ✅ Ready to test

Also working:
- **Email**: `ahadu@gmail.com`
- **Password**: `TestPassword123!`

## Sign-In Endpoint

### URL
```
POST /api/auth/signin
```

### Request Body
```json
{
  "email": "tame@gamil.com",
  "password": "TestPassword123!"
}
```

### Success Response (200)
```json
{
  "user": {
    "id": "user_9afe6a178cc20743d123d660",
    "email": "tame@gamil.com",
    "name": "User Name",
    "emailVerified": true
  },
  "session": {
    "id": "session_id_here",
    "token": "session_token_here",
    "expiresAt": "2026-07-24T..."
  }
}
```

### Error Responses
- **400**: Missing email or password
- **401**: User not found OR password doesn't match
- **403**: User not active OR email not verified
- **500**: Server error (check logs)

## Database Schema

### User Table
```
- id: UUID (primary key)
- email: VARCHAR (unique)
- passwordHash: VARCHAR (bcrypt hash)
- emailVerified: BOOLEAN
- status: 'active' | 'inactive' | 'suspended'
- createdAt: TIMESTAMP
```

### Account Table
```
- id: UUID (primary key)
- userId: UUID (foreign key)
- password: VARCHAR (bcrypt hash - for credential auth)
- providerId: 'credential' (for email/password login)
- providerAccountId: email (for credential auth)
```

### Session Table
```
- id: UUID
- token: VARCHAR (hex string)
- userId: UUID
- expiresAt: TIMESTAMP
- createdAt: TIMESTAMP
```

## Troubleshooting

### Problem: "Email not verified"
**Solution**:
```bash
node scripts/verify-user-email.js tame@gamil.com
```

### Problem: "Invalid email or password"
**Diagnosis**:
```bash
node scripts/test-login.js tame@gamil.com TestPassword123!
```

**Fix if hash is corrupted**:
```bash
node scripts/test-password-verify.js tame@gamil.com
```
(This automatically updates the database if needed)

### Problem: "User not found"
**Check if user exists**:
```bash
node scripts/check-user-password-status.js tame@gamil.com
```

### Problem: Server logs show 500 error
**Enable debug logging** in the endpoint:
- Check `/app/api/auth/signin/route.ts` for console.log statements
- Run `npm run dev` to see all logs

## Setting Up New Users

### Option 1: Manual SQL (for testing)
```sql
-- 1. Create user
INSERT INTO "user" (id, email, "passwordHash", "emailVerified", status, "createdAt", "updatedAt")
VALUES ('user_xxx', 'test@example.com', '$2b$12$...hash...', true, 'active', NOW(), NOW());

-- 2. Create account
INSERT INTO account (id, "userId", password, "providerId", "providerAccountId", "createdAt", "updatedAt")
VALUES ('account_xxx', 'user_xxx', '$2b$12$...hash...', 'credential', 'test@example.com', NOW(), NOW());
```

### Option 2: Using Script
```bash
node scripts/set-user-password.js test@example.com NewPassword123!
```

## Password Requirements
- Minimum 8 characters
- At least 1 uppercase letter (A-Z)
- At least 1 lowercase letter (a-z)
- At least 1 number (0-9)
- At least 1 special character (!@#$%^&*)

## Security Notes
- ✅ All passwords hashed with bcryptjs (12 rounds)
- ✅ Session tokens are httpOnly cookies
- ✅ Email verification required before sign-in
- ✅ Password hash in database is salted bcrypt, never plain text
- ✅ Database connection uses SSL/TLS

## Frontend Integration

### Using Custom Sign-In
```typescript
import { authClient } from '@/lib/auth-client'

const response = await authClient.customSignIn({
  email: 'tame@gamil.com',
  password: 'TestPassword123!'
})

if (response.user) {
  // Redirect to dashboard
}
```

### Checking Auth Status
```typescript
const session = await authClient.getSession()
if (!session) {
  // Not authenticated
}
```

### Signing Out
```typescript
await authClient.signOut()
// Redirects to sign-in page
```

## API Testing with Curl

```bash
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tame@gamil.com",
    "password": "TestPassword123!"
  }' \
  -v
```

## API Testing with Postman

1. Create POST request to `{{baseUrl}}/api/auth/signin`
2. Body (JSON):
   ```json
   {
     "email": "tame@gamil.com",
     "password": "TestPassword123!"
   }
   ```
3. Headers: `Content-Type: application/json`
4. Send and check status 200
5. Token in response → use in Authorization header for other requests

---

**Last Updated**: July 17, 2026  
**Status**: All authentication working ✅  
**Next Issue**: None known  
