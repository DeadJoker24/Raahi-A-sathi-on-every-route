const http = require('http');
const jwt = require('jsonwebtoken');

// Helper to make HTTP POST requests
function makePostRequest(path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('==============================================');
  console.log('🧪 TESTING LOGIN API (POST /api/auth/login)');
  console.log('==============================================\n');

  const randomSuffix = Math.floor(Math.random() * 100000);
  const testEmail = `logintest_${randomSuffix}@example.com`;
  const testPassword = 'SecretPassword123';

  // Step 0: Register a user first to test against
  console.log('Setup: Registering test user...');
  const regRes = await makePostRequest('/api/auth/register', {
    name: 'Vikram Mehta',
    email: testEmail,
    password: testPassword,
    role: 'DRIVER'
  });
  console.log('Registered user status:', regRes.status, '\n');

  // Test 1: Successful Login
  console.log('Test 1: Login with valid credentials...');
  const res1 = await makePostRequest('/api/auth/login', {
    email: testEmail,
    password: testPassword
  });
  console.log('Status:', res1.status);
  console.log('Response:', JSON.stringify(res1.body, null, 2));

  let token = null;
  if (res1.status === 200 && res1.body.success === true && res1.body.data.token) {
    token = res1.body.data.token;
    const decoded = jwt.decode(token);
    console.log('Decoded JWT payload:', decoded);
    
    if (decoded.email === testEmail && decoded.role === 'DRIVER' && !res1.body.data.user.password_hash) {
      console.log('✓ Test 1 PASSED: Token issued, payload verified, password_hash not exposed.\n');
    } else {
      console.error('✗ Test 1 FAILED: Payload mismatch or security leak.\n');
    }
  } else {
    console.error('✗ Test 1 FAILED: Could not log in.\n');
  }

  // Test 2: Incorrect Password Rejection (401)
  console.log('Test 2: Login with WRONG password...');
  const res2 = await makePostRequest('/api/auth/login', {
    email: testEmail,
    password: 'WrongPassword456'
  });
  console.log('Status:', res2.status);
  console.log('Response:', JSON.stringify(res2.body, null, 2));
  if (res2.status === 401 && res2.body.success === false) {
    console.log('✓ Test 2 PASSED: Incorrect password rejected with 401 Unauthorized.\n');
  } else {
    console.error('✗ Test 2 FAILED\n');
  }

  // Test 3: Non-existent Email Rejection (401)
  console.log('Test 3: Login with NON-EXISTENT email...');
  const res3 = await makePostRequest('/api/auth/login', {
    email: `doesnotexist_${randomSuffix}@example.com`,
    password: 'SomePassword123'
  });
  console.log('Status:', res3.status);
  console.log('Response:', JSON.stringify(res3.body, null, 2));
  if (res3.status === 401 && res3.body.success === false) {
    console.log('✓ Test 3 PASSED: Non-existent email rejected with 401 Unauthorized.\n');
  } else {
    console.error('✗ Test 3 FAILED\n');
  }

  // Test 4: Missing Password (400)
  console.log('Test 4: Login with MISSING password...');
  const res4 = await makePostRequest('/api/auth/login', {
    email: testEmail
  });
  console.log('Status:', res4.status);
  console.log('Response:', JSON.stringify(res4.body, null, 2));
  if (res4.status === 400 && res4.body.success === false) {
    console.log('✓ Test 4 PASSED: Missing password rejected with 400 Bad Request.\n');
  } else {
    console.error('✗ Test 4 FAILED\n');
  }

  console.log('🎉 ALL STEP 5 TESTS COMPLETED!');
}

runTests().catch(err => {
  console.error('Login test execution failed:', err);
});
