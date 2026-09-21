const express = require('express');
const router = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');
const { 
  getMyVehicle, 
  addVehicle, 
  updateVehicle 
} = require('../controllers/vehicleController');

// All vehicle routes require authentication and DRIVER role
router.use(authenticate);
router.use(authorizeRoles('DRIVER'));

// GET /api/vehicles/me
router.get('/me', getMyVehicle);

// POST /api/vehicles
router.post('/', addVehicle);

// PUT /api/vehicles/me
router.put('/me', updateVehicle);

module.exports = router;
