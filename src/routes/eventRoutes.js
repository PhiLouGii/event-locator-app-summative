const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const authenticate = require('../middleware/authMiddleware');

router.get('/', eventController.getAllEvents);
router.post('/', authenticate, eventController.createEvent);
router.delete('/:id', authenticate, eventController.deleteEvent);
router.get('/search', eventController.searchEvents);

module.exports = router;