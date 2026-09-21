const { query } = require('../config/db');

/**
 * @desc    Get current driver's vehicle
 * @route   GET /api/vehicles/me
 * @access  Private (Driver only)
 */
const getMyVehicle = async (req, res) => {
  try {
    const driverId = req.user.id;

    const result = await query(
      `SELECT id, driver_id, vehicle_type, vehicle_model, registration_number, created_at 
       FROM vehicles 
       WHERE driver_id = $1`,
      [driverId]
    );

    if (result.rows.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No vehicle registered yet',
        data: { vehicle: null }
      });
    }

    return res.status(200).json({
      success: true,
      data: { vehicle: result.rows[0] }
    });

  } catch (error) {
    console.error('[Get Vehicle Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve vehicle details'
    });
  }
};

/**
 * @desc    Register a new vehicle for the authenticated driver
 * @route   POST /api/vehicles
 * @access  Private (Driver only)
 */
const addVehicle = async (req, res) => {
  try {
    const driverId = req.user.id;
    const { vehicle_type, vehicle_model, registration_number } = req.body;

    // 1. Validate required fields
    if (!vehicle_type || !vehicle_model || !registration_number) {
      return res.status(400).json({
        success: false,
        message: 'All fields (vehicle_type, vehicle_model, registration_number) are required'
      });
    }

    const trimmedType = vehicle_type.trim();
    const trimmedModel = vehicle_model.trim();
    const formattedRegNum = registration_number.trim().toUpperCase().replace(/\s+/g, ' ');

    // 2. Check if driver already has a vehicle registered in Sprint 1
    const existingDriverVehicle = await query(
      'SELECT id FROM vehicles WHERE driver_id = $1',
      [driverId]
    );

    if (existingDriverVehicle.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'You already have a vehicle registered. Please update your existing vehicle.'
      });
    }

    // 3. Check if registration number already exists in system
    const existingPlate = await query(
      'SELECT id FROM vehicles WHERE registration_number = $1',
      [formattedRegNum]
    );

    if (existingPlate.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'A vehicle with this registration number is already registered'
      });
    }

    // 4. Insert vehicle record
    const insertQuery = `
      INSERT INTO vehicles (driver_id, vehicle_type, vehicle_model, registration_number)
      VALUES ($1, $2, $3, $4)
      RETURNING id, driver_id, vehicle_type, vehicle_model, registration_number, created_at
    `;

    const result = await query(insertQuery, [
      driverId,
      trimmedType,
      trimmedModel,
      formattedRegNum
    ]);

    return res.status(201).json({
      success: true,
      message: 'Vehicle registered successfully',
      data: {
        vehicle: result.rows[0]
      }
    });

  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'A vehicle with this registration number is already registered'
      });
    }

    console.error('[Add Vehicle Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error registering vehicle'
    });
  }
};

/**
 * @desc    Update authenticated driver's vehicle details
 * @route   PUT /api/vehicles/me
 * @access  Private (Driver only)
 */
const updateVehicle = async (req, res) => {
  try {
    const driverId = req.user.id;
    const { vehicle_type, vehicle_model, registration_number } = req.body;

    if (!vehicle_type || !vehicle_model || !registration_number) {
      return res.status(400).json({
        success: false,
        message: 'All fields (vehicle_type, vehicle_model, registration_number) are required'
      });
    }

    const trimmedType = vehicle_type.trim();
    const trimmedModel = vehicle_model.trim();
    const formattedRegNum = registration_number.trim().toUpperCase().replace(/\s+/g, ' ');

    // Check if vehicle exists for this driver
    const currentVehicle = await query(
      'SELECT id FROM vehicles WHERE driver_id = $1',
      [driverId]
    );

    if (currentVehicle.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No vehicle found to update. Please register a vehicle first.'
      });
    }

    // Check if registration number is used by someone else
    const duplicateCheck = await query(
      'SELECT id FROM vehicles WHERE registration_number = $1 AND driver_id != $2',
      [formattedRegNum, driverId]
    );

    if (duplicateCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Another vehicle already uses this registration number'
      });
    }

    // Update vehicle
    const updateQuery = `
      UPDATE vehicles
      SET vehicle_type = $1, vehicle_model = $2, registration_number = $3
      WHERE driver_id = $4
      RETURNING id, driver_id, vehicle_type, vehicle_model, registration_number, created_at
    `;

    const result = await query(updateQuery, [
      trimmedType,
      trimmedModel,
      formattedRegNum,
      driverId
    ]);

    return res.status(200).json({
      success: true,
      message: 'Vehicle updated successfully',
      data: {
        vehicle: result.rows[0]
      }
    });

  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Another vehicle already uses this registration number'
      });
    }

    console.error('[Update Vehicle Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating vehicle'
    });
  }
};

module.exports = {
  getMyVehicle,
  addVehicle,
  updateVehicle
};
