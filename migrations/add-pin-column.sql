-- Add PIN column to user table for password reset functionality
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "pin" TEXT;

-- Add comment for documentation
COMMENT ON COLUMN "user"."pin" IS 'User 4-6 digit PIN for authentication (should be encrypted in production)';
