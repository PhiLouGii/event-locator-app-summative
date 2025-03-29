const express = require('express');
const eventController = require('../controllers/eventController');
const authMiddleware = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/adminMiddleware');

const router = express.Router();

router.get('/', eventController.getAllEvents);
router.post('/', authMiddleware, eventController.createEvent);
router.delete('/:id', authMiddleware, eventController.deleteEvent);
router.get('/search', eventController.searchEvents);
router.put('/:id', authMiddleware, eventController.updateEvent);
router.delete('/admin/:id', authMiddleware, isAdmin, eventController.deleteEvent);

module.exports = router;
