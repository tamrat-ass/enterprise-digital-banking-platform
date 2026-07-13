# 🚀 Setup and Run Guide

Complete guide to set up your database and run the application.

---

## ✅ Prerequisites

- Node.js 18+ installed
- PostgreSQL 12+ running locally
- Database created: `ahadufile`
- User: `postgres`
- Password: `4840`

Verify PostgreSQL is running:
```bash
psql -U postgres -d ahadufile -c "SELECT version();"
```

---

## 📝 Step 1: Install Dependencies

```bash
cd d:\enterprise-digital-banking-platform
pnpm install
# or: npm install
```

**Expected output:**
```
added XXX packages in XX seconds
```

---

## 🗄️ Step 2: Initialize Database

The database tables need to be created. Run:

```bash
pnpm db:init
```

**What it does:**
- Connects to your PostgreSQL database
- Creates all 18 tables
- Creates indexes for performance
- Verifies all tables

**Expected output:**
```
🔧 Database Initialization Script
==================================

📍 Connecting to database...
✅ Connected to database

📖 Reading SQL schema file...
✅ Schema file loaded

🔨 Creating tables...
✅ Tables created successfully

🔍 Verifying tables...

📊 Created Tables:
==================
  1. account
  2. approval_requests
  3. audit_logs
  4. compliance_items
  5. contracts
  6. departments
  7. document_versions
  8. documents
  9. notifications
  10. profiles
  11. projects
  12. risks
  13. roles
  14. session
  15. user
  16. vendors
  17. verification
  18. workflows

✅ Total tables created: 18

🎉 Database initialization completed successfully!
```

---

## ✔️ Step 3: Verify Database Setup

Verify tables were created:

```bash
psql -U postgres -d ahadufile -c "\dt"
```

**Expected:** Should show all 18 tables

---

## 🖥️ Step 4: Start Frontend & Backend

The Next.js application includes both frontend and backend API. Start it:

```bash
pnpm dev
```

**Expected output:**
```
> next dev

  ▲ Next.js 16.2.6
  - Local:        http://localhost:3000
  - Environments: .env.local

✓ Ready in 5.2s
```

---

## 🌐 Step 5: Open in Browser

Visit: **http://localhost:3000**

You should see the **Meridian** login page.

---

## 👤 Step 6: Create First User (Super Admin)

1. Click **"Sign up"** link
2. Fill in:
   - **Full Name:** Any name
   - **Email:** any@email.com
   - **Password:** min 8 characters
   - **Role:** Staff (will be upgraded to Super Admin automatically)
   - **Department:** Select any

3. Click **"Create account"**

**Note:** The first registered user automatically becomes **Super Administrator**

---

## 🎯 Step 7: Login and Explore

1. You're now logged in as Super Admin
2. Navigate to **Dashboard** to see all metrics
3. Explore all modules:
   - Documents
   - Approvals
   - Projects
   - Vendors
   - Contracts
   - Risks
   - Compliance
   - Analytics

---

## 📊 Testing the Platform

### Create a Document

1. Go to **Documents**
2. Click **"New Document"**
3. Fill in:
   - Title: "Test Policy"
   - Category: "Policy"
   - Access Level: "Internal"
4. Click **"Create"**
5. Document appears in the list

### Create a Project

1. Go to **Projects**
2. Click **"New Project"**
3. Fill in details
4. Click **"Create"**

### Test API Endpoints

```bash
# Get all documents
curl http://localhost:3000/api/documents

# Get dashboard stats
curl http://localhost:3000/api/stats

# Create a document
curl -X POST http://localhost:3000/api/documents \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Document",
    "category": "policy",
    "accessLevel": "internal"
  }'
```

---

## 🛠️ Development Commands

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Lint code
pnpm lint

# Initialize database
pnpm db:init

# View database in Drizzle Studio
pnpm db:studio

# Seed sample data
pnpm db:seed
```

---

## 🔧 Troubleshooting

### Issue: Database Connection Failed

**Error:** `connect ECONNREFUSED 127.0.0.1:5432`

**Solution:**
1. Verify PostgreSQL is running
2. Check DATABASE_URL in .env.local
3. Verify database `ahadufile` exists
4. Verify user `postgres` and password `4840`

**Test connection:**
```bash
psql -U postgres -d ahadufile -c "SELECT 1"
```

### Issue: Port 3000 Already in Use

**Error:** `Error: listen EADDRINUSE: address already in use :::3000`

**Solution:** Use different port:
```bash
PORT=3001 pnpm dev
```

### Issue: Dependencies Not Installed

**Error:** `Cannot find module '...'`

**Solution:** Reinstall:
```bash
rm -rf node_modules
pnpm install
```

### Issue: Tables Already Exist

**Error:** `relation "documents" already exists`

**Solution:** Tables are already created, this is fine. Just run:
```bash
pnpm dev
```

---

## ✅ Verification Checklist

- [ ] Node.js 18+ installed (`node --version`)
- [ ] PostgreSQL running (`psql --version`)
- [ ] Database created: `ahadufile`
- [ ] Dependencies installed: `pnpm install`
- [ ] Database initialized: `pnpm db:init`
- [ ] 18 tables created in database
- [ ] Frontend running: `pnpm dev`
- [ ] Browser shows Meridian login page
- [ ] Can sign up and create user
- [ ] Dashboard loads successfully
- [ ] Can create documents/projects
- [ ] API endpoints respond (curl test)

---

## 🎯 Your Platform is Ready!

You now have a fully functional **Enterprise Digital Banking Governance Platform** running locally with:

✅ **8 Core Modules** - All working
✅ **31 API Endpoints** - Ready to use
✅ **Professional UI** - All pages
✅ **Secure Authentication** - First user is Super Admin
✅ **Complete Database** - 18 tables

---

## 📱 Default Access Levels

After first signup (Super Admin), you can:
- Create users with different roles
- Assign different permissions
- Manage all modules

**Available Roles:**
1. Super Admin (Full access)
2. Executive (Read + Approvals)
3. Compliance Officer (Risk & Compliance)
4. Auditor (Read-only)
5. Department Head (Department management)
6. Staff (Basic access)

---

## 🚀 Next Steps

1. **Explore the Code:**
   - Backend: `/lib/services/` (business logic)
   - Frontend: `/app/` (pages)
   - API: `/app/api/` (endpoints)

2. **Read Documentation:**
   - API details: [API_REFERENCE.md](./API_REFERENCE.md)
   - Setup details: [SETUP_GUIDE.md](./SETUP_GUIDE.md)
   - Architecture: [README.md](./README.md)

3. **Customize & Deploy:**
   - Update branding
   - Add more users
   - Deploy to production

---

## 📞 Support

If you encounter issues:

1. Check [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Common issues
2. Review [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Detailed setup
3. Check [API_REFERENCE.md](./API_REFERENCE.md) - API usage
4. Review error messages in browser console or terminal

---

## 🎉 Success!

Your Enterprise Digital Banking Governance Platform is now running!

**Start by visiting:** http://localhost:3000

Enjoy! 🏦
