#!/usr/bin/env node

/**
 * Migration: Add division_id column to documents table
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
    console.log('🚀 Migrating: Adding division_id column to documents table\n');
    
    await client.connect();
    console.log('✓ Connected to database\n');

    // Check if documents table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'documents'
      );
    `);

    if (!tableExists.rows[0].exists) {
      console.log('❌ Documents table does not exist');
      process.exit(1);
    }

    // Check if division_id column already exists
    console.log('Checking if division_id column exists...');
    const columnExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'documents' 
        AND column_name = 'division_id'
      );
    `);

    if (columnExists.rows[0].exists) {
      console.log('⚠️  division_id column already exists\n');
      await client.end();
      process.exit(0);
    }

    // Add division_id column
    console.log('Adding division_id column to documents table...\n');
    await client.query(`
      ALTER TABLE documents 
      ADD COLUMN division_id TEXT
    `);
    console.log('✓ Added division_id column\n');

    // Create index for faster queries
    console.log('Creating index on division_id...');
    await client.query(`
      CREATE INDEX idx_documents_division_id 
      ON documents(division_id)
    `);
    console.log('✓ Created index\n');

    // Verify the change
    console.log('📋 Verification:\n');
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'documents'
      ORDER BY ordinal_position
    `);

    console.log('Documents table columns:');
    columns.rows.forEach(col => {
      const nullable = col.is_nullable === 'YES' ? 'nullable' : 'not null';
      console.log(`  ${col.column_name}: ${col.data_type} (${nullable})`);
    });

    console.log('\n✨ Migration complete!\n');

    await client.end();
    console.log('✓ Connection closed');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

main();
