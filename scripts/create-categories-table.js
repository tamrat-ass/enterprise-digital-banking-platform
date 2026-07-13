import { db } from '../lib/db/index.js';
import { sql } from 'drizzle-orm';

async function createCategoriesTable() {
  try {
    console.log('Creating document_categories table...');
    
    // Create the table using raw SQL
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "document_categories" (
        "id" text PRIMARY KEY NOT NULL,
        "name" text NOT NULL UNIQUE,
        "code" text NOT NULL UNIQUE,
        "description" text,
        "color" text DEFAULT '#6B4423',
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamp NOT NULL DEFAULT NOW(),
        "updated_at" timestamp NOT NULL DEFAULT NOW()
      )
    `);

    console.log('✓ Table created successfully');

    // Insert default categories
    console.log('Inserting default categories...');
    
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
      await db.execute(sql`
        INSERT INTO "document_categories" (id, name, code, description, color, is_active, created_at, updated_at)
        VALUES (${cat.id}, ${cat.name}, ${cat.code}, ${cat.description}, ${cat.color}, true, NOW(), NOW())
        ON CONFLICT (name) DO NOTHING
      `);
    }

    console.log('✓ Default categories inserted');
    console.log('\nCategories created:');
    categories.forEach(cat => {
      console.log(`  - ${cat.name} (${cat.code})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('✗ Error creating table:', error);
    process.exit(1);
  }
}

createCategoriesTable();
