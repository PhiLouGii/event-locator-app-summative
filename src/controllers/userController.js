const knex = require('../config/database');

exports.updatePreferences = async (req, res) => {
  try {
    const { latitude, longitude, categories } = req.body;

    // Update user location
    await knex('users')
      .where({ id: req.user.id })
      .update({
        location: knex.raw('ST_SetSRID(ST_MakePoint(?, ?), 4326)', [longitude, latitude])
      });

    // Update categories
    await knex('user_categories').where({ user_id: req.user.id }).del();
    
    if (categories && categories.length > 0) {
      const validCategories = await knex('categories')
        .whereIn('id', categories)
        .pluck('id');

      if (validCategories.length !== categories.length) {
        return res.status(400).json({ error: 'Invalid categories' });
      }

      await knex('user_categories').insert(
        validCategories.map(catId => ({
          user_id: req.user.id,
          category_id: catId
        }))
      );
    }

    res.json({ message: 'Preferences updated successfully' });
  } catch (error) {
    console.error('Preferences update error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};