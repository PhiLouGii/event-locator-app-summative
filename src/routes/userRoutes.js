const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

// User Preferences Endpoints
router.patch(
  '/me/preferences',
  authMiddleware,
  userController.updatePreferences
);

// GET User Preferences
router.get(
  '/me/preferences',
  authMiddleware,
  userController.getPreferences
);

// Delete User preferences
router.delete(
  '/me/preferences', 
  authMiddleware, userController.resetPreferences
);

// Test route 
router.get('/', (req, res) => {
  res.json({ 
    status: 'success',
    message: 'User routes are working',
    endpoints: {
      update_preferences: 'PATCH /api/users/me/preferences',
      get_preferences: 'GET /api/users/me/preferences'
    }
  });
});

module.exports = router;