#!/usr/bin/env node

const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testPasswordVerify() {
  try {
    const email = process.argv[2] || 'tame@gamil.com';
    const testPassword = 'TestPassword123!';

    console.log(`\n🧪 Testing password verification for: ${email}\n`);

    const client = await pool.connect();

    // Get the stored hash
    const result = await client.query(`
      SELECT a.password FROM account a
      JOIN "user" u ON a."userId" = u.id
      WHERE u.email = $1
      LIMIT 1
    `, [email]);

    if (!result.rows.length) {
      console.log('❌ No account found');
      client.release();
      await pool.end();
      return;
    }

    const storedHash = result.rows[0].password;

    console.log('Stored Hash Info:');
    console.log(`  Full hash: ${storedHash}`);
    console.log(`  Length: ${storedHash.length}`);
    console.log(`  First 10: ${storedHash.substring(0, 10)}`);
    console.log(`  Last 10: ${storedHash.substring(storedHash.length - 10)}`);

    console.log('\nTest Password:');
    console.log(`  Password: ${testPassword}`);
    console.log(`  Length: ${testPassword.length}`);

    console.log('\n🔄 Testing bcrypt.compare()...');
    try {
      const matches = await bcrypt.compare(testPassword, storedHash);
      console.log(`  Result: ${matches}`);
      
      if (matches) {
        console.log('\n✅ Password verification WORKS!');
      } else {
        console.log('\n❌ Password verification FAILED - hashes don\'t match');
        console.log('\n💡 Possible solutions:');
        console.log('   1. Password has changed');
        console.log('   2. Hash is corrupted');
        console.log('   3. Wrong password stored');
        
        // Try to create a fresh hash and update
        console.log('\n🔄 Creating fresh hash with same password...');
        const freshHash = await bcrypt.hash(testPassword, 12);
        console.log(`  New hash: ${freshHash}`);
        
        console.log('\n🔄 Testing fresh hash...');
        const freshMatches = await bcrypt.compare(testPassword, freshHash);
        console.log(`  Fresh result: ${freshMatches}`);
        
        if (freshMatches) {
          console.log('\n✅ Fresh hash works - updating database...');
          
          const updateResult = await client.query(`
            UPDATE account SET password = $1, "updatedAt" = NOW()
            WHERE id IN (
              SELECT a.id FROM account a
              JOIN "user" u ON a."userId" = u.id
              WHERE u.email = $2
            )
          `, [freshHash, email]);
          
          console.log(`  Updated ${updateResult.rowCount} record(s)`);
          console.log('\n✅ Password updated successfully!');
          console.log('\n🎉 User can now sign in!');
        }
      }
    } catch (err) {
      console.error('❌ Error during bcrypt comparison:', err.message);
    }

    client.release();
    await pool.end();
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

testPasswordVerify();
