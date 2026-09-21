const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

/**
 * @desc    Register a new user (DRIVER or PASSENGER)
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // 1. Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'All fields (name, email, password, role) are required'
      });
    }

    // Clean inputs
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedRole = role.trim().toUpperCase();

    // 2. Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // 3. Validate password length (minimum 6 characters)
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // 4. Validate allowed roles
    if (!['DRIVER', 'PASSENGER'].includes(trimmedRole)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be either "DRIVER" or "PASSENGER"'
      });
    }

    // 5. Check if email already exists in database
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [trimmedEmail]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists'
      });
    }

    // 6. Hash password with bcrypt (10 salt rounds)
    // Salt adds random data to the password before hashing to prevent rainbow table attacks
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 7. Insert new user into database using parameterized query (prevents SQL injection)
    const insertQuery = `
      INSERT INTO users (name, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, role, created_at
    `;
    const result = await query(insertQuery, [
      trimmedName,
      trimmedEmail,
      passwordHash,
      trimmedRole
    ]);

    const newUser = result.rows[0];

    // 8. Return response without password hash
    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          createdAt: newUser.created_at
        }
      }
    });

  } catch (error) {
    // Check for PostgreSQL unique constraint violation error code (23505)
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists'
      });
    }

    console.error('[Register Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration. Please try again later.'
    });
  }
};

/**
 * @desc    Authenticate user & get JWT token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // 2. Find user by email in PostgreSQL
    const userResult = await query(
      'SELECT id, name, email, password_hash, role, created_at FROM users WHERE email = $1',
      [trimmedEmail]
    );

    // If user does not exist, return generic 401 (prevents account enumeration)
    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const user = userResult.rows[0];

    // 3. Verify password hash using bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // 4. Generate JSON Web Token (JWT)
    const jwtSecret = process.env.JWT_SECRET || 'raahi_jwt_secret_key_college_project_2026';
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      jwtSecret,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
      }
    );

    // 5. Send successful response with token and user details (no password hash!)
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.created_at
        }
      }
    });

  } catch (error) {
    console.error('[Login Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login. Please try again later.'
    });
  }
};

module.exports = {
  register,
  login
};
