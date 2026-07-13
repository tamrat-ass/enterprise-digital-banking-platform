#!/usr/bin/env node

/**
 * Migration: Add divisions table
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { Client } = pg;
const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  try {
    console.log('🚀 Migrating: Adding Divisions Table\n');
    
    await client.connect();
    console.log('✓ Connected to database\n');

    // Check if table already exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'divisions'
      );
    `);

    if (tableExists.rows[0].exists) {
      console.log('⚠️  Divisions table already exists');
      console.log('Dropping existing table...\n');
      await client.query('DROP TABLE IF EXISTS divisions CASCADE');
    }

    // Add updatedAt to departments if it doesn't exist
    console.log('Updating departments table...');
    try {
      await client.query(`
        ALTER TABLE departments 
        ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      `);
      console.log('✓ Added updated_at to departments\n');
    } catch (e) {
      console.log('  (Column may already exist)\n');
    }

    // Create divisions table
    console.log('Creating divisions table...\n');
    await client.query(`
      CREATE TABLE divisions (
        id TEXT PRIMARY KEY,
        department_id TEXT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        code TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        head_name TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Created divisions table\n');

    // Create index for faster queries
    console.log('Creating indexes...');
    await client.query(`
      CREATE INDEX idx_divisions_department_id 
      ON divisions(department_id)
    `);
    await client.query(`
      CREATE INDEX idx_divisions_status 
      ON divisions(status)
    `);
    console.log('✓ Created indexes\n');

    // Add sample divisions
    console.log('Adding sample divisions...\n');
    
    const departments = await client.query('SELECT id, name FROM departments ORDER BY name');
    
    const sampleDivisions = {
      'Digital Banking': ['Digital Banking Agent', 'Agent Banking Innovation', 'Agent Banking Support'],
      'Finance': ['Financial Planning', 'Treasury Management', 'Accounting'],
      'Operations': ['Process Management', 'Quality Assurance', 'Service Delivery'],
      'Legal': ['Contract Management', 'Compliance Review', 'Dispute Resolution'],
      'Compliance & Risk': ['Risk Assessment', 'Compliance Monitoring', 'Audit Support'],
    };

    let totalAdded = 0;

    for (const dept of departments.rows) {
      const divisionNames = sampleDivisions[dept.name] || [];
      
      for (const divName of divisionNames) {
        try {
          const divId = `div-${Math.random().toString(36).substr(2, 9)}`;
          const divCode = divName
            .split(' ')
            .map(w => w[0])
            .join('')
            .toUpperCase();
          
          await client.query(`
            INSERT INTO divisions (id, department_id, name, code, status)
            VALUES ($1, $2, $3, $4, 'active')
          `, [divId, dept.id, divName, divCode]);
          
          console.log(`  ✓ Added: ${divName} to ${dept.name}`);
          totalAdded++;
        } catch (e) {
          console.log(`  - ${divName}: ${e.message}`);
        }
      }
    }

    console.log(`\n✨ Migration complete! Added ${totalAdded} sample divisions.\n`);

    // Verify
    console.log('📋 Verification:\n');
    const divisionsCount = await client.query('SELECT COUNT(*) FROM divisions');
    console.log(`Total divisions in database: ${divisionsCount.rows[0].count}`);

    const byDept = await client.query(`
      SELECT d.name, COUNT(div.id) as division_count
      FROM departments d
      LEFT JOIN divisions div ON d.id = div.department_id
      GROUP BY d.id, d.name
      ORDER BY d.name
    `);

    console.log('\nDivisions per department:');
    byDept.rows.forEach(row => {
      console.log(`  ${row.name}: ${row.division_count} divisions`);
    });

    await client.end();
    console.log('\n✓ Connection closed');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

main();
