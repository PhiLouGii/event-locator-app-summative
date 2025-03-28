const { parse } = require('dotenv');
const knex = require('../config/database');

// GET ALL EVENTS
exports.getAllEvents = async (req, res) => {
  try {
    const { category } = req.query;
    
    let query = knex('events')
      .leftJoin('event_categories', 'events.id', 'event_categories.event_id')
      .leftJoin('categories', 'event_categories.category_id', 'categories.id')
      .select(
        'events.*',
        knex.raw('ARRAY_AGG(categories.name) as categories')
      )
      .groupBy('events.id');

    if (category) {
      // Validate category is a number
      const categoryId = Number(category);
      if (isNaN(categoryId)) {
        return res.status(400).json({ error: req.t('invalid_category') });
      }

      // Check if category exists
      const categoryExists = await knex('categories')
        .where('id', categoryId)
        .first();

      if (!categoryExists) {
        return res.status(400).json({ error: req.t('invalid_category') });
      }

      query = query.where('categories.id', categoryId);
    }

    const events = await query;
    res.json(events);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: req.t('server_error') });
  }
};

// CREATE EVENT 
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

      // Get event with categories
      const eventWithCategories = await trx('events')
        .leftJoin('event_categories', 'events.id', 'event_categories.event_id')
        .leftJoin('categories', 'event_categories.category_id', 'categories.id')
        .select(
          'events.*',
          trx.raw('ARRAY_AGG(categories.name) as categories')
        )
        .where('events.id', newEvent.id)
        .groupBy('events.id')
        .first();

      return eventWithCategories;
    });

    res.status(201).json(event);
  } catch (error) {
    console.error('Event creation error:', error);
    const status = error.message.includes(req.t('invalid_categories')) ? 400 : 500;
    res.status(status).json({ 
      error: error.message || req.t('server_error') 
    });
  }
};

// UPDATE EVENT
exports.updateEvent = async (req, res) => {
  const trx = await knex.transaction();
  try {
    const { title, description, lat, lng, date_time, categories } = req.body;
    const eventId = req.params.id;
    const userId = req.user.id;

    // 1. Verify ownership
    const existingEvent = await trx('events')
      .where({ id: eventId, user_id: userId })
      .first();

    if (!existingEvent) {
      await trx.rollback();
      return res.status(404).json({ error: req.t('event_not_found') });
    }

    // 2. Update event
    const updatedEvent = await trx('events')
      .where({ id: eventId })
      .update({
        title: title || existingEvent.title,
        description: description ?? existingEvent.description,
        location: lat && lng ? 
          trx.raw('ST_SetSRID(ST_MakePoint(?, ?), 4326', [lng, lat]) :
          existingEvent.location,
        date_time: date_time || existingEvent.date_time,
        updated_at: trx.fn.now()
      })
      .returning('*');

    // 3. Update categories
    await trx('event_categories').where({ event_id: eventId }).del();

    if (categories?.length) {
      const validCategories = await trx('categories')
        .whereIn('id', categories)
        .pluck('id');

      if (validCategories.length !== categories.length) {
        await trx.rollback();
        return res.status(400).json({ error: req.t('invalid_categories') });
      }

      await trx('event_categories').insert(
        validCategories.map(catId => ({
          event_id: eventId,
          category_id: catId
        }))
      );
    }

    // 4. Fetch updated event
    const fullEvent = await trx('events')
      .leftJoin('event_categories', 'events.id', 'event_categories.event_id')
      .leftJoin('categories', 'event_categories.category_id', 'categories.id')
      .select(
        'events.*',
        trx.raw('ARRAY_AGG(categories.id) as categories')
      )
      .where('events.id', eventId)
      .groupBy('events.id')
      .first();

    await trx.commit();
    res.json(fullEvent);

  } catch (error) {
    await trx.rollback();
    console.error('Update event error:', error);
    res.status(500).json({ error: req.t('server_error') });
  }
};


// DELETE EVENT
exports.deleteEvent = async (req, res) => {
  try {
    const query = knex('events').where('id', req.params.id);

    // Explicit admin check
    if (!req.user.is_admin) {
      // Non-admins can only delete their own events
      query.andWhere('user_id', req.user.id);
    }

    const deleted = await query.del();
    
    if (!deleted) {
      return res.status(404).json({ 
        error: req.t('event_not_found') 
      });
    }
    
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ 
      error: req.t('server_error') 
    });
  }
};

// SEARCH EVENTS
exports.searchEvents = async (req, res) => {
  try {
    const { lat, lng, radius = 5000, categories } = req.query; // radius in metres

    // Validate coordinates
    if (!lat || !lng) {
      return res.status(400).json({ error: req.t('missing_coordinates') });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ error: req.t('invalid_coordinates') });
    }

     // Parse and validate categories
     const categoryIds = categories ? categories.split(',').map(Number) : [];
     if (categoryIds.some(isNaN)) {
       return res.status(400).json({ error: req.t('invalid_categories') });
     }

    // Query with category filtering
    const events = await knex.raw(`
      SELECT 
        events.*,
        ST_Distance(
          events.location::geography, 
          ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography
        ) AS distance,
        ARRAY_AGG(categories.name) AS categories
      FROM events
      LEFT JOIN event_categories ON events.id = event_categories.event_id
      LEFT JOIN categories ON event_categories.category_id = categories.id
      WHERE ST_DWithin(
        events.location::geography,
        ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography,
        ?
      )
      ${categoryIds.length > 0 ? 'AND categories.id = ANY(?::int[])' : ''}
      GROUP BY events.id
      ORDER BY distance
    `, [
      longitude, latitude,
      longitude, latitude, radius,
      ...(categoryIds.length > 0 ? [categoryIds] : [])
    ]);

    res.json(events.rows);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: req.t('server_error') });
  }
};