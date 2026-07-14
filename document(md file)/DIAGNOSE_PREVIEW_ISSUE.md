# 🔍 Diagnose Why Preview is Not Working

**Date**: July 13, 2026  
**Issue**: Word files still download instead of showing as PDF  
**Status**: Need to debug

---

## Step 1: Start Dev Server and Check Console

```bash
npm run dev
```

**Watch the console output for these lines** (they should appear when dev server starts):

```
[PDFConversionService] Initialized
[PDFConversionService] CloudConvert API Key present: true
```

**If you see**:
```
[PDFConversionService] CloudConvert API Key present: false
```

→ **The API key is not loaded!** Jump to "Fix API Key" section below.

---

## Step 2: Test API Key Configuration

Open your browser and go to:

```
http://localhost:3000/api/admin/test-pdf-conversion
```

**You'll see a JSON response.**

### ✅ If Response Shows:
```json
{
  "status": "OK",
  "message": "CloudConvert API is working correctly",
  "apiKeyPresent": true,
  "account": {
    "id": "12345",
    "email": "your@email.com"
  }
}
```

→ **API is configured correctly! The issue is elsewhere.**

### ❌ If Response Shows:
```json
{
  "status": "ERROR",
  "message": "CLOUDCONVERT_API_KEY is not configured",
  "apiKeyPresent": false
}
```

→ **API key not loaded! See "Fix API Key" below.**

### ❌ If Response Shows:
```json
{
  "status": "ERROR",
  "message": "CloudConvert API authentication failed",
  "apiResponse": {
    "status": 401,
    "error": "Unauthorized"
  }
}
```

→ **API key is invalid or expired! Get a new one.**

---

## Fix: API Key Issues

### Problem: API Key Not Found

**Cause**: `.env.local` file exists but API key is not being loaded into Node.js environment

**Solution**:

1. **Verify `.env.local` exists**:
   ```bash
   ls -la .env.local
   # Should show: .env.local file exists
   ```

2. **Verify API key is in the file**:
   ```bash
   cat .env.local | grep CLOUDCONVERT_API_KEY
   # Should show: CLOUDCONVERT_API_KEY=eyJ0eXA...
   ```

3. **Restart dev server completely**:
   ```bash
   # Stop dev server (Ctrl+C)
   # Wait 2 seconds
   npm run dev
   ```

4. **Check console again** for:
   ```
   [PDFConversionService] CloudConvert API Key present: true
   ```

### Problem: API Key Invalid/Expired

**Cause**: API key exists but CloudConvert doesn't recognize it

**Solution**:

1. Get a new API key from CloudConvert:
   - Go to: https://cloudconvert.com/dashboard/api/keys
   - Generate a new API key
   - Copy the full token

2. Update `.env.local`:
   ```bash
   # Open .env.local in your editor
   # Find this line: CLOUDCONVERT_API_KEY=...
   # Replace with new key: CLOUDCONVERT_API_KEY=eyJ0eXA...{new-key}...
   # Save the file
   ```

3. Restart dev server:
   ```bash
   # Stop: Ctrl+C
   # Start: npm run dev
   ```

4. Test again:
   ```
   http://localhost:3000/api/admin/test-pdf-conversion
   ```

---

## Step 3: Test Preview Flow

If API key is working, now test the actual preview:

### 3A. Upload a File

1. Go to: http://localhost:3000/upload
2. Select a small `.docx` file
3. Click Upload
4. Wait for upload to complete
5. Navigate to: http://localhost:3000/documents

### 3B. Click Preview

1. Find your uploaded document
2. Click the eye icon (Preview button)
3. **Check what happens**:

   **✅ If PDF displays**: Conversion is working!
   
   **❌ If error text appears**: Read the error message
   
   **❌ If Word file downloads**: Something else is wrong

### 3C. Check Console

**In the terminal where you ran `npm run dev`, look for**:

#### ✅ Success logs (you should see):
```
[PDFConversion] Converting with CloudConvert: { fileName: '...', ... }
[PDFConversion] Creating CloudConvert task...
[PDFConversion] Task created, ID: ...
[PDFConversion] Uploading file to task...
[PDFConversion] File uploaded successfully
[PDFConversion] Task status: { status: 'finished', ... }
[PDFConversion] CloudConvert conversion successful: /uploads/...
[Preview] On-the-fly conversion successful
```

#### ❌ Failure logs (look for):
```
[PDFConversion] Upload failed: { status: 400, error: ... }
[PDFConversion] Conversion failed
[PDFConversion] CloudConvert error
```

---

## Step 4: Debug If Preview Still Fails

If the API key is OK but preview still doesn't work, check the actual error:

### Check Browser DevTools

1. Open browser DevTools: F12
2. Go to **Network** tab
3. Click Preview button
4. Find request to `/api/documents/[id]/preview`
5. Click on it
6. Check **Response** tab

**Response should be**:
- Status: 200
- Content-Type: application/pdf
- Body: PDF binary data (starts with `%PDF`)

**If you see error text**, read the error message returned.

### Check Server Console Details

Look for any error messages starting with:
- `[PDFConversion]` - Conversion service error
- `[Preview]` - Preview route error
- `[FileStorageService]` - File read error

---

## Common Issues and Fixes

### Issue 1: "Upload failed: 400"

```
[PDFConversion] Upload failed: { status: 400, error: ... }
```

**Cause**: File format or encoding issue

**Fix**:
1. Try with a different/smaller Word file
2. Create a fresh document in Word and try again
3. Check file is not corrupted

### Issue 2: "Conversion timeout"

```
[PDFConversion] Conversion timeout after 20 attempts
```

**Cause**: CloudConvert taking too long

**Fix**:
1. Check https://status.cloudconvert.com for outages
2. Try with smaller file
3. Wait a moment and try again

### Issue 3: "File not found"

```
[FileStorageService] File not found at: D:\...
```

**Cause**: Upload didn't save file correctly

**Fix**:
1. Check file exists: `ls public/uploads/`
2. Try uploading again
3. Check disk space available

### Issue 4: "API Key present: false"

```
[PDFConversionService] CloudConvert API Key present: false
```

**Cause**: `.env.local` not being read

**Fix**:
1. Verify file exists: `ls .env.local`
2. Check API key is in file: `grep CLOUDCONVERT_API_KEY .env.local`
3. Restart dev server completely
4. Check console again

---

## Full Diagnostic Checklist

```bash
# 1. Verify .env.local exists
ls -la .env.local

# 2. Verify API key is in file
grep CLOUDCONVERT_API_KEY .env.local

# 3. Restart dev server completely
# Ctrl+C to stop
# npm run dev to start

# 4. Check console for API key loaded message
# Should see: [PDFConversionService] CloudConvert API Key present: true

# 5. Test API endpoint
# Open: http://localhost:3000/api/admin/test-pdf-conversion
# Should show: "status": "OK"

# 6. Upload test file
# Go to: http://localhost:3000/upload
# Upload a .docx file

# 7. Test preview
# Go to: http://localhost:3000/documents
# Click Preview button
# Should show PDF (not download)

# 8. Check console for conversion logs
# Should show: [PDFConversion] CloudConvert conversion successful
```

---

## What to Report

If you've done all these steps and it still doesn't work, tell me:

1. **Console output** from `npm run dev` startup
   - Look for: `[PDFConversionService] CloudConvert API Key present: ...`

2. **Response from test endpoint**:
   - Go to: http://localhost:3000/api/admin/test-pdf-conversion
   - Copy the JSON response

3. **Console logs when you click Preview**:
   - Copy all lines starting with `[PDFConversion]` or `[Preview]`

4. **What happened**:
   - Did PDF show? Or error? Or download?

---

## Emergency: Reset Everything

If nothing is working:

```bash
# Stop dev server
# Ctrl+C

# Clear Next.js cache
rm -r .next

# Restart
npm run dev

# Test again
```

---

**Next**: Go through the checklist above and report what you find!
