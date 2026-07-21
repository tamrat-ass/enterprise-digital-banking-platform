// Debug test for updating user
const BASE_URL = 'http://localhost:3000'

async function test() {
  try {
    console.log('🧪 Testing PUT /api/users/{id} endpoint...\n')

    // First get users
    console.log('📋 Fetching users...')
    const usersRes = await fetch(`${BASE_URL}/api/users`, {
      credentials: 'include',
    })

    if (!usersRes.ok) {
      console.error(`❌ Failed to fetch users: ${usersRes.status}`)
      const text = await usersRes.text()
      console.error(text)
      return
    }

    const usersData = await usersRes.json()
    const users = usersData.data || []

    if (users.length === 0) {
      console.log('❌ No users found')
      return
    }

    const testUser = users[0]
    console.log(`✓ Found test user: ${testUser.name} (${testUser.email})\n`)

    // Test PUT request
    console.log('📝 Testing PUT /api/users/{id}...')
    console.log(`   User ID: ${testUser.id}`)
    console.log(`   Current name: ${testUser.name}`)
    console.log(`   Current status: ${testUser.status}`)

    const newName = `${testUser.name} - Test ${Date.now()}`
    console.log(`   New name: ${newName}\n`)

    const putRes = await fetch(`${BASE_URL}/api/users/${testUser.id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: newName,
      }),
    })

    console.log(`Response Status: ${putRes.status}`)
    const responseData = await putRes.json()
    console.log(`Response:`, JSON.stringify(responseData, null, 2))

    if (!putRes.ok) {
      console.error(`\n❌ PUT failed: ${putRes.status}`)
      if (responseData.error) {
        console.error(`Error: ${responseData.error}`)
      }
      if (responseData.details) {
        console.error(`Details:`, responseData.details)
      }
    } else {
      console.log(`\n✅ PUT successful!`)
      if (responseData.data) {
        console.log(`Updated user:`, responseData.data)
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('Stack:', error.stack)
  }
}

test()
