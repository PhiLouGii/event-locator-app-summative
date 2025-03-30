const express = require('express');
const eventController = require('../controllers/eventController');
const authMiddleware = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/adminMiddleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Events
 *     description: Event management
 *   - name: Favorites
 *     description: Event favorites management
 *   - name: Reviews
 *     description: Event reviews management
 */

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Get all events
 *     tags: [Events]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of events
 *       401:
 *         description: Unauthorized
 */
router.get('/', eventController.getAllEvents);


/**
 * @swagger
 * /api/events:
 *   post:
 *     summary: Create a new event
 *     tags: [Events]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - location
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Concert"
 *               location:
 *                 type: string
 *                 example: "London"
 *     responses:
 *       201:
 *         description: Event created
 *       400:
 *         description: Invalid input
 */
router.post('/', authMiddleware, eventController.createEvent);

/**
 * @swagger
 * /api/events/:
 *   delete:
 *     summary: Delete an event
 *     tags: [Events]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - location
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Concert"
 *               location:
 *                 type: string
 *                 example: "London"
 *     responses:
 *       201:
 *         description: Event deleted
 *       400:
 *         description: Invalid input
 */
router.delete('/:id', authMiddleware, eventController.deleteEvent);
/**
 * @swagger
 * /api/events:
 *   patch:
 *     summary: Update specific fields in an event
 *     tags: [Events]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - location
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Concert"
 *               location:
 *                 type: string
 *                 example: "London"
 *     responses:
 *       201:
 *         description: Successful updates
 *       400:
 *         description: Invalid input
 */
router.get('/search', eventController.searchEvents);

/**
 * @swagger
 * /api/events/{id}:
 *   put:
 *     summary: Update an exisiting event
 *     tags: [Events]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - location
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Concert"
 *               location:
 *                 type: string
 *                 example: "London"
 *     responses:
 *       201:
 *         description: Successful updates
 *       400:
 *         description: Invalid input
 */
router.put('/:id', authMiddleware, eventController.updateEvent);
router.delete('/admin/:id', authMiddleware, isAdmin, eventController.deleteEvent);

/**
 * @swagger
 * tags:
 *   name: Events
 *   description: Event management
 */

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Get all events
 *     tags: [Events]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of events
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/events/{id}:
 *   get:
 *     summary: Get event by ID
 *     tags: [Events]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event details
 *       404:
 *         description: Event not found
 */
router.get('/:id', eventController.getEventById);

module.exports = router;
