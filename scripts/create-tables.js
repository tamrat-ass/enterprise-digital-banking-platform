#!/usr/bin/env node

/**
 * Direct Database Table Creation Script
 * Run this with: node create-tables.js
 */

const { Pool } = require('pg');

// Your database connection
const pool = new Pool({
  user: 'postgres',
  password: '4840',
  host: 'localhost',
  port: 5432,
  database: 'ahadufile',
});

// SQL to create all tables
const createTablesSql = `

-- Better Auth Tables
CREATE TABLE IF NOT EXISTS "user" (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    image TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "session" (
    id TEXT PRIMARY KEY,
    "expiresAt" TIMESTAMP NOT NULL,
    token TEXT NOT NULL UNIQUE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL REFERENCES "user"(id)
);

CREATE TABLE IF NOT EXISTS "account" (
    id TEXT PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL REFERENCES "user"(id),
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP,
    "refreshTokenExpiresAt" TIMESTAMP,
    scope TEXT,
    password TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "verification" (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    "expiresAt" TIMESTAMP NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Organization
CREATE TABLE IF NOT EXISTS departments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    description TEXT,
    head_name TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    level INTEGER NOT NULL DEFAULT 1,
    permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    full_name TEXT,
    email TEXT,
    job_title TEXT,
    department_id TEXT,
    role_id TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Document Management
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    department_id TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    current_version INTEGER NOT NULL DEFAULT 1,
    tags JSONB NOT NULL DEFAULT '[]'::jsonb,
    owner_id TEXT NOT NULL,
    owner_name TEXT,
    access_level TEXT NOT NULL DEFAULT 'internal',
    expiry_date DATE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS document_versions (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL REFERENCES documents(id),
    version INTEGER NOT NULL,
    change_note TEXT,
    file_name TEXT,
    author_id TEXT,
    author_name TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Workflows
CREATE TABLE IF NOT EXISTS workflows (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    entity_type TEXT NOT NULL,
    steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    sla_hours INTEGER,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS approval_requests (
    id TEXT PRIMARY KEY,
    workflow_id TEXT,
    title TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    current_step INTEGER NOT NULL DEFAULT 1,
    total_steps INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'pending',
    requested_by TEXT,
    requested_by_name TEXT,
    assignee_name TEXT,
    priority TEXT NOT NULL DEFAULT 'medium',
    due_date DATE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Projects
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    department_id TEXT,
    status TEXT NOT NULL DEFAULT 'planning',
    priority TEXT NOT NULL DEFAULT 'medium',
    progress INTEGER NOT NULL DEFAULT 0,
    budget NUMERIC,
    spent NUMERIC DEFAULT 0,
    owner_name TEXT,
    start_date DATE,
    end_date DATE,
    risk_level TEXT DEFAULT 'low',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Vendors
CREATE TABLE IF NOT EXISTS vendors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    contact_email TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    risk_score INTEGER DEFAULT 0,
    risk_rating TEXT DEFAULT 'low',
    due_diligence_status TEXT DEFAULT 'pending',
    performance_score INTEGER,
    contract_value NUMERIC,
    onboarded_date DATE,
    renewal_date DATE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Contracts
CREATE TABLE IF NOT EXISTS contracts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    counterparty TEXT,
    vendor_id TEXT,
    type TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    value NUMERIC,
    start_date DATE,
    end_date DATE,
    auto_renew BOOLEAN DEFAULT false,
    owner_name TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Risks
CREATE TABLE IF NOT EXISTS risks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    department_id TEXT,
    likelihood INTEGER DEFAULT 1,
    impact INTEGER DEFAULT 1,
    severity TEXT DEFAULT 'low',
    status TEXT NOT NULL DEFAULT 'open',
    owner_name TEXT,
    control TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Compliance
CREATE TABLE IF NOT EXISTS compliance_items (
    id TEXT PRIMARY KEY,
    framework TEXT NOT NULL,
    control_ref TEXT,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'not_assessed',
    owner_name TEXT,
    last_reviewed DATE,
    next_review DATE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    "userId" TEXT,
    title TEXT NOT NULL,
    body TEXT,
    type TEXT DEFAULT 'info',
    is_read BOOLEAN NOT NULL DEFAULT false,
    link TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Audit
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    "userId" TEXT,
    actor_name TEXT,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    module TEXT,
    details TEXT,
    ip_address TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_documents_title ON documents(title);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_owner ON documents(owner_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_approval_requests_entity ON approval_requests(entity_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_vendors_risk ON vendors(risk_rating);
CREATE INDEX IF NOT EXISTS idx_vendors_status ON vendors(status);
CREATE INDEX IF NOT EXISTS idx_risks_severity ON risks(severity);
CREATE INDEX IF NOT EXISTS idx_risks_status ON risks(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs("userId");

`;

async function createTables() {
  const client = await pool.connect();
  try {
    console.log('🔄 Creating tables...\n');
    
    // Split SQL into individual statements and execute
    const statements = createTablesSql
      .split(';')
      .filter(stmt => stmt.trim())
      .map(stmt => stmt.trim() + ';');

    for (const statement of statements) {
      try {
        await client.query(statement);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`✅ ${statement.substring(0, 50)}... (already exists)`);
        } else {
          console.error(`❌ Error: ${error.message}`);
        }
      }
    }

    // Verify tables
    console.log('\n🔍 Verifying tables created:\n');
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('📊 Tables Created:');
    console.log('==================\n');
    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.table_name}`);
    });

    console.log(`\n✅ Total: ${result.rows.length} tables\n`);
    console.log('🎉 Database setup complete!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
    await pool.end();
  }
}

createTables();
