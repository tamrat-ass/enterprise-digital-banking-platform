#!/usr/bin/env node

/**
 * Test the API endpoints
 */

async function testAPI() {
  const baseURL = 'http://localhost:3000';

  try {
    console.log('🧪 Testing API Endpoints\n');

    // Test categories endpoint
    console.log('📋 Testing /api/categories...');
    let response = await fetch(`${baseURL}/api/categories`);
    let data = await response.json();
    console.log(`  Status: ${response.status}`);
    console.log(`  Categories: ${data.data?.length || 0}`);
    if (data.data && data.data.length > 0) {
      console.log(`    First category: ${data.data[0].name}`);
    }

    // Test departments endpoint
    console.log('\n🏢 Testing /api/departments...');
    response = await fetch(`${baseURL}/api/departments`);
    data = await response.json();
    console.log(`  Status: ${response.status}`);
    console.log(`  Departments: ${data.data?.length || 0}`);
    if (data.data && data.data.length > 0) {
      console.log(`    First department: ${data.data[0].name}`);
    }

    // Test documents endpoint
    console.log('\n📄 Testing /api/documents...');
    response = await fetch(`${baseURL}/api/documents`);
    data = await response.json();
    console.log(`  Status: ${response.status}`);
    console.log(`  Documents: ${data.data?.data?.length || 0}`);
    if (data.data?.data && data.data.data.length > 0) {
      console.log(`    First document: ${data.data.data[0].title}`);
    }
    if (!response.ok) {
      console.log(`  Error: ${data.error}`);
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

// Wait a moment for server to be ready, then test
setTimeout(testAPI, 1000);
