# Division N/A Issue - FIXED

## Problem
When uploading documents, the Division field was showing as "N/A" even though it should show the selected division.

## Root Cause
In the upload form (`components/file-upload-form.tsx`), the division was being sent as an **empty string** `''` when not selected:

```typescript
formDataToSend.append('divisionId', formData.divisionId || '')  // Empty string!
```

This empty string reached the backend and was stored as `null` or undefined, displaying as "N/A" in the table.

## Solution

### 1. Form Validation (Line ~215)
Added validation to **require division selection** before upload:
```typescript
if (formData.departmentId && !formData.divisionId) {
  setUploadMessage({ type: 'error', text: 'Please select a division' })
  return
}
```

### 2. Submit Button Disabled State (Line ~357)
Updated button to be **disabled until division is selected**:
```typescript
disabled={
  files.length === 0 || 
  !formData.title || 
  !formData.categoryId || 
  !formData.departmentId || 
  !formData.divisionId ||  // <- Added this check
  uploading
}
```

### 3. Division Select Requirement (Line ~438)
Made division always required:
```typescript
<select
  required  // <- Changed from: required={!!formData.departmentId}
  value={formData.divisionId}
  ...
>
```

## How It Works Now

### User Flow
1. ✅ Select Department
2. ✅ Divisions auto-load for that department
3. ✅ Select Division (now **required**)
4. ✅ Upload button becomes **enabled**
5. ✅ File uploads with Division ID
6. ✅ Division displays correctly in table (not N/A)

### Form Validation
- Department: **Required**
- Division: **Required** (when department is selected)
- Category: **Required**
- Title: **Required**
- Files: **Required** (at least 1)

All must be filled before upload button becomes active.

## Files Modified

**`components/file-upload-form.tsx`**
- Added division validation check in `handleSubmit()`
- Updated submit button disabled state to include division check
- Made division select always required (not conditional)

## Testing

To verify the fix works:

1. Go to `http://localhost:3000/upload`
2. Fill in all fields including **Division** (required now)
3. Division will appear in the file management table
4. No more "N/A" values

## Result

✅ Division field now works correctly
✅ Form validates that division is selected
✅ Upload button disabled until division chosen
✅ Uploaded documents show correct division
