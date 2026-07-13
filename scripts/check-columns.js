#!/usr/bin/env node

const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: '4840',
  host: 'localhost',
  port: 5432,
  database: 'ahadufile',
});

async function checkColumns() {
  const client = await pool.connect();
  try {
    console.log('🔍 Checking all table columns...\n');

    const tables = [
      'user',
      'session',
      'account',
      'verification',
      'departments',
      'roles',
      'profiles',
      'documents',
      'document_versions',
      'workflows',
      'approval_requests',
      'projects',
      'vendors',
      'contracts',
      'risks',
      'compliance_items',
      'notifications',
      'audit_logs'
    ];

    for (const table of tables) {
      const result = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [table]);

      console.log(`\n📋 TABLE: ${table}`);
      console.log('═══════════════════════════════════════════════════');
      result.rows.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        console.log(`  • ${col.column_name.padEnd(25)} ${col.data_type.padEnd(20)} ${nullable}${defaultVal}`);
      });
    }

    console.log('\n✅ Column check complete!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
    await pool.end();
  }
}

checkColumns();
