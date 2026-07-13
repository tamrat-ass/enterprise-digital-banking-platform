# Filename Download Issue - FIXED ✅

## Problem Identified
Files were downloading with incorrect/truncated names:
- Should be: `BRD for Fraud Management System V1.0 (1).docx`
- Was: `BRD_zip` or `BRD` (truncated/corrupted)

## Root Cause
The preview and download endpoints were using `document.title` instead of `latestVersion.fileName`:
- `document.title` = "BRD " (truncated in database)
- `latestVersion.fileName` = "BRD for Fraud Management System V1.0 (1).docx" (complete)

## Solution Implemented

### 1. File: `app/api/documents/[id]/preview/route.ts`

**Changed from:**
```typescript
const fileName = document.title || 'document'
```

**Changed to:**
```typescript
// Use the actual uploaded filename, not the document title
const fileName = latestVersion?.fileName || document.title || 'document'
```

**And when setting filename:**
```typescript
// Use the actual filename from the version
const displayFileName = (latestVersion?.fileName || fileName)
  .replace(/"/g, '\\"')  // Escape quotes for header value
```

### 2. File: `app/api/documents/[id]/download/route.ts`

Applied same fix - ensures download endpoint also uses the correct filename.

## Results

### Before Fix
```
Database entry: fileName = "BRD for Fraud Management System V1.0 (1).docx"
Download name: "BRD_zip" or truncated version
Issue: Using document.title instead of version fileName
```

### After Fix
```
Database entry: fileName = "BRD for Fraud Management System V1.0 (1).docx"
Download name: "BRD for Fraud Management System V1.0 (1).docx"
✅ Correct filename preserved from database
```

## Technical Details

### Content-Disposition Header
```
attachment; filename="BRD for Fraud Management System V1.0 (1).docx"
```

The header properly handles:
- ✅ Spaces in filename
- ✅ Special characters like parentheses
- ✅ Version numbers like "V1.0"
- ✅ Multiple dots (file extension preserved)

### Filename Source Priority
1. `latestVersion.fileName` - Actual uploaded filename ✅
2. `document.title` - Document title fallback
3. `'document'` - Generic fallback

## Files Modified

1. **app/api/documents/[id]/preview/route.ts**
   - Line 37: Changed to use `latestVersion?.fileName`
   - Line 77: Properly escape filename in header

2. **app/api/documents/[id]/download/route.ts**
   - Uses `currentVersion.fileName` correctly
   - Added proper escaping

## Verification

Tested with document:
```
fileName: "BRD for Fraud Management System V1.0 (1).docx"
File size: 34,780 bytes
MIME type: application/vnd.openxmlformats-officedocument.wordprocessingml.document

✅ Filename preserved correctly in download dialog
```

## User Experience

1. User uploads: `BRD for Fraud Management System V1.0 (1).docx`
2. File saved to disk: `/uploads/0d07641c-c979-47d7-b290-5a9f630649c3.docx`
3. Database records: `fileName = "BRD for Fraud Management System V1.0 (1).docx"`
4. User clicks Preview/Download
5. ✅ Browser shows filename: `BRD for Fraud Management System V1.0 (1).docx`
6. ✅ File downloads with correct name

## Status

✅ **COMPLETE & VERIFIED**

All filenames now download correctly with full names and special characters preserved.

---

## Summary of Changes

| Aspect | Before | After |
|--------|--------|-------|
| Source for filename | `document.title` | `latestVersion.fileName` |
| Filename accuracy | Truncated | Complete |
| Special characters | Lost | Preserved |
| Download name | Corrupted | Correct |
| User experience | Confusing | Professional |

**The system is now production-ready with proper filename handling!** 🎉
