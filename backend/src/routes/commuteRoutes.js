const express = require('express');
const router = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');
const {
  createCommute,
  getMyCommutes,
  searchCommutes,
  getCommuteById,
  updateCommute,
  cancelCommute
} = require('../controllers/commuteController');

// All commute routes require a valid JWT
router.use(authenticate);

// 1. Specific static GET endpoints (MUST precede /:id)
// GET /api/commutes/my - Driver's own commutes
router.get('/my', authorizeRoles('DRIVER'), getMyCommutes);

// GET /api/commutes/search - Search scheduled upcoming commutes
router.get('/search', searchCommutes);

// 2. Commute creation
// POST /api/commutes - Driver publishes commute
router.post('/', authorizeRoles('DRIVER'), createCommute);

// 3. Parameterized endpoints (/:id)
// GET /api/commutes/:id - View commute details
router.get('/:id', getCommuteById);

// PUT /api/commutes/:id - Driver edit commute
router.put('/:id', authorizeRoles('DRIVER'), updateCommute);

// PATCH /api/commutes/:id/cancel - Driver cancel commute
router.patch('/:id/cancel', authorizeRoles('DRIVER'), cancelCommute);

module.exports = router;
