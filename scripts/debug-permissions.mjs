import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

const client = postgres(connectionString);

async function debug() {
  try {
    // Get user
    const users = await client`
      SELECT u.id, u.name, u.email, p.role_id
      FROM "user" u
      JOIN profiles p ON p."userId" = u.id
      WHERE u.name = 'Tamrat Assefa Weldemesekel'
    `;

    if (users.length === 0) {
      console.log('User not found');
      process.exit(0);
    }

    const user = users[0];
    console.log('\n=== USER INFO ===');
    console.log('User ID:', user.id);
    console.log('Name:', user.name);
    console.log('Email:', user.email);
    console.log('Role ID:', user.role_id);

    // Get role with permissions
    const roles = await client`
      SELECT id, name, permissions
      FROM roles
      WHERE id = ${user.role_id}
    `;

    if (roles.length === 0) {
      console.log('Role not found');
      process.exit(0);
    }

    const role = roles[0];
    console.log('\n=== ROLE INFO ===');
    console.log('Role ID:', role.id);
    console.log('Role Name:', role.name);

    const permissions = role.permissions;
    
    console.log('\n=== PERMISSIONS ===');
    if (permissions === '*') {
      console.log('Permissions: * (ALL)');
    } else if (Array.isArray(permissions)) {
      console.log('Total permissions:', permissions.length);
      
      // Check for documents:admin specifically
      const hasDocumentsAdmin = permissions.some(p => p === 'documents:admin');
      const hasDocumentsView = permissions.some(p => p === 'documents:view');
      
      console.log('\nKey permissions:');
      console.log('  - documents:admin:', hasDocumentsAdmin ? '✓ YES' : '✗ NO');
      console.log('  - documents:view:', hasDocumentsView ? '✓ YES' : '✗ NO');

      if (permissions.length > 0) {
        console.log('\nAll permissions:');
        permissions.forEach(p => {
          console.log('  -', p);
        });
      }
    } else {
      console.log('Permissions format unknown:', permissions);
    }

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

debug();
