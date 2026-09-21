const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

/**
 * Middleware to authenticate requests using JWT Bearer token
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Check if Authorization header exists and has 'Bearer <token>' format
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No authentication token provided.'
      });
    }

    const token = authHeader.split(' ')[1];
    const jwtSecret = process.env.JWT_SECRET || 'raahi_jwt_secret_key_college_project_2026';

    // Verify token signature and expiration
    const decoded = jwt.verify(token, jwtSecret);

    // Fetch the active user from the database (ensures user still exists)
    const userResult = await query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
      [decoded.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Authentication failed. User account no longer exists.'
      });
    }

    // Attach user information to request object (without password_hash)
    req.user = userResult.rows[0];
    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Authentication token has expired. Please log in again.'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid authentication token.'
    });
  }
};

/**
 * Middleware factory for Role-Based Access Control (RBAC)
 * @param  {...string} allowedRoles - e.g. 'DRIVER', 'PASSENGER'
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Access restricted to [${allowedRoles.join(', ')}].`
      });
    }
    next();
  };
};

module.exports = {
  authenticate,
  authorizeRoles
};
