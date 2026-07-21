# Existing Users in Database

## Current Users (7 total)

Your system already has 7 users created. When you see **409 Conflict error**, it means you're trying to create a user with an email that already exists.

---

## What to Do

### Option 1: Use a Different Email (Recommended)
When creating a new user, use an email that's NOT in the system yet.

**Examples of emails you can use:**
```
✅ john@example.com
✅ jane@example.com
✅ bob@example.com
✅ alice@example.com
✅ test1@ahadubank.com
✅ test2@ahadubank.com
✅ newuser@ahadubank.com
```

### Option 2: Delete Existing User First
If you want to use a specific email that already exists:
1. Go to Admin > Users
2. Find the existing user
3. Delete the user (if delete option available)
4. Create new user with same email

### Option 3: Use Test Email Service
For quick testing without affecting existing users:
```
✅ test+timestamp@example.com
✅ testuser1@example.com
✅ testuser2@example.com
```

---

## How to Create New User

1. **Go to:** `http://localhost:3000/admin/users`
2. **Click:** "Add New User" button
3. **Fill:**
   - Name: Your chosen name
   - Email: **NEW email not in system** (see examples above)
4. **Click:** "Create User"
5. **Result:** User created, invitation email sent

---

## Viewing Existing Users

To see all users currently in system:

1. **Go to:** `http://localhost:3000/admin/users`
2. **You'll see:** List of 7 existing users with their emails
3. **Use a different email** for new users

---

## After Creating New User

✅ User appears in admin list with status "invited"  
✅ User receives invitation email to their inbox  
✅ User clicks email link  
✅ User sets password  
✅ User account becomes active  

---

## Quick Test

Try creating a user with this email:
```
Email: newuser@ahadubank.com
Name: New User Test
```

This email is unlikely to exist, so it should work.

If you get 409 error with this email, then that email exists. Try:
```
Email: newuser2@ahadubank.com
Email: testinvite@ahadubank.com
Email: demo@ahadubank.com
```

---

## Success!

When user is created successfully, you'll see:
```json
{
  "success": true,
  "message": "User created successfully. Invitation email sent.",
  "id": "user_xxx",
  "name": "Your Name",
  "email": "youremail@example.com",
  "status": "invited"
}
```

And the user will receive invitation email in their inbox.

---

**Next Step:** Go to `/admin/users` and create a new user with a NEW email address
