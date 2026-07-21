# Invitation System API Reference

## Quick Reference Guide

### 1. Create User (Admin)
**Endpoint:** `POST /api/users`  
**Permission Required:** `users.create`  
**Authentication:** Required

Creates a new user with invitation status.

#### Request
```json
{
  "name": "John Doe",
  "email": "john@example.com"
}
```

#### Response (201 Created)
```json
{
  "success": true,
  "data": {
    "id": "user_abc123...",
    "name": "John Doe",
    "email": "john@example.com",
    "status": "invited",
    "message": "User created successfully. Invitation email sent."
  }
}
```

#### Error Response (409 Conflict)
```json
{
  "success": false,
  "error": "User with this email already exists"
}
```

#### Error Response (400 Bad Request)
```json
{
  "success": false,
  "error": "Password does not meet security requirements: ..."
}
```

---

### 2. Accept Invitation (Public)
**URL:** `/accept-invitation?token=xxx`  
**Method:** GET  
**Authentication:** Not required  

Frontend page for users to set their password.

#### Page Features
- Password strength validation (real-time)
- Password confirmation
- All requirements listed
- Success screen with redirect

#### JavaScript Usage (from frontend)
```typescript
// User submits password
const response = await fetch('/api/users/set-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    invitationToken: 'token_from_url',
    password: 'SecurePass123!',
  }),
})
```

---

### 3. Set Password
**Endpoint:** `POST /api/users/set-password`  
**Authentication:** Not required (token is auth)  
**Rate Limiting:** Recommended 5 attempts per 15 minutes

Called after user clicks invitation link.

#### Request
```json
{
  "invitationToken": "a1b2c3d4e5f6...",
  "password": "SecurePass123!"
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "id": "user_abc123...",
    "email": "john@example.com",
    "name": "John Doe",
    "status": "active",
    "message": "Password set successfully. Your account is now active."
  }
}
```

#### Error Response (401 Unauthorized)
```json
{
  "success": false,
  "error": "Invalid or expired invitation token"
}
```

#### Error Response (400 Bad Request)
```json
{
  "success": false,
  "error": "Password does not meet security requirements: At least one uppercase letter; One special character"
}
```

#### Password Requirements
- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (!@#$%^&*...)
- No 3+ repeated characters (aaa, 111)
- No sequential characters (abc, 123)

---

### 4. Resend Invitation (Admin)
**Endpoint:** `POST /api/users/resend-invitation`  
**Permission Required:** `users.create`  
**Authentication:** Required  

Generates a new invitation token and sends email.

#### Request
```json
{
  "userId": "user_abc123..."
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "email": "john@example.com",
    "name": "John Doe",
    "message": "Invitation email sent successfully"
  }
}
```

#### Error Response (400 Bad Request)
```json
{
  "success": false,
  "error": "Cannot resend invitation to user with status \"active\". Only invited users can receive invitations."
}
```

#### Error Response (404 Not Found)
```json
{
  "success": false,
  "error": "User not found"
}
```

---

### 5. Get Users List (Admin)
**Endpoint:** `GET /api/users`  
**Permission Required:** `users.view`  
**Authentication:** Required  

Get all users with their roles and invitation status.

#### Response (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": "user_abc123...",
      "name": "John Doe",
      "email": "john@example.com",
      "status": "active",
      "roles": [
        {
          "id": "user_role_123",
          "roleId": "role_admin",
          "roleName": "System Admin"
        }
      ]
    },
    {
      "id": "user_def456...",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "status": "invited",
      "roles": []
    }
  ]
}
```

---

## User Status Flow

```
                    ┌─────────────────────┐
                    │   Create User       │
                    └──────────┬──────────┘
                               │
                        (status: invited)
                               │
                    ┌──────────▼──────────┐
                    │   Send Email        │
                    │  (invitationToken)  │
                    └──────────┬──────────┘
                               │
                        (24 hour window)
                               │
                        ┌──────▼──────┐
                        │  Resend?    │
                   ┌────┤  (expires)  ├────┐
                   │    └─────────────┘    │
                   │                        │
        ┌──────────▼─────────┐  ┌──────────▼──────────┐
        │ Click Link (valid)  │  │ Click Link (expired)│
        │ (Before 24h)        │  │ (After 24h)        │
        └──────────┬─────────┘  └──────────┬──────────┘
                   │                        │
        ┌──────────▼──────────────────────┐ │
        │ Accept Invitation Page          │ │
        │ (Set Password)                  │ │
        └──────────┬─────────────────────┘ │
                   │                        │
        ┌──────────▼──────────────────────┐ │
        │ POST /set-password              │ │
        │ (Validate & Hash Password)      │ │
        └──────────┬─────────────────────┘ │
                   │                        │
        ┌──────────▼──────────────────────┐ │
        │ User Status = "active"          │ │
        │ (Account Ready)                 │ │
        └─────────────────────────────────┘ │
                                             │
                        ┌────────────────────┘
                        │
                  ┌─────▼──────┐
                  │ Resend or   │
                  │ Create New  │
                  │ Invitation  │
                  └─────┬──────┘
                        │
              (back to "Send Email")
```

---

## Error Codes

| Code | Meaning | When |
|------|---------|------|
| 400 | Bad Request | Invalid input, failed validation |
| 401 | Unauthorized | Invalid/expired token, no permission |
| 404 | Not Found | User not found |
| 409 | Conflict | User already exists |
| 500 | Server Error | Email service down, DB error |

---

## Email Templates

### Invitation Email
- **Subject:** "Welcome to Enterprise Banking Platform - Complete Your Setup"
- **Contains:** User name, activation link, 24-hour expiry warning
- **Link:** `{baseUrl}/accept-invitation?token={invitationToken}`
- **Plain text** + **HTML** versions

### What NOT to Include
- ❌ Password (user sets it themselves)
- ❌ Temporary codes
- ❌ Admin instructions
- ❌ Sensitive data

---

## Database Queries

### Find Invited Users
```sql
SELECT id, name, email, invitationExpiresAt 
FROM "user" 
WHERE status = 'invited' 
ORDER BY createdAt DESC;
```

### Find Expired Invitations
```sql
SELECT id, name, email, invitationExpiresAt 
FROM "user" 
WHERE status = 'invited' AND invitationExpiresAt < NOW();
```

### Find Active Users
```sql
SELECT id, name, email, passwordChangedAt 
FROM "user" 
WHERE status = 'active' 
ORDER BY name;
```

### Find Disabled Users
```sql
SELECT id, name, email 
FROM "user" 
WHERE status = 'disabled';
```

### Check User Status
```sql
SELECT id, email, status, passwordHash, invitationExpiresAt 
FROM "user" 
WHERE email = 'user@example.com';
```

---

## Token Format

### Invitation Token
- **Type:** Cryptographic secure random
- **Length:** 64 characters (256 bits)
- **Format:** Hex string (0-9, a-f)
- **Example:** `a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b`
- **Uniqueness:** Unique in database (can't reuse)
- **One-time Use:** Cleared after successful password set

### Password Hash
- **Algorithm:** bcryptjs with 12 rounds
- **Format:** bcryptjs standard format
- **Example:** `$2b$12$abcdefg.hijklmnopqrstu.vwxyz...`
- **Verification:** Use `bcrypt.compare(plainPassword, hash)`

---

## Integration Examples

### Create User (TypeScript)
```typescript
async function createUser(name: string, email: string) {
  const response = await fetch('/api/users', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email }),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error)
  }
  
  return response.json()
}

// Usage
const result = await createUser('John Doe', 'john@example.com')
console.log('User created:', result.data.id)
```

### Set Password (TypeScript)
```typescript
async function setPassword(token: string, password: string) {
  const response = await fetch('/api/users/set-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ invitationToken: token, password }),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error)
  }
  
  return response.json()
}

// Usage
const result = await setPassword(token, 'SecurePass123!')
console.log('Account activated:', result.data.status)
```

### Resend Invitation (TypeScript)
```typescript
async function resendInvitation(userId: string) {
  const response = await fetch('/api/users/resend-invitation', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error)
  }
  
  return response.json()
}

// Usage
const result = await resendInvitation('user_abc123')
console.log('Email sent to:', result.data.email)
```

---

## Testing Checklist

- [ ] Create user with valid data
- [ ] Create user with duplicate email (409 error)
- [ ] Create user with invalid email format (400 error)
- [ ] Accept invitation with valid token (before 24h)
- [ ] Accept invitation with expired token (401 error)
- [ ] Set weak password (400 error with requirements)
- [ ] Set strong password (success)
- [ ] Resend invitation to invited user
- [ ] Resend invitation to active user (400 error)
- [ ] Verify user status changes from "invited" to "active"
- [ ] Verify password can be verified after set

---

## Performance Notes

### Database Indexes
- `idx_user_invitationToken` - O(1) lookup for token validation
- `idx_user_passwordResetToken` - O(1) lookup for password resets
- `idx_user_status` - O(1) filtering by status
- `idx_user_passwordChangedAt` - Ordered queries on password history

### Query Performance
- Single user lookup: ~1ms
- All users with roles: ~10-50ms (depending on role count)
- Email sending: ~100-500ms (varies by provider)
- Password hashing: ~100ms (bcryptjs 12 rounds by design)

### Optimization Tips
- Batch user creation if needed (create roles separately)
- Consider async email queue for bulk invitations
- Monitor token lookup performance
- Cache user lists if accessed frequently

---

## Troubleshooting

### Email Not Received
1. Check email service credentials in .env.local
2. Verify FROM email address is correct
3. Check email provider's sending logs
4. Test with known good email
5. Use resend-invitation endpoint to retry

### Token Expired
1. User must request admin to resend invitation
2. Admin uses POST /api/users/resend-invitation
3. New token is generated (old token is still valid but old)
4. User receives new email with new token

### Password Validation Fails
1. Check all 5 requirements are met
2. No 3+ repeated characters (aaa)
3. No sequential characters (abc)
4. Try different special character

### User Stuck in "Invited"
1. Check invitationExpiresAt in database
2. If expired, admin must resend
3. Or delete invitation token and recreate user

---

**For more information, see:**
- `docs/INVITATION_SYSTEM_MIGRATION.md` - Full architecture
- `docs/IMPLEMENTATION_CHECKLIST.md` - Step-by-step guide
- `lib/email.ts` - Email service code
- `lib/password.ts` - Password utilities
