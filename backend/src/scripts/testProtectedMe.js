const http = require('http');

// Helper to make HTTP requests
function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : '';
    const headers = {
      'Content-Type': 'application/json'
    };
    if (postData) {
      headers['Content-Length'] = Buffer.byteLength(postData);
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: headers
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
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runTests() {
  console.log('=====================================================');
  console.log('🧪 TESTING PROTECTED /me ROUTE & RBAC MIDDLEWARE');
  console.log('=====================================================\n');

  const randomSuffix = Math.floor(Math.random() * 100000);
  const driverEmail = `me_driver_${randomSuffix}@example.com`;
  const passengerEmail = `me_passenger_${randomSuffix}@example.com`;
  const password = 'TestPassword123';

  // Setup: Register Driver & Passenger
  await makeRequest('POST', '/api/auth/register', {
    name: 'Driver Dev',
    email: driverEmail,
    password: password,
    role: 'DRIVER'
  });
  await makeRequest('POST', '/api/auth/register', {
    name: 'Passenger Dev',
    email: passengerEmail,
    password: password,
    role: 'PASSENGER'
  });

  // Login both to get tokens
  const driverLogin = await makeRequest('POST', '/api/auth/login', { email: driverEmail, password });
  const driverToken = driverLogin.body.data.token;

  const passengerLogin = await makeRequest('POST', '/api/auth/login', { email: passengerEmail, password });
  const passengerToken = passengerLogin.body.data.token;

  // Test 1: Access without token
  console.log('Test 1: Access GET /api/users/me WITHOUT token...');
  const res1 = await makeRequest('GET', '/api/users/me');
  console.log('Status:', res1.status);
  console.log('Response:', JSON.stringify(res1.body, null, 2));
  if (res1.status === 401 && res1.body.success === false) {
    console.log('✓ Test 1 PASSED: Unauthenticated access rejected with 401.\n');
  } else {
    console.error('✗ Test 1 FAILED\n');
  }

  // Test 2: Access with tampered/invalid token
  console.log('Test 2: Access GET /api/users/me with INVALID token...');
  const res2 = await makeRequest('GET', '/api/users/me', null, 'invalid_fake_token_123');
  console.log('Status:', res2.status);
  console.log('Response:', JSON.stringify(res2.body, null, 2));
  if (res2.status === 401 && res2.body.success === false) {
    console.log('✓ Test 2 PASSED: Tampered token rejected with 401.\n');
  } else {
    console.error('✗ Test 2 FAILED\n');
  }

  // Test 3: Access with valid Driver token
  console.log('Test 3: Access GET /api/users/me with VALID Driver token...');
  const res3 = await makeRequest('GET', '/api/users/me', null, driverToken);
  console.log('Status:', res3.status);
  console.log('Response:', JSON.stringify(res3.body, null, 2));
  if (res3.status === 200 && res3.body.data.user.email === driverEmail && !res3.body.data.user.password_hash) {
    console.log('✓ Test 3 PASSED: User profile returned, no password_hash exposed.\n');
  } else {
    console.error('✗ Test 3 FAILED\n');
  }

  // Test 4: RBAC - Passenger attempting to access Driver-only route
  console.log('Test 4: RBAC test - Passenger accessing Driver-only route...');
  const res4 = await makeRequest('GET', '/api/users/driver-only-test', null, passengerToken);
  console.log('Status:', res4.status);
  console.log('Response:', JSON.stringify(res4.body, null, 2));
  if (res4.status === 403 && res4.body.success === false) {
    console.log('✓ Test 4 PASSED: Passenger blocked with 403 Forbidden.\n');
  } else {
    console.error('✗ Test 4 FAILED\n');
  }

  // Test 5: RBAC - Driver accessing Driver-only route
  console.log('Test 5: RBAC test - Driver accessing Driver-only route...');
  const res5 = await makeRequest('GET', '/api/users/driver-only-test', null, driverToken);
  console.log('Status:', res5.status);
  console.log('Response:', JSON.stringify(res5.body, null, 2));
  if (res5.status === 200 && res5.body.success === true) {
    console.log('✓ Test 5 PASSED: Driver successfully granted access.\n');
  } else {
    console.error('✗ Test 5 FAILED\n');
  }

  console.log('🎉 ALL STEP 6 TESTS COMPLETED!');
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
});
