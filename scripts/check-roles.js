#!/usr/bin/env node

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { Client } = pg;
const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  try {
    await client.connect();

    const result = await client.query('SELECT id, name, level, permissions FROM roles ORDER BY level DESC');
    
    console.log('📋 Roles in Database:\n');
    result.rows.forEach(role => {
      console.log(`${role.name} (${role.id})`);
      console.log(`  Level: ${role.level}`);
      console.log(`  Permissions: ${typeof role.permissions === 'string' ? role.permissions : JSON.stringify(role.permissions).substring(0, 50) + '...'}\n`);
    });

    await client.end();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
