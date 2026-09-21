const http = require('http');

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
  console.log('🧪 TESTING REGISTRATION API (POST /api/auth/register)');
  console.log('==============================================\n');

  const randomSuffix = Math.floor(Math.random() * 10000);
  const testDriverEmail = `driver_${randomSuffix}@example.com`;
  const testPassengerEmail = `passenger_${randomSuffix}@example.com`;

  // Test 1: Successful DRIVER registration
  console.log('Test 1: Valid DRIVER registration...');
  const res1 = await makePostRequest('/api/auth/register', {
    name: 'Aarav Sharma',
    email: testDriverEmail,
    password: 'password123',
    role: 'DRIVER'
  });
  console.log('Status:', res1.status);
  console.log('Response:', JSON.stringify(res1.body, null, 2));
  if (res1.status === 201 && res1.body.data.user.role === 'DRIVER' && !res1.body.data.user.password_hash) {
    console.log('✓ Test 1 PASSED: User registered, role correct, password_hash NOT exposed.\n');
  } else {
    console.error('✗ Test 1 FAILED\n');
  }

  // Test 2: Duplicate email registration rejection (409)
  console.log('Test 2: Duplicate email registration rejection...');
  const res2 = await makePostRequest('/api/auth/register', {
    name: 'Duplicate Aarav',
    email: testDriverEmail,
    password: 'anotherpassword',
    role: 'DRIVER'
  });
  console.log('Status:', res2.status);
  console.log('Response:', JSON.stringify(res2.body, null, 2));
  if (res2.status === 409 && res2.body.success === false) {
    console.log('✓ Test 2 PASSED: Duplicate email correctly rejected with 409 Conflict.\n');
  } else {
    console.error('✗ Test 2 FAILED\n');
  }

  // Test 3: Short password validation (< 6 chars)
  console.log('Test 3: Short password (< 6 chars) validation...');
  const res3 = await makePostRequest('/api/auth/register', {
    name: 'Short Pass',
    email: `short_${randomSuffix}@example.com`,
    password: '123',
    role: 'PASSENGER'
  });
  console.log('Status:', res3.status);
  console.log('Response:', JSON.stringify(res3.body, null, 2));
  if (res3.status === 400 && res3.body.success === false) {
    console.log('✓ Test 3 PASSED: Short password rejected with 400 Bad Request.\n');
  } else {
    console.error('✗ Test 3 FAILED\n');
  }

  // Test 4: Invalid role rejection
  console.log('Test 4: Invalid role rejection...');
  const res4 = await makePostRequest('/api/auth/register', {
    name: 'Invalid Role',
    email: `invalid_${randomSuffix}@example.com`,
    password: 'password123',
    role: 'SUPERADMIN'
  });
  console.log('Status:', res4.status);
  console.log('Response:', JSON.stringify(res4.body, null, 2));
  if (res4.status === 400 && res4.body.success === false) {
    console.log('✓ Test 4 PASSED: Invalid role rejected with 400 Bad Request.\n');
  } else {
    console.error('✗ Test 4 FAILED\n');
  }

  // Test 5: Successful PASSENGER registration
  console.log('Test 5: Valid PASSENGER registration...');
  const res5 = await makePostRequest('/api/auth/register', {
    name: 'Priya Patel',
    email: testPassengerEmail,
    password: 'password123',
    role: 'PASSENGER'
  });
  console.log('Status:', res5.status);
  console.log('Response:', JSON.stringify(res5.body, null, 2));
  if (res5.status === 201 && res5.body.data.user.role === 'PASSENGER') {
    console.log('✓ Test 5 PASSED: Passenger registered successfully.\n');
  } else {
    console.error('✗ Test 5 FAILED\n');
  }

  console.log('🎉 ALL STEP 4 TESTS COMPLETED!');
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
});
