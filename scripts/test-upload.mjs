#!/usr/bin/env node

/**
 * Test script to verify document upload with division ID
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
    console.log('🚀 Testing document uploads...\n')
    
    await client.connect()
    console.log('✓ Connected to database\n')

    // Check recent documents
    console.log('📋 Recent documents:\n')
    const documents = await client.query(`
      SELECT 
        id,
        title,
        department_id,
        division_id,
        status,
        created_at
      FROM documents
      ORDER BY created_at DESC
      LIMIT 10
    `)

    if (documents.rows.length === 0) {
      console.log('No documents found\n')
    } else {
      documents.rows.forEach((doc, idx) => {
        console.log(`${idx + 1}. ${doc.title}`)
        console.log(`   ID: ${doc.id}`)
        console.log(`   Department ID: ${doc.department_id || 'null'}`)
        console.log(`   Division ID: ${doc.division_id || 'null'}`)
        console.log(`   Status: ${doc.status}`)
        console.log(`   Created: ${doc.created_at}\n`)
      })
    }

    // Check divisions
    console.log('\n📋 Available divisions:\n')
    const divisions = await client.query(`
      SELECT 
        id,
        name,
        department_id,
        code
      FROM divisions
      LIMIT 10
    `)

    if (divisions.rows.length === 0) {
      console.log('No divisions found\n')
    } else {
      divisions.rows.forEach((div, idx) => {
        console.log(`${idx + 1}. ${div.name} (${div.code})`)
        console.log(`   ID: ${div.id}`)
        console.log(`   Department ID: ${div.department_id}\n`)
      })
    }

    // Check departments
    console.log('\n📋 Available departments:\n')
    const departments = await client.query(`
      SELECT 
        id,
        name,
        code
      FROM departments
      LIMIT 10
    `)

    if (departments.rows.length === 0) {
      console.log('No departments found\n')
    } else {
      departments.rows.forEach((dept, idx) => {
        console.log(`${idx + 1}. ${dept.name} (${dept.code})`)
        console.log(`   ID: ${dept.id}\n`)
      })
    }

    console.log('✓ Test complete\n')

    await client.end()
  } catch (err) {
    console.error('❌ Error:', err.message)
    process.exit(1)
  }
}

main()
