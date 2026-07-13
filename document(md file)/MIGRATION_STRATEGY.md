# 🔄 Database Migration Strategy

Complete guide for managing database schema changes and migrations using Drizzle ORM.

## Overview

This platform uses **Drizzle ORM** for type-safe database access and migrations. All schema changes are tracked and versioned.

## Current Schema Status

### Tables Created (18 total)

**Authentication & Sessions:**
- `user` - User accounts
- `session` - Active sessions
- `account` - OAuth accounts
- `verification` - Email verification tokens

**Organization:**
- `departments` - Department records
- `roles` - Role definitions
- `profiles` - User profiles with role assignment

**Core Modules:**
- `documents` - Document records
- `document_versions` - Document version history
- `workflows` - Workflow definitions
- `approval_requests` - Approval workflow instances
- `projects` - Project records
- `vendors` - Vendor records
- `contracts` - Contract records
- `risks` - Risk register
- `compliance_items` - Compliance controls
- `notifications` - User notifications
- `audit_logs` - Immutable audit trail

## Setting Up Drizzle Migrations

### 1. Create Migration Directory

```bash
mkdir -p migrations
```

### 2. Generate Migration Files

```bash
pnpm db:generate
```

This creates migration files based on schema changes.

### 3. Run Migrations

```bash
pnpm db:migrate
```

Applies pending migrations to database.

## Workflow: Adding New Column

### Example: Add phone number to profiles

#### Step 1: Update Schema

Edit `lib/db/schema.ts`:

```typescript
export const profiles = pgTable("profiles", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  fullName: text("full_name"),
  email: text("email"),
  jobTitle: text("job_title"),
  phoneNumber: text("phone_number"),  // NEW
  departmentId: text("department_id"),
  roleId: text("role_id"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})
```

#### Step 2: Generate Migration

```bash
pnpm db:generate
```

Creates file: `migrations/0001_add_phone_number.ts`

Generated migration:

```typescript
import { sql } from "drizzle-orm"
import { pgTable, text } from "drizzle-orm/pg-core"

export async function up(db: Database) {
  await db.schema
    .alterTable("profiles")
    .addColumn("phone_number", text("phone_number"))
    .execute()
}

export async function down(db: Database) {
  await db.schema
    .alterTable("profiles")
    .dropColumn("phone_number")
    .execute()
}
```

#### Step 3: Apply Migration

```bash
pnpm db:migrate
```

#### Step 4: Update Types

TypeScript automatically infers new type from schema.

## Common Migration Scenarios

### Add New Table

```typescript
// In schema.ts
export const newTable = pgTable("new_table", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

// Then generate and migrate
pnpm db:generate
pnpm db:migrate
```

### Add Index

```typescript
import { index } from "drizzle-orm/pg-core"

export const documents = pgTable(
  "documents",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    // ...
  },
  (table) => ({
    titleIdx: index("idx_documents_title").on(table.title),
  })
)
```

### Add Foreign Key Constraint

```typescript
export const comments = pgTable("comments", {
  id: text("id").primaryKey(),
  documentId: text("document_id")
    .notNull()
    .references(() => documents.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
})
```

### Add Unique Constraint

```typescript
export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
  },
  (table) => ({
    emailUnique: uniqueIndex("idx_users_email_unique").on(table.email),
  })
)
```

### Rename Column

Manual SQL in migration:

```typescript
export async function up(db: Database) {
  await db.schema.raw(
    sql`ALTER TABLE documents RENAME COLUMN owner_id TO owner_user_id`
  )
}
```

### Change Column Type

```typescript
export async function up(db: Database) {
  await db.schema
    .alterTable("vendors")
    .alterColumn("risk_score", {
      type: "numeric",
    })
    .execute()
}
```

## Database Inspector

### Open Drizzle Studio

Interactive UI to inspect and modify data:

```bash
pnpm db:studio
```

Opens at `http://local.drizzle.studio`

Features:
- View all tables and data
- Execute queries
- Manage relationships
- Export data

## Seed Data

### Create Seed Script

Create `scripts/seed.ts`:

```typescript
import { db } from "@/lib/db"
import { departments, roles } from "@/lib/db/schema"

async function seed() {
  console.log("Starting seed...")

  // Seed departments
  await db.insert(departments).values([
    {
      id: crypto.randomUUID(),
      name: "IT Department",
      code: "IT",
    },
    {
      id: crypto.randomUUID(),
      name: "Risk Department",
      code: "RISK",
    },
  ])

  console.log("✅ Seeding complete")
}

seed()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
```

### Run Seed

```bash
pnpm db:seed
```

## Backup & Restore

### Backup Database

```bash
pg_dump -U meridian_user -d meridian > backup-$(date +%Y%m%d-%H%M%S).sql
```

### Restore Database

```bash
psql -U meridian_user -d meridian < backup-20240101-120000.sql
```

### Remote Backup (Vercel)

```bash
# Get backup URL from Vercel dashboard
curl https://api.vercel.com/v13/...
```

## Version Control

### Track Migrations

Migrations are committed to Git:

```bash
git add migrations/
git commit -m "chore: add phone_number to profiles table"
```

### Merge Conflicts

If two devs add migrations:

1. Manually run both migrations locally
2. Verify schema consistency
3. Test application
4. Commit both migration files

## Deployment Pipeline

### Development

```bash
git pull
pnpm db:migrate  # Applies pending migrations
pnpm dev
```

### Staging

```bash
DATABASE_URL=staging_url pnpm db:migrate
# Deploy app
```

### Production

```bash
DATABASE_URL=production_url pnpm db:migrate
# Deploy app
# Monitor application
```

## Safety Practices

### Before Major Changes

1. **Backup Production:**
   ```bash
   pg_dump -Fc production_url > backup-pre-migration.dump
   ```

2. **Test Locally:**
   ```bash
   pnpm db:migrate
   npm run test
   ```

3. **Test in Staging:**
   ```bash
   # Deploy to staging
   # Run smoke tests
   ```

4. **Plan Downtime (if needed)**

### Reversible Migrations

Always write `down` migrations:

```typescript
export async function down(db: Database) {
  await db.schema
    .alterTable("profiles")
    .dropColumn("phone_number")
    .execute()
}
```

### Rollback on Failure

```bash
# Verify migration status
psql -U meridian_user -d meridian
SELECT * FROM drizzle_migrations;

# Manually rollback if needed
DELETE FROM drizzle_migrations WHERE name = '0001_...';
```

## Monitoring Migrations

### Check Migration Status

```bash
psql -U meridian_user -d meridian -c "SELECT * FROM drizzle_migrations;"
```

### Test Database Changes

```typescript
// In test file
import { db } from "@/lib/db"
import { profiles } from "@/lib/db/schema"

test("phone_number column exists", async () => {
  const result = await db.select().from(profiles).limit(1)
  expect(result[0]).toHaveProperty("phoneNumber")
})
```

## Performance Considerations

### Large Table Migrations

For tables with millions of rows:

1. **Use CONCURRENTLY:**
   ```typescript
   await db.schema.raw(
     sql`CREATE INDEX CONCURRENTLY idx_name ON table_name (column)`
   )
   ```

2. **Batch Changes:**
   ```typescript
   // Update in chunks
   for (let i = 0; i < totalRows; i += 1000) {
     await db.updateTable("table").offset(i).limit(1000).set({...})
   }
   ```

3. **Monitor Performance:**
   ```sql
   EXPLAIN ANALYZE SELECT * FROM large_table WHERE condition;
   ```

## Schema Documentation

### Document Changes

Create `SCHEMA.md`:

```markdown
# Database Schema

## Version: 1.0.0

### profiles table
- `id` - UUID primary key
- `userId` - Foreign key to user
- `fullName` - User full name
- `phoneNumber` - User phone (added in migration 0001)
```

## Troubleshooting

### Migration Fails

```
Error: migration failed
```

**Solution:**

1. Check database connection
2. Verify migration syntax
3. Check for conflicts with existing schema
4. Review migration logs

### Schema Out of Sync

Revert and regenerate:

```bash
pnpm db:generate --clean
```

### Connection Issues

```bash
# Test connection
psql -U meridian_user -d meridian -c "SELECT 1;"

# Check environment
echo $DATABASE_URL
```

## Best Practices

1. ✅ **One change per migration**
2. ✅ **Test migrations locally first**
3. ✅ **Always write rollback migrations**
4. ✅ **Backup before production migration**
5. ✅ **Review generated migrations**
6. ✅ **Document schema changes**
7. ✅ **Monitor performance impact**
8. ✅ **Use feature flags for risky changes**
9. ✅ **Keep migrations idempotent**
10. ✅ **Test with production data volumes**

## References

- [Drizzle ORM Docs](https://orm.drizzle.team)
- [PostgreSQL Migrations](https://www.postgresql.org/docs/current/sql-alteraction.html)
- [Database Design Best Practices](https://www.postgresql.org/docs/current/sql-createindex.html)

## Support

For migration issues:
- Check Drizzle documentation
- Review generated SQL
- Test in development first
- Contact database team

---

**Last Updated:** February 2024
**Drizzle Version:** 0.45.2
**PostgreSQL:** 12+

