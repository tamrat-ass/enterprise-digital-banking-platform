# Database Seeding & Data Verification Guide

This guide explains how to populate your enterprise banking platform database with sample data and verify that data is being retrieved correctly.

## Overview

The database seeding process includes:

1. **seed-data.sql** - SQL script with sample data for all tables
2. **seed-database.js** - Node.js script that executes seeding and verifies data
3. **verify-api-data.js** - Testing script to verify all API endpoints retrieve data correctly
4. Updated **setup.ps1** - Automatically runs seeding during initial setup

## Quick Start

### Option 1: Automatic (Recommended)

Run the complete setup script which includes database creation and seeding:

```powershell
.\setup.ps1
```

This will:
- Install dependencies
- Create all database tables
- Seed the database with sample data
- Display verification results
- Start the development server

### Option 2: Manual Seeding

If you already have the database tables created, run the seeding script directly:

```bash
node scripts/seed-database.js
```

This will:
- Insert sample data into all tables
- Display record counts for each table
- Show sample records from each entity type
- Test database connectivity and data retrieval

### Option 3: Verify Only

To verify that data is already in the database without seeding again:

```bash
# First, make sure your app is running
pnpm dev

# In another terminal, run verification
node scripts/verify-api-data.js
```

## Sample Data Included

The seeding script populates the following tables with realistic banking platform data:

### Core Data
- **7 Users** - Different roles and departments
- **5 Departments** - Finance, Risk, Operations, Technology, Legal
- **5 Roles** - Admin, Manager, Analyst, Approver, Vendor Manager
- **7 User Profiles** - Linked users to roles and departments

### Documents & Governance
- **6 Documents** - Policies, frameworks, procedures, guidelines
- **6 Document Versions** - Version history for documents
- **4 Workflows** - Document approval, vendor onboarding, project approval, risk assessment

### Business Operations
- **5 Projects** - Various banking projects with budgets and progress
- **7 Vendors** - Diverse vendor categories with risk ratings
- **6 Contracts** - Active and expired service agreements

### Risk & Compliance
- **6 Risks** - Various organizational risks with severity levels
- **6 Compliance Items** - SOX, GDPR, ISO 27001, GLBA, AML/KYC, BSA controls

### Workflow & Approvals
- **5 Approval Requests** - Mix of pending, approved, and in-progress requests
- **6 Notifications** - Alerts for users about pending actions
- **8 Audit Logs** - Historical record of system actions

## Data Entity Relationships

```
User → Profile → Role → Permissions
        ↓
      Department
        ↓
    ├─ Document (owned)
    ├─ Project (owned)
    ├─ Risk (owned)
    └─ Compliance Item (owned)

Workflow → Approval Request → Entity (Document/Vendor/Project/Risk)

Vendor → Contract → Department/User (owner)

Risk → Department/User (owner)
```

## Verifying Data Retrieval from Database

### Method 1: Database Query (Direct)

Connect to your PostgreSQL database and verify:

```sql
-- Check record counts
SELECT COUNT(*) FROM vendors;
SELECT COUNT(*) FROM documents;
SELECT COUNT(*) FROM approval_requests;
SELECT COUNT(*) FROM projects;
SELECT COUNT(*) FROM risks;

-- View sample records
SELECT name, category, status, risk_rating FROM vendors LIMIT 5;
SELECT title, category, owner_name FROM documents LIMIT 5;
SELECT title, status, priority FROM approval_requests LIMIT 5;
```

### Method 2: API Endpoints (Application Level)

Once your application is running, test these endpoints:

```bash
# Test in your browser or with curl

# Vendors
curl http://localhost:3000/api/vendors

# Documents
curl http://localhost:3000/api/documents

# Approvals
curl http://localhost:3000/api/approvals

# Projects
curl http://localhost:3000/api/projects

# Risks
curl http://localhost:3000/api/risks

# Compliance
curl http://localhost:3000/api/compliance

# Statistics
curl http://localhost:3000/api/stats
```

### Method 3: Automated Testing

Run the automated verification script:

```bash
# Make sure the application is running first
pnpm dev

# In another terminal, run the verification
node scripts/verify-api-data.js
```

This will:
- Test all API endpoints
- Verify expected fields are returned
- Display sample records from database
- Report overall test results

## Sample Data Details

### Users & Authentication
```
User: sarah.johnson@bank.com (Finance Director, Admin)
User: michael.chen@bank.com (Risk Manager, Manager)
User: jennifer.williams@bank.com (Operations Manager)
User: david.kumar@bank.com (CTO, Admin)
User: emma.thompson@bank.com (Legal Counsel, Approver)
```

### Projects with Budget Tracking
```
Mobile Banking Platform: 65% complete, $500K budget, $325K spent
Cloud Infrastructure: 45% complete, $750K budget, $337.5K spent
Data Analytics: 10% complete, $300K budget, $30K spent
Compliance Automation: 55% complete, $400K budget, $220K spent
HR Management System: Planning phase, $200K budget
```

### Vendors with Risk Ratings
```
CloudTech Solutions: Low Risk, Active, $150K contract
SecureBank Systems: Low Risk, Active, $200K contract
DataVault Pro: Medium Risk, Pending Review, $120K contract
Enterprise Solutions: Medium Risk, Active, $300K contract
ComplianceFirst: Low Risk, Active, $180K contract
Global IT Services: High Risk, Inactive, $250K contract (expired)
Financial Audit Partners: Low Risk, Active, $175K contract
```

### Approval Requests
```
APR-001: Enterprise Security Policy - Pending (High Priority)
APR-002: CloudTech Vendor Onboarding - Pending Legal Review
APR-003: Mobile Banking Project - Pending Budget Approval (High)
APR-004: Risk Framework - Already Approved
APR-005: Cybersecurity Risk - In Progress
```

## Troubleshooting

### "Database connection refused"
- Verify PostgreSQL is running
- Check DATABASE_URL in .env.local
- Ensure database exists: `ahadufile`

### "Permission denied" errors
- Verify database user has CREATE TABLE permissions
- Check user credentials in DATABASE_URL

### "No data returned from API"
- Verify seeding script completed successfully
- Check that your app is running (`pnpm dev`)
- Verify authentication/permissions if using auth

### Script fails silently
- Check that PostgreSQL client (`pg` package) is installed
- Run: `npm install pg` if needed
- Verify NODE_ENV is not preventing script execution

## Resetting & Reseeding

To clear and reseed all data:

```bash
# Option 1: Drop and recreate tables
node create-tables.js
node scripts/seed-database.js

# Option 2: Just delete records (keep schema)
# This requires manual SQL or additional script
```

## Performance Notes

- Initial seeding takes ~2-3 seconds
- Database includes appropriate indexes for common queries
- Sample data is sized for realistic load testing
- Vendor risk calculations are pre-calculated

## Next Steps

1. ✅ Run setup script or manual seeding
2. ✅ Start development server (`pnpm dev`)
3. ✅ Verify data with API endpoints
4. ✅ Test different user roles and permissions
5. ✅ View data in UI dashboards
6. ✅ Review audit logs for data modifications

## Support

For issues with:
- **Database**: Check PostgreSQL logs
- **Seeding**: Review seed-database.js output
- **API retrieval**: Check application console logs
- **Permissions**: Verify user roles in database profiles table
