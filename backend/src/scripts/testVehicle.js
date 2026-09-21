const http = require('http');

function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : '';
    const headers = { 'Content-Type': 'application/json' };
    if (postData) headers['Content-Length'] = Buffer.byteLength(postData);
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: headers
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });

    req.on('error', err => reject(err));
    if (postData) req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('=====================================================');
  console.log('🧪 TESTING VEHICLE API & ROLE-BASED RESTRICTIONS');
  console.log('=====================================================\n');

  const rand = Math.floor(Math.random() * 100000);
  const driverEmail = `v_driver_${rand}@example.com`;
  const passengerEmail = `v_passenger_${rand}@example.com`;
  const regNumber = `DL 01 AA ${rand.toString().padStart(4, '0').slice(-4)}`;

  // Setup: Register Driver and Passenger
  await makeRequest('POST', '/api/auth/register', {
    name: 'Kabir Driver',
    email: driverEmail,
    password: 'Password123',
    role: 'DRIVER'
  });
  const driverLogin = await makeRequest('POST', '/api/auth/login', { email: driverEmail, password: 'Password123' });
  const driverToken = driverLogin.body.data.token;

  await makeRequest('POST', '/api/auth/register', {
    name: 'Ananya Passenger',
    email: passengerEmail,
    password: 'Password123',
    role: 'PASSENGER'
  });
  const passengerLogin = await makeRequest('POST', '/api/auth/login', { email: passengerEmail, password: 'Password123' });
  const passengerToken = passengerLogin.body.data.token;

  // Test 1: Passenger attempting to create vehicle (RBAC test)
  console.log('Test 1: Passenger attempting POST /api/vehicles (Should be 403)...');
  const res1 = await makeRequest('POST', '/api/vehicles', {
    vehicle_type: 'Car',
    vehicle_model: 'Hyundai i20',
    registration_number: `DL 02 BB ${rand}`
  }, passengerToken);
  console.log('Status:', res1.status);
  console.log('Response:', JSON.stringify(res1.body, null, 2));
  if (res1.status === 403) {
    console.log('✓ Test 1 PASSED: Passenger blocked from vehicle creation with 403 Forbidden.\n');
  } else {
    console.error('✗ Test 1 FAILED\n');
  }

  // Test 2: Driver checking vehicle before registration
  console.log('Test 2: Driver checking GET /api/vehicles/me before registration...');
  const res2 = await makeRequest('GET', '/api/vehicles/me', null, driverToken);
  console.log('Status:', res2.status);
  console.log('Response:', JSON.stringify(res2.body, null, 2));
  if (res2.status === 200 && res2.body.data.vehicle === null) {
    console.log('✓ Test 2 PASSED: Returns vehicle: null for driver without vehicle.\n');
  } else {
    console.error('✗ Test 2 FAILED\n');
  }

  // Test 3: Driver successfully registering vehicle
  console.log('Test 3: Driver registering vehicle via POST /api/vehicles...');
  const res3 = await makeRequest('POST', '/api/vehicles', {
    vehicle_type: 'Sedan',
    vehicle_model: 'Honda City ZX',
    registration_number: regNumber
  }, driverToken);
  console.log('Status:', res3.status);
  console.log('Response:', JSON.stringify(res3.body, null, 2));
  if (res3.status === 201 && res3.body.data.vehicle.registration_number === regNumber) {
    console.log('✓ Test 3 PASSED: Driver vehicle registered successfully.\n');
  } else {
    console.error('✗ Test 3 FAILED\n');
  }

  // Test 4: Duplicate plate rejection
  console.log('Test 4: Registering duplicate plate (Should be 409)...');
  // Register second driver
  const driver2Email = `v_driver2_${rand}@example.com`;
  await makeRequest('POST', '/api/auth/register', {
    name: 'Driver Two',
    email: driver2Email,
    password: 'Password123',
    role: 'DRIVER'
  });
  const driver2Login = await makeRequest('POST', '/api/auth/login', { email: driver2Email, password: 'Password123' });
  const driver2Token = driver2Login.body.data.token;

  const res4 = await makeRequest('POST', '/api/vehicles', {
    vehicle_type: 'Hatchback',
    vehicle_model: 'Maruti Swift',
    registration_number: regNumber
  }, driver2Token);
  console.log('Status:', res4.status);
  console.log('Response:', JSON.stringify(res4.body, null, 2));
  if (res4.status === 409) {
    console.log('✓ Test 4 PASSED: Duplicate number plate rejected with 409 Conflict.\n');
  } else {
    console.error('✗ Test 4 FAILED\n');
  }

  // Test 5: Driver updating vehicle details
  console.log('Test 5: Driver updating vehicle via PUT /api/vehicles/me...');
  const res5 = await makeRequest('PUT', '/api/vehicles/me', {
    vehicle_type: 'SUV',
    vehicle_model: 'Hyundai Creta SX',
    registration_number: regNumber
  }, driverToken);
  console.log('Status:', res5.status);
  console.log('Response:', JSON.stringify(res5.body, null, 2));
  if (res5.status === 200 && res5.body.data.vehicle.vehicle_model === 'Hyundai Creta SX') {
    console.log('✓ Test 5 PASSED: Driver vehicle updated successfully.\n');
  } else {
    console.error('✗ Test 5 FAILED\n');
  }

  console.log('🎉 ALL STEP 9 BACKEND TESTS COMPLETED!');
}

runTests().catch(err => {
  console.error('Vehicle test error:', err);
});
