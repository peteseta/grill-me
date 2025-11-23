/**
 * Manual test script for authentication endpoints
 * Run with: node test-auth.js
 *
 * Make sure your worker is running with: npm run dev
 */

const BASE_URL = 'http://localhost:8787'; // Default Wrangler dev server URL

async function testRegister() {
  console.log('\n=== Testing Register Endpoint ===');
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'test123456';

  console.log(`Email: ${testEmail}`);
  console.log(`Password: ${testPassword}`);

  try {
    const response = await fetch(`${BASE_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });

    console.log(`Status: ${response.status}`);

    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('✅ Registration successful!');
      return data;
    } else {
      console.log('❌ Registration failed:', data.error);
      return null;
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    return null;
  }
}

async function testLogin() {
  console.log('\n=== Testing Login Endpoint ===');
  const testEmail = 'existing@example.com'; // Use an existing account
  const testPassword = 'password123';

  console.log(`Email: ${testEmail}`);

  try {
    const response = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });

    console.log(`Status: ${response.status}`);

    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('✅ Login successful!');
      return data;
    } else {
      console.log('❌ Login failed:', data.error);
      return null;
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    return null;
  }
}

async function testHealth() {
  console.log('\n=== Testing Health Endpoint ===');
  try {
    const response = await fetch(`${BASE_URL}/health`);
    const data = await response.json();
    console.log('Health check:', data);
    return response.ok;
  } catch (error) {
    console.log('❌ Worker not running. Start it with: npm run dev');
    return false;
  }
}

async function main() {
  console.log('🧪 Testing Authentication Endpoints');
  console.log(`Base URL: ${BASE_URL}`);

  // First check if worker is running
  const isHealthy = await testHealth();
  if (!isHealthy) {
    console.log('\n⚠️  Please start the worker first:');
    console.log('   cd workers && npm run dev');
    process.exit(1);
  }

  // Test register
  await testRegister();

  // Test login (this will fail if you don't have an existing account)
  // await testLogin();
}

main();
