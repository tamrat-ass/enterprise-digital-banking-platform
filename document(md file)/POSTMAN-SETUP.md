# Postman Setup Guide - Enterprise Digital Banking Platform

## Quick Start

### 1. Import the Collection
1. Open Postman
2. Click **Import** (top left)
3. Select `Postman-Collection-Fixed.json` from this directory
4. Click **Import**

### 2. Set Environment Variables
The collection includes built-in variables that auto-populate:

**Variables in collection:**
- `baseUrl` = `http://localhost:3000` (change for production)
- `authToken` = Set automatically after sign-in
- `userId` = Set automatically after sign-in

**To manually set baseUrl (if needed):**
1. Click the environment dropdown (top right)
2. Select or create an environment
3. Add these variables:
   - Key: `baseUrl`, Value: `http://localhost:3000`
   - Key: `authToken`, Value: (leave empty, auto-populated)
   - Key: `userId`, Value: (leave empty, auto-populated)

### 3. Sign In First
1. Go to **Authentication > Sign In (Custom - WORKING)**
2. Click **Send**
3. ✅ If successful (200 OK):
   - `authToken` and `userId` are auto-saved to variables
   - You can now use other endpoints

### 4. Use Other Endpoints
All endpoints that require authentication use the `authToken` variable automatically.

---

## API Endpoints

### Authentication
- **Sign In** - `POST /api/auth/signin` ✅ WORKING
  - Body: `{ "email": "ahadu@gmail.com", "password": "TestPassword123!" }`
  - Returns: User data + session token

### User Management
- **Get All Users** - `GET /api/users`
- **Get User by ID** - `GET /api/users/{{userId}}`
- **Reset Password** - `POST /api/users/reset-password`
  - Body: `{ "userId": "{{userId}}", "password": "NewPassword123!" }`

### RBAC
- **Get All Roles** - `GET /api/rbac/roles`
- **Create Role** - `POST /api/rbac/roles`
- **Get All Permissions** - `GET /api/rbac/permissions`

### Documents
- **Get All Documents** - `GET /api/documents`
- **Get Document by ID** - `GET /api/documents/{{documentId}}`

---

## Troubleshooting

### Problem: `baseUrl` is undefined
**Solution:** Make sure you've set the `baseUrl` variable in your environment or collection.

### Problem: 500 error on Sign In
**Solution:** Make sure you're using `/api/auth/signin` (NOT `/api/auth/sign-in/email`)

### Problem: "authToken not found" on protected endpoints
**Solution:** 
1. Run the **Sign In** request first
2. Check that the response is 200 OK
3. Verify `authToken` variable is populated (check collection variables)

### Problem: Cookies not being sent
**Solution:** Some Postman versions require explicit cookie headers:
- Add header: `Cookie: authToken={{authToken}}`
- (This is already done in the collection)

---

## Test Credentials
- **Email**: `ahadu@gmail.com`
- **Password**: `TestPassword123!`

---

## Development vs Production

### Local Development
```
baseUrl: http://localhost:3000
```

### Production
```
baseUrl: https://your-api-domain.com
```

Change the `baseUrl` variable in your Postman environment to switch between environments.

---

## Notes

✅ **Working Custom Authentication**
- The broken Better Auth endpoint (`/api/auth/sign-in/email`) has been replaced
- New endpoint: `/api/auth/signin` - fully functional
- Automatically manages sessions and cookies
- Token is saved to `authToken` variable after sign-in

✅ **Auto-Token Capture**
- The "Sign In" request has a test script that automatically saves the token
- No need to manually copy-paste tokens

✅ **Cookie Handling**
- Postman sends cookies with `Cookie` header
- Session tokens are httpOnly (secure)
- All authenticated endpoints use the `authToken` variable
