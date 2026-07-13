#!/usr/bin/env node

/**
 * Display existing departments from the database
 * This script queries the database directly to show current departments
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
    console.log('🚀 Fetching Departments from Database\n');
    
    await client.connect();
    console.log('✓ Connected to database\n');

    // Query departments
    const result = await client.query('SELECT * FROM departments ORDER BY name ASC');
    
    console.log(`📊 Total departments: ${result.rows.length}\n`);
    
    if (result.rows.length === 0) {
      console.log('No departments found. Creating sample departments...\n');
      
      const departments = [
        { name: 'Finance', code: 'FIN', description: 'Finance and Accounting Department', headName: 'Alice Johnson' },
        { name: 'Human Resources', code: 'HR', description: 'Human Resources Management', headName: 'Bob Smith' },
        { name: 'Operations', code: 'OPS', description: 'Operations and Process Management', headName: 'Charlie Brown' },
        { name: 'Technology', code: 'TECH', description: 'Information Technology Services', headName: 'Diana Prince' },
        { name: 'Legal', code: 'LEG', description: 'Legal and Compliance Services', headName: 'Edward Norton' },
        { name: 'Marketing', code: 'MKT', description: 'Marketing and Communications', headName: 'Fiona Green' },
        { name: 'Sales', code: 'SALES', description: 'Sales and Business Development', headName: 'George Harris' },
      ];

      let added = 0;
      for (const dept of departments) {
        try {
          const id = crypto.randomUUID?.() || Math.random().toString(36).substr(2, 9);
          await client.query(
            'INSERT INTO departments (id, name, code, description, "head_name") VALUES ($1, $2, $3, $4, $5)',
            [id, dept.name, dept.code, dept.description, dept.headName]
          );
          console.log(`✓ Added: ${dept.name} (${dept.code})`);
          added++;
        } catch (err) {
          if (err.code === '23505') {
            console.log(`- ${dept.name}: already exists`);
          } else {
            console.error(`✗ Error adding ${dept.name}: ${err.message}`);
          }
        }
      }
      console.log(`\n✨ Added ${added} departments\n`);

      // Re-query to show final list
      const newResult = await client.query('SELECT * FROM departments ORDER BY name ASC');
      console.log(`📊 Total departments: ${newResult.rows.length}\n`);
      displayDepartments(newResult.rows);
    } else {
      displayDepartments(result.rows);
    }

    await client.end();
    console.log('\n✓ Connection closed');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

function displayDepartments(departments) {
  console.log('Departments:');
  console.log('═'.repeat(80));
  departments.forEach((dept, idx) => {
    console.log(`\n[${idx + 1}] ${dept.name}`);
    console.log(`    Code: ${dept.code}`);
    console.log(`    Head: ${dept.head_name || 'Not assigned'}`);
    console.log(`    Description: ${dept.description || 'N/A'}`);
    console.log(`    Created: ${new Date(dept.created_at).toLocaleDateString()}`);
  });
  console.log('\n' + '═'.repeat(80));
}

main();
