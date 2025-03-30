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

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management
 */

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User details
 *       401:
 *         description: Unauthorized
 */
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

/**
 * @swagger
 * /api/users/me:
 *   patch:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated user
 */
router.patch('/me', authMiddleware, userController.updateProfile);

/**
 * @swagger
 * /api/users/me/location:
 *   put:
 *     summary: Set user location
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - latitude
 *               - longitude
 *             properties:
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *     responses:
 *       200:
 *         description: Location updated
 */
router.put('/me/location', authMiddleware, userController.setLocation);

/**
 * @swagger
 * /api/users/me/categories/{categoryId}:
 *   post:
 *     summary: Add preferred category
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       201:
 *         description: Category added
 */
router.post('/me/categories/:categoryId', authMiddleware, userController.addPreferredCategory);

/**
 * @swagger
 * /api/users/me/categories/{categoryId}:
 *   delete:
 *     summary: Remove preferred category
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Category removed
 */
router.delete('/me/categories/:categoryId', authMiddleware, userController.removePreferredCategory);

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