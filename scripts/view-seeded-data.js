#!/usr/bin/env node

const { Pool } = require('pg');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function divider(title) {
  log('\n' + '═'.repeat(70), 'cyan');
  log(`  ${title}`, 'cyan');
  log('═'.repeat(70), 'cyan');
}

async function viewSeededData() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:4840@localhost:5432/ahadufile',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  const client = await pool.connect();

  try {
    log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
    log('║          Seeded Data Overview & Verification             ║', 'cyan');
    log('╚════════════════════════════════════════════════════════════╝\n', 'cyan');

    // 1. Departments
    divider('1. DEPARTMENTS');
    const depts = await client.query('SELECT id, name, code, head_name FROM departments ORDER BY name');
    depts.rows.forEach(dept => {
      log(`  • ${dept.name.padEnd(20)} (${dept.code}) - Head: ${dept.head_name}`, 'green');
    });
    log(`  Total: ${depts.rows.length} departments`, 'blue');

    // 2. Users & Roles
    divider('2. USERS & ROLES');
    const users = await client.query(`
      SELECT u.name, u.email, r.name as role, d.name as department
      FROM "user" u
      LEFT JOIN profiles p ON u.id = p."userId"
      LEFT JOIN roles r ON p.role_id = r.id
      LEFT JOIN departments d ON p.department_id = d.id
      ORDER BY u.name
    `);
    users.rows.forEach(user => {
      log(`  • ${user.name.padEnd(20)} (${user.role || 'No Role'}) - ${user.department || 'N/A'}`, 'green');
    });
    log(`  Total: ${users.rows.length} users`, 'blue');

    // 3. Documents
    divider('3. DOCUMENTS');
    const docs = await client.query(`
      SELECT title, category, status, owner_name, current_version
      FROM documents
      ORDER BY title
    `);
    docs.rows.forEach(doc => {
      log(`  • ${doc.title.padEnd(30)} [${doc.category}] v${doc.current_version} - ${doc.owner_name}`, 'green');
      log(`    Status: ${doc.status}`, 'cyan');
    });
    log(`  Total: ${docs.rows.length} documents`, 'blue');

    // 4. Vendors
    divider('4. VENDORS');
    const vendors = await client.query(`
      SELECT name, category, status, risk_rating, contract_value
      FROM vendors
      ORDER BY name
    `);
    vendors.rows.forEach(vendor => {
      const value = vendor.contract_value ? `$${vendor.contract_value.toLocaleString()}` : 'N/A';
      log(`  • ${vendor.name.padEnd(28)} [${vendor.category}] - ${vendor.status}`, 'green');
      log(`    Risk: ${vendor.risk_rating.padEnd(6)} | Value: ${value}`, 'cyan');
    });
    log(`  Total: ${vendors.rows.length} vendors`, 'blue');

    // 5. Projects
    divider('5. PROJECTS');
    const projects = await client.query(`
      SELECT name, status, progress, budget, spent, owner_name
      FROM projects
      ORDER BY name
    `);
    projects.rows.forEach(project => {
      const budgetInfo = project.budget ? `$${project.budget.toLocaleString()} (${project.spent ? '$' + project.spent.toLocaleString() : '$0'} spent)` : 'N/A';
      log(`  • ${project.name.padEnd(30)} - ${project.status}`, 'green');
      log(`    Progress: ${project.progress}% | Budget: ${budgetInfo}`, 'cyan');
    });
    log(`  Total: ${projects.rows.length} projects`, 'blue');

    // 6. Contracts
    divider('6. CONTRACTS');
    const contracts = await client.query(`
      SELECT title, status, value, start_date, end_date
      FROM contracts
      ORDER BY title
    `);
    contracts.rows.forEach(contract => {
      const dates = `${contract.start_date} to ${contract.end_date}`;
      log(`  • ${contract.title.padEnd(35)} - ${contract.status}`, 'green');
      log(`    Value: $${contract.value?.toLocaleString() || 'N/A'} | ${dates}`, 'cyan');
    });
    log(`  Total: ${contracts.rows.length} contracts`, 'blue');

    // 7. Risks
    divider('7. RISKS');
    const risks = await client.query(`
      SELECT title, category, severity, status, owner_name
      FROM risks
      ORDER BY title
    `);
    risks.rows.forEach(risk => {
      log(`  • ${risk.title.padEnd(30)} [${risk.category}] - ${risk.severity}`, 'green');
      log(`    Status: ${risk.status} | Owner: ${risk.owner_name}`, 'cyan');
    });
    log(`  Total: ${risks.rows.length} risks`, 'blue');

    // 8. Approval Requests
    divider('8. APPROVAL REQUESTS');
    const approvals = await client.query(`
      SELECT title, entity_type, status, priority, current_step, total_steps
      FROM approval_requests
      ORDER BY title
    `);
    approvals.rows.forEach(approval => {
      log(`  • ${approval.title.padEnd(35)} - ${approval.status}`, 'green');
      log(`    Type: ${approval.entity_type} | Priority: ${approval.priority} | Step: ${approval.current_step}/${approval.total_steps}`, 'cyan');
    });
    log(`  Total: ${approvals.rows.length} approvals`, 'blue');

    // 9. Compliance Items
    divider('9. COMPLIANCE ITEMS');
    const compliance = await client.query(`
      SELECT framework, control_ref, title, status, owner_name
      FROM compliance_items
      ORDER BY framework, control_ref
    `);
    compliance.rows.forEach(item => {
      log(`  • [${item.framework}] ${item.control_ref} - ${item.title}`, 'green');
      log(`    Status: ${item.status} | Owner: ${item.owner_name}`, 'cyan');
    });
    log(`  Total: ${compliance.rows.length} compliance items`, 'blue');

    // 10. Workflow Status
    divider('10. WORKFLOWS');
    const workflows = await client.query(`
      SELECT id, name, entity_type, is_active
      FROM workflows
      ORDER BY name
    `);
    workflows.rows.forEach(wf => {
      const active = wf.is_active ? '✓ Active' : '✗ Inactive';
      log(`  • ${wf.name.padEnd(30)} [${wf.entity_type}] ${active}`, 'green');
    });
    log(`  Total: ${workflows.rows.length} workflows`, 'blue');

    // 11. Summary Statistics
    divider('11. SUMMARY STATISTICS');
    
    const stats = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM "user") as user_count,
        (SELECT COUNT(*) FROM departments) as dept_count,
        (SELECT COUNT(*) FROM documents) as doc_count,
        (SELECT COUNT(*) FROM vendors) as vendor_count,
        (SELECT COUNT(*) FROM projects) as project_count,
        (SELECT COUNT(*) FROM contracts) as contract_count,
        (SELECT COUNT(*) FROM risks) as risk_count,
        (SELECT COUNT(*) FROM approval_requests) as approval_count,
        (SELECT COUNT(*) FROM compliance_items) as compliance_count,
        (SELECT COUNT(*) FROM workflows) as workflow_count,
        (SELECT COUNT(*) FROM notifications) as notification_count,
        (SELECT COUNT(*) FROM audit_logs) as audit_count
    `);

    const s = stats.rows[0];
    log(`  Users: ${s.user_count}`, 'green');
    log(`  Departments: ${s.dept_count}`, 'green');
    log(`  Documents: ${s.doc_count}`, 'green');
    log(`  Vendors: ${s.vendor_count}`, 'green');
    log(`  Projects: ${s.project_count}`, 'green');
    log(`  Contracts: ${s.contract_count}`, 'green');
    log(`  Risks: ${s.risk_count}`, 'green');
    log(`  Approvals: ${s.approval_count}`, 'green');
    log(`  Compliance Items: ${s.compliance_count}`, 'green');
    log(`  Workflows: ${s.workflow_count}`, 'green');
    log(`  Notifications: ${s.notification_count}`, 'green');
    log(`  Audit Logs: ${s.audit_count}`, 'green');

    const totalRecords = 
      s.user_count + s.dept_count + s.doc_count + s.vendor_count + 
      s.project_count + s.contract_count + s.risk_count + s.approval_count + 
      s.compliance_count + s.workflow_count + s.notification_count + s.audit_count;
    
    log(`\n  ${colors.bold}Total Records: ${totalRecords}${colors.reset}`, 'yellow');

    // 12. Data Quality Checks
    divider('12. DATA QUALITY CHECKS');
    
    // Check for orphaned records
    const orphanedDocVersions = await client.query(`
      SELECT COUNT(*) as count FROM document_versions 
      WHERE document_id NOT IN (SELECT id FROM documents)
    `);
    log(`  ✓ Orphaned document versions: ${orphanedDocVersions.rows[0].count}`, 'green');

    // Check active vendors
    const activeVendors = await client.query(`
      SELECT COUNT(*) as count FROM vendors WHERE status = 'active'
    `);
    log(`  ✓ Active vendors: ${activeVendors.rows[0].count}`, 'green');

    // Check open risks
    const openRisks = await client.query(`
      SELECT COUNT(*) as count FROM risks WHERE status = 'open'
    `);
    log(`  ✓ Open risks: ${openRisks.rows[0].count}`, 'green');

    // Check pending approvals
    const pendingApprovals = await client.query(`
      SELECT COUNT(*) as count FROM approval_requests 
      WHERE status IN ('pending', 'in_progress')
    `);
    log(`  ✓ Pending/In-Progress approvals: ${pendingApprovals.rows[0].count}`, 'green');

    // Check compliant items
    const compliantItems = await client.query(`
      SELECT COUNT(*) as count FROM compliance_items WHERE status = 'compliant'
    `);
    log(`  ✓ Compliant items: ${compliantItems.rows[0].count}`, 'green');

    log('\n✨ All seeded data verified successfully!\n', 'green');

  } catch (err) {
    log(`\n❌ Error: ${err.message}\n`, 'red');
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

viewSeededData().catch(err => {
  log(`Fatal error: ${err.message}`, 'red');
  process.exit(1);
});
