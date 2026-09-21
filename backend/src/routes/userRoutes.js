const express = require('express');
const router = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');
const { getCurrentUser } = require('../controllers/userController');

// GET /api/users/me - Protected route for any authenticated user
router.get('/me', authenticate, getCurrentUser);

// GET /api/users/driver-only-test - Protected test route specifically for DRIVER role
router.get('/driver-only-test', authenticate, authorizeRoles('DRIVER'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome Driver! Access granted to driver-only resource.'
  });
});

module.exports = router;
