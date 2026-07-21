# Reset Password Feature - Admin Users Page

## Overview

A new "Reset Password" button has been added to the user management interface, allowing administrators to send password reset invitations to users.

## Feature Details

### Location
- **Page**: Admin Users Management (`app/admin/users/page.tsx`)
- **Position**: Action menu (three-dot menu) for each user in the user list

### How It Works

1. **Admin Action**: Click the three-dot menu (⋮) next to any user
2. **Options**: Select "Reset Password" from the dropdown menu
3. **Confirmation**: A confirmation dialog appears asking if you want to send a reset invitation
4. **Email Sent**: An invitation email is sent to the user with a password reset link
5. **Link Validity**: The reset link is valid for 24 hours
6. **User Action**: User receives an email and clicks the link to set a new password

### UI Components

#### Reset Password Button
- **Icon**: Key icon (KeyRound from lucide-react)
- **Color**: Blue text (`text-blue-700`)
- **State**: Disabled while sending
- **Location**: In the three-dot action menu between "View Details" and "Remove User"

#### Success Message
- **Type**: Green success notification
- **Message**: "✓ Password reset invitation sent to [email]!"
- **Duration**: Appears for 3 seconds

#### Confirmation Dialog
- **Text**: "Are you sure you want to send a password reset invitation to [email]?"
- **Action**: Requires user confirmation before sending

### API Endpoint

**Route**: `/api/users/send-password-reset`
**Method**: `POST`
**Authentication**: Required (session-based)

#### Request Body
```json
{
  "userId": "string",
  "email": "string"
}
```

#### Response Success (200)
```json
{
  "success": true,
  "message": "Password reset invitation sent successfully",
  "email": "user@example.com"
}
```

#### Response Errors
- **401**: Unauthorized (not logged in)
- **400**: Missing userId or email
- **404**: User not found
- **500**: Server error

### Email Notification

The password reset email includes:
- **Subject**: "Reset Your Password - Enterprise Banking Platform"
- **Content**:
  - Personalized greeting
  - Explanation of the password reset request
  - Clickable reset button
  - Link validity (24 hours)
  - Security notice
  - Alternative link copy-paste option

### Email Styling

The email uses the same professional design as the invitation emails:
- Blue gradient header
- Light gray background
- Security warning box (yellow)
- Responsive layout
- Safe HTML with escaped content

## Implementation Details

### Files Modified
1. **app/admin/users/page.tsx**
   - Added `KeyRound` icon import
   - Added `resettingPasswordUserId` state for tracking
   - Added `handleResetPassword()` function
   - Updated action menu with Reset Password button

### Files Created
1. **app/api/users/send-password-reset/route.ts**
   - New POST endpoint for password reset invitations
   - Creates/updates invitation record in database
   - Sends password reset email
   - Returns success response

### Dependencies
- `nodemailer` - For email sending (configured in `.env.local`)
- `crypto` - For generating secure invitation tokens
- `drizzle-orm` - For database operations

### Environment Variables Required
```
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM_EMAIL=
NEXT_PUBLIC_APP_URL=
```

## Security Considerations

1. **Authentication**: Only authenticated users can send reset invitations
2. **Token Generation**: Uses cryptographically secure random tokens (32 bytes)
3. **Expiration**: Reset links expire after 24 hours
4. **Confirmation**: Admin must confirm action before email is sent
5. **Email Verification**: Reset link is unique and single-use
6. **Audit Trail**: Email sent confirmation provides feedback to admin

## User Experience Flow

```
Admin Dashboard
      ↓
User Management Page
      ↓
Click user's action menu (⋮)
      ↓
Select "Reset Password"
      ↓
Confirm dialog appears
      ↓
Click "OK" to confirm
      ↓
Success message displays
      ↓
Email sent to user
      ↓
User receives "Reset Password" email
      ↓
User clicks link
      ↓
Sets new password
      ↓
Account reactivated
```

## Testing the Feature

### Prerequisites
- SMTP credentials configured in `.env.local`
- Test email account with sending capability

### Test Steps
1. Navigate to Admin > Users Management
2. Locate a test user in the list
3. Click the three-dot menu for that user
4. Select "Reset Password"
5. Confirm the action
6. Verify success message appears
7. Check email inbox for reset invitation
8. Click the link in the email
9. Set a new password
10. Verify user can log in with new password

### Manual Testing Commands
```bash
# Test the API endpoint directly
curl -X POST http://localhost:3000/api/users/send-password-reset \
  -H "Content-Type: application/json" \
  -b "session=..." \
  -d '{
    "userId": "user-id",
    "email": "user@example.com"
  }'
```

## Future Enhancements

Possible improvements for future versions:
- [ ] Bulk password reset for multiple users
- [ ] Password reset expiration customization
- [ ] Password reset history/audit log
- [ ] Custom email templates
- [ ] SMS backup notification option
- [ ] Force password change on next login
- [ ] Two-factor authentication reset

## Troubleshooting

### Email Not Sending
1. Check SMTP credentials in `.env.local`
2. Verify SMTP server is accessible
3. Check email spam/junk folder
4. Review server logs for error details
5. Test with `app/api/admin/test-email` endpoint

### Link Not Working
1. Verify `NEXT_PUBLIC_APP_URL` is set correctly
2. Check token hasn't expired (24-hour limit)
3. Ensure invitation record exists in database
4. Test with fresh invitation

### User Already Active
- User can request another reset anytime
- Multiple reset requests create new tokens
- Previous tokens are replaced with new ones

## Related Features
- User Management
- Invitation System
- Password Security
- Email Service
- RBAC (Role-Based Access Control)

---

For questions or issues, contact the development team or refer to the application's main documentation.
