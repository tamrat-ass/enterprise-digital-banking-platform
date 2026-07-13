-- Create document_categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS document_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#6B4423',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insert default categories if they don't exist
INSERT INTO document_categories (id, name, code, description, color, is_active)
VALUES
  ('cat-001', 'Financial Reports', 'FIN_REP', 'Financial and accounting reports', '#2E7D32', true),
  ('cat-002', 'Contracts', 'CONTRACT', 'Contract documents and agreements', '#1565C0', true),
  ('cat-003', 'Policies', 'POLICY', 'Company policies and procedures', '#F57C00', true),
  ('cat-004', 'HR Documents', 'HR_DOC', 'Human resources documents', '#7B1FA2', true),
  ('cat-005', 'General', 'GENERAL', 'General documents', '#6B4423', true)
ON CONFLICT (name) DO NOTHING;

-- Verify the table was created
SELECT COUNT(*) as category_count FROM document_categories;
