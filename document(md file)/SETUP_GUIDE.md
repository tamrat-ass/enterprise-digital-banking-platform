# 🚀 Setup & Configuration Guide

Complete guide for setting up the Enterprise Digital Banking Governance Platform locally and in production.

## Prerequisites

- **Node.js** 18.17 or higher ([Download](https://nodejs.org))
- **PostgreSQL** 12 or higher ([Download](https://www.postgresql.org/download))
- **pnpm** 8+ or npm ([Install pnpm](https://pnpm.io/installation))
- **Git** for version control

## Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/enterprise-digital-banking-platform.git
cd enterprise-digital-banking-platform
```

### 2. Install Dependencies

```bash
pnpm install
# or
npm install
```

### 3. PostgreSQL Setup

#### Option A: Local PostgreSQL

```bash
# Create database
createdb meridian

# Create user (optional, for security)
createuser meridian_user -P  # will prompt for password
```

#### Option B: Using Docker

```bash
docker run --name meridian-db \
  -e POSTGRES_USER=meridian_user \
  -e POSTGRES_PASSWORD=your_secure_password \
  -e POSTGRES_DB=meridian \
  -p 5432:5432 \
  -d postgres:15-alpine
```

### 4. Environment Configuration

Create `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Database Connection
DATABASE_URL=postgresql://meridian_user:your_secure_password@localhost:5432/meridian

# Authentication
BETTER_AUTH_SECRET=your-secret-key-min-32-chars-recommended
BETTER_AUTH_URL=http://localhost:3000

# Development
NODE_ENV=development
```

**Generating a Secure Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. Initialize Database

#### Create Tables via Drizzle ORM

The schema is already defined in `lib/db/schema.ts`. Drizzle can auto-migrate.

For manual setup, you have two options:

**Option A: Using Drizzle Migrations (Recommended)**

```bash
# Generate migration files (if not already created)
pnpm db:generate

# Run migrations
pnpm db:migrate
```

**Option B: Direct SQL Execution**

```bash
# Connect to database
psql -U meridian_user -d meridian

# Then paste contents of schema file (or run migrations)
```

### 6. Seed Initial Data (Optional)

Create seed script at `scripts/seed.js`:

```javascript
import { db } from "./lib/db/index.js"
import {
  departments,
  roles,
  workflows,
} from "./lib/db/schema.js"

async function seed() {
  console.log("Seeding database...")

  // Seed departments
  await db.insert(departments).values([
    {
      id: crypto.randomUUID(),
      name: "Retail Banking",
      code: "RETAIL",
      description: "Retail banking operations",
    },
    {
      id: crypto.randomUUID(),
      name: "Risk & Compliance",
      code: "RISK",
      description: "Enterprise risk management",
    },
    {
      id: crypto.randomUUID(),
      name: "Finance",
      code: "FIN",
      description: "Financial operations",
    },
  ])

  console.log("✅ Database seeded successfully")
}

seed().catch(console.error)
```

Run seed:
```bash
pnpm db:seed
```

### 7. Start Development Server

```bash
pnpm dev
```

Server runs on `http://localhost:3000`

### 8. First User Setup

1. Navigate to `http://localhost:3000/sign-up`
2. Register with email and password
3. **First registered user automatically becomes Super Admin** ⭐
4. Log in to access dashboard

## Project Structure Initialization

After setup, verify directory structure:

```
enterprise-digital-banking-platform/
├── app/                  ✓ Frontend pages & API routes
├── lib/
│   ├── services/        ✓ Business logic layer
│   ├── db/              ✓ Database config
│   ├── schemas.ts       ✓ Validation schemas
│   └── auth.ts          ✓ Authentication config
├── components/          ✓ React components
├── public/              ✓ Static files
└── package.json         ✓ Dependencies
```

## Configuration Details

### Database Connection String Format

```
postgresql://[user]:[password]@[host]:[port]/[database]
```

Examples:
- Local: `postgresql://postgres:password@localhost:5432/meridian`
- With port: `postgresql://user:pass@db.example.com:5432/meridian`
- SSH Tunnel: `postgresql://user:pass@localhost:5433/meridian`

### Authentication Configuration

**Better Auth** settings in `lib/auth.ts`:

```typescript
export const auth = betterAuth({
  database: new Pool({ connectionString: process.env.DATABASE_URL }),
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [process.env.BETTER_AUTH_URL],
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
  },
})
```

## Development Tools

### Drizzle Studio (Database Inspector)

Visually inspect your database:

```bash
pnpm db:studio
```

Opens browser at `http://local.drizzle.studio`

### Database Debugging

View raw SQL logs:

```typescript
// In development, enable Drizzle logging
import { getTableColumns } from "drizzle-orm"

// Your queries will log to console
```

## Common Issues & Solutions

### Issue: Cannot connect to PostgreSQL

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solutions:**
1. Verify PostgreSQL is running: `pg_isready`
2. Check DATABASE_URL is correct
3. Verify user exists: `psql -U postgres -l`
4. Restart PostgreSQL service

### Issue: Super Admin Not Created

**Symptom:** First user not getting super_admin role

**Solution:**
```bash
# Check profiles table
psql -U meridian_user -d meridian
SELECT * FROM profiles WHERE role_id = 'super_admin';

# Manually set if needed
UPDATE profiles SET role_id = 'super_admin' WHERE id = 'your-user-id';
```

### Issue: Port 3000 Already in Use

```bash
# Use different port
PORT=3001 pnpm dev

# Or kill process on 3000
lsof -ti:3000 | xargs kill -9
```

### Issue: Dependencies Won't Install

```bash
# Clear cache
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Or use npm
npm install
```

## Database Schema Overview

### Core Tables

| Table | Purpose |
|-------|---------|
| `user` | Better Auth users |
| `session` | User sessions |
| `account` | OAuth accounts |
| `verification` | Email verification |
| `departments` | Organization departments |
| `roles` | Role definitions |
| `profiles` | User profile extensions |
| `documents` | Document records |
| `document_versions` | Document history |
| `approvals_requests` | Approval workflow |
| `workflows` | Workflow definitions |
| `projects` | Projects |
| `vendors` | Vendor records |
| `contracts` | Contract records |
| `risks` | Risk register |
| `compliance_items` | Compliance controls |
| `notifications` | User notifications |
| `audit_logs` | Activity trail |

## API Testing

### Using curl

```bash
# Get all documents
curl -X GET http://localhost:3000/api/documents

# Create a document
curl -X POST http://localhost:3000/api/documents \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","category":"policy"}'

# With authentication (add bearer token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/documents
```

### Using Postman

1. Import API collection
2. Set base URL: `http://localhost:3000/api`
3. Add auth tokens to headers
4. Test endpoints

### Using REST Client (VS Code)

Create `test.http`:

```http
@baseUrl = http://localhost:3000

### Get documents
GET {{baseUrl}}/api/documents

### Create document
POST {{baseUrl}}/api/documents
Content-Type: application/json

{
  "title": "Security Policy",
  "category": "policy",
  "accessLevel": "internal"
}
```

## Performance Optimization

### Database Indexing

Key indexes created automatically:

```sql
-- Full-text search on documents
CREATE INDEX idx_documents_title_fts 
  ON documents USING GIN(to_tsvector('english', title));

-- Approval status queries
CREATE INDEX idx_approvals_status 
  ON approval_requests(status);

-- Vendor risk queries
CREATE INDEX idx_vendors_risk_rating 
  ON vendors(risk_rating);
```

### Query Optimization

Use pagination for large datasets:

```typescript
// Good - paginated
const result = await DocumentService.listDocuments({
  page: 1,
  limit: 20, // Limit results
})

// Bad - no limit (performance issue)
const all = await db.select().from(documents)
```

## Production Deployment

### Pre-Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong `BETTER_AUTH_SECRET` (32+ chars)
- [ ] Configure secure database URL
- [ ] Set proper `BETTER_AUTH_URL` (https)
- [ ] Enable HTTPS
- [ ] Configure CORS for your domain
- [ ] Set up automated backups
- [ ] Configure logging

### Environment Variables (Production)

```env
NODE_ENV=production
DATABASE_URL=postgresql://prod_user:STRONG_PASSWORD@prod.db.host:5432/meridian
BETTER_AUTH_SECRET=your-very-secure-random-string-32-chars-min
BETTER_AUTH_URL=https://your-domain.com
```

### Vercel Deployment

1. Push to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

```bash
vercel --prod
```

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "start"]
```

Deploy:
```bash
docker build -t meridian:latest .
docker run -p 3000:3000 \
  -e DATABASE_URL="..." \
  -e BETTER_AUTH_SECRET="..." \
  meridian:latest
```

## Monitoring & Maintenance

### Database Backups

```bash
# Daily backup
pg_dump -U meridian_user -d meridian > backup-$(date +%Y%m%d).sql

# Restore
psql -U meridian_user -d meridian < backup-20240101.sql
```

### Log Monitoring

Check application logs:
```bash
# Development
tail -f .next/logs/app.log

# Production (if using external logging)
# Configure CloudWatch, Datadog, etc.
```

### Health Checks

API health endpoint:
```bash
curl http://localhost:3000/api/health
```

## Next Steps

1. ✅ Setup complete
2. Review [README.md](./README.md) for architecture
3. Read [API documentation](#) for endpoint details
4. Explore the dashboard at `http://localhost:3000`
5. Create sample data and test workflows
6. Configure backups and monitoring for production

---

**Need help?** Check the README or create an issue in the repository.
