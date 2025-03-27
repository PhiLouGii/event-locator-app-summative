const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticate = require('../middleware/authMiddleware');

// PUT /api/users/preferences
router.put('/preferences', authenticate, userController.updatePreferences);

// GET /api/users (test route)
router.get('/', (req, res) => {
  res.json({ message: 'Users route works' });
});

module.exports = router;