const knex = require('../config/database');

// In your userController.js
// controllers/userController.js
exports.getPreferences = async (req, res) => {
  try {
    const user = await knex('users')
      .leftJoin('user_categories', 'users.id', 'user_categories.user_id')
      .leftJoin('categories', 'user_categories.category_id', 'categories.id')
      .select(
        'users.id',
        knex.raw('ST_Y(users.location::geometry) as lat'),
        knex.raw('ST_X(users.location::geometry) as lng'),
        knex.raw('COALESCE(ARRAY_AGG(categories.id), ARRAY[]::integer[]) as preferred_categories')
      )
      .where('users.id', req.user.id)
      .groupBy('users.id')
      .first();

    res.json({
      preferences: {
        location: user.lat && user.lng ? 
          { lat: parseFloat(user.lat), lng: parseFloat(user.lng) } : null,
        categories: user.preferred_categories
      }
    });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({ error: req.t('server_error') });
  }
};

exports.resetPreferences = async (req, res) => {
  const trx = await knex.transaction();
  try {
    await trx('users')
      .where({ id: req.user.id })
      .update({ location: null });

    await trx('user_categories')
      .where({ user_id: req.user.id })
      .del();

    await trx.commit();
    res.json({ success: true, message: 'Preferences reset' });
  } catch (error) {
    await trx.rollback();
    res.status(500).json({ error: req.t('server_error') });
  }
};

exports.updatePreferences = async (req, res) => {
  const trx = await knex.transaction();
  
  try {
    const { latitude, longitude, categories = [] } = req.body;
    const userId = req.user.id;

    // Validate coordinates syntax
    if (latitude && longitude) {
      if (isNaN(latitude)) {  
        await trx.rollback();
        return res.status(400).json({ error: req.t('invalid_latitude') });
      }
      if (isNaN(longitude)) {
        await trx.rollback();
        return res.status(400).json({ error: req.t('invalid_longitude') });
      }
      if (latitude < -90 || latitude > 90) {
        await trx.rollback();
        return res.status(400).json({ error: req.t('latitude_range_error') });
      }
      if (longitude < -180 || longitude > 180) {
        await trx.rollback();
        return res.status(400).json({ error: req.t('longitude_range_error') });
      }
    }

    // Update location
    if (latitude && longitude) {
      await trx('users')
        .where({ id: userId })
        .update({
          location: trx.raw(
            'ST_SetSRID(ST_MakePoint(?, ?), 4326)',
            [longitude, latitude]
          )
        });
    }

    // Update categories
    await trx('user_categories')
      .where({ user_id: userId })
      .del();

    if (categories.length > 0) {
      // Validate categories
      const validCategories = await trx('categories')
        .whereIn('id', categories)
        .pluck('id');

      const invalidCategories = categories.filter(
        catId => !validCategories.includes(Number(catId))
      );

      if (invalidCategories.length > 0) {
        await trx.rollback();
        return res.status(400).json({
          error: req.t('invalid_categories'),
          invalidCategories
        });
      }

      await trx('user_categories').insert(
        validCategories.map(catId => ({
          user_id: userId,
          category_id: catId
        }))
      );
    }

    // Get updated user data
    const user = await trx('users')
      .leftJoin('user_categories', 'users.id', 'user_categories.user_id')
      .leftJoin('categories', 'user_categories.category_id', 'categories.id')
      .select(
        'users.*',
        trx.raw('COALESCE(ARRAY_AGG(categories.id), ARRAY[]::integer[]) as preferred_categories'),
        trx.raw('ST_Y(users.location::geometry) as lat'),
        trx.raw('ST_X(users.location::geometry) as lng')
      )
      .where('users.id', userId)
      .groupBy('users.id')
      .first();

    await trx.commit();

    res.json({
      success: true,
      preferences: {
        location: user.lat && user.lng ? 
          { lat: parseFloat(user.lat), lng: parseFloat(user.lng) } : null,
        categories: user.preferred_categories
      }
    });

  } catch (error) {
    await trx.rollback();
    console.error('Preferences update error:', error);
    res.status(500).json({ 
      success: false,
      error: req.t('server_error'),
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};