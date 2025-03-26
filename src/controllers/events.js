const knex = require('../config/database');

exports.createEvent = async (req, res) => {
  const { title, description, lat, lng, date_time, categories } = req.body;
  
  const event = await knex('events').insert({
    user_id: req.user.id,
    title,
    description,
    location: knex.raw('ST_SetSRID(ST_MakePoint(?, ?), 4326)', [lng, lat]),
    date_time,
  }).returning('*');

  // Add categories
  await knex('event_categories').insert(
    categories.map(category_id => ({
      event_id: event[0].id,
      category_id
    }))
  );

  res.json(event[0]);
};