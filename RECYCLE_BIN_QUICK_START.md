# Recycle Bin Quick Start Guide

## 🚀 Getting Started

### Step 1: Apply Database Migration
Run the soft delete migration to add the necessary columns and tables:

```bash
psql -d your_database < migrations/add-soft-delete.sql
```

Or if using a migration tool, run the `add-soft-delete.sql` migration.

### Step 2: Initialize Permissions
Visit the setup page in your browser:

```
http://localhost:3000/admin/setup-recycle-bin
```

Click "Setup Recycle Bin Permissions" button. This will:
- Create 4 new permissions
- Assign permissions to System Admin and Document Officer roles

### Step 3: Test the Feature

**Delete a File**:
1. Go to File Management (`/file-management`)
2. Click the trash icon on any file
3. Confirm the dialog
4. File moves to Recycle Bin

**View Recycle Bin**:
1. Click "Recycle Bin" in the sidebar
2. See all deleted files with metadata
3. Use search to find files
4. Sort by date, name, or deleted by

**Restore a File**:
1. In Recycle Bin, click the restore icon (green)
2. Confirm the dialog
3. File returns to File Management

**Permanently Delete**:
1. In Recycle Bin, click the delete icon (red)
2. Confirm warning dialog
3. File is permanently removed

**Bulk Operations**:
1. Select multiple files using checkboxes
2. Click "Restore" or "Delete" button
3. Confirm action
4. All selected files processed

## 📋 Permissions Required

Users need these permissions to use the Recycle Bin:

| Feature | Permission | Role |
|---------|-----------|------|
| View Recycle Bin | `recycleBin.view` | System Admin, Document Officer |
| Delete Files | `file.delete` | System Admin, Document Officer |
| Restore Files | `file.restore` | System Admin, Document Officer |
| Permanently Delete | `file.permanentDelete` | System Admin only |

## 🔧 Configuration

### Change Retention Period
The default retention period is 30 days. To change it:

1. Connect to the database
2. Update the `recycle_bin_retention_policy` table:

```sql
UPDATE recycle_bin_retention_policy 
SET days_before_permanent_delete = 60 
WHERE id = 'default-retention-policy';
```

### Run Cleanup Manually
To immediately clean up expired deleted files:

```typescript
import { RecycleBinService } from '@/lib/services/recycle-bin.service'

// Clean up files deleted more than 30 days ago
await RecycleBinService.cleanupExpiredDeletedFiles(30)
```

### Schedule Automatic Cleanup
Set up a cron job or scheduled task to run cleanup automatically:

```typescript
// Example: Run daily at 2 AM
import cron from 'node-cron'
import { RecycleBinService } from '@/lib/services/recycle-bin.service'

cron.schedule('0 2 * * *', async () => {
  console.log('Running recycle bin cleanup...')
  await RecycleBinService.cleanupExpiredDeletedFiles(30)
})
```

## 📊 Monitoring

### View Audit Logs
Check the `soft_delete_audit` table to see all delete/restore/permanent-delete operations:

```sql
SELECT * FROM soft_delete_audit 
ORDER BY timestamp DESC 
LIMIT 100;
```

### Get Statistics
Query deleted files statistics:

```sql
SELECT 
  COUNT(*) as total_deleted,
  deleted_by,
  DATE(deleted_at) as delete_date
FROM documents 
WHERE deleted_at IS NOT NULL 
GROUP BY deleted_by, delete_date 
ORDER BY delete_date DESC;
```

## 🐛 Troubleshooting

### "Permission denied: recycleBin.view"
**Solution**: Assign the `recycleBin.view` permission to the user's role
- Go to Admin > Roles & Permissions
- Find user's role
- Add `recycleBin.view` permission

### "Recycle Bin menu not showing"
**Solution**: User needs `recycleBin.view` permission
- Verify permission is assigned
- Clear browser cache and reload

### Files not appearing in File Management after restore
**Solution**: Wait a moment for the UI to refresh, or reload the page
- The list should auto-update after restore operation

### Cleanup job not running
**Solution**: Set up the scheduled task manually
- Use system cron (Linux/Mac) or Task Scheduler (Windows)
- Or implement in application startup code

## 🔐 Security Notes

- Deleted files are NOT immediately removed from storage
- Only permanently deleted files are removed from storage
- All operations are logged in the audit table
- Users cannot access deleted files through APIs
- Soft-deleted files are hidden from all normal listings
- Access requires proper permissions

## 📱 API Reference

### Fetch Deleted Files
```bash
GET /api/recycle-bin?page=1&limit=20&sortBy=deletedAt&search=report
```

### Soft Delete File
```bash
DELETE /api/documents/:id/delete
```

### Restore File
```bash
POST /api/recycle-bin/:id/restore
```

### Permanently Delete File
```bash
DELETE /api/recycle-bin/:id/permanent-delete
```

### Bulk Operations
```bash
POST /api/recycle-bin/bulk-operations
Content-Type: application/json

{
  "fileIds": ["doc-1", "doc-2"],
  "action": "restore"  // or "permanent_delete"
}
```

## ✅ Verification Checklist

After setup, verify:

- [ ] Database migration applied successfully
- [ ] Recycle bin permissions created
- [ ] Can delete file from File Management
- [ ] Deleted file appears in Recycle Bin
- [ ] Can restore file from Recycle Bin
- [ ] Can search deleted files
- [ ] Can perform bulk restore
- [ ] Can permanently delete (with confirmation)
- [ ] Audit logs record all operations
- [ ] Soft-deleted files don't appear in normal File Management

## 📞 Support

For issues or questions:
1. Check the audit logs: `SELECT * FROM soft_delete_audit`
2. Review permissions: `/admin/permissions`
3. Check user role assignment: `/admin/users`
4. Contact system administrator
