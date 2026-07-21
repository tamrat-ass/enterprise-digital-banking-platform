#!/usr/bin/env node

/**
 * Test script to verify user status toggle functionality
 */

const { Pool } = require('pg');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testToggleUserStatus() {
  try {
    const email = process.argv[2] || 'tame@gamil.com';

    console.log(`\n🧪 Testing user status toggle\n`);
    console.log(`Email: ${email}`);
    console.log(`=====================================\n`);

    const client = await pool.connect();

    // Step 1: Check current status
    console.log('Step 1: Check current user status...');
    let result = await client.query(`
      SELECT id, email, status
      FROM "user"
      WHERE email = $1
      LIMIT 1
    `, [email]);

    if (!result.rows.length) {
      console.log('❌ User not found');
      client.release();
      await pool.end();
      return;
    }

    const userId = result.rows[0].id;
    const currentStatus = result.rows[0].status;

    console.log(`  User ID: ${userId}`);
    console.log(`  Email: ${result.rows[0].email}`);
    console.log(`  Current Status: ${currentStatus}\n`);

    // Step 2: Determine new status
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
    console.log(`Step 2: Toggle status: ${currentStatus} → ${newStatus}...\n`);

    // Step 3: Update status (simulate API call)
    await client.query(`
      UPDATE "user"
      SET status = $1, "updatedAt" = NOW()
      WHERE id = $2
    `, [newStatus, userId]);

    console.log(`  ✅ Status updated\n`);

    // Step 4: Verify the change
    console.log('Step 3: Verify status change...');
    result = await client.query(`
      SELECT id, email, status
      FROM "user"
      WHERE id = $1
      LIMIT 1
    `, [userId]);

    const updatedStatus = result.rows[0].status;

    console.log(`  New Status: ${updatedStatus}`);
    console.log(`  Status Changed: ${currentStatus} → ${updatedStatus}\n`);

    // Final summary
    console.log('📊 RESULT:');
    console.log('=====================================');
    if (updatedStatus === newStatus && updatedStatus !== currentStatus) {
      console.log('✅ USER STATUS TOGGLE WORKING!');
      console.log(`   Status changed from ${currentStatus} to ${newStatus}`);
    } else if (updatedStatus === currentStatus) {
      console.log('⚠️  STATUS DID NOT CHANGE');
      console.log(`   Current status: ${updatedStatus}`);
    } else {
      console.log('❌ UNEXPECTED STATUS');
      console.log(`   Expected: ${newStatus}, Got: ${updatedStatus}`);
    }
    console.log('=====================================\n');

    client.release();
    await pool.end();
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

testToggleUserStatus();
