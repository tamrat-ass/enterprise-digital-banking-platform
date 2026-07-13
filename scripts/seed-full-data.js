const postgres = require('postgres')
const crypto = require('crypto')

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:4840@localhost:5432/ahadufile'

function generateId() {
  return crypto.randomUUID()
}

async function seedData() {
  const sql = postgres(connectionString)

  try {
    console.log('🌱 Starting comprehensive data seeding...\n')

    // Create sample departments
    const departments = [
      {
        id: generateId(),
        name: 'Compliance & Risk',
        code: 'CRM',
        description: 'Handles compliance and risk management',
        head_name: 'John Smith',
      },
      {
        id: generateId(),
        name: 'Operations',
        code: 'OPS',
        description: 'Operational management',
        head_name: 'Sarah Johnson',
      },
      {
        id: generateId(),
        name: 'Legal',
        code: 'LEG',
        description: 'Legal affairs',
        head_name: 'Michael Brown',
      },
      {
        id: generateId(),
        name: 'Finance',
        code: 'FIN',
        description: 'Financial management',
        head_name: 'Emma Davis',
      },
    ]

    await sql`
      INSERT INTO departments (id, name, code, description, head_name, created_at)
      VALUES ${sql(
        departments.map((d) => [d.id, d.name, d.code, d.description, d.head_name, new Date()]),
      )}
      ON CONFLICT DO NOTHING
    `

    // Create sample documents
    const documentStatuses = ['draft', 'pending_approval', 'approved', 'archived']
    const documentCategories = ['Policy', 'Procedure', 'Report', 'Audit', 'Compliance']

    const documents = Array.from({ length: 15 }, (_, i) => ({
      id: generateId(),
      title: `Document ${i + 1}: ${['Financial Report', 'Risk Assessment', 'Compliance Checklist', 'Audit Trail', 'Policy Document'][i % 5]}`,
      description: `Description for document ${i + 1}`,
      category: documentCategories[i % documentCategories.length],
      department_id: departments[i % departments.length].id,
      status: documentStatuses[i % documentStatuses.length],
      current_version: 1,
      tags: JSON.stringify(['banking', 'compliance', 'governance']),
      owner_id: 'user_1',
      owner_name: 'Admin User',
      access_level: 'internal',
      expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      created_at: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
      updated_at: new Date(),
    }))

    await sql`
      INSERT INTO documents (
        id, title, description, category, department_id, status,
        current_version, tags, owner_id, owner_name, access_level,
        expiry_date, created_at, updated_at
      )
      VALUES ${sql(
        documents.map((d) => [
          d.id,
          d.title,
          d.description,
          d.category,
          d.department_id,
          d.status,
          d.current_version,
          d.tags,
          d.owner_id,
          d.owner_name,
          d.access_level,
          d.expiry_date,
          d.created_at,
          d.updated_at,
        ]),
      )}
      ON CONFLICT DO NOTHING
    `

    // Create sample projects
    const projectStatuses = ['planning', 'in_progress', 'on_hold', 'completed']
    const projects = Array.from({ length: 10 }, (_, i) => ({
      id: generateId(),
      name: `Project ${i + 1}: ${['Digital Transformation', 'Risk Framework Update', 'Compliance Automation', 'Data Migration', 'Security Enhancement'][i % 5]}`,
      description: `Project description for project ${i + 1}`,
      department_id: departments[i % departments.length].id,
      status: projectStatuses[i % projectStatuses.length],
      priority: ['high', 'medium', 'low'][i % 3],
      progress: Math.floor(Math.random() * 100),
      budget: 100000 + Math.random() * 900000,
      spent: Math.random() * 500000,
      owner_name: ['John Smith', 'Sarah Johnson', 'Michael Brown', 'Emma Davis'][i % 4],
      start_date: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000),
      end_date: new Date(Date.now() + Math.random() * 180 * 24 * 60 * 60 * 1000),
      risk_level: ['low', 'medium', 'high'][i % 3],
      created_at: new Date(),
    }))

    await sql`
      INSERT INTO projects (
        id, name, description, department_id, status, priority,
        progress, budget, spent, owner_name, start_date, end_date,
        risk_level, created_at
      )
      VALUES ${sql(
        projects.map((p) => [
          p.id,
          p.name,
          p.description,
          p.department_id,
          p.status,
          p.priority,
          p.progress,
          p.budget,
          p.spent,
          p.owner_name,
          p.start_date,
          p.end_date,
          p.risk_level,
          p.created_at,
        ]),
      )}
      ON CONFLICT DO NOTHING
    `

    // Create sample vendors
    const vendors = Array.from({ length: 12 }, (_, i) => ({
      id: generateId(),
      name: `Vendor ${i + 1}: ${['TechCorp', 'FinanceAI', 'CloudSys', 'SecureNet', 'DataPro', 'ComplianceHub'][i % 6]}`,
      category: ['Software', 'Consulting', 'Infrastructure', 'Services'][i % 4],
      contact_email: `vendor${i + 1}@vendor.com`,
      status: ['active', 'inactive', 'on_review'][i % 3],
      risk_score: Math.floor(Math.random() * 100),
      risk_rating: ['low', 'medium', 'high'][i % 3],
      due_diligence_status: ['pending', 'in_progress', 'completed'][i % 3],
      performance_score: Math.floor(Math.random() * 100),
      contract_value: 50000 + Math.random() * 950000,
      onboarded_date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
      renewal_date: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000),
      created_at: new Date(),
    }))

    await sql`
      INSERT INTO vendors (
        id, name, category, contact_email, status,
        risk_score, risk_rating, due_diligence_status,
        performance_score, contract_value, onboarded_date,
        renewal_date, created_at
      )
      VALUES ${sql(
        vendors.map((v) => [
          v.id,
          v.name,
          v.category,
          v.contact_email,
          v.status,
          v.risk_score,
          v.risk_rating,
          v.due_diligence_status,
          v.performance_score,
          v.contract_value,
          v.onboarded_date,
          v.renewal_date,
          v.created_at,
        ]),
      )}
      ON CONFLICT DO NOTHING
    `

    // Create sample risks
    const riskCategories = ['Operational', 'Compliance', 'Financial', 'Reputational', 'Technical']
    const risks = Array.from({ length: 20 }, (_, i) => ({
      id: generateId(),
      title: `Risk ${i + 1}: ${riskCategories[i % riskCategories.length]} Risk`,
      description: `Description for risk ${i + 1}`,
      category: riskCategories[i % riskCategories.length],
      department_id: departments[i % departments.length].id,
      likelihood: Math.floor(Math.random() * 5) + 1,
      impact: Math.floor(Math.random() * 5) + 1,
      severity: ['low', 'medium', 'high', 'critical'][i % 4],
      status: ['open', 'mitigating', 'closed'][i % 3],
      owner_name: ['John Smith', 'Sarah Johnson', 'Michael Brown', 'Emma Davis'][i % 4],
      control: `Control measure for risk ${i + 1}`,
      created_at: new Date(),
    }))

    await sql`
      INSERT INTO risks (
        id, title, description, category, department_id,
        likelihood, impact, severity, status, owner_name,
        control, created_at
      )
      VALUES ${sql(
        risks.map((r) => [
          r.id,
          r.title,
          r.description,
          r.category,
          r.department_id,
          r.likelihood,
          r.impact,
          r.severity,
          r.status,
          r.owner_name,
          r.control,
          r.created_at,
        ]),
      )}
      ON CONFLICT DO NOTHING
    `

    // Create sample approval requests
    const approvalRequests = Array.from({ length: 8 }, (_, i) => ({
      id: generateId(),
      workflow_id: null,
      title: `Approval Request ${i + 1}`,
      entity_type: ['document', 'vendor', 'contract', 'project'][i % 4],
      entity_id: documents[i % documents.length].id,
      current_step: Math.floor(Math.random() * 3) + 1,
      total_steps: 3,
      status: ['pending', 'approved', 'rejected'][i % 3],
      requested_by: 'user_1',
      requested_by_name: 'Admin User',
      assignee_name: ['John Smith', 'Sarah Johnson', 'Michael Brown'][i % 3],
      priority: ['low', 'medium', 'high'][i % 3],
      due_date: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
      created_at: new Date(),
    }))

    await sql`
      INSERT INTO approval_requests (
        id, workflow_id, title, entity_type, entity_id,
        current_step, total_steps, status, requested_by,
        requested_by_name, assignee_name, priority,
        due_date, created_at
      )
      VALUES ${sql(
        approvalRequests.map((ar) => [
          ar.id,
          ar.workflow_id,
          ar.title,
          ar.entity_type,
          ar.entity_id,
          ar.current_step,
          ar.total_steps,
          ar.status,
          ar.requested_by,
          ar.requested_by_name,
          ar.assignee_name,
          ar.priority,
          ar.due_date,
          ar.created_at,
        ]),
      )}
      ON CONFLICT DO NOTHING
    `

    // Create sample compliance items
    const complianceFrameworks = ['GDPR', 'PCI-DSS', 'SOX', 'Basel III', 'MiFID II']
    const complianceItems = Array.from({ length: 15 }, (_, i) => ({
      id: generateId(),
      framework: complianceFrameworks[i % complianceFrameworks.length],
      control_ref: `CTRL-${String(i + 1).padStart(3, '0')}`,
      title: `Compliance Control ${i + 1}`,
      description: `Description for compliance control ${i + 1}`,
      status: ['not_assessed', 'compliant', 'non_compliant', 'in_progress'][i % 4],
      owner_name: ['John Smith', 'Sarah Johnson', 'Michael Brown'][i % 3],
      last_reviewed: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
      next_review: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000),
      created_at: new Date(),
    }))

    await sql`
      INSERT INTO compliance_items (
        id, framework, control_ref, title, description,
        status, owner_name, last_reviewed, next_review, created_at
      )
      VALUES ${sql(
        complianceItems.map((ci) => [
          ci.id,
          ci.framework,
          ci.control_ref,
          ci.title,
          ci.description,
          ci.status,
          ci.owner_name,
          ci.last_reviewed,
          ci.next_review,
          ci.created_at,
        ]),
      )}
      ON CONFLICT DO NOTHING
    `

    console.log('✅ Data seeding completed successfully!\n')
    console.log('📊 Summary:')
    console.log(`   - Departments: ${departments.length}`)
    console.log(`   - Documents: ${documents.length}`)
    console.log(`   - Projects: ${projects.length}`)
    console.log(`   - Vendors: ${vendors.length}`)
    console.log(`   - Risks: ${risks.length}`)
    console.log(`   - Approval Requests: ${approvalRequests.length}`)
    console.log(`   - Compliance Items: ${complianceItems.length}`)

    await sql.end()
  } catch (error) {
    console.error('❌ Error seeding data:', error.message)
    process.exit(1)
  }
}

seedData()
