# System Architecture Diagrams

## User Invitation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    INVITATION FLOW DIAGRAM                       │
└─────────────────────────────────────────────────────────────────┘

1. ADMIN CREATES USER
   ┌──────────────────────┐
   │  Admin Portal        │
   │  /admin/users        │
   │                      │
   │  "Add User" Button   │
   └──────────┬───────────┘
              │
              ▼
   ┌──────────────────────┐
   │  Send Form:          │
   │  - email             │
   │  - name              │
   │  - roles             │
   └──────────┬───────────┘
              │
              ▼
   POST /api/users
              │
              ▼
   ┌──────────────────────────────────────────┐
   │  2. CREATE USER IN DATABASE              │
   │  ────────────────────────────────────    │
   │  CREATE user:                            │
   │    - id                                  │
   │    - email                               │
   │    - name                                │
   │    - status: "invitation_sent"           │
   │    - invitationToken: <random>           │
   │    - invitationSentAt: now()             │
   └──────────┬───────────────────────────────┘
              │
              ▼
   ┌──────────────────────────────────────────┐
   │  3. SEND INVITATION EMAIL                │
   │  ────────────────────────────────────    │
   │  lib/email.ts → sendInvitationEmail()    │
   └──────────┬───────────────────────────────┘
              │
              ├─────────────────────┐
              │                     │
              ▼                     ▼
   ┌──────────────────┐  ┌──────────────────┐
   │ SendGrid API     │  │ Console Fallback │
   │ (configured)     │  │ (if error)       │
   │                  │  │                  │
   │ Attempt send     │  │ Log email to     │
   │ email to user    │  │ server console   │
   └────────┬─────────┘  └────────┬─────────┘
            │                      │
            ├──────────────────────┤
            ▼
   ┌──────────────────────────────────┐
   │  Email Sent (or logged)          │
   │  ────────────────────────────    │
   │  Link: /accept-invitation?token= │
   │  Expires: 24 hours               │
   └──────────┬──────────────────────┘
              │
              ▼
   ┌──────────────────────────────────┐
   │  Admin Sees Success Message      │
   │  ────────────────────────────    │
   │  "User invited successfully"     │
   │  Invitation link: [link]         │
   └──────────────────────────────────┘


2. USER ACCEPTS INVITATION
   ┌────────────────────────────────┐
   │  User Receives Email            │
   │  (or clicks link from console)  │
   │                                 │
   │  Opens: /accept-invitation      │
   │  With: ?token=...               │
   └──────────┬─────────────────────┘
              │
              ▼
   ┌────────────────────────────────┐
   │  Accept Invitation Page         │
   │  ────────────────────────────  │
   │  - Validates token              │
   │  - Checks expiration            │
   │  - Shows password form          │
   └──────────┬─────────────────────┘
              │
              ▼
   ┌────────────────────────────────┐
   │  User Sets Password             │
   │  Requirements:                  │
   │  - 8+ characters                │
   │  - Uppercase letter             │
   │  - Lowercase letter             │
   │  - Number                       │
   │  - Special character            │
   └──────────┬─────────────────────┘
              │
              ▼
   POST /api/users/set-password
              │
              ├─────────────────────────────────┐
              │                                 │
              ▼                                 ▼
   ┌──────────────────────────┐  ┌──────────────────────────┐
   │ Validate Token           │  │ Validation Errors        │
   │ - Must be valid          │  │ - Invalid token          │
   │ - Must not be expired    │  │ - Expired token          │
   │ - Must not be used       │  │ - Password too weak      │
   └──────────┬───────────────┘  └──────────────────────────┘
              │                           │
              ├───────────────────────────┤
              ▼
   ┌──────────────────────────┐
   │ Hash Password            │
   │ ─────────────────────    │
   │ bcryptjs (12 rounds)     │
   │ secure.hash(password)    │
   └──────────┬───────────────┘
              │
              ▼
   ┌──────────────────────────┐
   │ Update User              │
   │ ─────────────────────    │
   │ UPDATE users SET:        │
   │   status="active"        │
   │   passwordHash=<hash>    │
   │   invitationToken=null   │
   └──────────┬───────────────┘
              │
              ▼
   ┌──────────────────────────┐
   │ Success Response         │
   │ ─────────────────────    │
   │ "Account activated!"     │
   │ Redirect to /sign-in     │
   └──────────┬───────────────┘
              │
              ▼
   ┌──────────────────────────┐
   │ User Signs In            │
   │ ─────────────────────    │
   │ Email: user@company.com  │
   │ Password: (set above)    │
   │                          │
   │ POST /api/auth/[...all]  │
   └──────────┬───────────────┘
              │
              ▼
   ┌──────────────────────────┐
   │ Session Created          │
   │ ─────────────────────    │
   │ User authenticated       │
   │ Redirected to /dashboard │
   └──────────────────────────┘
```

---

## Email Service Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                  EMAIL SERVICE ARCHITECTURE                       │
└──────────────────────────────────────────────────────────────────┘

                        sendEmail()
                             │
                 ┌───────────┴───────────┐
                 │                       │
                 ▼                       ▼
        ┌─────────────────┐   ┌─────────────────┐
        │  API Key Check  │   │  Get Config     │
        │                 │   │                 │
        │  env.SENDGRID_  │   │  - from email   │
        │  API_KEY        │   │  - to email     │
        │                 │   │  - template     │
        └────────┬────────┘   └─────────────────┘
                 │
                 ├──────────────────┐
                 │                  │
              No Key              Has Key
                 │                  │
                 ▼                  ▼
        ┌──────────────────┐  ┌──────────────────┐
        │ Console Log      │  │ Send via         │
        │ (Fallback)       │  │ SendGrid         │
        └──────────┬───────┘  └────────┬─────────┘
                   │                   │
                   │            ┌──────┴──────┐
                   │            │             │
                   │         Success      Error
                   │            │             │
                   │            ▼             ▼
                   │      ┌──────────┐  ┌──────────────┐
                   │      │ Return   │  │ Check Error  │
                   │      │ true     │  │ Status Code  │
                   │      └──────┬───┘  └──────┬───────┘
                   │             │             │
                   │             │      ┌──────┴──────┐
                   │             │      │             │
                   │             │    403         Other
                   │             │   (403)        Error
                   │             │      │             │
                   │             │      ▼             ▼
                   │             │  Sender Not  Log Error
                   │             │  Verified    & Fallback
                   │             │  │
                   │             │  ▼
                   │             │  Console Log
                   │             │  (Fallback)
                   │             │
                   └─────────────┴──────────────┘
                                 │
                                 ▼
                        ┌──────────────────┐
                        │ Return Result    │
                        │                  │
                        │ true = sent or   │
                        │ logged           │
                        │ false = error    │
                        └──────────────────┘


TEMPLATE SELECTION:

                    sendInvitationEmail()
                             │
                    ┌────────┴────────┐
                    ▼                 ▼
            ┌─────────────────┐  ┌──────────────┐
            │ HTML Template   │  │ Text Version │
            │                 │  │              │
            │ - Header        │  │ - Plain text │
            │ - Greeting      │  │ - Link       │
            │ - CTA button    │  │ - Steps      │
            │ - Security note │  │ - Footer     │
            │ - Link          │  │              │
            │ - Footer        │  │              │
            └────────┬────────┘  └──────┬───────┘
                     │                  │
                     └──────┬───────────┘
                            ▼
                    ┌──────────────────┐
                    │ sendEmail()      │
                    │ with both        │
                    └──────────────────┘
```

---

## Database Schema

```
┌──────────────────────────────────────────────────────────────────┐
│                    USERS TABLE SCHEMA                             │
└──────────────────────────────────────────────────────────────────┘

┌─────────────────────────────┬──────────┬────────────────────────┐
│ Column                      │ Type     │ Notes                  │
├─────────────────────────────┼──────────┼────────────────────────┤
│ id                          │ varchar  │ Primary Key            │
│ email                       │ varchar  │ Indexed, Unique        │
│ name                        │ varchar  │ User's full name       │
│                             │          │                        │
│ status*                     │ varchar  │ 'active'               │
│                             │          │ 'invitation_sent'      │
│                             │          │ 'invitation_accepted'  │
│                             │          │                        │
│ invitationToken*            │ varchar  │ Indexed                │
│                             │          │ Unique token           │
│                             │          │ Generated on create    │
│                             │          │                        │
│ invitationSentAt*           │ timestamp│ When invitation sent   │
│                             │          │ Used for expiry check  │
│                             │          │ (24 hours)             │
│                             │          │                        │
│ passwordHash*               │ varchar  │ Bcryptjs hash          │
│                             │          │ Set after accepting    │
│                             │          │ invitation             │
│                             │          │                        │
│ lastPasswordChangedAt*      │ timestamp│ Audit trail            │
│                             │          │ Security monitoring    │
│                             │          │                        │
│ createdAt                   │ timestamp│ Auto-generated         │
│ updatedAt                   │ timestamp│ Auto-updated           │
└─────────────────────────────┴──────────┴────────────────────────┘

* = New columns added for invitation system


INDEXES:

┌──────────────────────────────────────────────────────────┐
│ idx_users_email          │ For login lookups            │
│ idx_users_invitationToken│ For accepting invitations    │
│ idx_users_status         │ For admin dashboards         │
└──────────────────────────────────────────────────────────┘
```

---

## Permission Flow

```
┌────────────────────────────────────────────────────────────────┐
│              PERMISSION CHECK FLOW                              │
└────────────────────────────────────────────────────────────────┘

User Makes Request
      │
      ▼
┌──────────────────────────────────────┐
│ Check if Authenticated               │
├──────────────────────────────────────┤
│ ✓ Has valid session?                 │
│ ✓ Has valid JWT token?               │
└──────────┬───────────────────────────┘
           │
      Yes  │  No
      │    └────► 401 Unauthorized
      ▼
┌──────────────────────────────────────┐
│ Load User from Database              │
│ Get their permissions                │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ requirePermission(permission)         │
├──────────────────────────────────────┤
│ Check if user has permission         │
│ Example: "documents.view"            │
└──────────┬───────────────────────────┘
           │
      ┌────┴────┐
      │          │
      ▼          ▼
  Has Perm  No Perm
      │          │
      ▼          ▼
   ✓ Allow  Check Super Admin
           Bypass
             │
        ┌────┴────┐
        │          │
        ▼          ▼
    Has 20+   Less than
    perms?    20 perms
        │          │
        ▼          ▼
      ✓ Allow   ✗ Deny
                (403)
```

---

## Error Handling Tree

```
┌──────────────────────────────────────────────────────────────┐
│                   ERROR HANDLING FLOW                         │
└──────────────────────────────────────────────────────────────┘

Email Operation
      │
      ├─────────────────────────┐
      │                         │
      ▼                         ▼
  SendGrid Error      Console Fallback
      │                    (no API key)
      │
      ├─────────────────────────────────┐
      │                                 │
  403 Forbidden              Other Error
      │                         │
      ├─ Unverified             ├─ Invalid email
      │  sender                 ├─ API down
      │  │                      ├─ Rate limited
      │  ▼                      ├─ Timeout
      │  Fall back to       ├─ Auth error
      │  console logging   │
      │  Log helpful       │
      │  message with      │
      │  action steps      │
      │                    │
      │                    ▼
      │               Fall back to
      │               console logging
      │               Log error for
      │               debugging
      │
      └────────────────────┬─────────┘
                           │
                           ▼
                   ┌──────────────────┐
                   │ Return true      │
                   │ (operation ok,   │
                   │  email tracked)  │
                   └──────────────────┘


Password Validation Errors:

Set Password Request
      │
      ├─ Token invalid?
      │  ├─ YES → Return 400 "Invalid token"
      │  └─ NO → Continue
      │
      ├─ Token expired?
      │  ├─ YES → Return 400 "Token expired"
      │  └─ NO → Continue
      │
      ├─ Token already used?
      │  ├─ YES → Return 400 "Already accepted"
      │  └─ NO → Continue
      │
      ├─ Password too short?
      │  ├─ YES → Return 400 "Min 8 chars"
      │  └─ NO → Continue
      │
      ├─ Password missing uppercase?
      │  ├─ YES → Return 400 "Need uppercase"
      │  └─ NO → Continue
      │
      ├─ Password missing lowercase?
      │  ├─ YES → Return 400 "Need lowercase"
      │  └─ NO → Continue
      │
      ├─ Password missing number?
      │  ├─ YES → Return 400 "Need number"
      │  └─ NO → Continue
      │
      ├─ Password missing special char?
      │  ├─ YES → Return 400 "Need special char"
      │  └─ NO → Continue
      │
      └─ All validations pass
         │
         ▼
      Hash password & save
         │
         ▼
      Return 200 Success
```

---

## Component Interaction Diagram

```
┌──────────────────────────────────────────────────────────────┐
│              SYSTEM COMPONENT INTERACTIONS                    │
└──────────────────────────────────────────────────────────────┘

                    Admin Dashboard
                    /admin/users
                         │
                         │ Creates user
                         │
                         ▼
                    API: POST /api/users
                         │
          ┌──────────────┼──────────────┐
          │              │              │
          ▼              ▼              ▼
    Database       Email Service   Response
    (Create          (SendGrid)    (Success)
     user)           │
                     ├─ SendGrid API
                     │
                     └─ Console (fallback)
                           │
                           ▼
                    Server Logs
                    (Dev console)


                User Accepts Invitation
                         │
                         ▼
            Page: /accept-invitation?token=X
                         │
          ┌──────────────┴──────────────┐
          │                             │
          ▼                             ▼
    Validate Token            Password Form
    (token exists             (user enters
     & not expired)            password)
          │                             │
          └──────────────┬──────────────┘
                         │
                         ▼
            API: POST /api/users/set-password
                         │
          ┌──────────────┼──────────────────┐
          │              │                  │
          ▼              ▼                  ▼
    Hash Password   Update Database   Response
    (bcryptjs)      (user status)     (Success)
```

---

## Data Flow During Invitation

```
┌──────────────────────────────────────────────────────────────┐
│                   DATA FLOW DIAGRAM                           │
└──────────────────────────────────────────────────────────────┘

User Data Input:
┌─────────────────────────────────────┐
│ Email: john@company.com             │
│ Name: John Doe                       │
│ Roles: [Admin, Editor]              │
└──────────────┬──────────────────────┘
               │
               ▼
         ┌──────────────────────────────┐
         │ Validate Input               │
         │ - Email format               │
         │ - Name length                │
         │ - Roles exist                │
         └──────────┬───────────────────┘
                    │
                    ▼
         ┌──────────────────────────────┐
         │ Generate Token               │
         │ crypto.randomBytes(32)       │
         │ Result: abc123def...         │
         └──────────┬───────────────────┘
                    │
                    ▼
         ┌──────────────────────────────┐
         │ Create User Record           │
         │ ─────────────────────────    │
         │ {                            │
         │   id: uuid                   │
         │   email: john@company.com    │
         │   name: John Doe             │
         │   invitationToken: abc123... │
         │   invitationSentAt: now      │
         │   status: invitation_sent    │
         │   passwordHash: null         │
         │ }                            │
         └──────────┬───────────────────┘
                    │
                    ▼
         ┌──────────────────────────────┐
         │ Generate Invitation Link     │
         │ ─────────────────────────    │
         │ http://localhost:3000/       │
         │ accept-invitation?           │
         │ token=abc123def...           │
         └──────────┬───────────────────┘
                    │
                    ▼
         ┌──────────────────────────────┐
         │ Send Email                   │
         │ ─────────────────────────    │
         │ To: john@company.com         │
         │ Template: Invitation         │
         │ Link: (see above)            │
         │ Expires: 24 hours            │
         └──────────┬───────────────────┘
                    │
            ┌───────┴────────┐
            │                │
            ▼                ▼
         Success         Error (403)
            │                │
            ▼                ▼
         Email Sent      Console Log
         (delivered)     (fallback)
            │                │
            └────────┬───────┘
                     │
                     ▼
            ┌──────────────────────────────┐
            │ Return Response              │
            │ ─────────────────────────    │
            │ {                            │
            │   success: true              │
            │   userId: uuid               │
            │   invitationLink: http://... │
            │   emailSent: true/false      │
            │ }                            │
            └──────────────────────────────┘
```

---

## Session & Authentication Flow

```
┌──────────────────────────────────────────────────────────────┐
│            SESSION & AUTHENTICATION FLOW                      │
└──────────────────────────────────────────────────────────────┘

User Signs In:
    email + password
         │
         ▼
    POST /api/auth/[...all]
         │
         ├─ Find user by email
         │
         ├─ Get password hash from DB
         │
         ├─ Compare input password
         │  with stored hash
         │  (bcryptjs.compare)
         │
         ├─ Password matches?
         │  ├─ YES → Create session
         │  └─ NO → Return 401
         │
         ├─ Create JWT token
         │
         ├─ Set secure cookie
         │
         └─ Return session data


Subsequent Requests:
    With authenticated session
         │
         ├─ Read session from cookie/header
         │
         ├─ Verify JWT signature
         │
         ├─ Check expiration
         │
         ├─ Load user from DB
         │
         ├─ Load user permissions
         │
         ├─ Check permission for
         │  requested resource
         │
         └─ Allow/Deny request


Super Admin Access:
    Has 20+ permissions?
         │
    ┌────┴────┐
    │          │
    YES       NO
    │          │
    ▼          ▼
  BYPASS    STRICT
  CHECKS    CHECKS
    │          │
    ▼          ▼
  ALLOW    CHECK
           PERMISSION
```

---

These diagrams should help visualize how the email service and invitation system work together!
