#!/usr/bin/env node

/**
 * Migration: Add file_path column to document_versions table
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
    console.log('🚀 Migrating: Adding file_path column to document_versions table\n');
    
    await client.connect();
    console.log('✓ Connected to database\n');

    // Check if document_versions table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'document_versions'
      );
    `);

    if (!tableExists.rows[0].exists) {
      console.log('❌ document_versions table does not exist');
      process.exit(1);
    }

    // Check if file_path column already exists
    console.log('Checking if file_path column exists...');
    const columnExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'document_versions' 
        AND column_name = 'file_path'
      );
    `);

    if (columnExists.rows[0].exists) {
      console.log('⚠️  file_path column already exists\n');
      await client.end();
      process.exit(0);
    }

    // Add file_path column
    console.log('Adding file_path column to document_versions table...\n');
    await client.query(`
      ALTER TABLE document_versions 
      ADD COLUMN file_path TEXT DEFAULT NULL
    `);
    console.log('✓ Added file_path column\n');

    // Verify the change
    console.log('📋 Verification:\n');
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'document_versions'
      ORDER BY ordinal_position
    `);

    console.log('document_versions table columns:');
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
