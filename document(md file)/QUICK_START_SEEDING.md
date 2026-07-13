# Quick Start: Database Seeding & Data Verification

## 🚀 3-Step Quick Setup

### Step 1: Run Complete Setup
```powershell
.\setup.ps1
```
This automatically:
- Installs dependencies
- Creates database tables
- Populates with sample data
- Starts the dev server

### Step 2: Verify Data in Database
```bash
pnpm db:populate
```
Output shows:
- ✅ Record counts for all tables
- 📋 Sample data preview
- 🧪 API data retrieval tests

### Step 3: Test API Endpoints
```bash
pnpm db:verify
```
Runs while app is running (`pnpm dev`) and tests:
- All endpoints return data
- Correct data structure
- Sample records display

---

## 📊 What Gets Seeded?

| Entity | Count | Details |
|--------|-------|---------|
| Users | 7 | Different roles/departments |
| Departments | 5 | Finance, Risk, Ops, Tech, Legal |
| Documents | 6 | Policies, frameworks, procedures |
| Projects | 5 | Various stages, budgets tracked |
| Vendors | 7 | Risk ratings, contracts |
| Approvals | 5 | Pending and approved requests |
| Risks | 6 | Different severity levels |
| Compliance | 6 | SOX, GDPR, ISO, etc. |
| Contracts | 6 | Active and expired agreements |

---

## 🧪 Data Verification Methods

### Method 1: Direct Database Query
```bash
# Connect to PostgreSQL and check counts
SELECT COUNT(*) FROM vendors;
SELECT * FROM documents LIMIT 5;
```

### Method 2: API Endpoints
```bash
# Once app is running on http://localhost:3000
curl http://localhost:3000/api/vendors
curl http://localhost:3000/api/documents
curl http://localhost:3000/api/approvals
```

### Method 3: Automated Testing
```bash
# Terminal 1: Start app
pnpm dev

# Terminal 2: Run verification
pnpm db:verify
```

---

## ✅ Success Indicators

After seeding, you should see:

✓ **Database shows records**
```
✓ Departments : 5 records
✓ Users : 7 records
✓ Vendors : 7 records
✓ Documents : 6 records
✓ Projects : 5 records
✓ Approvals : 5 records
✓ Risks : 6 records
✓ Compliance Items : 6 records
```

✓ **API returns data**
```
GET /api/vendors → 7 vendor records
GET /api/documents → 6 document records
GET /api/approvals → 5 approval records
GET /api/projects → 5 project records
```

✓ **Sample records display**
```
Vendors: CloudTech Solutions, SecureBank Systems, etc.
Documents: Security Policy, Risk Framework, etc.
Projects: Mobile Banking Platform, Cloud Migration, etc.
```

---

## 🛠 Manual Commands

If you need to run steps individually:

```bash
# 1. Create database tables only
node create-tables.js

# 2. Seed database with sample data
pnpm db:populate

# 3. Start app and test
pnpm dev

# 4. In another terminal, verify APIs
pnpm db:verify
```

---

## 📝 Sample Login Credentials

After seeding, you can test with these users:

| Email | Role | Department |
|-------|------|------------|
| sarah.johnson@bank.com | Admin | Finance |
| michael.chen@bank.com | Manager | Risk |
| jennifer.williams@bank.com | Manager | Operations |
| david.kumar@bank.com | Admin | Technology |
| emma.thompson@bank.com | Approver | Legal |

---

## 🔍 Verifying Data Flow

### Flow Diagram
```
Database (PostgreSQL)
    ↓
[Sample Data Seeded]
    ↓
API Endpoints (/api/vendors, /api/documents, etc.)
    ↓
Application UI Displays Data
    ↓
✅ Users see live data from database
```

### Testing Workflow
1. **Seed data** → Populates database tables
2. **Start app** → `pnpm dev` connects to database
3. **API calls** → Fetch data from database
4. **UI renders** → Shows database records
5. **Verify** → Script confirms data retrieval

---

## ❓ Troubleshooting

**Problem: "Database connection refused"**
- Verify PostgreSQL is running
- Check DATABASE_URL in .env.local

**Problem: "No data showing in UI"**
- Run `pnpm db:populate` to seed data
- Restart app with `pnpm dev`

**Problem: "API returns 401/403"**
- Data exists but auth is required
- Test with valid user credentials

**Problem: "Seeding script fails"**
- Ensure `pg` package installed: `npm install pg`
- Check database user permissions

---

## 📚 Full Documentation

For detailed information, see:
- **[SEEDING_GUIDE.md](./SEEDING_GUIDE.md)** - Complete seeding documentation
- **[API_REFERENCE.md](./document(md%20file)/API_REFERENCE.md)** - API endpoints
- **[COMPLETE_PROJECT_SUMMARY.md](./document(md%20file)/COMPLETE_PROJECT_SUMMARY.md)** - Project overview

---

## ✨ Next Steps

1. ✅ Run `.\setup.ps1`
2. ✅ Verify seeding: `pnpm db:populate`
3. ✅ Start app: `pnpm dev`
4. ✅ Test APIs: `pnpm db:verify`
5. ✅ View dashboard at http://localhost:3000
6. ✅ Test with different users
7. ✅ Review sample data in database

**Everything should now be working with live data from the database!**
