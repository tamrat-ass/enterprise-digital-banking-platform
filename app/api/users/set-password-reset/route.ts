import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { user, account } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { hashPassword, validatePasswordStrength } from '@/lib/password'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    const { userId, password } = body

    if (!userId || !password) {
      return NextResponse.json(
        { error: 'userId and password are required' },
        { status: 400 }
      )
    }

    // Validate password strength
    const strengthCheck = validatePasswordStrength(password)
    if (!strengthCheck.isValid) {
      return NextResponse.json(
        {
          error: `Password does not meet security requirements: ${strengthCheck.errors.join('; ')}`,
        },
        { status: 400 }
      )
    }

    // Verify user exists
    const targetUser = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1)

    if (!targetUser.length) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Hash the password
    let passwordHash: string
    try {
      passwordHash = await hashPassword(password)
    } catch (err) {
      console.error('Error hashing password:', err)
      return NextResponse.json(
        { error: 'Failed to process password' },
        { status: 500 }
      )
    }

    // Create or update Better Auth credential account
    try {
      const existingAccount = await db
        .select()
        .from(account)
        .where(eq(account.userId, userId))
        .limit(1)

      if (existingAccount.length === 0) {
        // Insert new account record
        const accountId = `account_${crypto.randomBytes(12).toString('hex')}`
        await db.insert(account).values({
          id: accountId,
          accountId: userId,
          providerId: 'credential',
          userId: userId,
          password: passwordHash,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      } else {
        // Update existing account
        await db
          .update(account)
          .set({
            password: passwordHash,
            updatedAt: new Date(),
          })
          .where(eq(account.userId, userId))
      }
    } catch (err) {
      console.warn('Warning creating/updating Better Auth credential:', err)
      // Continue anyway - password is set in user table
    }

    // Update user password in database
    await db
      .update(user)
      .set({
        passwordHash,
        passwordChangedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId))

    return NextResponse.json(
      {
        success: true,
        message: 'Password set successfully',
        userId,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error setting password:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
