import { NextRequest, NextResponse } from "next/server"
import { sendInvitationEmail } from "@/lib/email"

/**
 * GET /api/admin/test-email
 * Test the email sending functionality using Nodemailer SMTP
 * 
 * This endpoint sends a test invitation email to verify SMTP configuration.
 * Check console logs for [Email Service] messages to debug issues.
 */
export async function GET(req: NextRequest) {
  try {
    console.log('[Test Email] 🧪 Starting email test with Nodemailer SMTP...')
    console.log('[Test Email] ℹ️  SMTP Configuration Status:')
    console.log('[Test Email]    SMTP_HOST:', process.env.SMTP_HOST || '❌ Not set')
    console.log('[Test Email]    SMTP_PORT:', process.env.SMTP_PORT || '❌ Not set')
    console.log('[Test Email]    SMTP_USER:', process.env.SMTP_USER ? '✅ Configured' : '❌ Not set')
    console.log('[Test Email]    SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? '✅ Configured' : '❌ Not set')
    console.log('[Test Email]    SMTP_FROM_EMAIL:', process.env.SMTP_FROM_EMAIL || '❌ Not set')

    // Send test email
    const testEmail = 'test@example.com'
    const testName = 'Test User'
    const testLink = 'http://localhost:3000/accept-invitation?token=test-token-12345'

    console.log('[Test Email] 📧 Attempting to send test invitation email...')
    console.log('[Test Email]    To:', testEmail)
    console.log('[Test Email]    Name:', testName)
    const result = await sendInvitationEmail(testEmail, testName, testLink, 24)
    
    console.log('[Test Email] 📊 Test result:', result ? '✅ SUCCESS' : '❌ FAILED')

    return NextResponse.json({
      success: result,
      message: result 
        ? 'Test email sent successfully! Check your email (or spam folder).'
        : 'Email sending failed. Check console logs and .env.local configuration.',
      smtpConfig: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER ? '✅ Set' : '❌ Not set',
        password: process.env.SMTP_PASSWORD ? '✅ Set' : '❌ Not set',
        fromEmail: process.env.SMTP_FROM_EMAIL,
        fromName: process.env.SMTP_FROM_NAME,
      },
      testDetails: {
        toEmail: testEmail,
        testName: testName,
        testLink: testLink,
      },
      nextSteps: result
        ? [
            'Check your email inbox (or spam folder) for the test email',
            'If received, you can now create users and they will receive invitation emails',
            'Go to /admin/users to create a new user',
          ]
        : [
            'Check the console logs above for [Email Service] error messages',
            'Verify SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD are set correctly in .env.local',
            'For Gmail: Use app password (not your regular password)',
            'See EMAIL_SETUP_INSTRUCTIONS.md for step-by-step setup guide',
          ],
    })
  } catch (err) {
    console.error('[Test Email] ❌ Unexpected error during test:', err)
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        errorType: err instanceof Error ? err.constructor.name : 'Unknown',
        smtpConfig: {
          host: process.env.SMTP_HOST || 'Not set',
          port: process.env.SMTP_PORT || 'Not set',
          user: process.env.SMTP_USER ? 'Set' : 'Not set',
          password: process.env.SMTP_PASSWORD ? 'Set' : 'Not set',
        },
        nextSteps: [
          'Check EMAIL_SETUP_INSTRUCTIONS.md in the project root',
          'Configure Gmail SMTP credentials in .env.local',
          'Restart dev server: Ctrl+C then npm run dev',
          'Run this test again',
        ],
      },
      { status: 500 }
    )
  }
}
