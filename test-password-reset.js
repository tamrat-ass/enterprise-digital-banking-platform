/**
 * Test script to verify password reset functionality
 * Usage: node test-password-reset.js
 */

const BASE_URL = 'http://localhost:3000'

async function testPasswordReset() {
  try {
    console.log('='.repeat(60))
    console.log('Testing Password Reset Functionality')
    console.log('='.repeat(60))

    // Step 1: Get a test user (you need to provide the userId)
    const testUserId = process.argv[2] || 'user_b746f98df798d09e242234d3' // Default from logs
    const testPassword = 'TestPass@123'

    console.log('\n📝 Test Parameters:')
    console.log(`  User ID: ${testUserId}`)
    console.log(`  New Password: ${testPassword}`)

    // Step 2: Call reset-password endpoint
    console.log('\n🔄 Calling POST /api/users/reset-password...')
    
    const resetResponse = await fetch(`${BASE_URL}/api/users/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: testUserId,
        password: testPassword,
      }),
    })

    const resetData = await resetResponse.json()

    if (!resetResponse.ok) {
      console.log(`❌ Reset failed: ${resetData.error}`)
      console.log('Response:', JSON.stringify(resetData, null, 2))
      return false
    }

    console.log(`✅ Reset successful`)
    console.log('Response:', JSON.stringify(resetData, null, 2))

    // Step 3: Try to sign in with the new password
    console.log('\n🔐 Calling POST /api/custom-signin to verify...')
    
    // Get user email (you need to provide this or look it up)
    const testEmail = process.argv[3] || 'tamrat.assefa@ahadubank.com'
    
    console.log(`  Email: ${testEmail}`)
    console.log(`  Password: ${testPassword}`)

    const signInResponse = await fetch(`${BASE_URL}/api/custom-signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    })

    const signInData = await signInResponse.json()

    if (!signInResponse.ok) {
      console.log(`❌ Sign-in FAILED: ${signInData.error}`)
      console.log('Response:', JSON.stringify(signInData, null, 2))
      console.log('\n⚠️  PASSWORD RESET NOT WORKING - Hash not persisted in database')
      return false
    }

    console.log(`✅ Sign-in successful`)
    console.log('Response:', JSON.stringify(signInData, null, 2))
    console.log('\n✅ PASSWORD RESET IS WORKING - Password updated and verified!')
    return true

  } catch (error) {
    console.error('❌ Test error:', error.message)
    return false
  }
}

// Run the test
testPasswordReset().then(success => {
  console.log('\n' + '='.repeat(60))
  console.log(success ? '✅ TEST PASSED' : '❌ TEST FAILED')
  console.log('='.repeat(60))
  process.exit(success ? 0 : 1)
})
