# 🚀 RUN YOUR APPLICATION NOW

Complete step-by-step guide to get your application running with database tables created.

---

## ✅ Prerequisites Check

Before starting, verify:

1. **PostgreSQL is running**
   - Database: `ahadufile`
   - User: `postgres`
   - Password: `4840`

2. **Node.js is installed**
   ```
   node --version  (should be 18+)
   npm --version
   ```

3. **.env.local file exists** with correct configuration:
   ```
   DATABASE_URL=postgresql://postgres:4840@localhost:5432/ahadufile
   ```

---

## 🎯 Method 1: Automated Setup (Recommended)

### For Windows PowerShell:

```powershell
cd d:\enterprise-digital-banking-platform
.\setup.ps1
```

This script will automatically:
1. ✅ Install dependencies
2. ✅ Create all database tables
3. ✅ Start the development server
4. ✅ Open http://localhost:3000

**Done!** Skip to "Using the Application" section.

---

## 🎯 Method 2: Manual Setup (Step by Step)

### Step 1: Navigate to Project

```bash
cd d:\enterprise-digital-banking-platform
```

### Step 2: Install Dependencies

```bash
pnpm install
```

**Wait for completion** - You should see:
```
added XXX packages in XX seconds
```

### Step 3: Create Database Tables

```bash
node create-tables.js
```

**Wait for completion** - You should see:
```
✅ Total: 18 tables
🎉 Database setup complete!
```

### Step 4: Start Development Server

```bash
pnpm dev
```

**Wait for startup** - You should see:
```
▲ Next.js 16.2.6
  - Local:        http://localhost:3000
  ✓ Ready in 5.2s
```

### Step 5: Open in Browser

Visit: **http://localhost:3000**

---

## 🎯 Method 3: If Tables Still Don't Exist

If you still see no tables after running the script, use this direct approach:

### Option A: Using Node.js Directly

```bash
node create-tables.js
```

This will create all tables directly.

### Option B: Using Direct SQL

1. Open your PostgreSQL client (pgAdmin or DBeaver)
2. Run the SQL file: `scripts/init-database.sql`
3. Execute all statements

---

## 📊 Verify Tables Were Created

After running `node create-tables.js`, you should see output like:

```
🔄 Creating tables...

🔍 Verifying tables created:

📊 Tables Created:
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

✅ Total: 18 tables

🎉 Database setup complete!
```

---

## 👤 Using the Application

### 1. Login Page
Visit: http://localhost:3000

You'll see the Meridian login page.

### 2. Sign Up (Create First User)
- Click "Sign up" link
- Fill in:
  - **Full Name:** Your name
  - **Email:** any@email.com
  - **Password:** min 8 characters
  - **Role:** Staff (will auto-upgrade to Super Admin)
  - **Department:** Select any
- Click "Create account"

### 3. Login
- Use your credentials to login
- You're now Super Administrator!

### 4. Explore Dashboard
- See all metrics
- Navigate to modules:
  - Documents
  - Approvals
  - Projects
  - Vendors
  - Contracts
  - Risks
  - Compliance
  - Analytics

---

## 🧪 Test the Application

### Create a Document

1. Go to **Documents** page
2. Click **"New Document"**
3. Fill in:
   - **Title:** "Test Policy"
   - **Category:** "Policy"
   - **Access Level:** "Internal"
4. Click **"Create"**
5. Document appears in list!

### Test API

```bash
# Get all documents
curl http://localhost:3000/api/documents

# Get dashboard stats
curl http://localhost:3000/api/stats

# Create a document
curl -X POST http://localhost:3000/api/documents \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Doc",
    "category": "policy"
  }'
```

---

## 🛠️ Troubleshooting

### Problem: "Cannot connect to database"

**Solution:**
1. Verify PostgreSQL is running
2. Verify database `ahadufile` exists
3. Check credentials in .env.local:
   ```
   DATABASE_URL=postgresql://postgres:4840@localhost:5432/ahadufile
   ```
4. Test connection:
   ```bash
   psql -U postgres -d ahadufile -c "SELECT 1;"
   ```

### Problem: "Tables not created"

**Solution:**
```bash
# Run this directly
node create-tables.js

# Or run the SQL file manually in your PostgreSQL client
```

### Problem: "Port 3000 already in use"

**Solution:**
```bash
# Use different port
PORT=3001 pnpm dev

# Visit http://localhost:3001
```

### Problem: "Dependencies error"

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules
pnpm install

# Then try again
node create-tables.js
pnpm dev
```

---

## ✅ Verification Checklist

- [ ] PostgreSQL running
- [ ] Database `ahadufile` created
- [ ] .env.local configured
- [ ] `pnpm install` completed
- [ ] `node create-tables.js` completed successfully
- [ ] 18 tables showing in output
- [ ] `pnpm dev` running
- [ ] http://localhost:3000 loads Meridian login
- [ ] Can sign up
- [ ] Can login
- [ ] Dashboard shows metrics
- [ ] Can create documents

---

## 🎉 SUCCESS!

When everything is working:

✅ You see the Meridian login page
✅ You can sign up and login
✅ Dashboard loads with metrics
✅ All modules are accessible
✅ Can create/view items
✅ API endpoints respond

---

## 📊 What You Now Have

**Enterprise Digital Banking Governance Platform with:**

✅ 8 Core Modules
✅ 31 API Endpoints
✅ 18 Database Tables
✅ Professional UI (10 pages)
✅ Security (Authentication + RBAC)
✅ Complete Audit Trail

---

## 🚀 Ready to Deploy?

When ready for production:

1. Review: `DEPLOYMENT_CHECKLIST.md`
2. Build: `pnpm build`
3. Deploy to Vercel, Docker, or your server

---

## 📞 Need Help?

Check these files:
- **SETUP_AND_RUN.md** - Detailed setup guide
- **API_REFERENCE.md** - API documentation
- **QUICK_REFERENCE.md** - Quick commands
- **README.md** - Architecture overview

---

## 🎯 Next Command

Run this now:

**For Windows PowerShell:**
```powershell
cd d:\enterprise-digital-banking-platform
.\setup.ps1
```

**Or Manual:**
```bash
cd d:\enterprise-digital-banking-platform
pnpm install
node create-tables.js
pnpm dev
```

**Then visit:** http://localhost:3000

---

**Enjoy your Enterprise Governance Platform! 🏦**
