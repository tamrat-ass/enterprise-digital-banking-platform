#!/usr/bin/env node

/**
 * Test API endpoints with proper headers/cookies simulation
 */

async function testEndpoints() {
  const baseURL = 'http://localhost:3000';

  console.log('🧪 Testing API Endpoints\n');

  // Add sample departments first
  console.log('➕ Adding sample departments...\n');
  const departments = [
    { name: 'Finance', code: 'FIN', description: 'Finance and Accounting', headName: 'Alice Johnson' },
    { name: 'Human Resources', code: 'HR', description: 'Human Resources', headName: 'Bob Smith' },
    { name: 'Operations', code: 'OPS', description: 'Operations Management', headName: 'Charlie Brown' },
    { name: 'Technology', code: 'TECH', description: 'Information Technology', headName: 'Diana Prince' },
    { name: 'Legal', code: 'LEG', description: 'Legal and Compliance', headName: 'Edward Norton' },
  ];

  for (const dept of departments) {
    try {
      const response = await fetch(`${baseURL}/api/departments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(dept),
      });
      if (response.ok) {
        console.log(`   ✓ Added department: ${dept.name}`);
      } else {
        const error = await response.json();
        if (error.error?.includes('already exists')) {
          console.log(`   - Department ${dept.name} already exists`);
        } else {
          console.log(`   ✗ Failed to add ${dept.name}: ${error.error}`);
        }
      }
    } catch (err) {
      console.error(`   ✗ Error adding ${dept.name}: ${err.message}`);
    }
  }

  console.log('\n---\n');

  // Test categories
  console.log('1️⃣  GET /api/categories');
  try {
    const response = await fetch(`${baseURL}/api/categories`, {
      headers: {
        'Accept': 'application/json',
      },
      credentials: 'include', // Include cookies
    });
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Categories: ${data.data?.length || 0}`);
    if (data.data && data.data.length > 0) {
      console.log(`   First: ${data.data[0].name}\n`);
    }
  } catch (err) {
    console.error(`   Error: ${err.message}\n`);
  }

  // Test departments
  console.log('2️⃣  GET /api/departments');
  try {
    const response = await fetch(`${baseURL}/api/departments`, {
      headers: {
        'Accept': 'application/json',
      },
      credentials: 'include',
    });
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Departments: ${data.data?.length || 0}`);
    if (data.data && data.data.length > 0) {
      data.data.forEach((dept, idx) => {
        console.log(`   [${idx + 1}] ${dept.name} (${dept.code}) - ${dept.headName || 'No head assigned'}`);
      });
      console.log();
    }
  } catch (err) {
    console.error(`   Error: ${err.message}\n`);
  }

  // Test documents
  console.log('3️⃣  GET /api/documents');
  try {
    const response = await fetch(`${baseURL}/api/documents?page=1&limit=5`, {
      headers: {
        'Accept': 'application/json',
      },
      credentials: 'include',
    });
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    if (response.ok) {
      const docs = data.data?.data || [];
      console.log(`   Documents: ${docs.length}`);
      if (docs.length > 0) {
        console.log(`   First: ${docs[0].title}`);
        console.log(`   Response structure:`);
        console.log(`     - success: ${data.success}`);
        console.log(`     - data.data exists: ${!!data.data?.data}`);
        console.log(`     - data.pagination: ${JSON.stringify(data.data?.pagination)}`);
      }
    } else {
      console.log(`   Error: ${data.error}`);
    }
    console.log();
  } catch (err) {
    console.error(`   Error: ${err.message}\n`);
  }

  process.exit(0);
}

// Run after a short delay to ensure server is ready
setTimeout(testEndpoints, 1000);
