const knex = require('../config/database');

// GET ALL EVENTS
exports.getAllEvents = async (req, res) => {
  try {
    const events = await knex('events')
      .leftJoin('event_categories', 'events.id', 'event_categories.event_id')
      .leftJoin('categories', 'event_categories.category_id', 'categories.id')
      .select(
        'events.*',
        knex.raw('ARRAY_AGG(categories.name) as categories')
      )
      .groupBy('events.id');  // Grouping

    res.json(events);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: req.t('server_error') });
  }
};

// CREATE EVENT (MISSING METHOD)
exports.createEvent = async (req, res) => {
  try {
    const { title, description, lat, lng, date_time, categories } = req.body;

    // Validation
    if (!title || !lat || !lng || !date_time) {
      return res.status(400).json({ error: req.t('missing_required_fields') });
    }

    const event = await knex.transaction(async (trx) => {
      const [newEvent] = await trx('events').insert({
        title,
        description,
        location: knex.raw('ST_SetSRID(ST_MakePoint(?, ?), 4326)', [lng, lat]),
        date_time: new Date(date_time),
        user_id: req.user.id
      }).returning('*');

      if (categories?.length) {
        const validCategories = await trx('categories')
          .whereIn('id', categories)
          .pluck('id');

        if (validCategories.length !== categories.length) {
          throw new Error(req.t('invalid_categories'));
        }

        await trx('event_categories').insert(
          validCategories.map(catId => ({
            event_id: newEvent.id,
            category_id: catId
          }))
        );
      }

      return newEvent;
    });

    res.status(201).json(event);
  } catch (error) {
    console.error('Event creation error:', error);
    const status = error.message.includes(req.t('invalid_categories')) ? 400 : 500;
    res.status(status).json({ error: error.message || req.t('server_error') });
  }
};


// DELET EVENT
exports.deleteEvent = async (req, res) => {
  try {
    const deleted = await knex('events')
      .where({ 
        id: req.params.id, 
        user_id: req.user.id 
      })
      .del();

    if (!deleted) return res.status(404).json({ error: req.t('event_not_found') });
    
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: req.t('server_error') });
  }
};

// SEARCH EVENTS
exports.searchEvents = async (req, res) => {
  try {
    const { lat, lng, radius = 5000 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: req.t('missing_coordinates') });
    }

    const events = await knex.raw(`
      SELECT *, 
      ST_Distance(
        location::geography, 
        ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography
      ) AS distance
      FROM events
      WHERE ST_DWithin(
        location::geography,
        ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography,
        ?
      )
      ORDER BY distance
    `, [lng, lat, lng, lat, radius]);

    res.json(events.rows);
  } catch (error) {
    res.status(500).json({ error: req.t('server_error') });
  }
};