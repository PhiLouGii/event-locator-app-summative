const { parse } = require('dotenv');
const knex = require('../config/database');
const { publishNotification, scheduleNotification } = require('../services/notificationService');
const { format } = require('date-fns');
const { en, fr, es, it } = require('date-fns/locale');

// Configure date locales
const dateLocales = { en: en, fr, es, it };

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
      const categoryId = Number(category);
      if (isNaN(categoryId)) {
        return res.status(400).json({ error: req.t('invalid_category') });
      }

      const categoryExists = await knex('categories')
        .where('id', categoryId)
        .first();

      if (!categoryExists) {
        return res.status(400).json({ error: req.t('invalid_category') });
      }

      query = query.where('categories.id', categoryId);
    }

    let events = await query;
    
    // Format dates for all events
    events = events.map(event => ({
      ...event,
      formattedDate: format(new Date(event.date_time), 'PPP', {
        locale: dateLocales[req.language] || enGB
      })
    }));

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

      const eventWithCategories = await trx('events')
        .leftJoin('event_categories', 'events.id', 'event_categories.event_id')
        .leftJoin('categories', 'event_categories.category_id', 'categories.id')
        .select(
          'events.*',
          trx.raw('ARRAY_AGG(categories.id) as category_ids'),
          trx.raw('ARRAY_AGG(categories.name) as categories')
        )
        .where('events.id', newEvent.id)
        .groupBy('events.id')
        .first();

      // Add formatted date
      eventWithCategories.formattedDate = format(
        new Date(eventWithCategories.date_time), 
        'PPP', 
        { locale: dateLocales[req.language] || enGB }
      );

      req.app.get('io').emit('event:created', eventWithCategories);
      return eventWithCategories;
    });

    // Notification logic remains same...
    
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
    // ... existing update logic ...

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

    // Add formatted date
    fullEvent.formattedDate = format(
      new Date(fullEvent.date_time),
      'PPP',
      { locale: dateLocales[req.language] || enGB }
    );

    req.app.get('io').emit('event:updated', fullEvent);
    await trx.commit();
    res.json(fullEvent);

  } catch (error) {
    await trx.rollback();
    console.error('Update event error:', error);
    res.status(500).json({ error: req.t('server_error') });
  }
};

// GET EVENT BY ID
exports.getEventById = async (req, res) => {
  try {
    const event = await knex('events')
      .leftJoin('event_categories', 'events.id', 'event_categories.event_id')
      .leftJoin('categories', 'event_categories.category_id', 'categories.id')
      .select(
        'events.*',
        knex.raw('ARRAY_AGG(categories.name) as categories')
      )
      .where('events.id', req.params.id)
      .groupBy('events.id')
      .first();

    if (!event) {
      return res.status(404).json({ error: req.t('event_not_found') });
    }

    // Add formatted date and distance if available
    event.formattedDate = format(
      new Date(event.date_time),
      'PPP',
      { locale: dateLocales[req.language] || enGB }
    );

    if (event.distance) {
      event.formattedDistance = new Intl.NumberFormat(req.language, {
        style: 'unit',
        unit: 'kilometer',
        unitDisplay: 'short'
      }).format(event.distance / 1000);
    }

    res.json(event);
  } catch (error) {
    res.status(500).json({ error: req.t('server_error') });
  }
};

// SEARCH EVENTS
exports.searchEvents = async (req, res) => {
  try {
    // ... existing search logic ...

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
    `, [longitude, latitude, longitude, latitude, radius, ...(categoryIds.length > 0 ? [categoryIds] : [])]);

    // Format results
    const formattedEvents = events.rows.map(event => ({
      ...event,
      formattedDate: format(new Date(event.date_time), 'PPP', {
        locale: dateLocales[req.language] || en
      }),
      formattedDistance: new Intl.NumberFormat(req.language, {
        style: 'unit',
        unit: 'kilometer',
        unitDisplay: 'short'
      }).format(event.distance / 1000)
    }));

    res.json(formattedEvents);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: req.t('server_error') });
  }
};