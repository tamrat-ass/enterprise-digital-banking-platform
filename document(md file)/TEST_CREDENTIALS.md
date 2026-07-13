# Test Credentials & Sign In

## How to Create an Account

The system uses **Better Auth** with no pre-built demo accounts. You need to create one:

### Option 1: Create a New Account (RECOMMENDED)

1. Go to: `http://localhost:3000/sign-up`
2. Fill in the form:
   - **Full Name**: Your name (e.g., "John Smith")
   - **Email**: Any email (e.g., "john@example.com")
   - **Password**: Any password (minimum 8 characters)
   - **Job Title**: Your role (e.g., "Finance Manager")
   - **Role**: Select a role (e.g., "Staff Member", "Compliance Officer")
   - **Department**: Select a department
3. Click "Create account"
4. You'll be logged in automatically ✅

### Option 2: Sign In (If You Already Have an Account)

1. Go to: `http://localhost:3000/sign-in`
2. Enter your email and password
3. Click "Sign in"

---

## Important Notes

### First Account = Super Administrator
The **first account created** automatically becomes the **Super Administrator** with all permissions.

This means:
- First account has access to everything
- Can manage users, roles, permissions
- Can create departments, divisions, categories
- Full admin access

### Suggested Test Account

For testing, you can create:

**Email**: `admin@ahadufile.com`  
**Password**: `TestPassword123`  
**Name**: `Admin User`  
**Role**: `Executive`  
**Department**: Select any

Or use:

**Email**: `test@example.com`  
**Password**: `Test12345`  
**Name**: `Test User`  
**Role**: `Staff Member`  
**Department**: Select any

---

## After Sign Up

Once you create an account:
1. ✅ You'll be automatically logged in
2. ✅ Redirected to dashboard
3. ✅ Can access all features:
   - Upload documents
   - View file management
   - Upload with category/department/division
   - Preview and download files

---

## If You Forget Credentials

Since this is development:
1. You can always create a new account
2. Or check the database directly (PostgreSQL at localhost:5432)
3. Database: `ahadufile`
4. User: `postgres`
5. Password: `4840`

---

## Testing the Upload Feature

After signing in:

1. Go to: `http://localhost:3000/upload`
2. Upload a test file
3. Check all features work:
   - ✅ File uploads
   - ✅ File path saves to database
   - ✅ Preview works
   - ✅ Download works

---

## URL Reference

| Page | URL |
|------|-----|
| Sign In | `http://localhost:3000/sign-in` |
| Sign Up | `http://localhost:3000/sign-up` |
| Dashboard | `http://localhost:3000/` |
| Upload | `http://localhost:3000/upload` |
| File Management | `http://localhost:3000/file-management` |

---

**No demo credentials exist. Create your own account to test!** 🚀

