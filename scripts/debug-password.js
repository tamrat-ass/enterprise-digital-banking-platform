#!/usr/bin/env node

const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function debugPassword() {
  try {
    const client = await pool.connect();

    // Get the account record
    const result = await client.query(`
      SELECT a.password FROM account a
      JOIN "user" u ON a."userId" = u.id
      WHERE u.email = $1
      LIMIT 1
    `, ['ahadu@gmail.com']);

    if (!result.rows.length) {
      console.log('No account found');
      process.exit(1);
    }

    const storedHash = result.rows[0].password;
    const testPassword = 'TestPassword123!';

    console.log('Stored hash:', storedHash);
    console.log('Stored hash type:', typeof storedHash);
    console.log('Stored hash length:', storedHash.length);
    console.log('\nTesting password: ' + testPassword);

    // Try to compare
    const match = await bcrypt.compare(testPassword, storedHash);
    console.log('\nPassword match:', match);

    if (!match) {
      console.log('\n⚠️  Password mismatch! The hash may be invalid or corrupted.');
      console.log('\nLet me create a fresh hash and update the database...');

      // Create new hash
      const newHash = await bcrypt.hash(testPassword, 12);
      console.log('\nNew hash:', newHash);

      // Verify new hash
      const newMatch = await bcrypt.compare(testPassword, newHash);
      console.log('New hash matches password:', newMatch);

      if (newMatch) {
        // Update database with new hash
        const updateResult = await client.query(`
          UPDATE account SET password = $1, "updatedAt" = NOW()
          WHERE id IN (
            SELECT a.id FROM account a
            JOIN "user" u ON a."userId" = u.id
            WHERE u.email = $2
          )
        `, [newHash, 'ahadu@gmail.com']);

        console.log(`\n✅ Updated ${updateResult.rowCount} account record(s)`);

        // Verify update
        const verifyResult = await client.query(`
          SELECT password FROM account a
          JOIN "user" u ON a."userId" = u.id
          WHERE u.email = $1
          LIMIT 1
        `, ['ahadu@gmail.com']);

        const verifyHash = verifyResult.rows[0].password;
        const verifyMatch = await bcrypt.compare(testPassword, verifyHash);
        console.log('Verification - password now matches:', verifyMatch);
      }
    }

    client.release();
    await pool.end();
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

debugPassword();
