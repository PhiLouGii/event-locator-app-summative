const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const authenticate = require('../middleware/authMiddleware');

router.post('/', authenticate, eventController.createEvent);

module.exports = router;