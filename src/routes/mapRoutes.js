const express = require('express');
const { generateStaticMapUrl } = require('../utils/mapUtils');
const router = express.Router();

router.get('/events/map', async (req, res) => {
  try {
    // Get events within current viewport 
    const events = await knex('events')
      .select(
        'id',
        knex.raw('ST_Y(location::geometry) as lat'),
        knex.raw('ST_X(location::geometry) as lng')
      );

    const mapUrl = generateStaticMapUrl(events, {
      size: req.query.size || '600x400',
      zoom: req.query.zoom || 12
    });

    res.json({
      mapUrl,
      events
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate map' });
  }
});

module.exports = router;