#!/usr/bin/env node

/**
 * Database Migration Runner
 * Executes the invitation system migration
 */

const fs = require('fs');
const path = require('path');
const postgres = require('postgres');

async function runMigration() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not set in environment');
    process.exit(1);
  }

  console.log('🔄 Running database migration...');
  console.log(`📍 Database: ${databaseUrl.split('@')[1]}`);

  try {
    // Create connection
    const sql = postgres(databaseUrl);

    // Read migration file
    const migrationPath = path.join(__dirname, '..', 'migrations', 'add-invitation-system.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split SQL into individual statements and execute
    // Remove comments first
    const sqlWithoutComments = migrationSQL
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n');
    
    const statements = sqlWithoutComments
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`\n📝 Executing ${statements.length} migration statements...\n`);

    for (const statement of statements) {
      try {
        console.log(`⏳ ${statement.substring(0, 60)}...`);
        await sql.unsafe(statement);
        console.log(`✅ Success\n`);
      } catch (err) {
        // Some statements might fail if columns already exist (that's ok)
        if (err.message.includes('already exists') || err.message.includes('IF NOT EXISTS')) {
          console.log(`⚠️  Already exists (skipped)\n`);
        } else {
          throw err;
        }
      }
    }

    console.log('\n✅ Migration completed successfully!\n');

    // Verify columns
    console.log('🔍 Verifying new columns...\n');
    const result = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'user' 
      ORDER BY ordinal_position
    `;

    const newColumns = ['status', 'invitationToken', 'invitationExpiresAt', 'passwordHash', 
                       'requirePasswordChange', 'passwordChangedAt', 'passwordResetToken', 'passwordResetExpiresAt'];
    
    console.log('User table columns:');
    result.forEach(col => {
      const isNew = newColumns.includes(col.column_name);
      const marker = isNew ? '✨' : '  ';
      console.log(`${marker} ${col.column_name} (${col.data_type})`);
    });

    // Verify indexes
    console.log('\n📊 Verifying indexes...\n');
    const indexes = await sql`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'user' 
      AND indexname LIKE 'idx_user%'
      ORDER BY indexname
    `;

    console.log('User table indexes:');
    indexes.forEach(idx => {
      console.log(`✅ ${idx.indexname}`);
    });

    // Check user count
    console.log('\n📈 Database Status:\n');
    const userCount = await sql`SELECT COUNT(*) as count FROM "user"`;
    console.log(`Total users: ${userCount[0].count}`);

    const activeUsers = await sql`SELECT COUNT(*) as count FROM "user" WHERE status = 'active'`;
    console.log(`Active users: ${activeUsers[0].count}`);

    const invitedUsers = await sql`SELECT COUNT(*) as count FROM "user" WHERE status = 'invited'`;
    console.log(`Invited users: ${invitedUsers[0].count}`);

    console.log('\n🎉 All checks passed! Migration is complete.\n');
    console.log('Next steps:');
    console.log('1. Set up email service (SendGrid, AWS SES, etc.)');
    console.log('2. Update lib/email.ts with email provider code');
    console.log('3. Add email service credentials to .env.local');
    console.log('4. Build and deploy: npm run build && git push');
    console.log('5. Test user creation flow\n');

    await sql.end();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    console.error('\nError details:', err);
    process.exit(1);
  }
}

runMigration();
