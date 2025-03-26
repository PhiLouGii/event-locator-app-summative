const knex = require('../config/database');

exports.createEvent = async (req, res) => {
  try {
    const { title, description, lat, lng, date_time, categories } = req.body;

    // Validate required fields
    if (!title || !lat || !lng || !date_time) {
      return res.status(400).json({ error: req.t('missing_required_fields') });
    }

    // Validate coordinates are numbers
    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: req.t('invalid_coordinates') });
    }

    // Validate date format
    const eventDate = new Date(date_time);
    if (isNaN(eventDate.getTime())) {
      return res.status(400).json({ error: req.t('invalid_date_format') });
    }

    // Create event with transaction
    const event = await knex.transaction(async (trx) => {
      const [newEvent] = await trx('events')
        .insert({
          title,
          description,
          location: knex.raw('ST_SetSRID(ST_MakePoint(?, ?), 4326)', [lng, lat]), // Fixed closing parenthesis
          date_time: eventDate,
          user_id: req.user.id
        })
        .returning('*');

      // Add categories if provided
      if (categories && categories.length > 0) {
        const validCategories = await trx('categories')
          .whereIn('id', categories)
          .pluck('id');

        if (validCategories.length !== categories.length) {
          throw new Error(req.t('invalid_categories'));
        }

        const eventCategories = validCategories.map(category_id => ({
          event_id: newEvent.id,
          category_id
        }));

        await trx('event_categories').insert(eventCategories);
      }

      return newEvent;
    });

    res.status(201).json(event);
  } catch (error) {
    console.error('Event creation error:', error);
    const statusCode = error.message.includes(req.t('invalid_categories')) ? 400 : 500;
    res.status(statusCode).json({ 
      error: error.message || req.t('server_error') 
    });
  }
};

