/**
 * Email Service
 * Handles sending transactional emails using Nodemailer SMTP
 * 
 * Supports multiple SMTP providers:
 * - Gmail (free with app password)
 * - Outlook/Office365
 * - Custom SMTP servers
 * 
 * Configuration in .env.local:
 * SMTP_HOST=smtp.gmail.com
 * SMTP_PORT=587
 * SMTP_USER=your-email@gmail.com
 * SMTP_PASSWORD=your-app-password
 * SMTP_FROM_EMAIL=your-email@gmail.com
 */

import nodemailer from 'nodemailer'

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

// Create transporter once and reuse it
let transporter: any = null

function getTransporter() {
  if (transporter) return transporter

  const host = process.env.SMTP_HOST
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASSWORD

  if (!host || !user || !pass) {
    console.warn('[Email Service] ⚠️  SMTP credentials not configured')
    console.warn('[Email Service]    Please set SMTP_HOST, SMTP_USER, SMTP_PASSWORD in .env.local')
    return null
  }

  try {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: {
        user,
        pass,
      },
    })

    console.log('[Email Service] ✅ Nodemailer transporter initialized')
    console.log('[Email Service]    Host:', host)
    console.log('[Email Service]    Port:', port)

    return transporter
  } catch (err) {
    console.error('[Email Service] ❌ Failed to create transporter:', err)
    return null
  }
}

/**
 * Send email using Nodemailer SMTP
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const transporter = getTransporter()
    const fromEmail = process.env.SMTP_FROM_EMAIL || 'noreply@example.com'
    const fromName = process.env.SMTP_FROM_NAME || 'Enterprise Banking Platform'

    if (!transporter) {
      console.warn('[Email Service] ⚠️  Email service not configured')
      console.warn('[Email Service]    Email to:', options.to)
      console.warn('[Email Service]    Subject:', options.subject)
      console.warn('[Email Service]    Please configure SMTP settings in .env.local')
      return false
    }

    const mailOptions = {
      from: `${fromName} <${fromEmail}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || 'See HTML version for full content',
    }

    console.log('[Email Service] 📧 Sending email...')
    console.log('[Email Service]    To:', options.to)
    console.log('[Email Service]    From:', mailOptions.from)
    console.log('[Email Service]    Subject:', options.subject)

    // Send email
    const info = await transporter.sendMail(mailOptions)

    console.log('[Email Service] ✅ Email sent successfully!')
    console.log('[Email Service]    Message ID:', info.messageId)
    console.log('[Email Service]    Response:', info.response)

    return true
  } catch (err) {
    console.error('[Email Service] ❌ Failed to send email:')
    if (err instanceof Error) {
      console.error('[Email Service]    Error:', err.message)
      console.error('[Email Service]    Stack:', err.stack)

      // Provide helpful error messages
      if (err.message.includes('getaddrinfo')) {
        console.error('[Email Service] ℹ️  Host lookup failed - check SMTP_HOST')
      } else if (err.message.includes('403') || err.message.includes('535')) {
        console.error('[Email Service] ℹ️  Authentication failed - check SMTP_USER and SMTP_PASSWORD')
      } else if (err.message.includes('connect')) {
        console.error('[Email Service] ℹ️  Connection failed - check SMTP_HOST and SMTP_PORT')
      }
    }
    return false
  }
}

/**
 * Send user invitation email
 */
export async function sendInvitationEmail(
  email: string,
  name: string,
  invitationLink: string,
  expiresInHours: number = 24
): Promise<boolean> {
  const subject = 'Welcome to Enterprise Banking Platform - Complete Your Setup'

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; color: #333; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 40px 20px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
          .footer { color: #6b7280; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
          .security-note { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; color: #92400e; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome, ${escapeHtml(name)}!</h1>
          </div>
          <div class="content">
            <p>Your account has been created in the Enterprise Banking Platform.</p>
            
            <p>To get started, please click the button below to set your password and activate your account:</p>
            
            <center>
              <a href="${escapeHtml(invitationLink)}" class="button">Activate Your Account</a>
            </center>
            
            <div class="security-note">
              <strong>🔒 Security Notice:</strong> This link will expire in ${expiresInHours} hours. If it expires, your administrator can send you a new invitation.
            </div>
            
            <p><strong>Or copy and paste this link in your browser:</strong></p>
            <p style="word-break: break-all; background: #f3f4f6; padding: 10px; border-radius: 4px; font-size: 12px;">
              ${escapeHtml(invitationLink)}
            </p>
            
            <p style="margin-top: 30px; font-size: 14px;">
              <strong>What happens next:</strong>
            </p>
            <ol>
              <li>Click the activation link above</li>
              <li>Create a secure password</li>
              <li>Log in with your email and password</li>
              <li>Complete your profile setup</li>
            </ol>
            
            <p style="margin-top: 30px; font-size: 12px; color: #6b7280;">
              If you did not request this account, please contact your administrator immediately.
            </p>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} Enterprise Banking Platform. All rights reserved.</p>
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `

  const text = `
Welcome, ${name}!

Your account has been created in the Enterprise Banking Platform.

To activate your account and set your password, click the link below:
${invitationLink}

This link will expire in ${expiresInHours} hours.

If you did not request this account, please contact your administrator immediately.

© ${new Date().getFullYear()} Enterprise Banking Platform. All rights reserved.
  `.trim()

  return sendEmail({
    to: email,
    subject,
    html,
    text,
  })
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetLink: string,
  expiresInHours: number = 1
): Promise<boolean> {
  const subject = 'Reset Your Password - Enterprise Banking Platform'

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; color: #333; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 40px 20px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
          .footer { color: #6b7280; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
          .security-note { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; color: #92400e; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hi ${escapeHtml(name)},</p>
            
            <p>We received a request to reset your password for your Enterprise Banking Platform account.</p>
            
            <p>Click the button below to create a new password:</p>
            
            <center>
              <a href="${escapeHtml(resetLink)}" class="button">Reset Password</a>
            </center>
            
            <div class="security-note">
              <strong>🔒 Security Notice:</strong> This link will expire in ${expiresInHours} hour(s). If you didn't request a password reset, you can safely ignore this email.
            </div>
            
            <p><strong>Or copy and paste this link:</strong></p>
            <p style="word-break: break-all; background: #f3f4f6; padding: 10px; border-radius: 4px; font-size: 12px;">
              ${escapeHtml(resetLink)}
            </p>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} Enterprise Banking Platform. All rights reserved.</p>
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `

  const text = `
Password Reset Request

Hi ${name},

We received a request to reset your password. Click the link below:
${resetLink}

This link will expire in ${expiresInHours} hour(s).

If you didn't request this, you can safely ignore this email.

© ${new Date().getFullYear()} Enterprise Banking Platform. All rights reserved.
  `.trim()

  return sendEmail({
    to: email,
    subject,
    html,
    text,
  })
}

/**
 * Escape HTML to prevent XSS in emails
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}
