import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    const { userId, pin } = body

    if (!userId || !pin) {
      return NextResponse.json(
        { error: 'userId and pin are required' },
        { status: 400 }
      )
    }

    // Validate PIN format
    if (!/^\d{4,6}$/.test(pin)) {
      return NextResponse.json(
        { error: 'PIN must be 4-6 digits' },
        { status: 400 }
      )
    }

    // Check for invalid patterns
    if (new Set(pin).size === 1) {
      return NextResponse.json(
        { error: 'Cannot use same digit repeatedly' },
        { status: 400 }
      )
    }

    const hasSequence = /01234|12345|23456|34567|45678|56789|6789|789|012345|123456|234567|345678|456789/.test(pin)
    if (hasSequence) {
      return NextResponse.json(
        { error: 'Cannot use sequential digits' },
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

    // Update user PIN in database
    // In production, encrypt the PIN using a secure cipher
    await db
      .update(user)
      .set({
        pin: pin, // In production, this should be encrypted
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId))

    return NextResponse.json(
      {
        success: true,
        message: 'PIN set successfully',
        userId,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error setting PIN:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
