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
  console.log('================================================================');
  console.log('🚗 TESTING SPRINT 2 PART 2: COMMUTE REST APIS');
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

  const rand = Math.floor(Math.random() * 100000);
  const driver1Email = `c_driver1_${rand}@raahi.test`;
  const driver2Email = `c_driver2_${rand}@raahi.test`;
  const passengerEmail = `c_passenger_${rand}@raahi.test`;
  const pass = 'Password123';

  // Setup: Register Driver 1, Driver 2, Passenger
  console.log('--- Setup: Users and Vehicles ---');
  await makeRequest('POST', '/api/auth/register', { name: 'Driver One', email: driver1Email, password: pass, role: 'DRIVER' });
  const d1Login = await makeRequest('POST', '/api/auth/login', { email: driver1Email, password: pass });
  const d1Token = d1Login.body.data.token;
  const d1Id = d1Login.body.data.user.id;

  await makeRequest('POST', '/api/auth/register', { name: 'Driver Two', email: driver2Email, password: pass, role: 'DRIVER' });
  const d2Login = await makeRequest('POST', '/api/auth/login', { email: driver2Email, password: pass });
  const d2Token = d2Login.body.data.token;
  const d2Id = d2Login.body.data.user.id;

  await makeRequest('POST', '/api/auth/register', { name: 'Passenger One', email: passengerEmail, password: pass, role: 'PASSENGER' });
  const pLogin = await makeRequest('POST', '/api/auth/login', { email: passengerEmail, password: pass });
  const pToken = pLogin.body.data.token;

  // 1. Test: Driver cannot create commute without vehicle
  console.log('\n--- 1. POST /api/commutes (Creation & Validations) ---');
  const futureDeparture = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // 2 hours in future

  const resNoVehicle = await makeRequest('POST', '/api/commutes', {
    origin: 'Sector 62, Noida',
    destination: 'Cyber City, Gurugram',
    departure_datetime: futureDeparture,
    total_seats: 3,
    price_per_seat: 150
  }, d1Token);
  assert(resNoVehicle.status === 400, 'Driver without vehicle blocked from creating commute (400)');

  // Register vehicle for Driver 1 & Driver 2
  const reg1Res = await makeRequest('POST', '/api/vehicles', {
    vehicle_type: 'Sedan',
    vehicle_model: 'Honda City',
    registration_number: `DL 01 AA ${rand.toString().padStart(4, '0').slice(-4)}`
  }, d1Token);
  const d1VehicleId = reg1Res.body.data.vehicle.id;

  const reg2Res = await makeRequest('POST', '/api/vehicles', {
    vehicle_type: 'Hatchback',
    vehicle_model: 'Maruti Swift',
    registration_number: `HR 26 BB ${rand.toString().padStart(4, '0').slice(-4)}`
  }, d2Token);
  const d2VehicleId = reg2Res.body.data.vehicle.id;

  // Test: Driver creates commute with valid inputs
  const resValidCommute = await makeRequest('POST', '/api/commutes', {
    origin: 'Sector 62, Noida',
    destination: 'Cyber City, Gurugram',
    departure_datetime: futureDeparture,
    total_seats: 3,
    price_per_seat: 150,
    route_description: 'Via NH24 & Barapullah. Leaving sharp at 9am.'
  }, d1Token);
  assert(resValidCommute.status === 201, 'Driver publishes commute successfully (201)');
  const commute1 = resValidCommute.body.data.commute;
  assert(commute1.status === 'SCHEDULED', 'Status initialized to SCHEDULED');
  assert(commute1.available_seats === 3, 'Available seats initialized equal to total seats (3)');
  assert(commute1.driver_id === d1Id, 'Commute driver_id matches authenticated driver');

  // Test: Past / short departure (< 15 mins) rejected
  const pastDeparture = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes in future
  const resPast = await makeRequest('POST', '/api/commutes', {
    origin: 'Noida',
    destination: 'Delhi',
    departure_datetime: pastDeparture,
    total_seats: 2,
    price_per_seat: 100
  }, d1Token);
  assert(resPast.status === 400, 'Departure under 15 mins rejected with 400 Bad Request');

  // Test: Invalid seats (0 or > 8)
  const resBadSeats = await makeRequest('POST', '/api/commutes', {
    origin: 'Noida',
    destination: 'Delhi',
    departure_datetime: futureDeparture,
    total_seats: 12,
    price_per_seat: 100
  }, d1Token);
  assert(resBadSeats.status === 400, 'Seats > 8 rejected with 400 Bad Request');

  // Test: Passenger role blocked from creating commute
  const resPassengerCreate = await makeRequest('POST', '/api/commutes', {
    origin: 'Noida',
    destination: 'Delhi',
    departure_datetime: futureDeparture,
    total_seats: 2,
    price_per_seat: 100
  }, pToken);
  assert(resPassengerCreate.status === 403, 'Passenger role blocked from commute creation (403)');

  // Test: Driver trying to use another driver vehicle
  const resFakeVehicle = await makeRequest('POST', '/api/commutes', {
    origin: 'Noida',
    destination: 'Delhi',
    departure_datetime: futureDeparture,
    total_seats: 2,
    price_per_seat: 100,
    vehicle_id: d2VehicleId // Belongs to Driver 2!
  }, d1Token);
  assert(resFakeVehicle.status === 400, 'Using another driver vehicle rejected with 400 Bad Request');

  // 2. Test: GET /api/commutes/my
  console.log('\n--- 2. GET /api/commutes/my ---');
  const resMyCommutes = await makeRequest('GET', '/api/commutes/my', null, d1Token);
  assert(resMyCommutes.status === 200, 'Driver retrieves their commutes (200)');
  assert(resMyCommutes.body.count >= 1, 'My commutes count >= 1');
  assert(resMyCommutes.body.data.commutes[0].vehicle.model === 'Honda City', 'Includes driver vehicle details');

  const resMyFiltered = await makeRequest('GET', '/api/commutes/my?status=SCHEDULED', null, d1Token);
  assert(resMyFiltered.status === 200, 'Driver status filter (?status=SCHEDULED) works (200)');

  const resPassengerMy = await makeRequest('GET', '/api/commutes/my', null, pToken);
  assert(resPassengerMy.status === 403, 'Passenger blocked from /my with 403 Forbidden');

  // 3. Test: GET /api/commutes/search
  console.log('\n--- 3. GET /api/commutes/search ---');
  const resSearchAll = await makeRequest('GET', '/api/commutes/search', null, pToken);
  assert(resSearchAll.status === 200, 'Passenger searches commutes (200)');
  assert(resSearchAll.body.count >= 1, 'Search finds published commute');
  assert(resSearchAll.body.data.commutes[0].driver.name === 'Driver One', 'Search returns driver name');

  // Origin filter
  const resSearchOrigin = await makeRequest('GET', '/api/commutes/search?origin=noida', null, pToken);
  assert(resSearchOrigin.status === 200 && resSearchOrigin.body.count >= 1, 'Case-insensitive origin search (?origin=noida) matches');

  const resSearchNone = await makeRequest('GET', '/api/commutes/search?origin=MumbaiNonExistent', null, pToken);
  assert(resSearchNone.status === 200 && resSearchNone.body.count === 0, 'Non-matching origin returns empty array');

  // Destination filter
  const resSearchDest = await makeRequest('GET', '/api/commutes/search?destination=gurugram', null, pToken);
  assert(resSearchDest.status === 200 && resSearchDest.body.count >= 1, 'Destination search (?destination=gurugram) matches');

  // Date filter (YYYY-MM-DD)
  const dateStr = futureDeparture.split('T')[0];
  const resSearchDate = await makeRequest(`GET`, `/api/commutes/search?date=${dateStr}`, null, pToken);
  assert(resSearchDate.status === 200 && resSearchDate.body.count >= 1, 'Date filter (?date=YYYY-MM-DD) matches');

  const resSearchWrongDate = await makeRequest('GET', '/api/commutes/search?date=2024-01-01', null, pToken);
  assert(resSearchWrongDate.status === 200 && resSearchWrongDate.body.count === 0, 'Date in past returns empty array');

  // 4. Test: GET /api/commutes/:id
  console.log('\n--- 4. GET /api/commutes/:id ---');
  const resGetId = await makeRequest('GET', `/api/commutes/${commute1.id}`, null, pToken);
  assert(resGetId.status === 200, 'Retrieve commute details by ID (200)');
  assert(resGetId.body.data.commute.origin === 'Sector 62, Noida', 'Commute details match');

  const resGet404 = await makeRequest('GET', '/api/commutes/999999', null, pToken);
  assert(resGet404.status === 404, 'Non-existent commute returns 404 Not Found');

  // 5. Test: PUT /api/commutes/:id (Edit)
  console.log('\n--- 5. PUT /api/commutes/:id (Update) ---');
  // Driver 2 trying to edit Driver 1's commute
  const resEditForbidden = await makeRequest('PUT', `/api/commutes/${commute1.id}`, {
    origin: 'Hacked Origin',
    destination: 'Hacked Dest',
    departure_datetime: futureDeparture,
    total_seats: 2,
    price_per_seat: 100
  }, d2Token);
  assert(resEditForbidden.status === 403, 'Non-owner driver blocked from editing with 403 Forbidden');

  // Passenger trying to edit
  const resEditPassenger = await makeRequest('PUT', `/api/commutes/${commute1.id}`, {
    origin: 'Test',
    destination: 'Test',
    departure_datetime: futureDeparture,
    total_seats: 2,
    price_per_seat: 100
  }, pToken);
  assert(resEditPassenger.status === 403, 'Passenger blocked from editing with 403 Forbidden');

  // Driver 1 updating their own commute
  const updatedFutureTime = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();
  const resEditValid = await makeRequest('PUT', `/api/commutes/${commute1.id}`, {
    origin: 'Sector 62, Noida (Updated)',
    destination: 'DLF Cyber City, Gurugram',
    departure_datetime: updatedFutureTime,
    total_seats: 4,
    available_seats: 4,
    price_per_seat: 180,
    route_description: 'Updated route notes.'
  }, d1Token);
  assert(resEditValid.status === 200, 'Driver updates their commute successfully (200)');
  assert(resEditValid.body.data.commute.origin === 'Sector 62, Noida (Updated)', 'Updated origin saved');
  assert(resEditValid.body.data.commute.total_seats === 4, 'Updated total seats saved (4)');

  // Available seats > total seats rejected
  const resBadAvail = await makeRequest('PUT', `/api/commutes/${commute1.id}`, {
    origin: 'Sector 62, Noida',
    destination: 'Cyber City, Gurugram',
    departure_datetime: updatedFutureTime,
    total_seats: 3,
    available_seats: 5, // Greater than total seats!
    price_per_seat: 150
  }, d1Token);
  assert(resBadAvail.status === 400, 'Available seats > total seats rejected with 400 Bad Request');

  // 6. Test: PATCH /api/commutes/:id/cancel
  console.log('\n--- 6. PATCH /api/commutes/:id/cancel ---');
  // Non-owner trying to cancel
  const resCancelForbidden = await makeRequest('PATCH', `/api/commutes/${commute1.id}/cancel`, null, d2Token);
  assert(resCancelForbidden.status === 403, 'Non-owner driver blocked from cancelling with 403 Forbidden');

  const resCancelPass = await makeRequest('PATCH', `/api/commutes/${commute1.id}/cancel`, null, pToken);
  assert(resCancelPass.status === 403, 'Passenger blocked from cancelling with 403 Forbidden');

  // Owner cancels commute
  const resCancel = await makeRequest('PATCH', `/api/commutes/${commute1.id}/cancel`, null, d1Token);
  assert(resCancel.status === 200, 'Owner driver cancels commute successfully (200)');
  assert(resCancel.body.data.commute.status === 'CANCELLED', 'Commute status is now CANCELLED');

  // Cancelling an already cancelled commute rejected
  const resDoubleCancel = await makeRequest('PATCH', `/api/commutes/${commute1.id}/cancel`, null, d1Token);
  assert(resDoubleCancel.status === 400, 'Already-cancelled commute rejected with 400 Bad Request');

  // Cancelled commute disappears from passenger search
  const resSearchAfterCancel = await makeRequest('GET', `/api/commutes/search?origin=Noida`, null, pToken);
  const foundCancelledInSearch = resSearchAfterCancel.body.data.commutes.some(c => c.id === commute1.id);
  assert(!foundCancelledInSearch, 'Cancelled commute automatically excluded from passenger search results');

  console.log('\n================================================================');
  if (allPassed) {
    console.log('🏆 SPRINT 2 PART 2: ALL COMMUTE API TESTS PASSED SUCCESSFULLY!');
  } else {
    console.log('⚠️ SPRINT 2 PART 2: SOME TESTS FAILED');
  }
  console.log('================================================================\n');

  process.exit(allPassed ? 0 : 1);
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
