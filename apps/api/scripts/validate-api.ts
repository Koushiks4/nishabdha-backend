import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const API_URL = process.env.VITE_API_URL || 'http://localhost:3001';

interface TestResult {
  endpoint: string;
  method: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  statusCode?: number;
  message?: string;
  error?: string;
}

const results: TestResult[] = [];

function log(color: string, ...args: any[]) {
  const colors: Record<string, string> = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
  };
  console.log(colors[color], ...args, colors.reset);
}

async function testEndpoint(
  method: string,
  endpoint: string,
  description: string,
  options: {
    auth?: string;
    body?: any;
    expectedStatus?: number;
    skip?: boolean;
  } = {}
): Promise<TestResult> {
  const { auth, body, expectedStatus = 200, skip = false } = options;

  if (skip) {
    log('yellow', `⏭️  SKIP: ${method} ${endpoint} - ${description}`);
    return {
      endpoint,
      method,
      status: 'SKIP',
      message: description,
    };
  }

  try {
    const config: any = {
      method,
      url: `${API_URL}${endpoint}`,
    };

    if (auth) {
      config.headers = { Authorization: `Bearer ${auth}` };
    }

    if (body) {
      config.data = body;
    }

    const response = await axios(config);

    if (response.status === expectedStatus) {
      log('green', `✅ PASS: ${method} ${endpoint} - ${description} (${response.status})`);
      return {
        endpoint,
        method,
        status: 'PASS',
        statusCode: response.status,
        message: description,
      };
    } else {
      log('red', `❌ FAIL: ${method} ${endpoint} - Expected ${expectedStatus}, got ${response.status}`);
      return {
        endpoint,
        method,
        status: 'FAIL',
        statusCode: response.status,
        message: `Expected ${expectedStatus}, got ${response.status}`,
      };
    }
  } catch (error: any) {
    const statusCode = error.response?.status;
    const errorMsg = error.response?.data?.error || error.message;

    // Some endpoints are expected to fail (401, 404, etc.)
    if (statusCode === expectedStatus) {
      log('green', `✅ PASS: ${method} ${endpoint} - ${description} (${statusCode})`);
      return {
        endpoint,
        method,
        status: 'PASS',
        statusCode,
        message: description,
      };
    }

    log('red', `❌ FAIL: ${method} ${endpoint} - ${errorMsg} (${statusCode})`);
    return {
      endpoint,
      method,
      status: 'FAIL',
      statusCode,
      error: errorMsg,
    };
  }
}

async function main() {
  log('blue', '\n🔍 Starting API Validation\n');
  log('blue', `API URL: ${API_URL}\n`);

  // ========================================
  // 1. Health & Info Endpoints
  // ========================================
  log('blue', '📋 Health & Info Endpoints');
  results.push(await testEndpoint('GET', '/health', 'Health check'));
  results.push(await testEndpoint('GET', '/api', 'API info'));

  // ========================================
  // 2. Products (Public)
  // ========================================
  log('blue', '\n📦 Product Endpoints');
  results.push(await testEndpoint('GET', '/api/products', 'List all products'));
  results.push(await testEndpoint('GET', '/api/products?type=ARTWORK', 'List artwork products'));
  results.push(await testEndpoint('GET', '/api/products?type=MERCHANDISE', 'List merchandise products'));

  // ========================================
  // 3. Email Auth (Customer)
  // ========================================
  log('blue', '\n📧 Email Authentication Endpoints');
  results.push(
    await testEndpoint('POST', '/api/auth/email/send-otp', 'Send OTP', {
      body: { email: 'test@example.com' },
      expectedStatus: 400, // Will fail without proper setup, but endpoint exists
      skip: true, // Skip to avoid sending real OTPs
    })
  );

  // ========================================
  // 4. Cart (Requires Auth)
  // ========================================
  log('blue', '\n🛒 Cart Endpoints');
  results.push(
    await testEndpoint('GET', '/api/cart', 'Get cart (no auth)', {
      expectedStatus: 401, // Should fail without auth
    })
  );
  results.push(
    await testEndpoint('POST', '/api/cart', 'Add to cart (no auth)', {
      expectedStatus: 401,
    })
  );

  // ========================================
  // 5. Addresses (Requires Auth)
  // ========================================
  log('blue', '\n📍 Address Endpoints');
  results.push(
    await testEndpoint('GET', '/api/addresses', 'Get addresses (no auth)', {
      expectedStatus: 401,
    })
  );
  results.push(
    await testEndpoint('POST', '/api/addresses', 'Create address (no auth)', {
      expectedStatus: 401,
    })
  );

  // ========================================
  // 6. Orders (Requires Auth)
  // ========================================
  log('blue', '\n📦 Order Endpoints');
  results.push(
    await testEndpoint('GET', '/api/orders', 'Get orders (no auth)', {
      expectedStatus: 401,
    })
  );
  results.push(
    await testEndpoint('POST', '/api/orders', 'Create order (no auth)', {
      expectedStatus: 401,
    })
  );
  results.push(
    await testEndpoint('POST', '/api/orders/validate-cart', 'Validate cart (no auth)', {
      expectedStatus: 401,
    })
  );

  // ========================================
  // 7. Admin Endpoints (Requires Admin Auth)
  // ========================================
  log('blue', '\n👨‍💼 Admin Endpoints');
  results.push(
    await testEndpoint('GET', '/api/admin/me', 'Get admin profile (no auth)', {
      expectedStatus: 401,
    })
  );
  results.push(
    await testEndpoint('GET', '/api/admin/invites', 'List invites (no auth)', {
      expectedStatus: 401,
    })
  );
  results.push(
    await testEndpoint('POST', '/api/admin/invite', 'Create invite (no auth)', {
      expectedStatus: 401,
    })
  );

  // ========================================
  // Summary
  // ========================================
  log('blue', '\n\n📊 Test Summary\n');

  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  const skipped = results.filter((r) => r.status === 'SKIP').length;
  const total = results.length;

  log('green', `✅ Passed: ${passed}/${total}`);
  log('red', `❌ Failed: ${failed}/${total}`);
  log('yellow', `⏭️  Skipped: ${skipped}/${total}`);

  if (failed > 0) {
    log('red', '\n❌ Failed Tests:');
    results
      .filter((r) => r.status === 'FAIL')
      .forEach((r) => {
        console.log(`   ${r.method} ${r.endpoint} - ${r.error || r.message}`);
      });
  }

  log('blue', '\n✅ API Validation Complete\n');

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  log('red', '\n❌ Fatal error:', error.message);
  process.exit(1);
});
