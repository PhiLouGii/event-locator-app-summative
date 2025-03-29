const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const authenticate = require('../middleware/authMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
import { isAdmin } from '../middlewares/adminMiddleware';

router.get('/', eventController.getAllEvents);
router.post('/', authenticate, eventController.createEvent);
router.delete('/:id', authenticate, eventController.deleteEvent);
router.get('/search', eventController.searchEvents);
router.put('/:id', authMiddleware, eventController.updateEvent);
router.delete('/admin/:id', authMiddleware, isAdmin, eventController.deleteEvent);

module.exports = router;