-- Enterprise Digital Banking Platform - Seed Data Script
-- This script populates all database tables with sample data for testing

-- ================================================================
-- Departments
-- ================================================================

INSERT INTO departments (id, name, code, description, head_name) VALUES
('dept-001', 'Finance', 'FIN', 'Financial Operations & Management', 'Sarah Johnson'),
('dept-002', 'Risk Management', 'RISK', 'Enterprise Risk & Compliance', 'Michael Chen'),
('dept-003', 'Operations', 'OPS', 'Daily Operations & Support', 'Jennifer Williams'),
('dept-004', 'Technology', 'TECH', 'Information Technology & Systems', 'David Kumar'),
('dept-005', 'Legal', 'LEG', 'Legal Affairs & Contracts', 'Emma Thompson')
ON CONFLICT DO NOTHING;

-- ================================================================
-- Users (Better Auth)
-- ================================================================

INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt") VALUES
('user-001', 'Sarah Johnson', 'sarah.johnson@bank.com', true, NOW(), NOW()),
('user-002', 'Michael Chen', 'michael.chen@bank.com', true, NOW(), NOW()),
('user-003', 'Jennifer Williams', 'jennifer.williams@bank.com', true, NOW(), NOW()),
('user-004', 'David Kumar', 'david.kumar@bank.com', true, NOW(), NOW()),
('user-005', 'Emma Thompson', 'emma.thompson@bank.com', true, NOW(), NOW()),
('user-006', 'John Martinez', 'john.martinez@bank.com', true, NOW(), NOW()),
('user-007', 'Lisa Anderson', 'lisa.anderson@bank.com', true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- ================================================================
-- Roles
-- ================================================================

INSERT INTO roles (id, name, description, level, permissions) VALUES
('role-001', 'Admin', 'Full system access', 5, '["approvals:create","approvals:view","approvals:edit","approvals:delete","vendors:create","vendors:view","vendors:edit","vendors:delete","projects:create","projects:view","projects:edit","projects:delete","documents:create","documents:view","documents:edit","documents:delete","risks:create","risks:view","risks:edit","risks:delete","compliance:view","compliance:edit","workflows:manage"]'),
('role-002', 'Manager', 'Department management', 4, '["approvals:create","approvals:view","approvals:edit","vendors:view","vendors:edit","projects:create","projects:view","projects:edit","documents:create","documents:view","documents:edit","risks:create","risks:view","risks:edit","compliance:view"]'),
('role-003', 'Analyst', 'Data analysis & reporting', 3, '["approvals:view","vendors:view","projects:view","documents:view","risks:view","compliance:view"]'),
('role-004', 'Approver', 'Approval authority', 4, '["approvals:view","approvals:edit","vendors:view","projects:view","documents:view","risks:view"]'),
('role-005', 'Vendor Manager', 'Vendor operations', 3, '["vendors:view","vendors:edit","contracts:create","contracts:view","contracts:edit"]')
ON CONFLICT DO NOTHING;

-- ================================================================
-- Profiles
-- ================================================================

INSERT INTO profiles (id, "userId", full_name, email, job_title, department_id, role_id, status) VALUES
('prof-001', 'user-001', 'Sarah Johnson', 'sarah.johnson@bank.com', 'Finance Director', 'dept-001', 'role-001', 'active'),
('prof-002', 'user-002', 'Michael Chen', 'michael.chen@bank.com', 'Risk Manager', 'dept-002', 'role-002', 'active'),
('prof-003', 'user-003', 'Jennifer Williams', 'jennifer.williams@bank.com', 'Operations Manager', 'dept-003', 'role-002', 'active'),
('prof-004', 'user-004', 'David Kumar', 'david.kumar@bank.com', 'CTO', 'dept-004', 'role-001', 'active'),
('prof-005', 'user-005', 'Emma Thompson', 'emma.thompson@bank.com', 'Legal Counsel', 'dept-005', 'role-004', 'active'),
('prof-006', 'user-006', 'John Martinez', 'john.martinez@bank.com', 'Vendor Manager', 'dept-003', 'role-005', 'active'),
('prof-007', 'user-007', 'Lisa Anderson', 'lisa.anderson@bank.com', 'Compliance Analyst', 'dept-002', 'role-003', 'active')
ON CONFLICT DO NOTHING;

-- ================================================================
-- Documents
-- ================================================================

INSERT INTO documents (id, title, description, category, department_id, status, current_version, tags, owner_id, owner_name, access_level, expiry_date) VALUES
('doc-001', 'Enterprise Security Policy', 'Comprehensive security guidelines and requirements', 'Policy', 'dept-004', 'published', 3, '["security","policy","governance"]', 'user-004', 'David Kumar', 'internal', '2026-12-31'),
('doc-002', 'Risk Management Framework', 'Framework for identifying and managing enterprise risks', 'Framework', 'dept-002', 'published', 2, '["risk","framework"]', 'user-002', 'Michael Chen', 'internal', '2026-06-30'),
('doc-003', 'Vendor Management Procedures', 'Standard procedures for vendor onboarding and management', 'Procedure', 'dept-003', 'published', 1, '["vendors","procedures"]', 'user-003', 'Jennifer Williams', 'internal', '2027-03-15'),
('doc-004', 'Financial Controls Manual', 'Controls and compliance requirements for financial operations', 'Manual', 'dept-001', 'draft', 1, '["finance","controls"]', 'user-001', 'Sarah Johnson', 'restricted', '2026-09-30'),
('doc-005', 'Data Protection Guidelines', 'Guidelines for handling and protecting sensitive data', 'Guideline', 'dept-004', 'published', 2, '["data","protection","gdpr"]', 'user-004', 'David Kumar', 'internal', '2026-12-31'),
('doc-006', 'Compliance Audit Checklist', 'Annual compliance audit requirements and checklist', 'Checklist', 'dept-002', 'published', 1, '["compliance","audit"]', 'user-002', 'Michael Chen', 'internal', '2026-12-31')
ON CONFLICT DO NOTHING;

-- ================================================================
-- Document Versions
-- ================================================================

INSERT INTO document_versions (id, document_id, version, change_note, file_name, author_id, author_name) VALUES
('docv-001', 'doc-001', 1, 'Initial version', 'security-policy-v1.pdf', 'user-004', 'David Kumar'),
('docv-002', 'doc-001', 2, 'Added multi-factor authentication requirements', 'security-policy-v2.pdf', 'user-004', 'David Kumar'),
('docv-003', 'doc-001', 3, 'Updated incident response procedures', 'security-policy-v3.pdf', 'user-004', 'David Kumar'),
('docv-004', 'doc-002', 1, 'Initial framework version', 'risk-framework-v1.pdf', 'user-002', 'Michael Chen'),
('docv-005', 'doc-002', 2, 'Enhanced risk scoring methodology', 'risk-framework-v2.pdf', 'user-002', 'Michael Chen'),
('docv-006', 'doc-003', 1, 'Initial procedures document', 'vendor-procedures-v1.pdf', 'user-003', 'Jennifer Williams')
ON CONFLICT DO NOTHING;

-- ================================================================
-- Workflows
-- ================================================================

INSERT INTO workflows (id, name, description, entity_type, steps, sla_hours, is_active) VALUES
('wf-001', 'Document Approval', 'Standard document approval workflow', 'document', '[{"step": 1, "name": "Department Review", "role": "Manager"}, {"step": 2, "name": "Compliance Review", "role": "Manager"}, {"step": 3, "name": "Final Approval", "role": "Admin"}]', 48, true),
('wf-002', 'Vendor Onboarding', 'Vendor due diligence and onboarding workflow', 'vendor', '[{"step": 1, "name": "Initial Assessment", "role": "Vendor Manager"}, {"step": 2, "name": "Risk Assessment", "role": "Manager"}, {"step": 3, "name": "Legal Review", "role": "Approver"}, {"step": 4, "name": "Final Approval", "role": "Admin"}]', 72, true),
('wf-003', 'Project Approval', 'Project initiation approval workflow', 'project', '[{"step": 1, "name": "Department Review", "role": "Manager"}, {"step": 2, "name": "Budget Approval", "role": "Admin"}, {"step": 3, "name": "Executive Approval", "role": "Admin"}]', 96, true),
('wf-004', 'Risk Assessment', 'Risk identification and assessment workflow', 'risk', '[{"step": 1, "name": "Initial Assessment", "role": "Analyst"}, {"step": 2, "name": "Risk Review", "role": "Manager"}, {"step": 3, "name": "Mitigation Planning", "role": "Manager"}]', 120, true)
ON CONFLICT DO NOTHING;

-- ================================================================
-- Approval Requests
-- ================================================================

INSERT INTO approval_requests (id, workflow_id, title, entity_type, entity_id, current_step, total_steps, status, requested_by, requested_by_name, assignee_name, priority, due_date) VALUES
('apr-001', 'wf-001', 'Approve Enterprise Security Policy', 'document', 'doc-001', 2, 3, 'pending', 'user-004', 'David Kumar', 'Michael Chen', 'high', '2026-07-03'),
('apr-002', 'wf-002', 'Onboard CloudTech Solutions Inc', 'vendor', 'vend-001', 3, 4, 'pending', 'user-006', 'John Martinez', 'Emma Thompson', 'medium', '2026-07-08'),
('apr-003', 'wf-003', 'Approve Mobile Banking Project', 'project', 'proj-001', 1, 3, 'pending', 'user-001', 'Sarah Johnson', 'Jennifer Williams', 'high', '2026-07-06'),
('apr-004', 'wf-001', 'Approve Risk Management Framework', 'document', 'doc-002', 3, 3, 'approved', 'user-002', 'Michael Chen', 'Sarah Johnson', 'medium', '2026-06-29'),
('apr-005', 'wf-004', 'Assess Cybersecurity Risk', 'risk', 'risk-001', 2, 3, 'in_progress', 'user-004', 'David Kumar', 'Michael Chen', 'high', '2026-07-02')
ON CONFLICT DO NOTHING;

-- ================================================================
-- Projects
-- ================================================================

INSERT INTO projects (id, name, description, department_id, status, priority, progress, budget, spent, owner_name, start_date, end_date, risk_level) VALUES
('proj-001', 'Mobile Banking Platform', 'Development of mobile application for retail banking', 'dept-004', 'active', 'high', 65, 500000, 325000, 'David Kumar', '2026-01-15', '2026-09-30', 'medium'),
('proj-002', 'Cloud Infrastructure Migration', 'Migration of on-premises systems to cloud', 'dept-004', 'active', 'high', 45, 750000, 337500, 'David Kumar', '2026-02-01', '2026-10-31', 'high'),
('proj-003', 'Data Analytics Platform', 'Implementation of advanced analytics for reporting', 'dept-001', 'planning', 'medium', 10, 300000, 30000, 'Sarah Johnson', '2026-08-01', '2026-12-31', 'low'),
('proj-004', 'Compliance Automation', 'Automation of compliance monitoring and reporting', 'dept-002', 'active', 'high', 55, 400000, 220000, 'Michael Chen', '2026-01-20', '2026-08-31', 'medium'),
('proj-005', 'HR Management System', 'New HRMS implementation', 'dept-003', 'planning', 'medium', 0, 200000, 0, 'Jennifer Williams', '2026-09-01', '2027-02-28', 'low')
ON CONFLICT DO NOTHING;

-- ================================================================
-- Vendors
-- ================================================================

INSERT INTO vendors (id, name, category, contact_email, status, risk_score, risk_rating, due_diligence_status, performance_score, contract_value, onboarded_date, renewal_date) VALUES
('vend-001', 'CloudTech Solutions Inc', 'Cloud Services', 'contact@cloudtech.com', 'active', 35, 'low', 'completed', 92, 150000, '2024-03-15', '2025-03-15'),
('vend-002', 'SecureBank Systems', 'Security', 'sales@securebank.com', 'active', 25, 'low', 'completed', 95, 200000, '2023-06-01', '2025-06-01'),
('vend-003', 'DataVault Pro', 'Data Services', 'info@datavault.com', 'pending_review', 55, 'medium', 'in_progress', NULL, 120000, NULL, NULL),
('vend-004', 'Enterprise Solutions Ltd', 'Consulting', 'business@entsolutions.com', 'active', 45, 'medium', 'completed', 85, 300000, '2024-08-20', '2025-08-20'),
('vend-005', 'ComplianceFirst Technologies', 'Compliance', 'support@compfirst.com', 'active', 20, 'low', 'completed', 98, 180000, '2023-12-10', '2025-12-10'),
('vend-006', 'Global IT Services', 'IT Services', 'contracts@globalit.com', 'inactive', 75, 'high', 'completed', 62, 250000, '2022-01-01', '2024-06-30'),
('vend-007', 'Financial Audit Partners', 'Audit Services', 'engagement@finaudit.com', 'active', 15, 'low', 'completed', 96, 175000, '2023-04-15', '2025-04-15')
ON CONFLICT DO NOTHING;

-- ================================================================
-- Contracts
-- ================================================================

INSERT INTO contracts (id, title, counterparty, vendor_id, type, status, value, start_date, end_date, auto_renew, owner_name) VALUES
('cont-001', 'Cloud Infrastructure Services Agreement', 'CloudTech Solutions Inc', 'vend-001', 'Service', 'active', 150000, '2024-03-15', '2025-03-15', true, 'David Kumar'),
('cont-002', 'Security Solutions Contract', 'SecureBank Systems', 'vend-002', 'Service', 'active', 200000, '2023-06-01', '2025-06-01', true, 'David Kumar'),
('cont-003', 'Consulting Services Agreement', 'Enterprise Solutions Ltd', 'vend-004', 'Service', 'active', 300000, '2024-08-20', '2025-08-20', false, 'Sarah Johnson'),
('cont-004', 'Compliance Monitoring Services', 'ComplianceFirst Technologies', 'vend-005', 'Service', 'active', 180000, '2023-12-10', '2025-12-10', true, 'Michael Chen'),
('cont-005', 'External Audit Services', 'Financial Audit Partners', 'vend-007', 'Service', 'active', 175000, '2023-04-15', '2025-04-15', true, 'Sarah Johnson'),
('cont-006', 'Managed IT Services', 'Global IT Services', 'vend-006', 'Service', 'expired', 250000, '2022-01-01', '2024-06-30', false, 'David Kumar')
ON CONFLICT DO NOTHING;

-- ================================================================
-- Risks
-- ================================================================

INSERT INTO risks (id, title, description, category, department_id, likelihood, impact, severity, status, owner_name, control) VALUES
('risk-001', 'Cybersecurity Threats', 'Potential security breaches and cyber attacks', 'Security', 'dept-004', 3, 4, 'high', 'open', 'David Kumar', 'Advanced threat detection system, employee training, incident response plan'),
('risk-002', 'Vendor Financial Instability', 'Risk of critical vendors experiencing financial difficulties', 'Vendor', 'dept-003', 2, 3, 'medium', 'open', 'John Martinez', 'Regular vendor financial assessments, diversified vendor base'),
('risk-003', 'Regulatory Compliance Violation', 'Failure to comply with evolving regulations', 'Compliance', 'dept-002', 2, 4, 'high', 'open', 'Michael Chen', 'Compliance monitoring system, regular audits, legal review'),
('risk-004', 'Data Privacy Breach', 'Unauthorized access to sensitive customer data', 'Data', 'dept-004', 2, 5, 'high', 'open', 'David Kumar', 'Encryption, access controls, data classification'),
('risk-005', 'Project Schedule Delay', 'Critical projects may exceed planned timelines', 'Project', 'dept-001', 3, 2, 'medium', 'open', 'Sarah Johnson', 'Project management office, weekly tracking, escalation procedures'),
('risk-006', 'Key Personnel Turnover', 'Loss of critical staff members', 'HR', 'dept-003', 2, 3, 'medium', 'mitigated', 'Jennifer Williams', 'Competitive compensation, career development, knowledge transfer program')
ON CONFLICT DO NOTHING;

-- ================================================================
-- Compliance Items
-- ================================================================

INSERT INTO compliance_items (id, framework, control_ref, title, description, status, owner_name, last_reviewed, next_review) VALUES
('comp-001', 'SOX', 'SOX-001', 'Financial Reporting Controls', 'Controls over financial statement preparation and reporting', 'compliant', 'Sarah Johnson', '2026-05-15', '2026-11-15'),
('comp-002', 'GDPR', 'GDPR-005', 'Data Subject Rights', 'Procedures for handling data subject access requests', 'compliant', 'David Kumar', '2026-04-20', '2026-10-20'),
('comp-003', 'ISO 27001', 'ISO-001', 'Access Control Policy', 'Policy for managing system and data access', 'compliant', 'David Kumar', '2026-03-10', '2026-09-10'),
('comp-004', 'GLBA', 'GLBA-003', 'Customer Information Protection', 'Safeguards for protecting customer financial information', 'compliant', 'Sarah Johnson', '2026-05-01', '2026-11-01'),
('comp-005', 'AML/KYC', 'AML-002', 'Customer Due Diligence', 'Know Your Customer requirements and enhanced due diligence', 'under_review', 'Michael Chen', '2026-05-30', '2026-08-30'),
('comp-006', 'BSA', 'BSA-001', 'Suspicious Activity Reporting', 'Procedures for reporting suspicious transaction patterns', 'compliant', 'Michael Chen', '2026-04-10', '2026-10-10')
ON CONFLICT DO NOTHING;

-- ================================================================
-- Notifications
-- ================================================================

INSERT INTO notifications (id, "userId", title, body, type, is_read, link) VALUES
('notif-001', 'user-001', 'Approval Required', 'Mobile Banking Project requires budget approval', 'info', false, '/approvals/apr-003'),
('notif-002', 'user-002', 'Pending Review', 'Cybersecurity risk assessment needs your review', 'warning', false, '/risks/risk-001'),
('notif-003', 'user-004', 'Document Updated', 'Security Policy has been updated to version 3', 'info', true, '/documents/doc-001'),
('notif-004', 'user-006', 'Vendor Onboarding', 'CloudTech Solutions requires legal review', 'info', false, '/vendors/vend-001'),
('notif-005', 'user-005', 'Contract Review', 'New contract ready for legal review', 'warning', false, '/contracts/cont-001'),
('notif-006', 'user-002', 'Compliance Task', 'AML/KYC framework needs to be reviewed', 'warning', false, '/compliance/comp-005')
ON CONFLICT DO NOTHING;

-- ================================================================
-- Audit Logs
-- ================================================================

INSERT INTO audit_logs (id, "userId", actor_name, action, entity_type, entity_id, module, details, ip_address) VALUES
('audit-001', 'user-001', 'Sarah Johnson', 'created', 'project', 'proj-001', 'projects', 'Mobile Banking Platform project created', '192.168.1.100'),
('audit-002', 'user-004', 'David Kumar', 'updated', 'document', 'doc-001', 'documents', 'Security Policy updated to version 3', '192.168.1.101'),
('audit-003', 'user-006', 'John Martinez', 'created', 'vendor', 'vend-001', 'vendors', 'CloudTech Solutions onboarded', '192.168.1.102'),
('audit-004', 'user-002', 'Michael Chen', 'approved', 'document', 'doc-002', 'approvals', 'Risk Management Framework approved', '192.168.1.103'),
('audit-005', 'user-004', 'David Kumar', 'viewed', 'document', 'doc-001', 'documents', 'Accessed Security Policy', '192.168.1.104'),
('audit-006', 'user-001', 'Sarah Johnson', 'created', 'approval', 'apr-003', 'approvals', 'New approval request for Mobile Banking Project', '192.168.1.100'),
('audit-007', 'user-003', 'Jennifer Williams', 'updated', 'project', 'proj-004', 'projects', 'Compliance Automation project progress updated to 55%', '192.168.1.105'),
('audit-008', 'user-002', 'Michael Chen', 'created', 'risk', 'risk-003', 'risks', 'Regulatory Compliance Violation risk identified', '192.168.1.103')
ON CONFLICT DO NOTHING;

-- ================================================================
-- Summary
-- ================================================================

-- Display counts of seeded data
SELECT 
    'Departments' as entity, COUNT(*) as count FROM departments
UNION ALL
SELECT 'Users', COUNT(*) FROM "user"
UNION ALL
SELECT 'Roles', COUNT(*) FROM roles
UNION ALL
SELECT 'Profiles', COUNT(*) FROM profiles
UNION ALL
SELECT 'Documents', COUNT(*) FROM documents
UNION ALL
SELECT 'Workflows', COUNT(*) FROM workflows
UNION ALL
SELECT 'Approval Requests', COUNT(*) FROM approval_requests
UNION ALL
SELECT 'Projects', COUNT(*) FROM projects
UNION ALL
SELECT 'Vendors', COUNT(*) FROM vendors
UNION ALL
SELECT 'Contracts', COUNT(*) FROM contracts
UNION ALL
SELECT 'Risks', COUNT(*) FROM risks
UNION ALL
SELECT 'Compliance Items', COUNT(*) FROM compliance_items
UNION ALL
SELECT 'Notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'Audit Logs', COUNT(*) FROM audit_logs
ORDER BY entity;
