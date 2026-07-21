// Test script for editing user status via PUT and toggle-status endpoints
const BASE_URL = 'http://localhost:3000'

async function test() {
  try {
    console.log('🧪 Testing User Edit with Status Toggle...\n')

    // First, get all users to find a test user
    console.log('📋 Fetching users...')
    const usersRes = await fetch(`${BASE_URL}/api/users`, {
      credentials: 'include',
      headers: {
        'Cookie': `authToken=${process.env.AUTH_TOKEN || ''}`,
      }
    })

    if (!usersRes.ok) {
      throw new Error(`Failed to fetch users: ${usersRes.status}`)
    }

    const usersData = await usersRes.json()
    const users = usersData.data || []

    if (users.length === 0) {
      console.log('❌ No users found')
      return
    }

    // Find a test user (prefer non-invited)
    const testUser = users.find(u => u.status === 'active') || users[0]
    console.log(`✓ Found test user: ${testUser.name} (${testUser.email}) - Status: ${testUser.status}\n`)

    // Test 1: Update user name only (PUT request)
    console.log('Test 1️⃣ : Updating user name via PUT...')
    const newName = `${testUser.name} (Updated)`
    const putRes = await fetch(`${BASE_URL}/api/users/${testUser.id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `authToken=${process.env.AUTH_TOKEN || ''}`,
      },
      body: JSON.stringify({
        name: newName,
      })
    })

    if (!putRes.ok) {
      const error = await putRes.text()
      console.error(`❌ PUT failed: ${putRes.status}`)
      console.error(error)
    } else {
      const result = await putRes.json()
      console.log(`✅ Name updated: ${result.data?.name || 'N/A'}\n`)
    }

    // Test 2: Toggle user status
    if (testUser.status !== 'invited') {
      console.log('Test 2️⃣ : Toggling user status via toggle-status...')
      const newStatus = testUser.status === 'active' ? 'disabled' : 'active'
      console.log(`   Changing from '${testUser.status}' to '${newStatus}'...`)

      const toggleRes = await fetch(`${BASE_URL}/api/users/toggle-status`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `authToken=${process.env.AUTH_TOKEN || ''}`,
        },
        body: JSON.stringify({
          userId: testUser.id,
          newStatus: newStatus,
        })
      })

      if (!toggleRes.ok) {
        const error = await toggleRes.json()
        console.error(`❌ Toggle failed: ${toggleRes.status}`)
        console.error(error)
      } else {
        const result = await toggleRes.json()
        console.log(`✅ Status toggled: ${result.newStatus}\n`)
      }
    } else {
      console.log('⏭️  Skipping status toggle (user is in invited state)\n')
    }

    // Test 3: Verify changes
    console.log('Test 3️⃣ : Verifying changes...')
    const verifyRes = await fetch(`${BASE_URL}/api/users`, {
      credentials: 'include',
      headers: {
        'Cookie': `authToken=${process.env.AUTH_TOKEN || ''}`,
      }
    })

    if (verifyRes.ok) {
      const verifyData = await verifyRes.json()
      const updatedUser = verifyData.data?.find(u => u.id === testUser.id)
      if (updatedUser) {
        console.log(`✅ Updated user details:`)
        console.log(`   Name: ${updatedUser.name}`)
        console.log(`   Status: ${updatedUser.status}`)
      }
    }

    console.log('\n✨ All tests completed!')

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

test()
