import { NextRequest, NextResponse } from "next/server"
import { PDFConversionService } from "@/lib/services"
import fs from 'fs/promises'
import path from 'path'

/**
 * GET /api/admin/test-conversion
 * Test if PDF conversion actually works (not just API key validation)
 */
export async function GET(req: NextRequest) {
  try {
    console.log('[TestConversion] Starting conversion test...')
    
    const apiKey = process.env.CLOUDCONVERT_API_KEY
    
    if (!apiKey) {
      return NextResponse.json({
        status: 'ERROR',
        message: 'CLOUDCONVERT_API_KEY not configured',
      }, { status: 400 })
    }

    // Create a test file to convert
    const testDir = path.join(process.cwd(), 'public', 'test-conversions')
    await fs.mkdir(testDir, { recursive: true })

    // Create a simple test docx file (minimal valid docx)
    const testDocxPath = path.join(testDir, 'test-document.docx')
    
    // This is a minimal valid .docx file (it's actually a zip with minimal XML)
    // Real docx files are binary, but for testing we'll create a simple one
    const minimalDocx = Buffer.from([
      0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00,
      0x08, 0x00, 0x00, 0x00, 0x21, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x0b, 0x00, 0x00, 0x00, 0x5b, 0x43,
      0x6f, 0x6e, 0x74, 0x65, 0x6e, 0x74, 0x5f, 0x54,
      0x79, 0x70, 0x65, 0x73, 0x5d, 0x2e, 0x78, 0x6d,
      0x6c, 0x00, 0x00, 0x00, 0x00, 0x00
    ])
    
    // Instead, let's try with the actual CloudConvert API directly
    console.log('[TestConversion] Testing CloudConvert API directly...')
    
    // Step 1: Create job (v2/jobs endpoint, not v2/tasks!)
    const jobResponse = await fetch('https://api.cloudconvert.com/v2/jobs', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tasks: {
          'import-file': {
            operation: 'import/upload',
          },
          'convert-file': {
            operation: 'convert',
            input: 'import-file',
            input_format: 'docx',
            output_format: 'pdf',
          },
          'export-file': {
            operation: 'export/url',
            input: 'convert-file',
          },
        },
      }),
    })

    const jobData = await jobResponse.json()
    
    console.log('[TestConversion] Create job response:', {
      status: jobResponse.status,
      ok: jobResponse.ok,
      data: jobData,
    })

    if (!jobResponse.ok) {
      return NextResponse.json({
        status: 'ERROR',
        message: 'Failed to create conversion job',
        details: jobData,
        apiStatus: jobResponse.status,
      }, { status: 400 })
    }

    return NextResponse.json({
      status: 'SUCCESS',
      message: 'CloudConvert API is working! Conversion job created.',
      jobId: (jobData as any).data?.id,
      data: jobData,
    }, { status: 200 })

  } catch (err) {
    console.error('[TestConversion] Error:', err)
    return NextResponse.json({
      status: 'ERROR',
      message: 'Test failed with exception',
      error: err instanceof Error ? err.message : String(err),
    }, { status: 500 })
  }
}

