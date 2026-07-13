// Test script to verify POST /api/departments works
// Note: This requires user to be authenticated via browser cookie

async function testPostDepartment() {
  try {
    console.log('Testing POST /api/departments...');
    
    const response = await fetch('http://localhost:3000/api/departments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test Department',
        code: 'TEST',
        description: 'This is a test department',
        headName: 'Test Head',
        divisions: [
          {
            name: 'Test Division 1',
            code: 'TD1',
            description: 'First test division',
            headName: 'Division Head 1',
            status: 'active',
          },
          {
            name: 'Test Division 2',
            code: 'TD2',
            description: 'Second test division',
            headName: 'Division Head 2',
            status: 'active',
          }
        ]
      }),
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✓ SUCCESS - Department created');
      console.log('Department ID:', data.data?.id);
      console.log('Divisions created:', data.data?.divisions?.length);
    } else {
      console.log('✗ FAILED');
      console.log('Error:', data.error);
      console.log('Details:', data.details);
    }
    
    return response.ok;
  } catch (error) {
    console.error('Test failed:', error.message);
    return false;
  }
}

testPostDepartment();
