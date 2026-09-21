/**
 * @desc    Get currently authenticated user's profile
 * @route   GET /api/users/me
 * @access  Private (Requires valid JWT)
 */
const getCurrentUser = async (req, res) => {
  try {
    // req.user was populated by the authenticate middleware
    return res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully',
      data: {
        user: {
          id: req.user.id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
          createdAt: req.user.created_at
        }
      }
    });
  } catch (error) {
    console.error('[Get Profile Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving profile'
    });
  }
};

module.exports = {
  getCurrentUser
};
