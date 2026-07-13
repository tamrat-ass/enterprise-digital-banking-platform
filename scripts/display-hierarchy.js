#!/usr/bin/env node

/**
 * Display the Department-Division hierarchy from the database
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
    console.log('🏢 Department-Division Hierarchy\n');
    console.log('═'.repeat(80));
    
    await client.connect();

    // Get all departments with their divisions
    const result = await client.query(`
      SELECT 
        d.id as dept_id,
        d.name as dept_name,
        d.code as dept_code,
        d.head_name as dept_head,
        d.description as dept_desc,
        COUNT(div.id) as div_count,
        d.created_at as dept_created
      FROM departments d
      LEFT JOIN divisions div ON d.id = div.department_id
      GROUP BY d.id, d.name, d.code, d.head_name, d.description, d.created_at
      ORDER BY d.name
    `);

    console.log(`\n📊 Summary: ${result.rows.length} departments\n`);

    for (const dept of result.rows) {
      console.log(`\n🏢 ${dept.dept_name.toUpperCase()}`);
      console.log(`   Code: ${dept.dept_code}`);
      console.log(`   Head: ${dept.dept_head || 'N/A'}`);
      console.log(`   Description: ${dept.dept_desc || 'N/A'}`);
      console.log(`   Divisions: ${dept.div_count}`);

      if (dept.div_count > 0) {
        // Get divisions for this department
        const divResult = await client.query(`
          SELECT 
            id,
            name,
            code,
            status,
            head_name,
            description
          FROM divisions
          WHERE department_id = $1
          ORDER BY name
        `, [dept.dept_id]);

        divResult.rows.forEach((div, idx) => {
          console.log(`   ${idx + 1}. ${div.name}`);
          console.log(`      Code: ${div.code}`);
          console.log(`      Status: ${div.status}`);
          console.log(`      Head: ${div.head_name || 'N/A'}`);
          if (div.description) {
            console.log(`      Description: ${div.description}`);
          }
        });
      }
    }

    // Statistics
    console.log('\n' + '═'.repeat(80));
    console.log('\n📈 Statistics:\n');

    const totalDept = await client.query('SELECT COUNT(*) as count FROM departments');
    const totalDiv = await client.query('SELECT COUNT(*) as count FROM divisions');
    const avgDiv = await client.query(`
      SELECT AVG(div_count) as average 
      FROM (
        SELECT COUNT(divisions.id) as div_count 
        FROM departments 
        LEFT JOIN divisions ON departments.id = divisions.department_id 
        GROUP BY departments.id
      ) t
    `);

    console.log(`Total Departments: ${totalDept.rows[0].count}`);
    console.log(`Total Divisions: ${totalDiv.rows[0].count}`);
    console.log(`Average Divisions per Department: ${parseFloat(avgDiv.rows[0].average).toFixed(2)}`);

    await client.end();
    console.log('\n✓ Connection closed');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
