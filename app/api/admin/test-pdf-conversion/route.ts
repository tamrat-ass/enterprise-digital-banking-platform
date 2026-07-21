import { NextRequest, NextResponse } from "next/server"

/**
 * GET /api/admin/test-pdf-conversion
 * Test if PDF conversion is properly configured
 */
export async function GET(req: NextRequest) {
  try {
    const apiKey = process.env.CLOUDCONVERT_API_KEY
    
    console.log('[TestPDFConversion] Checking configuration...')
    
    const response = {
      timestamp: new Date().toISOString(),
      apiKeyPresent: !!apiKey,
      apiKeyLength: apiKey ? apiKey.length : 0,
      apiKeyFirstChars: apiKey ? apiKey.substring(0, 50) : null,
      nodeEnv: process.env.NODE_ENV,
      checks: {
        apiKeyConfigured: !!apiKey && apiKey.length > 0,
        hasValidJWT: apiKey ? apiKey.startsWith('eyJ') : false,
      }
    }
    
    console.log('[TestPDFConversion] Configuration:', response)
    
    if (!response.checks.apiKeyConfigured) {
      return NextResponse.json({
        ...response,
        status: 'ERROR',
        message: 'CLOUDCONVERT_API_KEY is not configured',
        action: 'Add CLOUDCONVERT_API_KEY to .env.local and restart dev server'
      }, { status: 400 })
    }
    
    if (!response.checks.hasValidJWT) {
      return NextResponse.json({
        ...response,
        status: 'WARNING',
        message: 'API key does not appear to be a valid JWT token',
        action: 'Check if the API key value in .env.local is correct'
      }, { status: 400 })
    }
    
    // Try to validate API key with CloudConvert
    console.log('[TestPDFConversion] Testing CloudConvert API...')
    const testResponse = await fetch('https://api.cloudconvert.com/v2/account', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      }
    })
    
    if (testResponse.ok) {
      const accountData = await testResponse.json()
      return NextResponse.json({
        ...response,
        status: 'OK',
        message: 'CloudConvert API is working correctly',
        account: {
          id: (accountData as any).data?.id,
          email: (accountData as any).data?.email,
          plan: (accountData as any).data?.plan,
        }
      }, { status: 200 })
    } else {
      const errorText = await testResponse.text()
      return NextResponse.json({
        ...response,
        status: 'ERROR',
        message: 'CloudConvert API authentication failed',
        apiResponse: {
          status: testResponse.status,
          statusText: testResponse.statusText,
          error: errorText.substring(0, 200),
        },
        action: 'API key may be expired or invalid. Get a new one from https://cloudconvert.com/dashboard/api/keys'
      }, { status: 401 })
    }
  } catch (err) {
    console.error('[TestPDFConversion] Error:', err)
    return NextResponse.json({
      status: 'ERROR',
      message: 'Test failed with exception',
      error: err instanceof Error ? err.message : String(err)
    }, { status: 500 })
  }
}

