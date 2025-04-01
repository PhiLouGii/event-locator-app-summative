const knex = require('../config/database');

exports.toggleFavorite = async (req, res) => {
  const trx = await knex.transaction();
  try {
    const userId = req.user.id;
    const eventId = req.params.eventId;

    // Check if favorite exists
    const existing = await trx('favorites')
      .where({ user_id: userId, event_id: eventId })
      .first();

    if (existing) {
      await trx('favorites')
        .where({ user_id: userId, event_id: eventId })
        .del();
      await trx.commit();
      return res.status(200).json({ message: 'Removed from favorites' });
    }

    await trx('favorites').insert({ 
      user_id: userId, 
      event_id: eventId 
    });
    
    await trx.commit();
    res.status(201).json({ message: 'Added to favorites' });
  } catch (error) {
    await trx.rollback();
    console.error('Favorite error:', error);
    res.status(500).json({ error: 'Failed to update favorite' });
  }
};

exports.getUserFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const favorites = await knex('favorites')
      .where('user_id', userId)
      .join('events', 'favorites.event_id', 'events.id')
      .select('events.*');

    res.json(favorites);
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
};