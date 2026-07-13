#!/usr/bin/env node

/**
 * Test script to simulate upload flow and check database
 * This will show us exactly where the divisionId is being lost
 */

import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const { Client } = pg
const client = new Client({
  connectionString: process.env.DATABASE_URL,
})

async function main() {
  try {
    console.log('🚀 Testing upload flow...\n')
    
    await client.connect()
    console.log('✓ Connected to database\n')

    // Get a user to upload as
    console.log('📋 Getting admin user...\n')
    const userResult = await client.query(`
      SELECT u.id, u.name, u.email, p.department_id, p.role_id
      FROM "user" u
      LEFT JOIN profiles p ON p."userId" = u.id
      LIMIT 1
    `)

    if (userResult.rows.length === 0) {
      console.log('❌ No users found\n')
      process.exit(1)
    }

    const user = userResult.rows[0]
    console.log('User found:')
    console.log(`  ID: ${user.id}`)
    console.log(`  Name: ${user.name}`)
    console.log(`  Email: ${user.email}\n`)

    // Get first department
    const deptResult = await client.query(`
      SELECT id, name, code
      FROM departments
      LIMIT 1
    `)

    if (deptResult.rows.length === 0) {
      console.log('❌ No departments found\n')
      process.exit(1)
    }

    const dept = deptResult.rows[0]
    console.log('Department found:')
    console.log(`  ID: ${dept.id}`)
    console.log(`  Name: ${dept.name}\n`)

    // Get a division for that department
    const divResult = await client.query(`
      SELECT id, name, code, department_id
      FROM divisions
      WHERE department_id = $1
      LIMIT 1
    `, [dept.id])

    if (divResult.rows.length === 0) {
      console.log('❌ No divisions found for this department\n')
      process.exit(1)
    }

    const div = divResult.rows[0]
    console.log('Division found:')
    console.log(`  ID: ${div.id}`)
    console.log(`  Name: ${div.name}`)
    console.log(`  Department ID: ${div.department_id}\n`)

    // Now simulate what the backend receives
    console.log('📝 Simulating document insert...\n')
    console.log('FormData that would be sent:')
    console.log(`  title: "Test Document"`)
    console.log(`  category: "other"`)
    console.log(`  departmentId: "${dept.id}"`)
    console.log(`  divisionId: "${div.id}"`)
    console.log(`  accessLevel: "internal"\n`)

    // Check the database schema to ensure columns exist
    console.log('📋 Checking documents table schema...\n')
    const schemaResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'documents'
      ORDER BY ordinal_position
    `)

    console.log('Documents table columns:')
    schemaResult.rows.forEach(col => {
      const highlight = col.column_name === 'division_id' ? ' ← DIVISION COLUMN' : ''
      console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})${highlight}`)
    })

    if (!schemaResult.rows.find(col => col.column_name === 'division_id')) {
      console.log('\n⚠️  WARNING: division_id column NOT FOUND in documents table!')
      console.log('   Need to run migration: node scripts/migrate-add-division-id-to-documents.js\n')
    } else {
      console.log('\n✓ division_id column EXISTS\n')
    }

    // Verify department_id column exists and is being used
    const hasDeptCol = schemaResult.rows.find(col => col.column_name === 'department_id')
    if (!hasDeptCol) {
      console.log('⚠️  WARNING: department_id column NOT FOUND in documents table!\n')
    } else {
      console.log('✓ department_id column EXISTS\n')
    }

    await client.end()
  } catch (err) {
    console.error('❌ Error:', err.message)
    process.exit(1)
  }
}

main()
