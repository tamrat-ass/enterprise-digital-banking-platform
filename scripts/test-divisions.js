#!/usr/bin/env node

/**
 * Test divisions API
 */

const baseURL = 'http://localhost:3000';

async function testDivisionsAPI() {
  console.log('🧪 Testing Divisions API\n');

  try {
    // Get departments with divisions
    console.log('1️⃣  GET /api/departments (with divisions)\n');
    const deptResponse = await fetch(`${baseURL}/api/departments`, {
      credentials: 'include',
    });

    if (!deptResponse.ok) {
      throw new Error(`Departments API returned ${deptResponse.status}`);
    }

    const deptData = await deptResponse.json();
    const departments = deptData.data || [];

    console.log(`Total departments: ${departments.length}\n`);

    departments.forEach((dept, idx) => {
      const divCount = dept.divisions?.length || 0;
      console.log(`[${idx + 1}] ${dept.name} (${dept.code})`);
      console.log(`    Head: ${dept.headName || 'N/A'}`);
      console.log(`    Divisions: ${divCount}`);
      if (dept.divisions && dept.divisions.length > 0) {
        dept.divisions.forEach((div, didx) => {
          console.log(`      - ${div.name} (${div.code})`);
        });
      }
      console.log();
    });

    // Get divisions for specific department
    if (departments.length > 0) {
      const firstDept = departments[0];
      console.log(`\n2️⃣  GET /api/divisions?departmentId=${firstDept.id}\n`);
      
      const divResponse = await fetch(
        `${baseURL}/api/divisions?departmentId=${firstDept.id}`,
        { credentials: 'include' }
      );

      if (!divResponse.ok) {
        throw new Error(`Divisions API returned ${divResponse.status}`);
      }

      const divData = await divResponse.json();
      const divisions = divData.data || [];

      console.log(`Divisions in ${firstDept.name}: ${divisions.length}\n`);
      divisions.forEach((div, idx) => {
        console.log(`[${idx + 1}] ${div.name}`);
        console.log(`    Code: ${div.code}`);
        console.log(`    Status: ${div.status}`);
        console.log(`    Head: ${div.headName || 'N/A'}`);
        console.log();
      });
    }

    console.log('✨ All tests passed!');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

setTimeout(testDivisionsAPI, 1000);
