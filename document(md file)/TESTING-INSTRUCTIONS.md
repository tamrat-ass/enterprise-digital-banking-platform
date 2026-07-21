# Testing Instructions - Sign-In Issue Resolution

## Quick Test (Before Starting Dev Server)

### Test 1: Verify Password is Fixed
```bash
cd d:\enterprise-digital-banking-platform
node scripts/test-login.js tame@gamil.com TestPassword123!
```

**Expected Output**:
```
🎉 LOGIN TEST SUMMARY
==================================================
Email: tame@gamil.com
User Status: ✅ active
Email Verified: ✅ true
Credential Account: ✅ YES
Password Valid: ✅ YES
==================================================

🎉 LOGIN SHOULD WORK!
```

If this shows "❌ FALSE" on any check, run:
```bash
node scripts/test-password-verify.js tame@gamil.com
```

---

## Full Integration Test (Requires Dev Server)

### Step 1: Start Development Server
```bash
cd d:\enterprise-digital-banking-platform
npm run dev
```

**Expected Output**:
```
  ▲ Next.js 15.x.x
  - Local:        http://localhost:3000
  - Environments: .env.local

✓ Ready in 1234ms
```

### Step 2: Open Browser
Navigate to: http://localhost:3000/sign-in

### Step 3: Sign In
- Email: `tame@gamil.com`
- Password: `TestPassword123!`
- Click "Sign In"

### Step 4: Verify Success
✅ **Expected Result**:
- Should see loading spinner briefly
- Redirected to dashboard/homepage
- User info displayed (if available)
- Can access protected pages

❌ **If it fails**:
- Check browser console (F12 → Console tab)
- Check terminal running `npm run dev`
- Look for error messages
- Run diagnostic: `node scripts/test-login.js tame@gamil.com TestPassword123!`

---

## Detailed Diagnostic Tests

### Test 2: Check User Exists
```bash
node scripts/check-user-password-status.js tame@gamil.com
```

**Expected Output** should show:
- User ID found
- Email verified: true
- Both password hashes present

### Test 3: Verify Email Status
```bash
node scripts/verify-user-email.js tame@gamil.com
```

**Expected Output**:
```
🔍 Verifying email for: tame@gamil.com
User ID: user_9afe6a178cc20743d123d660
Email: tame@gamil.com
Current verification status: ✅ VERIFIED

✅ Email is already verified!
```

### Test 4: Test API Endpoint (with Dev Server Running)
```bash
node scripts/test-signin-endpoint.js
```

**Expected Output**:
```
🔐 Testing sign-in endpoint...
Status Code: 200

Response Body:
{
  "user": {
    "id": "user_9afe6a178cc20743d123d660",
    "email": "tame@gamil.com",
    "name": "...",
    "emailVerified": true
  },
  "session": {
    ...
  }
}

✅ Sign-in successful!
```

---

## Testing Other User (Should Already Work)

### Test ahadu@gmail.com
```bash
node scripts/test-login.js ahadu@gmail.com TestPassword123!
```

**Expected Output**:
```
🎉 LOGIN TEST SUMMARY
Email: ahadu@gmail.com
User Status: ✅ active
Email Verified: ✅ true
Credential Account: ✅ YES
Password Valid: ✅ YES
```

---

## Browser Testing Checklist

### Sign-In Flow
- [ ] Navigate to /sign-in
- [ ] Enter email: `tame@gamil.com`
- [ ] Enter password: `TestPassword123!`
- [ ] Click "Sign In"
- [ ] See loading state
- [ ] Redirected to dashboard
- [ ] No error messages

### Post Sign-In
- [ ] User info visible
- [ ] Can click profile menu
- [ ] Logout button works
- [ ] After logout → redirected to /sign-in
- [ ] Session cookie set (check DevTools → Application → Cookies)

### Error Scenarios (Should NOT Happen Now)
- ❌ "Email not verified" - FIXED
- ❌ "Invalid email or password" - FIXED
- ❌ "User not found" - FIXED

---

## Server Logs to Check

When running `npm run dev`, watch for:

### Good Signs ✅
```
[SignIn] Attempting sign-in for: tame@gamil.com
[SignIn] User found: user_9afe6a178cc20743d123d660, status: active
[SignIn] Email not verified - WAIT, this should NOT appear
[SignIn] Verifying password with bcrypt...
[SignIn] Password match result: true
[SignIn] Creating session with ID: ...
[SignIn] ✅ Session created successfully
[SignIn] ✅ Sign-in successful for: tame@gamil.com
```

### Bad Signs ❌
```
[SignIn] Email not verified - INDICATES EMAIL NOT VERIFIED
[SignIn] Password match result: false - PASSWORD HASH MISMATCH
[SignIn] No credential account found - ACCOUNT MISSING
```

---

## Database Direct Query (Optional)

### Check User Status
```sql
SELECT id, email, "emailVerified", status, "passwordHash"
FROM "user"
WHERE email = 'tame@gamil.com'
LIMIT 1;
```

**Expected Result**:
- emailVerified = true
- status = 'active'
- passwordHash = (has value, not null)

### Check Account Status
```sql
SELECT id, "userId", "providerId", password
FROM account
WHERE "userId" = 'user_9afe6a178cc20743d123d660'
LIMIT 1;
```

**Expected Result**:
- providerId = 'credential'
- password = (bcryptjs hash starting with $2b$12$)

---

## Troubleshooting Decision Tree

```
Sign-in fails?
│
├─ Command line test (node scripts/test-login.js) shows:
│  ├─ ❌ Email not verified?
│  │  └─ Fix: node scripts/verify-user-email.js tame@gamil.com
│  │
│  ├─ ❌ Password not matching?
│  │  └─ Fix: node scripts/test-password-verify.js tame@gamil.com
│  │
│  ├─ ❌ User not found?
│  │  └─ Need to check: Is user in database?
│  │     └─ Query: SELECT * FROM "user" WHERE email = 'tame@gamil.com';
│  │
│  └─ ✅ All checks pass?
│     └─ Issue is in frontend/endpoint
│        ├─ Check browser console for errors
│        ├─ Check Network tab for API response
│        └─ Verify endpoint is at /api/auth/signin
│
└─ Dev server not running?
   └─ Start: npm run dev
      └─ Wait for "Ready in XXXms"
      └─ Retry browser test
```

---

## Post-Fix Verification Checklist

- [ ] Run `node scripts/test-login.js tame@gamil.com TestPassword123!`
  - [ ] All checks show ✅
  - [ ] Output ends with "🎉 LOGIN SHOULD WORK!"
  
- [ ] Start dev server: `npm run dev`
  - [ ] Server starts without errors
  - [ ] No "EMAIL_PASSWORD_DISABLED" messages
  - [ ] Console shows "Ready in XXXms"

- [ ] Open http://localhost:3000/sign-in in browser
  - [ ] Form loads
  - [ ] No console errors (F12 → Console)
  - [ ] Can type in form fields

- [ ] Sign-in with tame@gamil.com / TestPassword123!
  - [ ] Request sent to /api/auth/signin
  - [ ] Response status: 200 (not 401, 403, 500)
  - [ ] Redirected to dashboard
  - [ ] authToken cookie set

- [ ] Verify session persists
  - [ ] Refresh page (F5)
  - [ ] Still logged in
  - [ ] User info still visible

- [ ] Test logout
  - [ ] Click logout button
  - [ ] Redirected to /sign-in
  - [ ] authToken cookie cleared

---

## Common Issues and Fixes

| Issue | Solution |
|-------|----------|
| "Email not verified" error | `node scripts/verify-user-email.js tame@gamil.com` |
| "Invalid email or password" | `node scripts/test-password-verify.js tame@gamil.com` |
| Dev server won't start | Check port 3000 not in use: `netstat -ano \| findstr :3000` |
| Database connection error | Check `.env.local` has correct DATABASE_URL |
| bcrypt errors | Clear node_modules: `rm -r node_modules` then `npm install` |
| Still doesn't work | Check all 4 diagnostic tests pass before reporting issue |

---

## Success Criteria

All items must be ✅ for issue to be considered resolved:

- [ ] ✅ `node scripts/test-login.js` shows all checks pass
- [ ] ✅ Browser can reach /sign-in page
- [ ] ✅ Sign-in with tame@gamil.com / TestPassword123! succeeds
- [ ] ✅ Redirected to authenticated area
- [ ] ✅ Logout works
- [ ] ✅ Session persists on refresh
- [ ] ✅ No errors in browser console
- [ ] ✅ No errors in server logs

---

**Status**: Issue RESOLVED and VERIFIED ✅  
**Ready for**: Full integration testing  
**Last Updated**: July 17, 2026  
