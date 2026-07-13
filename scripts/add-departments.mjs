#!/usr/bin/env node

/**
 * Add sample departments to the database
 * Run this after logging in through the web interface
 */

const baseURL = 'http://localhost:3000';

const departments = [
  { name: 'Finance', code: 'FIN', description: 'Finance and Accounting Department', headName: 'Alice Johnson' },
  { name: 'Human Resources', code: 'HR', description: 'Human Resources Management', headName: 'Bob Smith' },
  { name: 'Operations', code: 'OPS', description: 'Operations and Process Management', headName: 'Charlie Brown' },
  { name: 'Technology', code: 'TECH', description: 'Information Technology Services', headName: 'Diana Prince' },
  { name: 'Legal', code: 'LEG', description: 'Legal and Compliance Services', headName: 'Edward Norton' },
  { name: 'Marketing', code: 'MKT', description: 'Marketing and Communications', headName: 'Fiona Green' },
  { name: 'Sales', code: 'SALES', description: 'Sales and Business Development', headName: 'George Harris' },
];

async function getDepartments() {
  try {
    const response = await fetch(`${baseURL}/api/departments`, {
      credentials: 'include',
    });
    const data = await response.json();
    return data.data || [];
  } catch (err) {
    console.error('Error fetching departments:', err.message);
    return [];
  }
}

async function addDepartment(dept) {
  try {
    const response = await fetch(`${baseURL}/api/departments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(dept),
    });

    if (response.ok) {
      return { success: true };
    } else {
      const error = await response.json();
      return { success: false, error: error.error };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function main() {
  console.log('🚀 Adding Sample Departments\n');
  
  // Check existing departments
  const existing = await getDepartments();
  const existingCodes = new Set(existing.map(d => d.code));

  console.log(`📊 Current departments: ${existing.length}`);
  if (existing.length > 0) {
    existing.forEach((dept, idx) => {
      console.log(`   [${idx + 1}] ${dept.name} (${dept.code})`);
    });
    console.log();
  }

  console.log('➕ Adding new departments...\n');

  let added = 0;
  let skipped = 0;

  for (const dept of departments) {
    if (existingCodes.has(dept.code)) {
      console.log(`   - ${dept.name} (${dept.code}) - already exists`);
      skipped++;
      continue;
    }

    const result = await addDepartment(dept);
    if (result.success) {
      console.log(`   ✓ Added ${dept.name} (${dept.code})`);
      added++;
    } else {
      console.log(`   ✗ Failed to add ${dept.name}: ${result.error}`);
    }
  }

  console.log(`\n📈 Summary:`);
  console.log(`   Added: ${added}`);
  console.log(`   Skipped: ${skipped}`);

  // Fetch and display final list
  console.log('\n📋 Final departments list:\n');
  const final = await getDepartments();
  final.forEach((dept, idx) => {
    console.log(`  [${idx + 1}] ${dept.name} (${dept.code})`);
    console.log(`      Head: ${dept.headName || 'Not assigned'}`);
    console.log(`      ${dept.description || 'No description'}\n`);
  });

  console.log(`✨ Total departments: ${final.length}`);
  process.exit(0);
}

// Run after a short delay to ensure server is ready
setTimeout(main, 500);
