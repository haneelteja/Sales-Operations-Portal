/**
 * Test Script for Invoice Generation Edge Functions
 * 
 * Usage:
 *   node scripts/test-invoice-functions.js
 * 
 * Make sure to set environment variables:
 *   SUPABASE_URL=https://your-project.supabase.co
 *   SUPABASE_ANON_KEY=your-anon-key
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'YOUR_ANON_KEY';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testTokenRefresh() {
  log('\n🔐 Testing Token Refresh Function...', 'blue');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/google-drive-token`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const data = await response.json();

    if (response.ok && data.accessToken) {
      log('✅ Token refresh successful!', 'green');
      log(`   Access Token: ${data.accessToken.substring(0, 20)}...`, 'reset');
      log(`   Expires In: ${data.expiresIn} seconds`, 'reset');
      return { success: true, accessToken: data.accessToken };
    } else {
      log('❌ Token refresh failed!', 'red');
      log(`   Error: ${JSON.stringify(data, null, 2)}`, 'red');
      return { success: false, error: data };
    }
  } catch (error) {
    log('❌ Token refresh error!', 'red');
    log(`   Error: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function testFileUpload(accessToken) {
  log('\n📤 Testing File Upload Function...', 'blue');
  
  // Create a simple test file (base64 encoded "Hello World")
  const testContent = 'Hello World - Test Invoice File';
  const base64Content = Buffer.from(testContent).toString('base64');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/google-drive-upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: `test-invoice-${Date.now()}.txt`,
        folderId: null,
        fileData: base64Content,
        mimeType: 'text/plain',
      }),
    });

    const data = await response.json();

    if (response.ok && data.id) {
      log('✅ File upload successful!', 'green');
      log(`   File ID: ${data.id}`, 'reset');
      log(`   View Link: ${data.webViewLink}`, 'reset');
      log(`   Download Link: ${data.webContentLink}`, 'reset');
      return { success: true, fileId: data.id, links: data };
    } else {
      log('❌ File upload failed!', 'red');
      log(`   Error: ${JSON.stringify(data, null, 2)}`, 'red');
      return { success: false, error: data };
    }
  } catch (error) {
    log('❌ File upload error!', 'red');
    log(`   Error: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function testInvoiceNumberGeneration() {
  log('\n🔢 Testing Invoice Number Generation...', 'blue');
  
  // This would require Supabase client - simplified version
  log('⚠️  Invoice number generation test requires database access', 'yellow');
  log('   Run this SQL in Supabase SQL Editor:', 'yellow');
  log('   SELECT generate_invoice_number(\'INV\', true, true);', 'reset');
}

async function runAllTests() {
  log('🧪 Invoice Generation System - Function Tests', 'blue');
  log('='.repeat(50), 'blue');
  
  // Check environment variables
  if (SUPABASE_URL.includes('YOUR_PROJECT') || SUPABASE_ANON_KEY.includes('YOUR_ANON')) {
    log('\n⚠️  Warning: Environment variables not set!', 'yellow');
    log('   Set SUPABASE_URL and SUPABASE_ANON_KEY environment variables', 'yellow');
    log('   Example:', 'yellow');
    log('   export SUPABASE_URL=https://your-project.supabase.co', 'reset');
    log('   export SUPABASE_ANON_KEY=your-anon-key', 'reset');
    return;
  }

  // Test 1: Token Refresh
  const tokenResult = await testTokenRefresh();
  
  if (!tokenResult.success) {
    log('\n❌ Token refresh failed. Cannot proceed with file upload test.', 'red');
    log('\n💡 Troubleshooting:', 'yellow');
    log('   1. Check GOOGLE_REFRESH_TOKEN secret is set in Supabase', 'reset');
    log('   2. Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set', 'reset');
    log('   3. Verify refresh token is valid (not expired)', 'reset');
    log('   4. Check function logs in Supabase Dashboard', 'reset');
    return;
  }

  // Test 2: File Upload
  const uploadResult = await testFileUpload(tokenResult.accessToken);
  
  if (!uploadResult.success) {
    log('\n❌ File upload failed.', 'red');
    log('\n💡 Troubleshooting:', 'yellow');
    log('   1. Check token refresh function works (test above)', 'reset');
    log('   2. Verify OAuth scopes include drive.file', 'reset');
    log('   3. Check function logs in Supabase Dashboard', 'reset');
    return;
  }

  // Test 3: Invoice Number Generation
  await testInvoiceNumberGeneration();

  // Summary
  log('\n' + '='.repeat(50), 'blue');
  log('📊 Test Summary:', 'blue');
  log(`   Token Refresh: ${tokenResult.success ? '✅ PASS' : '❌ FAIL'}`, tokenResult.success ? 'green' : 'red');
  log(`   File Upload: ${uploadResult.success ? '✅ PASS' : '❌ FAIL'}`, uploadResult.success ? 'green' : 'red');
  
  if (tokenResult.success && uploadResult.success) {
    log('\n✅ All tests passed! Invoice generation system is ready.', 'green');
    log('\n📝 Next Steps:', 'yellow');
    log('   1. Create Word template at public/templates/invoice-template.docx', 'reset');
    log('   2. Configure environment variables (company details)', 'reset');
    log('   3. Integrate with SalesEntry component', 'reset');
    log('   4. Test end-to-end invoice generation', 'reset');
  } else {
    log('\n❌ Some tests failed. Please fix issues before proceeding.', 'red');
  }
}

// Run tests
runAllTests().catch(error => {
  log(`\n❌ Unexpected error: ${error.message}`, 'red');
  process.exit(1);
});
