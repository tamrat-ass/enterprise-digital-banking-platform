#!/usr/bin/env node

/**
 * Migration: Populate file_path for existing document versions
 * This script finds files in the uploads directory and links them to document versions
 */

import pg from 'pg';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { Client } = pg;
const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

async function main() {
  try {
    console.log('🚀 Migrating: Populating file_path for existing documents\n');
    
    await client.connect();
    console.log('✓ Connected to database\n');

    // Get all files in uploads directory
    console.log('Scanning uploads directory...');
    let uploadedFiles = [];
    try {
      uploadedFiles = await fs.readdir(UPLOAD_DIR);
      console.log(`Found ${uploadedFiles.length} files in uploads directory\n`);
    } catch (err) {
      console.log('❌ Uploads directory not found or empty\n');
      await client.end();
      process.exit(0);
    }

    // For each file, try to find the corresponding document and update it
    let updated = 0;
    for (const fileName of uploadedFiles) {
      try {
        // Extract document ID from filename (format: {documentId}.{extension})
        const documentId = fileName.split('.')[0];
        
        // Check if this document exists
        const doc = await client.query(
          'SELECT id FROM documents WHERE id = $1',
          [documentId]
        );
        
        if (doc.rows.length === 0) {
          console.log(`  ⊘ ${fileName}: No document found for ID ${documentId}`);
          continue;
        }

        // Update the latest version with file path
        const filePath = `/uploads/${fileName}`;
        const result = await client.query(
          `UPDATE document_versions 
           SET file_path = $1 
           WHERE document_id = $2 
           AND version = (SELECT MAX(version) FROM document_versions WHERE document_id = $2)
           RETURNING id`,
          [filePath, documentId]
        );

        if (result.rows.length > 0) {
          console.log(`  ✓ ${fileName}: Updated document_versions.file_path`);
          updated++;
        } else {
          console.log(`  ⊘ ${fileName}: No version found for document ${documentId}`);
        }
      } catch (err) {
        console.log(`  ✗ ${fileName}: Error - ${err.message}`);
      }
    }

    console.log(`\n✨ Migration complete! Updated ${updated} document versions.\n`);

    // Verify
    console.log('📋 Verification:\n');
    const withPath = await client.query(
      'SELECT COUNT(*) FROM document_versions WHERE file_path IS NOT NULL'
    );
    const total = await client.query(
      'SELECT COUNT(*) FROM document_versions'
    );

    console.log(`Document versions with file_path: ${withPath.rows[0].count} / ${total.rows[0].count}`);

    await client.end();
    console.log('\n✓ Connection closed');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

main();
