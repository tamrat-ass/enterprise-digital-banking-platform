import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { user, account } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { hashPassword } from '@/lib/password'
import crypto from 'crypto'
import bcryptjs from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    const { userId, password } = body

    console.log('[Reset Password] ========== PASSWORD RESET START ==========')
    console.log('[Reset Password] Received userId:', userId)
    console.log('[Reset Password] Received password length:', password?.length)
    console.log('[Reset Password] Received password:', password)
    console.log('[Reset Password] Received password bytes:', password ? Buffer.from(password).toString('hex') : 'EMPTY')

    if (!userId || !password) {
      return NextResponse.json(
        { error: 'userId and password are required' },
        { status: 400 }
      )
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // Check password complexity
    const hasUppercase = /[A-Z]/.test(password)
    const hasLowercase = /[a-z]/.test(password)
    const hasNumber = /\d/.test(password)
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)

    if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
      return NextResponse.json(
        { error: 'Password must contain uppercase, lowercase, number, and special character' },
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
      console.log('[Reset Password] ✅ Password hashed successfully')
      console.log('[Reset Password] Hash first 30 chars:', passwordHash.substring(0, 30))
    } catch (err) {
      console.error('Error hashing password:', err)
      return NextResponse.json(
        { error: 'Failed to process password' },
        { status: 500 }
      )
    }

    // Update Better Auth credential account
    try {
      // Check if account already exists
      const existingAccount = await db
        .select()
        .from(account)
        .where(eq(account.userId, userId))
        .limit(1)

      if (existingAccount.length === 0) {
        // Create new account record
        const accountId = `account_${crypto.randomBytes(12).toString('hex')}`
        
        console.log('[Reset Password] Creating new account record for userId:', userId)
        console.log('[Reset Password] Setting password hash: ', passwordHash.substring(0, 30))
        await db.insert(account).values({
          id: accountId,
          accountId: targetUser[0].email,
          providerId: 'credential',
          userId: userId,
          password: passwordHash,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        console.log('[Reset Password] ✅ New account record created:', accountId)
        
        // Immediately verify it was saved
        const verifyInsert = await db
          .select({ password: account.password })
          .from(account)
          .where(eq(account.id, accountId))
          .limit(1)
        console.log('[Reset Password] Inserted account password first 30:', verifyInsert[0]?.password?.substring(0, 30))
      } else {
        // Update existing account - CRITICAL SECTION
        console.log('[Reset Password] ========== ACCOUNT UPDATE START ==========')
        console.log('[Reset Password] Target userId for update:', userId)
        console.log('[Reset Password] Existing account count:', existingAccount.length)
        console.log('[Reset Password] Existing account ID:', existingAccount[0].id)
        console.log('[Reset Password] Existing account userId field:', existingAccount[0].userId)
        console.log('[Reset Password] Old password hash first 30:', existingAccount[0].password?.substring(0, 30))
        console.log('[Reset Password] New password hash first 30:', passwordHash.substring(0, 30))
        
        // Try update by account.id (more reliable than userId)
        console.log('[Reset Password] Executing update by account.id...')
        
        const updateResult = await db
          .update(account)
          .set({
            password: passwordHash,
            updatedAt: new Date(),
          })
          .where(eq(account.id, existingAccount[0].id))
        
        console.log('[Reset Password] Update query executed')
        
        // Add small delay to ensure DB commit
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Verify it was updated by querying by ID
        const verifyUpdate = await db
          .select()
          .from(account)
          .where(eq(account.id, existingAccount[0].id))
          .limit(1)
        
        if (!verifyUpdate.length) {
          console.error('[Reset Password] ⚠️ CRITICAL: Account not found after update!')
        } else {
          console.log('[Reset Password] ========== VERIFICATION AFTER UPDATE ==========')
          console.log('[Reset Password] Updated account ID:', verifyUpdate[0].id)
          console.log('[Reset Password] Updated account password first 30:', verifyUpdate[0].password?.substring(0, 30))
          console.log('[Reset Password] Updated account updatedAt:', verifyUpdate[0].updatedAt)
          
          // Compare old vs new
          if (verifyUpdate[0].password === passwordHash) {
            console.log('[Reset Password] ✅ Hash in DB matches new hash exactly - UPDATE SUCCESSFUL')
          } else if (verifyUpdate[0].password === existingAccount[0].password) {
            console.log('[Reset Password] ⚠️ CRITICAL: Hash in DB is STILL the old hash!')
            console.log('[Reset Password]   Old hash first 50:', existingAccount[0].password?.substring(0, 50))
            console.log('[Reset Password]   DB hash first 50:', verifyUpdate[0].password?.substring(0, 50))
            console.log('[Reset Password] ⚠️ UPDATE FAILED - Database not persisting changes')
          } else {
            console.log('[Reset Password] ⚠️ Hash is different from both old and new (unexpected state)')
            console.log('[Reset Password]   Old hash first 50:', existingAccount[0].password?.substring(0, 50))
            console.log('[Reset Password]   New hash first 50:', passwordHash.substring(0, 50))
            console.log('[Reset Password]   DB hash first 50:', verifyUpdate[0].password?.substring(0, 50))
          }
          
          // Test the password verification
          const testVerify = await bcryptjs.compare(password, verifyUpdate[0].password || '')
          console.log('[Reset Password] bcrypt.compare result:', testVerify)
        }
      }
    } catch (err) {
      console.error('[Reset Password] CRITICAL ERROR updating account password:', err)
      throw new Error(`Failed to update account password: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }

    // Update user password AND set email as verified in database
    try {
      await db
        .update(user)
        .set({
          passwordHash: passwordHash,
          emailVerified: true, // Mark email as verified when password is reset
          passwordChangedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(user.id, userId))
      console.log('[Reset Password] ✅ User passwordHash updated and email verified:', userId)
      
      // Verify the update by reading it back
      const updatedUserRecord = await db
        .select({ passwordHash: user.passwordHash, emailVerified: user.emailVerified })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1)
      
      if (updatedUserRecord.length > 0) {
        console.log('[Reset Password] ✅ Verified - User record after update:')
        console.log('[Reset Password]   - emailVerified:', updatedUserRecord[0].emailVerified)
        console.log('[Reset Password]   - passwordHash first 30:', updatedUserRecord[0].passwordHash?.substring(0, 30))
      }
      
      // Also verify account table was updated
      const updatedAccount = await db
        .select({ password: account.password })
        .from(account)
        .where(eq(account.userId, userId))
        .limit(1)
      
      if (updatedAccount.length > 0) {
        console.log('[Reset Password] ✅ Verified - Account record after update:')
        console.log('[Reset Password]   - password first 30:', updatedAccount[0].password?.substring(0, 30))
      }
    } catch (err) {
      console.error('[Reset Password] Error updating user passwordHash:', err)
      throw err
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Password reset successfully',
        userId,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error resetting password:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
