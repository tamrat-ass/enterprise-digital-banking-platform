#!/usr/bin/env node

/**
 * Seed the database with test data
 * This script creates a test user and adds sample departments
 */

const baseURL = 'http://localhost:3000';

let authToken = null;
let sessionCookie = null;

async function signUp() {
  console.log('🔐 Creating test user...\n');
  
  try {
    const response = await fetch(`${baseURL}/api/auth/sign-up`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test Admin',
        email: 'admin@test.local',
        password: 'TestPassword123!',
      }),
    });

    const data = await response.json();
    console.log('Sign up response:', response.status);
    
    if (response.ok && data.token) {
      authToken = data.token;
      console.log('✓ User created/logged in');
      
      // Extract session cookie from response headers
      const setCookieHeader = response.headers.get('set-cookie');
      if (setCookieHeader) {
        sessionCookie = setCookieHeader.split(';')[0];
        console.log('✓ Session cookie obtained\n');
      }
      return true;
    } else if (response.status === 400 && data.error?.message?.includes('already exists')) {
      console.log('- User already exists, attempting sign in...\n');
      return await signIn();
    } else {
      console.error('✗ Failed to sign up:', data.error);
      return false;
    }
  } catch (err) {
    console.error('✗ Error during sign up:', err.message);
    return false;
  }
}

async function signIn() {
  console.log('🔐 Signing in test user...\n');
  
  try {
    const response = await fetch(`${baseURL}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@test.local',
        password: 'TestPassword123!',
      }),
    });

    const data = await response.json();
    console.log('Sign in response:', response.status);
    
    if (response.ok && data.token) {
      authToken = data.token;
      console.log('✓ Signed in successfully');
      
      // Extract session cookie from response headers
      const setCookieHeader = response.headers.get('set-cookie');
      if (setCookieHeader) {
        sessionCookie = setCookieHeader.split(';')[0];
        console.log('✓ Session cookie obtained\n');
      }
      return true;
    } else {
      console.error('✗ Failed to sign in:', data.error);
      return false;
    }
  } catch (err) {
    console.error('✗ Error during sign in:', err.message);
    return false;
  }
}

async function addDepartments() {
  console.log('➕ Adding sample departments...\n');
  
  const departments = [
    { name: 'Finance', code: 'FIN', description: 'Finance and Accounting', headName: 'Alice Johnson' },
    { name: 'Human Resources', code: 'HR', description: 'Human Resources Management', headName: 'Bob Smith' },
    { name: 'Operations', code: 'OPS', description: 'Operations Management', headName: 'Charlie Brown' },
    { name: 'Technology', code: 'TECH', description: 'Information Technology', headName: 'Diana Prince' },
    { name: 'Legal', code: 'LEG', description: 'Legal and Compliance', headName: 'Edward Norton' },
  ];

  for (const dept of departments) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };
      
      // Add auth headers
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      // Add session cookie if available
      let credentialHeaders = {};
      if (sessionCookie) {
        credentialHeaders['Cookie'] = sessionCookie;
      }

      const response = await fetch(`${baseURL}/api/departments`, {
        method: 'POST',
        headers: { ...headers, ...credentialHeaders },
        credentials: 'include',
        body: JSON.stringify(dept),
      });
      
      if (response.ok) {
        console.log(`   ✓ Added: ${dept.name}`);
      } else {
        const error = await response.json();
        if (error.error?.includes('already exists')) {
          console.log(`   - ${dept.name} already exists`);
        } else {
          console.log(`   ✗ ${dept.name}: ${error.error || response.statusText}`);
        }
      }
    } catch (err) {
      console.error(`   ✗ Error adding ${dept.name}: ${err.message}`);
    }
  }
  console.log();
}

async function fetchDepartments() {
  console.log('📋 Fetching departments...\n');
  
  try {
    const headers = {
      'Accept': 'application/json',
    };
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    let credentialHeaders = {};
    if (sessionCookie) {
      credentialHeaders['Cookie'] = sessionCookie;
    }

    const response = await fetch(`${baseURL}/api/departments`, {
      headers: { ...headers, ...credentialHeaders },
      credentials: 'include',
    });
    
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log(`Total departments: ${data.data?.length || 0}\n`);
    
    if (data.data && data.data.length > 0) {
      console.log('Departments:');
      data.data.forEach((dept, idx) => {
        console.log(`  [${idx + 1}] ${dept.name} (${dept.code})`);
        console.log(`      Head: ${dept.headName || 'Not assigned'}`);
        console.log(`      Description: ${dept.description || 'N/A'}`);
      });
    } else {
      console.log('No departments found');
    }
  } catch (err) {
    console.error('Error fetching departments:', err.message);
  }
}

async function main() {
  console.log('🚀 Database Seeding Script\n');
  console.log('---\n');
  
  // Try to sign up first (creates user if doesn't exist), then sign in
  const authed = await signUp();
  
  if (!authed) {
    console.error('Failed to authenticate. Exiting.');
    process.exit(1);
  }
  
  console.log('---\n');
  
  // Add departments
  await addDepartments();
  
  console.log('---\n');
  
  // Fetch and display departments
  await fetchDepartments();
  
  console.log('\n✨ Seeding complete!');
  process.exit(0);
}

// Run after a short delay to ensure server is ready
setTimeout(main, 1000);
