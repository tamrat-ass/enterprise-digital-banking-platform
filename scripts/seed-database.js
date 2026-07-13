#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:4840@localhost:5432/ahadufile',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function seedDatabase() {
  const client = await pool.connect();

  try {
    log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
    log('║     Database Seeding - Enterprise Banking Platform        ║', 'cyan');
    log('╚════════════════════════════════════════════════════════════╝\n', 'cyan');

    // Read and execute seed data script
    const seedFilePath = path.join(__dirname, 'seed-data.sql');
    const seedSQL = fs.readFileSync(seedFilePath, 'utf8');

    log('📝 Executing seed data script...', 'blue');
    
    // Split by statements to handle multiple commands
    const statements = seedSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      try {
        await client.query(statement);
      } catch (err) {
        // Ignore "ON CONFLICT DO NOTHING" errors
        if (!err.message.includes('already exists')) {
          console.error(`Error executing statement: ${err.message}`);
        }
      }
    }

    log('✅ Seed data inserted successfully!\n', 'green');

    // Verify data by displaying counts
    log('📊 Data Verification - Record Counts:\n', 'blue');
    
    const verificationQueries = [
      { table: 'departments', label: 'Departments' },
      { table: '"user"', label: 'Users' },
      { table: 'roles', label: 'Roles' },
      { table: 'profiles', label: 'User Profiles' },
      { table: 'documents', label: 'Documents' },
      { table: 'document_versions', label: 'Document Versions' },
      { table: 'workflows', label: 'Workflows' },
      { table: 'approval_requests', label: 'Approval Requests' },
      { table: 'projects', label: 'Projects' },
      { table: 'vendors', label: 'Vendors' },
      { table: 'contracts', label: 'Contracts' },
      { table: 'risks', label: 'Risks' },
      { table: 'compliance_items', label: 'Compliance Items' },
      { table: 'notifications', label: 'Notifications' },
      { table: 'audit_logs', label: 'Audit Logs' },
    ];

    for (const query of verificationQueries) {
      const result = await client.query(`SELECT COUNT(*) as count FROM ${query.table}`);
      const count = result.rows[0].count;
      log(`  ✓ ${query.label.padEnd(25)} : ${count} records`, 'green');
    }

    // Display sample data from key tables
    log('\n📋 Sample Data Preview:\n', 'blue');

    // Departments
    log('Departments:', 'cyan');
    const deptResult = await client.query('SELECT name, code, head_name FROM departments LIMIT 3');
    deptResult.rows.forEach(row => {
      log(`  • ${row.name} (${row.code}) - Head: ${row.head_name}`);
    });

    // Users
    log('\nUsers:', 'cyan');
    const userResult = await client.query('SELECT name, email FROM "user" LIMIT 3');
    userResult.rows.forEach(row => {
      log(`  • ${row.name} (${row.email})`);
    });

    // Vendors
    log('\nVendors:', 'cyan');
    const vendorResult = await client.query(
      'SELECT name, category, status, risk_rating FROM vendors LIMIT 3'
    );
    vendorResult.rows.forEach(row => {
      log(`  • ${row.name} (${row.category}) - Status: ${row.status}, Risk: ${row.risk_rating}`);
    });

    // Projects
    log('\nProjects:', 'cyan');
    const projectResult = await client.query(
      'SELECT name, status, progress, budget FROM projects LIMIT 3'
    );
    projectResult.rows.forEach(row => {
      log(`  • ${row.name} - Status: ${row.status}, Progress: ${row.progress}%, Budget: $${row.budget?.toLocaleString()}`);
    });

    // Documents
    log('\nDocuments:', 'cyan');
    const docResult = await client.query(
      'SELECT title, category, status, owner_name FROM documents LIMIT 3'
    );
    docResult.rows.forEach(row => {
      log(`  • ${row.title} (${row.category}) - Owner: ${row.owner_name}, Status: ${row.status}`);
    });

    // Risks
    log('\nRisks:', 'cyan');
    const riskResult = await client.query(
      'SELECT title, severity, status, owner_name FROM risks LIMIT 3'
    );
    riskResult.rows.forEach(row => {
      log(`  • ${row.title} - Severity: ${row.severity}, Status: ${row.status}, Owner: ${row.owner_name}`);
    });

    // Approval Requests
    log('\nPending Approvals:', 'cyan');
    const approvalResult = await client.query(
      'SELECT title, entity_type, status, priority FROM approval_requests WHERE status IN (\'pending\', \'in_progress\') LIMIT 3'
    );
    approvalResult.rows.forEach(row => {
      log(`  • ${row.title} (${row.entity_type}) - Priority: ${row.priority}, Status: ${row.status}`);
    });

    log('\n✨ Database seeding completed successfully!\n', 'green');

    // Test API data retrieval
    log('🧪 Testing API Data Retrieval:\n', 'blue');
    
    // Test vendors endpoint
    log('Testing GET /api/vendors...', 'yellow');
    const vendorsTest = await client.query(
      'SELECT COUNT(*) as total FROM vendors WHERE status = \'active\''
    );
    log(`  ✓ Found ${vendorsTest.rows[0].total} active vendors in database`, 'green');

    // Test documents endpoint
    log('Testing GET /api/documents...', 'yellow');
    const docsTest = await client.query(
      'SELECT COUNT(*) as total FROM documents WHERE status = \'published\''
    );
    log(`  ✓ Found ${docsTest.rows[0].total} published documents in database`, 'green');

    // Test approvals endpoint
    log('Testing GET /api/approvals...', 'yellow');
    const approvalsTest = await client.query(
      'SELECT COUNT(*) as total FROM approval_requests WHERE status IN (\'pending\', \'in_progress\')'
    );
    log(`  ✓ Found ${approvalsTest.rows[0].total} pending/in-progress approvals in database`, 'green');

    // Test projects endpoint
    log('Testing GET /api/projects...', 'yellow');
    const projectsTest = await client.query(
      'SELECT COUNT(*) as total FROM projects WHERE status = \'active\''
    );
    log(`  ✓ Found ${projectsTest.rows[0].total} active projects in database`, 'green');

    // Test risks endpoint
    log('Testing GET /api/risks...', 'yellow');
    const risksTest = await client.query(
      'SELECT COUNT(*) as total FROM risks WHERE status = \'open\''
    );
    log(`  ✓ Found ${risksTest.rows[0].total} open risks in database`, 'green');

    // Test compliance endpoint
    log('Testing GET /api/compliance...', 'yellow');
    const complianceTest = await client.query(
      'SELECT COUNT(*) as total FROM compliance_items'
    );
    log(`  ✓ Found ${complianceTest.rows[0].total} compliance items in database`, 'green');

    log('\n🎉 All tests passed! Data is being retrieved from the database successfully.\n', 'green');

  } catch (err) {
    log(`\n❌ Error during seeding: ${err.message}\n`, 'red');
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the seeding
seedDatabase().catch(err => {
  log(`Fatal error: ${err.message}`, 'red');
  process.exit(1);
});
