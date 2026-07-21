import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { user, account, session } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import bcryptjs from 'bcryptjs'
import crypto from 'crypto'

/**
 * Custom email/password sign-in endpoint
 * Validates credentials against bcrypt hashes and creates a Better Auth session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    console.log(`[SignIn] Attempting sign-in for: ${email}`)

    // Step 1: Find user by email
    const users = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1)

    if (!users.length) {
      console.log(`[SignIn] User not found: ${email}`)
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const targetUser = users[0]
    console.log(`[SignIn] User found: ${targetUser.id}, status: ${targetUser.status}`)

    // Step 2: Check user is active
    if (targetUser.status !== 'active') {
      console.log(`[SignIn] User not active: ${targetUser.status}`)
      return NextResponse.json(
        { error: 'User account is not active' },
        { status: 403 }
      )
    }

    // Step 3: Check email is verified
    if (!targetUser.emailVerified) {
      console.log(`[SignIn] Email not verified`)
      return NextResponse.json(
        { error: 'Email not verified' },
        { status: 403 }
      )
    }

    // Step 4: Find credential account
    const accounts = await db
      .select()
      .from(account)
      .where(eq(account.userId, targetUser.id))
      .limit(1)

    if (!accounts.length) {
      console.log(`[SignIn] No credential account found`)
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const targetAccount = accounts[0]
    console.log(`[SignIn] Account found: ${targetAccount.id}`)

    // Step 5: Verify password
    if (!targetAccount.password) {
      console.log(`[SignIn] No password hash in account`)
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    console.log(`[SignIn] Verifying password with bcrypt...`)
    const passwordMatch = await bcryptjs.compare(password, targetAccount.password)

    console.log(`[SignIn] Password match result: ${passwordMatch}`)
    console.log(`[SignIn] Input password: ${password}`)
    console.log(`[SignIn] Hash (first 30 chars): ${targetAccount.password.substring(0, 30)}...`)

    console.log(`[SignIn] Password match result: ${passwordMatch}`)
    console.log(`[SignIn] Input password: ${password}`)
    console.log(`[SignIn] Hash (first 30 chars): ${targetAccount.password.substring(0, 30)}...`)

    if (!passwordMatch) {
      console.log(`[SignIn] Password mismatch`)
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Step 6: Create session token (static, non-expirable)
    const sessionToken = crypto.randomBytes(32).toString('hex')
    const sessionId = crypto.randomUUID()
    // Use a far future date (essentially infinite for practical purposes)
    const expiresAt = new Date('2099-12-31') // Static, non-expiring

    try {
      console.log(`[SignIn] Creating static session with ID: ${sessionId}, token: ${sessionToken.substring(0, 20)}...`)
      await db.insert(session).values({
        id: sessionId,
        token: sessionToken,
        userId: targetUser.id,
        expiresAt,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      console.log(`[SignIn] ✅ Static session created successfully: ${sessionId}`)
    } catch (err) {
      console.error('[SignIn] Failed to create session:', err)
      throw err
    }

    // Step 7: Return success response with session
    const response = NextResponse.json(
      {
        user: {
          id: targetUser.id,
          email: targetUser.email,
          name: targetUser.name,
          emailVerified: targetUser.emailVerified,
        },
        session: {
          id: sessionId,
          token: sessionToken,
          expiresAt: expiresAt.toISOString(),
        },
      },
      { status: 200 }
    )

    // Set auth token as secure httpOnly cookie (static, non-expirable)
    response.cookies.set({
      name: 'authToken',
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: undefined, // No expiration on cookie itself
      path: '/',
    })

    console.log(`[SignIn] ✅ Sign-in successful for: ${email}`)
    return response
  } catch (error) {
    console.error('[SignIn] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
