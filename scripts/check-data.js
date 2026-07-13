#!/usr/bin/env node

import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

async function checkData() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ DATABASE_URL not found');
    process.exit(1);
  }

  const sql = postgres(connectionString);

  try {
    console.log('📊 Database Data Check\n');

    // Check categories
    const categories = await sql`SELECT COUNT(*) as count FROM document_categories`;
    console.log(`📋 Categories: ${categories[0].count}`);

    // Check departments
    const departments = await sql`SELECT COUNT(*) as count FROM departments`;
    console.log(`🏢 Departments: ${departments[0].count}`);

    // Check documents
    const documents = await sql`SELECT COUNT(*) as count FROM documents`;
    console.log(`📄 Documents: ${documents[0].count}`);

    // Check document versions
    const versions = await sql`SELECT COUNT(*) as count FROM document_versions`;
    console.log(`📑 Document Versions: ${versions[0].count}`);

    // List documents if any exist
    if (documents[0].count > 0) {
      console.log('\n📄 Documents:');
      const docs = await sql`
        SELECT id, title, status, created_at, owner_name, current_version 
        FROM documents 
        ORDER BY created_at DESC 
        LIMIT 10
      `;
      docs.forEach(doc => {
        console.log(`  • ${doc.title} (${doc.status}) - v${doc.current_version} - by ${doc.owner_name}`);
      });
    } else {
      console.log('\n⚠️  No documents in database yet');
    }

    // List departments
    if (departments[0].count > 0) {
      console.log('\n🏢 Departments:');
      const depts = await sql`SELECT id, name FROM departments ORDER BY name LIMIT 5`;
      depts.forEach(dept => {
        console.log(`  • ${dept.name}`);
      });
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

checkData();
