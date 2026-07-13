# 🚀 Fix Preview Issue - Follow These Exact Steps

**Status**: Word file still downloading instead of showing PDF  
**Root Cause**: Need to diagnose (likely API key not loaded)  
**Time to Fix**: 5-10 minutes  

---

## STEP 1: Completely Restart Dev Server (2 minutes)

**THIS IS CRITICAL** - The API key needs to be reloaded.

### On Windows:

```powershell
# 1. Stop the current dev server
# Press: Ctrl+C (in the terminal running npm run dev)
# Wait until it fully stops

# 2. Clear Next.js cache
Remove-Item -Recurse -Force .next

# 3. Start fresh
npm run dev
```

### What to Watch For:

When the dev server starts, **look at the console output**. You should see:

```
[PDFConversionService] Initialized
[PDFConversionService] CloudConvert API Key present: true
```

**If you see**:
```
[PDFConversionService] CloudConvert API Key present: false
```

→ The API key is not being loaded. See **FIX** section below.

**⏳ Wait** until you see: `✓ Compiled successfully`

---

## STEP 2: Verify API Configuration (2 minutes)

Open your browser and go to:

```
http://localhost:3000/api/admin/test-pdf-conversion
```

You'll see a JSON response. Check what it says:

### ✅ If you see "status": "OK":
```json
{
  "status": "OK",
  "message": "CloudConvert API is working correctly",
  "account": {
    "email": "your@email.com"
  }
}
```

→ **Great! API is working. Go to STEP 3.**

### ❌ If you see "status": "ERROR":
```json
{
  "status": "ERROR",
  "message": "CLOUDCONVERT_API_KEY is not configured"
}
```

→ **API key not loaded. Do the FIX below, then go to STEP 3.**

### ❌ If you see "status": "ERROR" with "authentication failed":
```json
{
  "status": "ERROR",
  "message": "CloudConvert API authentication failed"
}
```

→ **API key is invalid. Get a new one (see FIX section), then go to STEP 3.**

---

## FIX: API Key Not Loading

### Check if .env.local exists

```powershell
Test-Path .env.local
# Should show: True
```

If it shows `False`, the file doesn't exist! Create it:
```powershell
# Copy the template
Copy-Item .env.example .env.local
# Then edit it and add CLOUDCONVERT_API_KEY
```

### Check if API key is in .env.local

```powershell
Get-Content .env.local | Select-String "CLOUDCONVERT_API_KEY"
# Should show a line like:
# CLOUDCONVERT_API_KEY=eyJ0eXA...
```

If you don't see this line, add it to `.env.local`.

### If API Key is Invalid/Expired

Get a new API key:
1. Go to: https://cloudconvert.com/dashboard/api/keys
2. Click "Generate New Key"
3. Copy the new JWT token
4. Open `.env.local` in your editor
5. Find: `CLOUDCONVERT_API_KEY=...`
6. Replace with: `CLOUDCONVERT_API_KEY={your-new-key}`
7. Save the file

### Restart Dev Server

```powershell
# Stop: Ctrl+C
# Wait 2 seconds
npm run dev
```

Check console for:
```
[PDFConversionService] CloudConvert API Key present: true
```

---

## STEP 3: Test Preview (2 minutes)

### 3A. Upload a Word File

1. Start dev server (from STEP 1)
2. Open browser: http://localhost:3000/upload
3. Click "Choose File"
4. Select a `.docx` file (small is better, <5MB)
5. Click Upload
6. Wait for it to complete

### 3B. Click Preview

1. Open browser: http://localhost:3000/documents
2. Find your uploaded document
3. Click the **eye icon** (Preview button)
4. **Wait 15-20 seconds** for conversion

### ✅ If Success:
- PDF opens in browser
- No download dialog
- Console shows: `[PDFConversion] CloudConvert conversion successful`

### ❌ If Failure:
- Error text appears on screen
- Or file downloads anyway
- Go to STEP 4 for debugging

---

## STEP 4: Debug If Still Not Working (5 minutes)

### Check Server Console

Look for messages starting with `[PDFConversion]` or `[Preview]`.

**Copy any error messages you see.**

### Check Browser Network Tab

1. Press F12 (open DevTools)
2. Go to **Network** tab
3. Click Preview button
4. Look for request to `/api/documents/[id]/preview`
5. Click on it
6. Check **Response** tab

**What you should see**:
- Status: 200
- Content-Type: application/pdf
- Response body starts with: `%PDF`

**If you see**:
- Error text instead of PDF data
- Or error status (400, 401, 500)
- Copy the full response text

---

## Tell Me What You See

After following all steps above, tell me:

1. **Dev server startup** - Did you see:
   ```
   [PDFConversionService] CloudConvert API Key present: true
   ```
   Or `false`?

2. **API test endpoint** - What did you see:
   - Status: OK (working)
   - Status: ERROR with "not configured"
   - Status: ERROR with "authentication failed"

3. **Preview test** - What happened:
   - PDF displayed ✅
   - Error text appeared ❌
   - File downloaded ❌

4. **Console error message** - If it failed, copy the exact error from console

With this information, I can fix it immediately.

---

## Quick Checklist

```
[ ] Completely restarted dev server (Ctrl+C, then npm run dev)
[ ] Waited for "✓ Compiled successfully"
[ ] Tested: http://localhost:3000/api/admin/test-pdf-conversion
[ ] Uploaded a .docx file to /upload
[ ] Clicked Preview button
[ ] Waited 15-20 seconds
[ ] Checked what happened (PDF? Error? Download?)
[ ] Copied any error messages from console
```

**If all checked** → You're ready to report!

---

## Emergency Support

If you're stuck:

1. **Restart everything**:
   ```powershell
   # Stop dev server: Ctrl+C
   Remove-Item -Recurse -Force .next
   npm run dev
   ```

2. **Check basics**:
   ```powershell
   # Is .env.local present?
   Test-Path .env.local
   
   # Does it have the API key?
   Get-Content .env.local | Select-String "CLOUDCONVERT"
   ```

3. **Test API**:
   - Go to: http://localhost:3000/api/admin/test-pdf-conversion
   - Copy what you see

4. **Report**:
   - Tell me what step you're stuck on
   - Copy console output
   - Copy API test response

---

**Next Step**: Follow STEP 1 now! 🚀
