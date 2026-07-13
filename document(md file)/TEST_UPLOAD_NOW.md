# Test Upload Update - Simple Steps

## STEP 1: Start the Server (5 seconds)
Open terminal and run:
```bash
npm run dev
```

Wait for:
```
✓ Ready in 2.5s
```

---

## STEP 2: Test Database Fix (1 minute)

Open browser and go to:
```
http://localhost:3000/api/admin/fix-database
```

**You should see:**
```json
{
  "success": true,
  "action": "exists",
  "message": "file_path column already exists",
  "columnName": "file_path"
}
```

✅ If you see this → Database is OK

---

## STEP 3: Check Current Status (1 minute)

Open browser and go to:
```
http://localhost:3000/api/admin/test-upload
```

**You should see something like:**
```json
{
  "success": true,
  "summary": {
    "totalDocuments": 5,
    "documentsWithFilePath": 3,
    "documentsWithoutFilePath": 2
  }
}
```

**Note the numbers** for comparison after upload.

---

## STEP 4: Upload Test File (5 minutes)

### A) Go to upload page:
```
http://localhost:3000/upload
```

### B) Create a test file first:
Create a text file called `test.txt`:
```
Hello World - This is a test file
```

### C) Upload it:
1. Drag `test.txt` onto the upload area OR click Browse and select it
2. Fill in form:
   - **Title**: `Test Upload`
   - **Category**: Pick any
   - **Department**: Pick any
   - **Division**: Pick any (or leave blank)
3. Click **Upload**

### D) Check for success:
Should see green message: ✅ "Successfully uploaded 1 file(s)"

---

## STEP 5: Watch Server Logs (2 minutes)

Look at your **terminal** where you ran `npm run dev`.

### You should see logs like:

```
[FileUploadForm] Uploading file: {
  "fileName": "test.txt",
  "size": 1024,
  "type": "text/plain"
}

[POST Documents] FormData received: {
  "fileExists": true,
  "fileName": "test.txt",
  "fileSize": 1024
}

[DocumentService] Saving file for document: {
  "fileName": "test.txt",
  "contentSize": 1024
}

[FileStorageService] File written successfully: D:\...\public\uploads\[UUID].txt

[DocumentService] File saved successfully at: /uploads/[UUID].txt

[DocumentService] Verification - data in database: {
  "filePath": "/uploads/[UUID].txt",
  "filePathIsNull": false
}
```

✅ If you see `filePathIsNull: false` → **File path IS being saved!**

---

## STEP 6: Verify Database (2 minutes)

Check status again:
```
http://localhost:3000/api/admin/test-upload
```

**Look for:**
- `"documentsWithFilePath"` should have gone UP by 1
- Your new document should show:
  ```json
  "status": "✅ HAS FILE_PATH"
  "filePath": "/uploads/[UUID].txt"
  ```

✅ If you see this → **Upload is working!**

---

## STEP 7: Test Preview (2 minutes)

1. Go to:
   ```
   http://localhost:3000/file-management
   ```

2. Find your "Test Upload" document

3. Click **Preview** button

4. You should see your text file content displayed:
   ```
   Hello World - This is a test file
   ```

✅ If file displays → **Everything works!**

---

## STEP 8: Test Download (1 minute)

1. From file management page, find your test document

2. Click **Download** button

3. File should download as `test.txt`

✅ If download works → **All features working!**

---

## SUMMARY

If you see:
- ✅ Step 2: `"action": "exists"` 
- ✅ Step 3: Upload count increased
- ✅ Step 4: Success message
- ✅ Step 5: `filePathIsNull: false` in logs
- ✅ Step 6: Document shows `✅ HAS FILE_PATH`
- ✅ Step 7: Preview displays file
- ✅ Step 8: Download works

**= EVERYTHING IS WORKING! 🎉**

---

## IF SOMETHING FAILS

### If Step 2 fails (database):
- Run this in terminal:
  ```bash
  curl http://localhost:3000/api/admin/fix-database
  ```
- If it says `"action": "created"`, the column was added
- Try uploading again

### If Step 5 shows `filePathIsNull: true`:
- File is not being saved to database
- **Share the complete logs** from step 5
- This shows exactly where the problem is

### If Step 7 (preview) doesn't work:
- But Step 6 shows `✅ HAS FILE_PATH`
- Go to terminal and check if file exists:
  ```bash
  # Windows:
  dir public\uploads\
  
  # Mac/Linux:
  ls -la public/uploads/
  ```
- If file doesn't exist on disk, file save failed

### If nothing works:
Share:
1. Output from `/api/admin/test-upload`
2. Complete server logs from upload attempt
3. What error message you see (if any)

---

## QUICK TEST SUMMARY

| Step | Time | What to Check | Good Sign |
|------|------|---------------|-----------|
| 1 | 5s | Server starts | Terminal shows "Ready" |
| 2 | 1m | Database column | `"action": "exists"` |
| 3 | 1m | Current uploads | Shows count of uploads |
| 4 | 5m | Upload file | Green success message |
| 5 | 2m | Server logs | `filePathIsNull: false` |
| 6 | 2m | Database status | Count increased, shows ✅ |
| 7 | 2m | Preview | File displays |
| 8 | 1m | Download | File downloads |

**Total Time: ~20 minutes**

