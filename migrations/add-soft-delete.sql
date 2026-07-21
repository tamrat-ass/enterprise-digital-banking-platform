-- Migration: Add Soft Delete Support to Documents Table
-- Date: 2026-07-21
-- Purpose: Implement enterprise-grade soft delete (Recycle Bin) functionality

BEGIN;

-- Add soft delete columns to documents table
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS deleted_by TEXT NULL,
ADD COLUMN IF NOT EXISTS original_status TEXT NULL;

-- Create index on deleted_at for efficient filtering
CREATE INDEX IF NOT EXISTS idx_documents_deleted_at ON documents(deleted_at);
CREATE INDEX IF NOT EXISTS idx_documents_status_deleted_at ON documents(status, deleted_at);

-- Create audit table for soft delete operations (if not exists)
CREATE TABLE IF NOT EXISTS soft_delete_audit (
    id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL, -- 'document', 'folder', etc.
    entity_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL, -- 'delete', 'restore', 'permanent_delete'
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address TEXT,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index on entity_id and user_id for efficient querying
CREATE INDEX IF NOT EXISTS idx_soft_delete_audit_entity_id ON soft_delete_audit(entity_id);
CREATE INDEX IF NOT EXISTS idx_soft_delete_audit_user_id ON soft_delete_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_soft_delete_audit_timestamp ON soft_delete_audit(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_soft_delete_audit_action ON soft_delete_audit(action);

-- Create recycle bin retention policy table
CREATE TABLE IF NOT EXISTS recycle_bin_retention_policy (
    id TEXT PRIMARY KEY,
    days_before_permanent_delete INTEGER NOT NULL DEFAULT 30,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insert default retention policy if not exists
INSERT INTO recycle_bin_retention_policy (id, days_before_permanent_delete, enabled)
VALUES ('default-retention-policy', 30, TRUE)
ON CONFLICT (id) DO NOTHING;

-- Update existing documents to set status to ACTIVE if currently draft (to support new status values)
UPDATE documents 
SET status = 'active' 
WHERE status = 'draft' AND deleted_at IS NULL;

COMMIT;
