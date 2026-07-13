# The Real Problem Found - Database Error

## What's Actually Happening

You're getting a **500 error** when trying to check documents because **the database query is failing**.

The error message shows:
```
Failed query: select ... from document_versions where document_id = $1
```

This means the **SQL query itself is broken** - not a "Document not found" (404), but a **database error** (500).

---

## Possible Causes (In Order of Likelihood)

### 1. **Database Tables Don't Exist** ⭐ MOST LIKELY
- Schema wasn't initialized
- Migrations weren't run
- Database is empty

### 2. **Database Connection Failed**
- PostgreSQL service not running
- Wrong credentials in `.env.local`
- Invalid connection string

### 3. **Column Names Mismatch**
- Code expects different column names
- Schema was partially updated
- Type mismatch in query

### 4. **Database Server Is Down**
- PostgreSQL service crashed
- Network connection lost
- Port blocked

---

## How to Fix It - Quick Path (5 minutes)

### Step 1: Check Health Endpoint (1 min)

I've added a new health check endpoint. Visit:
```
http://localhost:3000/api/admin/health
```

**This will tell you if the database is even connected.**

### Step 2: Read the Response

**If you see:**
```json
{
  "success": true,
  "status": "healthy",
  "database": { "connected": true, "documentsCount": 0 }
}
```
→ Database IS connected, but tables might be empty or schema wrong.

**If you see:**
```json
{
  "success": false,
  "status": "unhealthy",
  "error": "Database connection failed",
  "details": "connect ECONNREFUSED 127.0.0.1:5432"
}
```
→ Database is NOT connected. PostgreSQL not running or credentials wrong.

### Step 3: Fix Based on Response

**If health check says "unhealthy":**

Check .env.local:
```
DATABASE_URL=postgresql://username:password@localhost:5432/dbname
```

Verify:
- Is PostgreSQL running? (Start it if not)
- Is username/password correct?
- Is database name correct?
- Is port 5432 correct?

**If health check says "healthy" but test-upload still fails:**

Initialize database:
```bash
npm run db:init
npm run db:migrate
```

Then restart:
```bash
npm run dev
```

---

## What I've Done to Help

### 1. Created New Health Check Endpoint
```
GET /api/admin/health
```
- Simple test to verify database connection
- Doesn't require tables to exist
- Tells you if basic connection works

**File:** `app/api/admin/health/route.ts`

### 2. Improved Error Handling
Updated `test-upload` endpoint with:
- Better error messages
- Graceful handling of missing tables
- Detailed logging

**File:** `app/api/admin/test-upload/route.ts`

### 3. Created Diagnostic Guide
Complete troubleshooting guide with all possible causes and fixes.

**File:** `DATABASE_ERROR_DIAGNOSTIC.md`

---

## The Exact Problem (My Best Guess)

**Your database tables probably weren't created.**

When you set up the project, the schema initialization might have:
- Failed silently
- Wasn't run
- Credentials were wrong

Now when code tries to query `document_versions` table, it doesn't exist → SQL error → 500.

**The fix:**
```bash
npm run db:init      # Create tables
npm run db:migrate   # Run migrations  
npm run dev          # Restart server
```

---

## What to Do RIGHT NOW

### 1. Visit Health Check (30 seconds)
```
http://localhost:3000/api/admin/health
```

### 2. Tell Me What You See

**Copy the response and tell me:**
- Is it "success": true or false?
- What error message (if any)?

### 3. Based on That, I'll Tell You Exactly What To Do

---

## If Health Check Works

If health check says "healthy" but test-upload still fails:

```bash
# Run database initialization
npm run db:init

# Run migrations
npm run db:migrate

# Restart server
npm run dev
```

Then try:
```
http://localhost:3000/api/admin/test-upload
```

---

## If Health Check Fails

If health check says database not connected:

1. **Check PostgreSQL is running**
2. **Verify DATABASE_URL in .env.local**
3. **Verify credentials are correct**
4. **Check database exists**

Then restart server:
```bash
npm run dev
```

---

## The Real Issue In One Sentence

**Your database isn't connected or tables don't exist, so SQL queries fail with 500 errors.**

---

## Files to Check

1. `.env.local` - Database credentials
2. Check if PostgreSQL is running
3. Check if tables exist in database

---

## Next Action

**Visit:** `http://localhost:3000/api/admin/health`

**Tell me:** What response do you get? Success or error?

**Then:** I'll tell you exactly how to fix it based on that response.

---

**This is the REAL problem, not "Document not found".**

The 404 error you were seeing before was masking this database error. Now we've found the root cause.
