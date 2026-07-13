#!/usr/bin/env node

/**
 * CloudConvert API Test Script
 * 
 * Tests if CloudConvert API is working correctly
 * Usage: node test-conversion-debug.js
 */

const fs = require('fs/promises')
const path = require('path')

const CLOUDCONVERT_API_KEY = process.env.CLOUDCONVERT_API_KEY

console.log('='.repeat(60))
console.log('CloudConvert API Test')
console.log('='.repeat(60))

// Step 1: Check API key
console.log('\n1. Checking API key...')
if (!CLOUDCONVERT_API_KEY) {
  console.error('❌ ERROR: CLOUDCONVERT_API_KEY not set in environment')
  console.error('   Add CLOUDCONVERT_API_KEY to .env.local')
  process.exit(1)
}

if (CLOUDCONVERT_API_KEY.length < 50) {
  console.error('❌ ERROR: API key seems too short')
  process.exit(1)
}

console.log('✅ API key found (', CLOUDCONVERT_API_KEY.substring(0, 50) + '...' + ')')

// Step 2: Test account endpoint
console.log('\n2. Testing CloudConvert account endpoint...')
fetch('https://api.cloudconvert.com/v2/account', {
  headers: {
    'Authorization': `Bearer ${CLOUDCONVERT_API_KEY}`,
  },
})
  .then(async res => {
    if (!res.ok) {
      console.error(`❌ ERROR: ${res.status} ${res.statusText}`)
      const body = await res.text()
      console.error('   Response:', body.substring(0, 200))
      process.exit(1)
    }
    const data = await res.json()
    console.log('✅ API is accessible')
    console.log('   Account:', data.data?.email || data.data?.id)
    console.log('   Plan:', data.data?.plan)
    console.log('   Conversions:', data.data?.conversions_count || 'N/A')
  })
  .then(() => {
    console.log('\n' + '='.repeat(60))
    console.log('✅ All tests passed!')
    console.log('='.repeat(60))
    console.log('\nYour CloudConvert API is working correctly.')
    console.log('The preview feature should work when you upload a Word file.')
  })
  .catch(err => {
    console.error('\n❌ Test failed:', err.message)
    process.exit(1)
  })
