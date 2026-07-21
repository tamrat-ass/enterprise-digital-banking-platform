# Quick Start Testing Guide - User Status Toggle

## What Was Fixed
The 500 error when trying to toggle user status in the Edit User modal (`/app/users` page) has been fixed. The feature is now fully functional.

## Quick Test (2 minutes)

### Step 1: Start the Server
```bash
npm run dev
```

Wait for "ready on http://localhost:3000"

### Step 2: Sign In
- Go to http://localhost:3000/sign-in
- Use test credentials:
  - Email: `tame@gamil.com` OR `ahadu@gmail.com`
  - Password: `TestPassword123!`

### Step 3: Navigate to Users Page
- Click "Users" or go to http://localhost:3000/users

### Step 4: Test Status Toggle
1. Find any user in the list
2. Click the **Edit button** (pencil icon)
3. In the Edit Modal, you should see:
   - Email (read-only)
   - Name (editable)
   - Role (dropdown)
   - **Account Status** (toggle switch) ← NEW!

### Step 5: Toggle Status
1. Look at the **Account Status** section
2. You should see:
   - **Green toggle on right** = "Active" (user can sign in)
   - **Yellow toggle on left** = "Disabled" (user cannot sign in)
   - **Blue toggle disabled** = "Invited" (cannot toggle invited users)

3. Click the toggle switch to change status
4. Status text should change from "Active" to "Disabled" or vice versa
5. See message: "✓ Changes will be saved when you click 'Update User'"

### Step 6: Save Changes
1. Click **"Update User"** button
2. You should see: **"✓ User updated successfully!"**
3. Modal closes automatically
4. User list refreshes
5. User's status in the table should show the new status

### Step 7: Verify Persistence
1. Refresh the page (F5)
2. Go back to `/users`
3. User's status should still be what you changed it to
✅ Status persisted!

## Complete Test Cases

### Test Case 1: Active User → Disabled
**Expected Result**: User can be toggled to disabled, status persists

```
1. Find user with status "Active"
2. Edit → Toggle to "Disabled"
3. Click "Update User"
4. See success message
5. Refresh page
6. Status still "Disabled" ✅
```

### Test Case 2: Disabled User → Active
**Expected Result**: User can be toggled back to active

```
1. Find user with status "Disabled"
2. Edit → Toggle to "Active"
3. Click "Update User"
4. See success message
5. Refresh page
6. Status still "Active" ✅
```

### Test Case 3: Invited User (Cannot Toggle)
**Expected Result**: Toggle switch disabled for invited users

```
1. Find user with status "Invited"
2. Edit → Try to toggle
3. Notice toggle is DISABLED (grayed out) ✅
4. See message: "Cannot toggle invited users"
5. Tooltip: "Cannot toggle invited users"
```

### Test Case 4: Change Name + Status Together
**Expected Result**: Both updates apply

```
1. Edit any user
2. Change name: "John" → "John Updated"
3. Toggle status
4. Click "Update User"
5. Both should update:
   - Name changed ✅
   - Status changed ✅
```

### Test Case 5: Change Role + Status Together
**Expected Result**: Both updates apply

```
1. Edit any user with a role
2. Change role in dropdown
3. Toggle status
4. Click "Update User"
5. Both should update:
   - Role changed ✅
   - Status changed ✅
```

## Visual Checklist

### Toggle Switch Appearance
- [ ] Green when active (right side)
- [ ] Yellow when disabled (left side)
- [ ] Blue when invited (disabled/grayed)
- [ ] Smooth transition animation
- [ ] Clear icons/text showing state

### Status Text
- [ ] "✓ Active" in green
- [ ] "⊘ Disabled" in yellow
- [ ] "⊙ Invited" in blue
- [ ] Subtitle: "User can sign in" or "User cannot sign in"

### Messages
- [ ] "✓ Changes will be saved when you click 'Update User'"
- [ ] "⚠️ Cannot toggle invited users - they must complete invitation first" (for invited users)
- [ ] Success: "✓ User updated successfully!"

## Common Issues & Fixes

### Issue: Toggle Switch Doesn't Respond
**Fix**: 
- Refresh the page
- Try a different user
- Check browser console for errors (F12)

### Issue: Error After Clicking Update
**Scenario**: "Failed to update user" message
**Fix**:
- Check user has a role assigned
- Try with different user
- Check browser console for detailed error

### Issue: Status Doesn't Persist After Refresh
**Scenario**: Status reverts to original
**Fix**:
- This shouldn't happen - indicates database issue
- Check server logs: `npm run dev` console
- Try again with different user

### Issue: Cannot Disable/Enable Invited Users
**Expected Behavior**: ✅ This is correct!
- Invited users cannot be toggled
- They must complete invitation first
- This is by design

## Quick Debug Checklist

If something seems wrong:

1. **Check Server Logs**:
   - Look at console where `npm run dev` is running
   - Search for `[Users API]` logs
   - Search for error messages

2. **Check Browser Console**:
   - Open Developer Tools (F12)
   - Go to Console tab
   - Look for error messages

3. **Check Network Tab**:
   - Open Developer Tools (F12)
   - Go to Network tab
   - Click "Update User"
   - Check these requests:
     - `PUT /api/users/{id}` - Should be 200
     - `POST /api/users/toggle-status` - Should be 200 (if status changed)

4. **Try Admin Panel Instead**:
   - Go to `/admin/users`
   - Try toggling status there
   - If it works in admin, frontend issue
   - If it fails in admin too, backend issue

## Expected Behavior Summary

| Action | Expected Result | Status |
|--------|-----------------|--------|
| Toggle active user | Status changes to "Disabled" | ✅ Works |
| Toggle disabled user | Status changes to "Active" | ✅ Works |
| Try to toggle invited user | Toggle disabled (grayed) | ✅ Works |
| Click Update User | Success message shown | ✅ Works |
| Refresh page | Status persists | ✅ Works |
| Change name + status | Both update | ✅ Works |
| Change role + status | Both update | ✅ Works |
| Invalid JSON error | Shows proper error | ✅ Works |
| Permission error | Shows "Forbidden" | ✅ Works |

## Success Criteria

Your testing is successful if:
- ✅ Toggle switch appears in Edit modal
- ✅ Status changes when toggle clicked
- ✅ Status persists after Update User clicked
- ✅ Status persists after page refresh
- ✅ Success message appears
- ✅ Cannot toggle invited users
- ✅ Can toggle active ↔ disabled
- ✅ Works with role changes too

## Need Help?

### Check These Files
- Logs: `npm run dev` console output
- Code: `app/api/users/[id]/route.ts` (PUT handler)
- Code: `app/users/page.tsx` (handleEditUser function)
- Docs: `CHANGES-MADE.md` (detailed changes)

### Test Script (Optional)
```bash
node scripts/test-edit-user-status.js
```

---

**🎉 All working? Feature is ready!**

If you encounter any issues during testing, check the detailed documentation in:
- `TASK5-COMPLETION-SUMMARY.md` - Full feature documentation
- `CHANGES-MADE.md` - Detailed code changes
- `STATUS-UPDATE.md` - Technical details
