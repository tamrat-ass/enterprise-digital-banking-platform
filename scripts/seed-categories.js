#!/usr/bin/env node

import { db } from '../lib/db/index.js';
import { documentCategories } from '../lib/db/schema.js';

/**
 * Seed script to create and populate the document_categories table
 */

async function seedCategories() {
  try {
    console.log('🌱 Starting categories seeding...\n');

    const categories = [
      {
        id: 'cat-001',
        name: 'Financial Reports',
        code: 'FIN_REP',
        description: 'Financial and accounting reports',
        color: '#2E7D32',
        isActive: true,
      },
      {
        id: 'cat-002',
        name: 'Contracts',
        code: 'CONTRACT',
        description: 'Contract documents and agreements',
        color: '#1565C0',
        isActive: true,
      },
      {
        id: 'cat-003',
        name: 'Policies',
        code: 'POLICY',
        description: 'Company policies and procedures',
        color: '#F57C00',
        isActive: true,
      },
      {
        id: 'cat-004',
        name: 'HR Documents',
        code: 'HR_DOC',
        description: 'Human resources documents',
        color: '#7B1FA2',
        isActive: true,
      },
      {
        id: 'cat-005',
        name: 'General',
        code: 'GENERAL',
        description: 'General documents',
        color: '#6B4423',
        isActive: true,
      },
    ];

    // Insert categories - this will create the table if it doesn't exist
    // and ignore duplicates
    for (const category of categories) {
      try {
        const existing = await db
          .select()
          .from(documentCategories)
          .where(eq(documentCategories.id, category.id))
          .limit(1);

        if (existing.length === 0) {
          await db.insert(documentCategories).values(category);
          console.log(`✓ Created category: ${category.name}`);
        } else {
          console.log(`- Category already exists: ${category.name}`);
        }
      } catch (err) {
        // Ignore constraint errors
        if (err.code === '23505') {
          console.log(`- Category already exists: ${category.name}`);
        } else {
          throw err;
        }
      }
    }

    // Verify
    const total = await db.select().from(documentCategories);
    console.log(`\n✓ Categories seeding complete! Total: ${total.length}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
    process.exit(1);
  }
}

seedCategories();
