# Database Error - Root Cause & Fix

## The Error You're Getting

```
GET /api/admin/test-upload 500
"Failed query: select ... from document_versions where document_id = $1"
```

**Translation:** The API tried to query the database but failed with a SQL error.

---

## What This Means

Your **database connection is having problems**. Either:

1. **Database tables don't exist** - Schema wasn't created
2. **Column names are wrong** - Field mismatch between code and database
3. **Database credentials are wrong** - Can't connect
4. **Database service is down** - PostgreSQL not running
5. **Connection string is invalid** - Wrong host/port/password

---

## How to Diagnose (5 minutes)

### Step 1: Check If Database is Running

**Windows (If using PostgreSQL locally):**
```bash
# Check if PostgreSQL service is running
sc query postgresql
```

**Mac (with Homebrew):**
```bash
# Check if PostgreSQL is running
brew services list | grep postgresql
```

**Or just try to connect:**
```bash
# Use your database tool (DBeaver, pgAdmin, psql)
# Try to connect with credentials from .env.local
```

### Step 2: Check Your .env.local File

```bash
# Open: d:\enterprise-digital-banking-platform\.env.local
# Look for: DATABASE_URL=postgresql://...
```

**It should look like:**
```
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
```

**Check:**
- ✅ Username correct?
- ✅ Password correct?
- ✅ Host is 'localhost' or correct IP?
- ✅ Port is 5432 (or your custom port)?
- ✅ Database name exists?

### Step 3: Check If Tables Exist

Run the database initialization:

```bash
# Run migrations
npm run db:migrate

# Or create tables
npm run db:init
```

Check if any output shows errors.

### Step 4: Test New Health Check Endpoint

I've added a new health check endpoint:

```
http://localhost:3000/api/admin/health
```

**This should tell you:**
- ✅ Database is connected
- ✅ How many documents exist

**If it returns:**
```json
{
  "success": true,
  "status": "healthy",
  "database": { "connected": true, "documentsCount": 0 }
}
```
→ **Database is working!**

**If it returns error:**
→ **Database is not connected**

### Step 5: Check Terminal Logs

When you visit `/api/admin/health`, watch your terminal for logs:

```
[Health Check] Starting database health check...
[Health Check] Count result: [{ count: 0 }]
```

**Or errors like:**
```
[Health Check] Database error: connect ECONNREFUSED 127.0.0.1:5432
```

---

## Common Problems & Fixes

### Problem 1: "connect ECONNREFUSED"

**Cause:** PostgreSQL service not running

**Fix:**
```bash
# Windows - Start PostgreSQL service
net start PostgreSQL14

# Mac - Start with Homebrew
brew services start postgresql

# Or check if port 5432 is in use
netstat -an | grep 5432
```

### Problem 2: "FATAL: password authentication failed"

**Cause:** Wrong username or password in DATABASE_URL

**Fix:**
1. Check `.env.local` credentials
2. Verify PostgreSQL user exists
3. Reset password if needed

### Problem 3: "database ... does not exist"

**Cause:** Database not created

**Fix:**
```bash
# Create database (replace dbname)
createdb -U postgres dbname

# Or run initialization
npm run db:init
```

### Problem 4: "column ... does not exist"

**Cause:** Tables exist but schema is outdated

**Fix:**
```bash
# Run migrations to update schema
npm run db:migrate

# Or generate new migrations
npm run db:generate
```

### Problem 5: "relation ... does not exist"

**Cause:** Tables weren't created

**Fix:**
```bash
# Create all tables
npm run db:init

# Verify tables were created
npm run db:studio  # Opens Drizzle Studio to inspect
```

---

## Step-by-Step Recovery Process

### Step A: Verify Database Connection

1. **Check PostgreSQL is running:**
   ```bash
   psql -U postgres -h localhost
   # If prompt appears → PostgreSQL is running
   # If error → PostgreSQL not running, start it
   ```

2. **Check .env.local is correct:**
   ```
   DATABASE_URL=postgresql://[user]:[password]@localhost:5432/[dbname]
   ```

3. **Test the health endpoint:**
   ```
   http://localhost:3000/api/admin/health
   ```

### Step B: Ensure Tables Exist

1. **Run initialization:**
   ```bash
   npm run db:init
   ```

2. **Check for errors in output**

3. **Verify tables in database:**
   ```sql
   SELECT * FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```

### Step C: Test Upload Endpoint

1. **Visit health check:**
   ```
   http://localhost:3000/api/admin/health
   ```

2. **Should show: "success": true**

3. **Then visit test endpoint:**
   ```
   http://localhost:3000/api/admin/test-upload
   ```

4. **Should show: "success": true**

---

## Quick Diagnostic Command

```bash
# Test database connection directly
psql -U postgres -h localhost -d your_database -c "SELECT COUNT(*) FROM documents;"
```

**If it works:** Shows document count
**If it fails:** Shows connection error (tells you what's wrong)

---

## Expected vs Actual

### ✅ Working:
```
Health check: ✅ success
Test-upload: ✅ success
Can see documents or empty list
No SQL errors
```

### ❌ Broken:
```
Health check: ❌ Database connection failed
Test-upload: ❌ 500 error
SQL error in logs
Can't connect to database
```

---

## Files I've Added to Help

1. **`app/api/admin/health/route.ts`** - New health check endpoint
2. **Updated `test-upload/route.ts`** - Better error handling

---

## What to Do Now

### Do This (2 minutes):

1. **Verify PostgreSQL is running**
   - Check if service is started
   - Try to connect with your DB tool

2. **Check .env.local**
   - Verify DATABASE_URL is correct
   - Especially password and database name

3. **Test health endpoint:**
   ```
   http://localhost:3000/api/admin/health
   ```

### If Health Check Works:

4. **Try test-upload endpoint:**
   ```
   http://localhost:3000/api/admin/test-upload
   ```

### If Still Getting Error:

5. **Run initialization:**
   ```bash
   npm run db:init
   npm run db:migrate
   ```

6. **Restart server:**
   ```bash
   npm run dev
   ```

---

## Most Likely Cause

Based on the error, **your database tables probably don't exist** or **database credentials are wrong**.

**The fix is probably:**

```bash
# Option 1: Tables don't exist
npm run db:init

# Option 2: Schema is outdated
npm run db:migrate

# Option 3: Restart server
npm run dev
```

---

## Verification Checklist

- [ ] PostgreSQL service is running
- [ ] DATABASE_URL in .env.local is correct
- [ ] Can connect to database with DB tool
- [ ] `/api/admin/health` returns success
- [ ] Tables exist in database
- [ ] `/api/admin/test-upload` returns success

**If all checked:** Database is working!

---

## Next Steps

1. **Check health endpoint:** `http://localhost:3000/api/admin/health`
2. **Tell me:** What does it say?
3. **If error:** What's the error message?
4. **Then:** I can tell you exactly what to do

---

**Start with:** Visit `/api/admin/health` and tell me if it says success or error.
