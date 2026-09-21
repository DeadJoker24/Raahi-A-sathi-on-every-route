const http = require('http');
const { query } = require('../config/db');

// Helper to make HTTP requests
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

async function runSprint1Verification() {
  console.log('================================================================');
  console.log('🚗 RAAHI - SPRINT 1 COMPLETE ACCEPTANCE CRITERIA TEST SUITE');
  console.log('================================================================\n');

  let allPassed = true;
  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`  ✓ PASSED: ${testName}`);
    } else {
      console.error(`  ✗ FAILED: ${testName}`);
      if (details) console.error(`    Details: ${details}`);
      allPassed = false;
    }
  }

  const timestamp = Date.now();
  const driverEmail = `flow1_driver_${timestamp}@raahi.test`;
  const passengerEmail = `flow2_passenger_${timestamp}@raahi.test`;
  const driverPass = 'DriverSecret123';
  const passengerPass = 'PassengerSecret123';
  const regPlate = `MH 02 CZ ${Math.floor(1000 + Math.random() * 9000)}`;

  // ============================================================================
  // FLOW 1: DRIVER JOURNEY
  // ============================================================================
  console.log('----------------------------------------------------------------');
  console.log('▶ FLOW 1: Complete Driver Registration, Login, Profile, Vehicle');
  console.log('----------------------------------------------------------------');

  // Step 1: Register as DRIVER
  const regDriverRes = await makeRequest('POST', '/api/auth/register', {
    name: 'Sameer Verma',
    email: driverEmail,
    password: driverPass,
    role: 'DRIVER'
  });
  assert(regDriverRes.status === 201, 'Driver account registered (201)');
  assert(regDriverRes.body.data.user.role === 'DRIVER', 'Driver role assigned correctly');
  assert(!regDriverRes.body.data.user.password_hash && !regDriverRes.body.data.user.password, 'Driver registration omits password');

  // Step 2: Login as DRIVER
  const loginDriverRes = await makeRequest('POST', '/api/auth/login', {
    email: driverEmail,
    password: driverPass
  });
  assert(loginDriverRes.status === 200, 'Driver login successful (200)');
  assert(!!loginDriverRes.body.data.token, 'JWT token issued to Driver');
  const driverToken = loginDriverRes.body.data.token;
  const driverId = loginDriverRes.body.data.user.id;

  // Step 3: Access Profile (/api/users/me)
  const profileDriverRes = await makeRequest('GET', '/api/users/me', null, driverToken);
  assert(profileDriverRes.status === 200, 'Driver profile retrieved with JWT (200)');
  assert(profileDriverRes.body.data.user.email === driverEmail, 'Profile email matches registered driver');
  assert(!profileDriverRes.body.data.user.password_hash, 'Profile response contains no password hash');

  // Step 4: Check Vehicle before addition (should be null)
  const initialVehicleRes = await makeRequest('GET', '/api/vehicles/me', null, driverToken);
  assert(initialVehicleRes.status === 200 && initialVehicleRes.body.data.vehicle === null, 'Driver vehicle is initially null');

  // Step 5: Add Vehicle (/api/vehicles)
  const addVehicleRes = await makeRequest('POST', '/api/vehicles', {
    vehicle_type: 'Sedan',
    vehicle_model: 'Honda City ZX',
    registration_number: regPlate
  }, driverToken);
  assert(addVehicleRes.status === 201, 'Vehicle registered successfully (201)');
  assert(addVehicleRes.body.data.vehicle.registration_number === regPlate, 'Vehicle plate number matches');

  // Step 6: Verify vehicle directly in PostgreSQL database
  const dbVehicleQuery = await query('SELECT * FROM vehicles WHERE driver_id = $1', [driverId]);
  assert(dbVehicleQuery.rows.length === 1, 'Vehicle successfully verified in PostgreSQL table "vehicles"');
  assert(dbVehicleQuery.rows[0].registration_number === regPlate, 'PostgreSQL record registration plate matches');

  // Step 7: Update vehicle details
  const updateVehicleRes = await makeRequest('PUT', '/api/vehicles/me', {
    vehicle_type: 'Sedan',
    vehicle_model: 'Honda City Hybrid',
    registration_number: regPlate
  }, driverToken);
  assert(updateVehicleRes.status === 200, 'Vehicle updated successfully (200)');
  assert(updateVehicleRes.body.data.vehicle.vehicle_model === 'Honda City Hybrid', 'Updated model reflected');

  console.log('✓ FLOW 1 COMPLETE!\n');

  // ============================================================================
  // FLOW 2: PASSENGER JOURNEY
  // ============================================================================
  console.log('----------------------------------------------------------------');
  console.log('▶ FLOW 2: Passenger Registration, Login, Profile, Role Guarding');
  console.log('----------------------------------------------------------------');

  // Step 1: Register as PASSENGER
  const regPassRes = await makeRequest('POST', '/api/auth/register', {
    name: 'Neha Roy',
    email: passengerEmail,
    password: passengerPass,
    role: 'PASSENGER'
  });
  assert(regPassRes.status === 201, 'Passenger account registered (201)');
  assert(regPassRes.body.data.user.role === 'PASSENGER', 'Passenger role assigned correctly');

  // Step 2: Login as PASSENGER
  const loginPassRes = await makeRequest('POST', '/api/auth/login', {
    email: passengerEmail,
    password: passengerPass
  });
  assert(loginPassRes.status === 200, 'Passenger login successful (200)');
  assert(!!loginPassRes.body.data.token, 'JWT token issued to Passenger');
  const passengerToken = loginPassRes.body.data.token;

  // Step 3: Access Profile
  const profilePassRes = await makeRequest('GET', '/api/users/me', null, passengerToken);
  assert(profilePassRes.status === 200, 'Passenger profile retrieved (200)');
  assert(profilePassRes.body.data.user.email === passengerEmail, 'Profile email matches registered passenger');

  // Step 4: Verify Passenger cannot access Driver-only vehicle routes (RBAC)
  const passVehiclePost = await makeRequest('POST', '/api/vehicles', {
    vehicle_type: 'Car',
    vehicle_model: 'Test',
    registration_number: 'DL 99 ZZ 9999'
  }, passengerToken);
  assert(passVehiclePost.status === 403, 'Passenger POST /api/vehicles blocked with 403 Forbidden');

  const passVehicleGet = await makeRequest('GET', '/api/vehicles/me', null, passengerToken);
  assert(passVehicleGet.status === 403, 'Passenger GET /api/vehicles/me blocked with 403 Forbidden');

  console.log('✓ FLOW 2 COMPLETE!\n');

  // ============================================================================
  // SECURITY & EDGE CASES
  // ============================================================================
  console.log('----------------------------------------------------------------');
  console.log('▶ SECURITY & EDGE CASE VALIDATIONS');
  console.log('----------------------------------------------------------------');

  // Check 1: Duplicate email rejected
  const dupEmailRes = await makeRequest('POST', '/api/auth/register', {
    name: 'Duplicate Name',
    email: driverEmail,
    password: 'password123',
    role: 'DRIVER'
  });
  assert(dupEmailRes.status === 409, 'Duplicate email registration rejected with 409 Conflict');

  // Check 2: Incorrect password rejected
  const badPassRes = await makeRequest('POST', '/api/auth/login', {
    email: driverEmail,
    password: 'WrongPasswordXYZ'
  });
  assert(badPassRes.status === 401, 'Incorrect password rejected with 401 Unauthorized');

  // Check 3: Unauthenticated access rejected
  const unauthRes = await makeRequest('GET', '/api/users/me');
  assert(unauthRes.status === 401, 'Unauthenticated request to protected route rejected with 401');

  // Check 4: Tampered JWT token rejected
  const tamperedRes = await makeRequest('GET', '/api/users/me', null, driverToken + '_tampered');
  assert(tamperedRes.status === 401, 'Tampered token rejected with 401');

  // Check 5: Duplicate vehicle plate rejected
  const driver3Email = `flow1_driver3_${timestamp}@raahi.test`;
  await makeRequest('POST', '/api/auth/register', {
    name: 'Driver Three',
    email: driver3Email,
    password: driverPass,
    role: 'DRIVER'
  });
  const loginD3 = await makeRequest('POST', '/api/auth/login', { email: driver3Email, password: driverPass });
  const dupPlateRes = await makeRequest('POST', '/api/vehicles', {
    vehicle_type: 'Hatchback',
    vehicle_model: 'Swift',
    registration_number: regPlate // Already used by Sameer Verma
  }, loginD3.body.data.token);
  assert(dupPlateRes.status === 409, 'Duplicate vehicle license plate rejected with 409 Conflict');

  // Check 6: Password Hashing in PostgreSQL (Verify Plaintext is NEVER stored)
  const dbUserQuery = await query('SELECT password_hash FROM users WHERE email = $1', [driverEmail]);
  const storedHash = dbUserQuery.rows[0].password_hash;
  const isBcryptHash = storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$');
  assert(isBcryptHash && storedHash.length === 60, 'Password is stored as 60-char salted bcrypt hash ($2b$) in PostgreSQL, never plaintext');
  assert(storedHash !== driverPass, 'Stored hash does NOT match plaintext password');

  console.log('\n================================================================');
  if (allPassed) {
    console.log('🏆 SPRINT 1 ACCEPTANCE CRITERIA: ALL TESTS PASSED SUCCESSFULLY!');
  } else {
    console.log('⚠️ SPRINT 1 ACCEPTANCE CRITERIA: SOME TESTS FAILED');
  }
  console.log('================================================================\n');

  process.exit(allPassed ? 0 : 1);
}

runSprint1Verification().catch(err => {
  console.error('Acceptance verification execution error:', err);
  process.exit(1);
});
