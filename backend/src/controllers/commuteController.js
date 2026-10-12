const { query } = require('../config/db');

/**
 * @desc    Create a new scheduled commute
 * @route   POST /api/commutes
 * @access  Private (Driver only)
 */
const createCommute = async (req, res) => {
  try {
    const driverId = req.user.id;
    const {
      origin,
      destination,
      departure_datetime,
      total_seats,
      price_per_seat,
      route_description,
      vehicle_id
    } = req.body;

    // 1. Basic field presence validation
    if (!origin || !origin.trim()) {
      return res.status(400).json({ success: false, message: 'Origin is required' });
    }
    if (!destination || !destination.trim()) {
      return res.status(400).json({ success: false, message: 'Destination is required' });
    }
    if (!departure_datetime) {
      return res.status(400).json({ success: false, message: 'Departure date and time is required' });
    }
    if (total_seats === undefined || total_seats === null) {
      return res.status(400).json({ success: false, message: 'Total seats is required' });
    }
    if (price_per_seat === undefined || price_per_seat === null) {
      return res.status(400).json({ success: false, message: 'Price per seat is required' });
    }

    // 2. Validate departure time (at least 15 minutes in the future)
    const departureDate = new Date(departure_datetime);
    if (isNaN(departureDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid departure date/time format' });
    }
    const minDepartureTime = new Date(Date.now() + 15 * 60 * 1000);
    if (departureDate < minDepartureTime) {
      return res.status(400).json({
        success: false,
        message: 'Departure time must be at least 15 minutes in the future'
      });
    }

    // 3. Validate seat capacity (1 to 8 seats)
    const seatsNum = parseInt(total_seats, 10);
    if (isNaN(seatsNum) || seatsNum < 1 || seatsNum > 8) {
      return res.status(400).json({
        success: false,
        message: 'Total seats must be an integer between 1 and 8'
      });
    }

    // 4. Validate price per seat (non-negative)
    const priceNum = parseFloat(price_per_seat);
    if (isNaN(priceNum) || priceNum < 0) {
      return res.status(400).json({
        success: false,
        message: 'Price per seat must be a valid non-negative number'
      });
    }

    // 5. Verify vehicle ownership & driver vehicle requirement
    let targetVehicleId = vehicle_id;

    if (targetVehicleId) {
      // If vehicle_id is provided, verify it belongs to this authenticated driver
      const vehicleCheck = await query(
        'SELECT id FROM vehicles WHERE id = $1 AND driver_id = $2',
        [targetVehicleId, driverId]
      );
      if (vehicleCheck.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'The selected vehicle does not belong to you or does not exist'
        });
      }
    } else {
      // If vehicle_id not explicitly provided, find driver's registered vehicle
      const driverVehicles = await query(
        'SELECT id FROM vehicles WHERE driver_id = $1 LIMIT 1',
        [driverId]
      );
      if (driverVehicles.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'You must register a vehicle before publishing a commute'
        });
      }
      targetVehicleId = driverVehicles.rows[0].id;
    }

    // 6. Insert new commute into PostgreSQL
    // available_seats is set equal to total_seats, status defaults to 'SCHEDULED'
    const insertQuery = `
      INSERT INTO commutes (
        driver_id,
        vehicle_id,
        origin,
        destination,
        departure_datetime,
        total_seats,
        available_seats,
        price_per_seat,
        route_description,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'SCHEDULED')
      RETURNING id, driver_id, vehicle_id, origin, destination, departure_datetime, 
                total_seats, available_seats, price_per_seat, route_description, 
                status, created_at, updated_at
    `;

    const result = await query(insertQuery, [
      driverId,
      targetVehicleId,
      origin.trim(),
      destination.trim(),
      departureDate.toISOString(),
      seatsNum,
      seatsNum, // available_seats initially equals total_seats
      priceNum,
      route_description ? route_description.trim() : null
    ]);

    return res.status(201).json({
      success: true,
      message: 'Commute published successfully',
      data: {
        commute: result.rows[0]
      }
    });

  } catch (error) {
    console.error('[Create Commute Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error publishing commute'
    });
  }
};

/**
 * @desc    Get all commutes for the authenticated driver
 * @route   GET /api/commutes/my
 * @access  Private (Driver only)
 */
const getMyCommutes = async (req, res) => {
  try {
    const driverId = req.user.id;
    const { status } = req.query;

    let sql = `
      SELECT 
        c.id,
        c.driver_id,
        c.vehicle_id,
        c.origin,
        c.destination,
        c.departure_datetime,
        c.total_seats,
        c.available_seats,
        c.price_per_seat,
        c.route_description,
        c.status,
        c.created_at,
        c.updated_at,
        v.vehicle_type,
        v.vehicle_model,
        v.registration_number
      FROM commutes c
      JOIN vehicles v ON c.vehicle_id = v.id
      WHERE c.driver_id = $1
    `;
    const params = [driverId];

    if (status) {
      params.push(status.toUpperCase().trim());
      sql += ` AND c.status = $${params.length}`;
    }

    sql += ` ORDER BY c.departure_datetime ASC`;

    const result = await query(sql, params);

    const formattedCommutes = result.rows.map(row => ({
      id: row.id,
      driver_id: row.driver_id,
      vehicle_id: row.vehicle_id,
      origin: row.origin,
      destination: row.destination,
      departure_datetime: row.departure_datetime,
      total_seats: row.total_seats,
      available_seats: row.available_seats,
      price_per_seat: row.price_per_seat,
      route_description: row.route_description,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
      vehicle: {
        id: row.vehicle_id,
        type: row.vehicle_type,
        model: row.vehicle_model,
        registration_number: row.registration_number
      }
    }));

    return res.status(200).json({
      success: true,
      count: formattedCommutes.length,
      data: {
        commutes: formattedCommutes
      }
    });

  } catch (error) {
    console.error('[Get My Commutes Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving driver commutes'
    });
  }
};

/**
 * @desc    Search for scheduled, future commutes with available seats
 * @route   GET /api/commutes/search
 * @access  Private (Authenticated users)
 */
const searchCommutes = async (req, res) => {
  try {
    const { origin, destination, date } = req.query;

    let sql = `
      SELECT 
        c.id,
        c.driver_id,
        c.vehicle_id,
        c.origin,
        c.destination,
        c.departure_datetime,
        c.total_seats,
        c.available_seats,
        c.price_per_seat,
        c.route_description,
        c.status,
        c.created_at,
        u.name AS driver_name,
        u.email AS driver_email,
        v.vehicle_type,
        v.vehicle_model,
        v.registration_number
      FROM commutes c
      JOIN users u ON c.driver_id = u.id
      JOIN vehicles v ON c.vehicle_id = v.id
      WHERE c.status = 'SCHEDULED'
        AND c.departure_datetime > NOW()
        AND c.available_seats > 0
    `;
    const params = [];

    // Filter by origin (case-insensitive substring)
    if (origin && origin.trim()) {
      params.push(`%${origin.trim()}%`);
      sql += ` AND c.origin ILIKE $${params.length}`;
    }

    // Filter by destination (case-insensitive substring)
    if (destination && destination.trim()) {
      params.push(`%${destination.trim()}%`);
      sql += ` AND c.destination ILIKE $${params.length}`;
    }

    // Filter by date (YYYY-MM-DD)
    if (date && date.trim()) {
      const searchDate = date.trim();
      // Validate date format YYYY-MM-DD
      if (!/^\d{4}-\d{2}-\d{2}$/.test(searchDate)) {
        return res.status(400).json({
          success: false,
          message: 'Date filter must be in YYYY-MM-DD format'
        });
      }
      params.push(searchDate);
      sql += ` AND c.departure_datetime::date = $${params.length}::date`;
    }

    sql += ` ORDER BY c.departure_datetime ASC`;

    const result = await query(sql, params);

    const formattedCommutes = result.rows.map(row => ({
      id: row.id,
      origin: row.origin,
      destination: row.destination,
      departure_datetime: row.departure_datetime,
      total_seats: row.total_seats,
      available_seats: row.available_seats,
      price_per_seat: row.price_per_seat,
      route_description: row.route_description,
      status: row.status,
      created_at: row.created_at,
      driver: {
        id: row.driver_id,
        name: row.driver_name,
        email: row.driver_email
      },
      vehicle: {
        id: row.vehicle_id,
        type: row.vehicle_type,
        model: row.vehicle_model,
        registration_number: row.registration_number
      }
    }));

    return res.status(200).json({
      success: true,
      count: formattedCommutes.length,
      data: {
        commutes: formattedCommutes
      }
    });

  } catch (error) {
    console.error('[Search Commutes Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error searching commutes'
    });
  }
};

/**
 * @desc    Get details of a single commute by ID
 * @route   GET /api/commutes/:id
 * @access  Private (Authenticated users)
 */
const getCommuteById = async (req, res) => {
  try {
    const commuteId = parseInt(req.params.id, 10);
    if (isNaN(commuteId) || commuteId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid commute ID' });
    }

    const sql = `
      SELECT 
        c.id,
        c.driver_id,
        c.vehicle_id,
        c.origin,
        c.destination,
        c.departure_datetime,
        c.total_seats,
        c.available_seats,
        c.price_per_seat,
        c.route_description,
        c.status,
        c.created_at,
        c.updated_at,
        u.name AS driver_name,
        u.email AS driver_email,
        v.vehicle_type,
        v.vehicle_model,
        v.registration_number
      FROM commutes c
      JOIN users u ON c.driver_id = u.id
      JOIN vehicles v ON c.vehicle_id = v.id
      WHERE c.id = $1
    `;

    const result = await query(sql, [commuteId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Commute not found'
      });
    }

    const row = result.rows[0];
    const commute = {
      id: row.id,
      driver_id: row.driver_id,
      vehicle_id: row.vehicle_id,
      origin: row.origin,
      destination: row.destination,
      departure_datetime: row.departure_datetime,
      total_seats: row.total_seats,
      available_seats: row.available_seats,
      price_per_seat: row.price_per_seat,
      route_description: row.route_description,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
      driver: {
        id: row.driver_id,
        name: row.driver_name,
        email: row.driver_email
      },
      vehicle: {
        id: row.vehicle_id,
        type: row.vehicle_type,
        model: row.vehicle_model,
        registration_number: row.registration_number
      }
    };

    return res.status(200).json({
      success: true,
      data: { commute }
    });

  } catch (error) {
    console.error('[Get Commute Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving commute details'
    });
  }
};

/**
 * @desc    Update a scheduled commute (own commute only, before departure)
 * @route   PUT /api/commutes/:id
 * @access  Private (Driver only)
 */
const updateCommute = async (req, res) => {
  try {
    const driverId = req.user.id;
    const commuteId = parseInt(req.params.id, 10);

    if (isNaN(commuteId) || commuteId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid commute ID' });
    }

    // 1. Fetch current commute record
    const existingResult = await query('SELECT * FROM commutes WHERE id = $1', [commuteId]);
    if (existingResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Commute not found' });
    }

    const commute = existingResult.rows[0];

    // 2. Ownership check: Driver may edit only their own commutes
    if (commute.driver_id !== driverId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You can only edit your own commutes'
      });
    }

    // 3. Status check: Only SCHEDULED commutes can be updated
    if (commute.status !== 'SCHEDULED') {
      return res.status(400).json({
        success: false,
        message: `Cannot edit a commute with status "${commute.status}"`
      });
    }

    // 4. Timing check: Cannot edit a commute whose departure time has already passed
    if (new Date(commute.departure_datetime) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit a commute that has already departed'
      });
    }

    // 5. Validate input fields
    const {
      origin,
      destination,
      departure_datetime,
      total_seats,
      available_seats,
      price_per_seat,
      route_description,
      vehicle_id
    } = req.body;

    if (!origin || !origin.trim()) {
      return res.status(400).json({ success: false, message: 'Origin is required' });
    }
    if (!destination || !destination.trim()) {
      return res.status(400).json({ success: false, message: 'Destination is required' });
    }
    if (!departure_datetime) {
      return res.status(400).json({ success: false, message: 'Departure date and time is required' });
    }

    // Departure time must be at least 15 minutes in the future
    const newDepartureDate = new Date(departure_datetime);
    if (isNaN(newDepartureDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid departure date/time format' });
    }
    const minDepartureTime = new Date(Date.now() + 15 * 60 * 1000);
    if (newDepartureDate < minDepartureTime) {
      return res.status(400).json({
        success: false,
        message: 'Departure time must be at least 15 minutes in the future'
      });
    }

    // Validate seats
    const newTotalSeats = parseInt(total_seats, 10);
    if (isNaN(newTotalSeats) || newTotalSeats < 1 || newTotalSeats > 8) {
      return res.status(400).json({
        success: false,
        message: 'Total seats must be an integer between 1 and 8'
      });
    }

    const newAvailableSeats = available_seats !== undefined ? parseInt(available_seats, 10) : newTotalSeats;
    if (isNaN(newAvailableSeats) || newAvailableSeats < 0 || newAvailableSeats > newTotalSeats) {
      return res.status(400).json({
        success: false,
        message: 'Available seats must be between 0 and total seats'
      });
    }

    // Validate price
    const newPrice = parseFloat(price_per_seat);
    if (isNaN(newPrice) || newPrice < 0) {
      return res.status(400).json({
        success: false,
        message: 'Price per seat must be a non-negative number'
      });
    }

    // Validate vehicle ownership if changing vehicle
    let targetVehicleId = commute.vehicle_id;
    if (vehicle_id && vehicle_id !== commute.vehicle_id) {
      const vCheck = await query(
        'SELECT id FROM vehicles WHERE id = $1 AND driver_id = $2',
        [vehicle_id, driverId]
      );
      if (vCheck.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'The selected vehicle does not belong to you or does not exist'
        });
      }
      targetVehicleId = vehicle_id;
    }

    // 6. Update commute in database
    const updateSql = `
      UPDATE commutes
      SET origin = $1,
          destination = $2,
          departure_datetime = $3,
          total_seats = $4,
          available_seats = $5,
          price_per_seat = $6,
          route_description = $7,
          vehicle_id = $8,
          updated_at = NOW()
      WHERE id = $9
      RETURNING id, driver_id, vehicle_id, origin, destination, departure_datetime,
                total_seats, available_seats, price_per_seat, route_description,
                status, created_at, updated_at
    `;

    const updateResult = await query(updateSql, [
      origin.trim(),
      destination.trim(),
      newDepartureDate.toISOString(),
      newTotalSeats,
      newAvailableSeats,
      newPrice,
      route_description ? route_description.trim() : null,
      targetVehicleId,
      commuteId
    ]);

    return res.status(200).json({
      success: true,
      message: 'Commute updated successfully',
      data: {
        commute: updateResult.rows[0]
      }
    });

  } catch (error) {
    console.error('[Update Commute Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating commute'
    });
  }
};

/**
 * @desc    Cancel a scheduled commute (own commute only, before departure)
 * @route   PATCH /api/commutes/:id/cancel
 * @access  Private (Driver only)
 */
const cancelCommute = async (req, res) => {
  try {
    const driverId = req.user.id;
    const commuteId = parseInt(req.params.id, 10);

    if (isNaN(commuteId) || commuteId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid commute ID' });
    }

    // 1. Fetch commute
    const result = await query('SELECT * FROM commutes WHERE id = $1', [commuteId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Commute not found' });
    }

    const commute = result.rows[0];

    // 2. Ownership check
    if (commute.driver_id !== driverId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You can only cancel your own commutes'
      });
    }

    // 3. Already cancelled check
    if (commute.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: 'This commute is already cancelled'
      });
    }

    // 4. Past departure check
    if (new Date(commute.departure_datetime) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a commute that has already departed'
      });
    }

    // 5. Update status to CANCELLED
    const cancelSql = `
      UPDATE commutes
      SET status = 'CANCELLED',
          updated_at = NOW()
      WHERE id = $1
      RETURNING id, driver_id, vehicle_id, origin, destination, departure_datetime,
                total_seats, available_seats, price_per_seat, route_description,
                status, created_at, updated_at
    `;

    const cancelResult = await query(cancelSql, [commuteId]);

    return res.status(200).json({
      success: true,
      message: 'Commute cancelled successfully',
      data: {
        commute: cancelResult.rows[0]
      }
    });

  } catch (error) {
    console.error('[Cancel Commute Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error cancelling commute'
    });
  }
};

module.exports = {
  createCommute,
  getMyCommutes,
  searchCommutes,
  getCommuteById,
  updateCommute,
  cancelCommute
};
