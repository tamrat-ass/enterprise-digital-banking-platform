#!/usr/bin/env node

/**
 * Direct database table creation script
 * Runs SQL to create document_categories table and seed it
 */

import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

async function createCategoriesTable() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL not found in environment');
    process.exit(1);
  }

  console.log('🔗 Connecting to database...');
  const sql = postgres(connectionString);

  try {
    // Create table
    console.log('📋 Creating document_categories table...');
    await sql`
      CREATE TABLE IF NOT EXISTS document_categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        code TEXT NOT NULL UNIQUE,
        description TEXT,
        color TEXT DEFAULT '#6B4423',
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✓ Table created or already exists');

    // Insert default categories
    console.log('📊 Inserting default categories...');
    const categories = [
      {
        id: 'cat-001',
        name: 'Financial Reports',
        code: 'FIN_REP',
        description: 'Financial and accounting reports',
        color: '#2E7D32',
      },
      {
        id: 'cat-002',
        name: 'Contracts',
        code: 'CONTRACT',
        description: 'Contract documents and agreements',
        color: '#1565C0',
      },
      {
        id: 'cat-003',
        name: 'Policies',
        code: 'POLICY',
        description: 'Company policies and procedures',
        color: '#F57C00',
      },
      {
        id: 'cat-004',
        name: 'HR Documents',
        code: 'HR_DOC',
        description: 'Human resources documents',
        color: '#7B1FA2',
      },
      {
        id: 'cat-005',
        name: 'General',
        code: 'GENERAL',
        description: 'General documents',
        color: '#6B4423',
      },
    ];

    for (const cat of categories) {
      try {
        await sql`
          INSERT INTO document_categories (id, name, code, description, color, is_active)
          VALUES (${cat.id}, ${cat.name}, ${cat.code}, ${cat.description}, ${cat.color}, true)
          ON CONFLICT (id) DO NOTHING
        `;
        console.log(`  ✓ ${cat.name}`);
      } catch (err) {
        console.log(`  - ${cat.name} (already exists or error)`);
      }
    }

    // Verify
    console.log('\n📈 Verifying categories...');
    const results = await sql`SELECT COUNT(*) as count FROM document_categories`;
    console.log(`✓ Total categories in database: ${results[0].count}`);

    const allCategories = await sql`SELECT id, name FROM document_categories ORDER BY name`;
    console.log('\nCategories:');
    allCategories.forEach(cat => {
      console.log(`  • ${cat.name}`);
    });

    console.log('\n✅ Database setup complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

createCategoriesTable();
