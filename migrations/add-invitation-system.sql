-- Migration: Add Invitation-Based User Creation System
-- Date: 2024
-- Purpose: Add fields to support enterprise invitation-based account creation

-- Add columns to user table
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'invited';
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "invitationToken" TEXT UNIQUE;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "invitationExpiresAt" TIMESTAMP;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "passwordHash" TEXT;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "requirePasswordChange" BOOLEAN DEFAULT FALSE;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "passwordChangedAt" TIMESTAMP;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "passwordResetToken" TEXT UNIQUE;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "passwordResetExpiresAt" TIMESTAMP;

-- Create indexes for performance and uniqueness
CREATE INDEX IF NOT EXISTS idx_user_invitationToken ON "user"("invitationToken");
CREATE INDEX IF NOT EXISTS idx_user_passwordResetToken ON "user"("passwordResetToken");
CREATE INDEX IF NOT EXISTS idx_user_status ON "user"("status");
CREATE INDEX IF NOT EXISTS idx_user_passwordChangedAt ON "user"("passwordChangedAt");

-- Update existing users to active status (they already have passwords from better-auth)
UPDATE "user" 
SET "status" = 'active', 
    "passwordChangedAt" = "createdAt"
WHERE "status" IS NULL OR "status" = 'invited';

-- Add check constraint for valid statuses
ALTER TABLE "user" ADD CONSTRAINT check_user_status 
CHECK ("status" IN ('invited', 'active', 'disabled'));
