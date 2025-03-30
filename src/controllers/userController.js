const knex = require('../config/database');

// GET USER PREFERENCES
exports.getPreferences = async (req, res) => {
  try {
    const user = await knex('users')
      .leftJoin('user_categories', 'users.id', 'user_categories.user_id')
      .leftJoin('categories', 'user_categories.category_id', 'categories.id')
      .select(
        'users.id',
        'users.preferred_language',
        knex.raw('ST_Y(users.location::geometry) as lat'),
        knex.raw('ST_X(users.location::geometry) as lng'),
        knex.raw('COALESCE(ARRAY_AGG(categories.id), ARRAY[]::integer[]) as preferred_categories')
      )
      .where('users.id', req.user.id)
      .groupBy('users.id')
      .first();

    res.json({
      success: true,
      preferences: {
        language: user?.preferred_language || 'en',
        location: user?.lat && user?.lng ? 
          { lat: parseFloat(user.lat), lng: parseFloat(user.lng) } : null,
        categories: user?.preferred_categories || []
      }
    });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({ 
      success: false,
      error: req.t('server_error'),
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// RESET PREFERENCES
exports.resetPreferences = async (req, res) => {
  const trx = await knex.transaction();
  try {
    await trx('users')
      .where({ id: req.user.id })
      .update({ 
        location: null,
        preferred_language: 'en'
      });

    await trx('user_categories')
      .where({ user_id: req.user.id })
      .del();

    await trx.commit();
    res.json({ 
      success: true, 
      message: req.t('preferences_reset') 
    });
  } catch (error) {
    await trx.rollback();
    res.status(500).json({ 
      success: false,
      error: req.t('server_error'),
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// UPDATE PREFERENCES (LOCATION, CATEGORIES, LANGUAGE)
exports.updatePreferences = async (req, res) => {
  const trx = await knex.transaction();
  try {
    const { latitude, longitude, categories = [], preferred_language } = req.body;
    const userId = req.user.id;

    // ======================
    //  VALIDATE LANGUAGE
    // ======================
    const validLanguages = ['en', 'es', 'fr', 'it', 'de', 'fi', 'nl', 'pt', 'sw', 'zu'];
    if (preferred_language && !validLanguages.includes(preferred_language)) {
      return res.status(400).json({ 
        success: false,
        error: req.t('invalid_language') 
      });
    }

    // ======================
    //  UPDATE LOCATION
    // ======================
    if (latitude && longitude) {
      if (isNaN(latitude) || latitude < -90 || latitude > 90 ||
          isNaN(longitude) || longitude < -180 || longitude > 180) {
        return res.status(400).json({ 
          success: false,
          error: req.t('invalid_coordinates') 
        });
      }

      await trx('users')
        .where({ id: userId })
        .update({
          location: trx.raw(
            'ST_SetSRID(ST_MakePoint(?, ?), 4326)',
            [longitude, latitude]
          )
        });
    }

    // ======================
    //  UPDATE CATEGORIES
    // ======================
    await trx('user_categories').where({ user_id: userId }).del();

    if (categories.length > 0) {
      const validCategories = await trx('categories')
        .whereIn('id', categories)
        .pluck('id');

      const invalidCategories = categories.filter(
        catId => !validCategories.includes(Number(catId))
      );

      if (invalidCategories.length > 0) {
        return res.status(400).json({
          success: false,
          error: req.t('invalid_categories'),
          invalidCategories
        });
      }

      // Insert only valid categories
      await trx('user_categories').insert(
        validCategories.map(catId => ({
          user_id: userId,
          category_id: catId
        }))
      );
    }

    // ======================
    //  UPDATE LANGUAGE
    // ======================
    if (preferred_language) {
      await trx('users')
        .where({ id: userId })
        .update({ preferred_language });
    }

    // ======================
    //  RETURN UPDATED DATA
    // ======================
    const user = await trx('users')
      .leftJoin('user_categories', 'users.id', 'user_categories.user_id')
      .leftJoin('categories', 'user_categories.category_id', 'categories.id')
      .select(
        'users.preferred_language',
        trx.raw('ST_Y(users.location::geometry) as lat'),
        trx.raw('ST_X(users.location::geometry) as lng'),
        trx.raw('COALESCE(ARRAY_AGG(categories.id), ARRAY[]::integer[]) as preferred_categories')
      )
      .where('users.id', userId)
      .groupBy('users.id')
      .first();

    await trx.commit();

    res.json({
      success: true,
      preferences: {
        language: user.preferred_language,
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

// UPDATE USER PROFILE (USERNAME/EMAIL)
exports.updateProfile = async (req, res) => {
  const trx = await knex.transaction();
  try {
    const { username, email } = req.body;

    const [updatedUser] = await trx('users')
      .where({ id: req.user.id })
      .update({ username, email })
      .returning(['id', 'username', 'email']);

    await trx.commit();
    res.json({ 
      success: true,
      user: updatedUser 
    });
  } catch (error) {
    await trx.rollback();
    res.status(500).json({ 
      success: false,
      error: req.t('server_error'),
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ADD PREFERRED CATEGORY
exports.addPreferredCategory = async (req, res) => {
  const trx = await knex.transaction();
  try {
    const categoryId = parseInt(req.params.categoryId);

    // Validate category exists
    const categoryExists = await trx('categories')
      .where('id', categoryId)
      .first();
      
    if (!categoryExists) {
      return res.status(404).json({ 
        success: false,
        error: req.t('category_not_found') 
      });
    }

    // Prevent duplicates
    const existing = await trx('user_categories')
      .where({ 
        user_id: req.user.id, 
        category_id: categoryId 
      })
      .first();

    if (existing) {
      return res.status(400).json({ 
        success: false,
        error: req.t('category_exists') 
      });
    }

    await trx('user_categories').insert({
      user_id: req.user.id,
      category_id: categoryId
    });

    await trx.commit();
    res.status(201).json({ 
      success: true,
      message: req.t('category_added') 
    });
  } catch (error) {
    await trx.rollback();
    res.status(500).json({ 
      success: false,
      error: req.t('server_error'),
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// REMOVE PREFERRED CATEGORY
exports.removePreferredCategory = async (req, res) => {
  const trx = await knex.transaction();
  try {
    const categoryId = parseInt(req.params.categoryId);
    
    const deleted = await trx('user_categories')
      .where({
        user_id: req.user.id,
        category_id: categoryId
      })
      .del();

    if (!deleted) {
      return res.status(404).json({ 
        success: false,
        error: req.t('category_not_found') 
      });
    }

    await trx.commit();
    res.status(204).end();
  } catch (error) {
    await trx.rollback();
    res.status(500).json({ 
      success: false,
      error: req.t('server_error'),
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Controller function exists
exports.setLocation = async (req, res) => {
  const trx = await knex.transaction();
  try {
    const { longitude, latitude } = req.body;

    // Validate coordinates
    if (isNaN(longitude) || isNaN(latitude)) {
      return res.status(400).json({ error: req.t('invalid_coordinates') });
    }

    await trx('users')
      .where({ id: req.user.id })
      .update({
        location: trx.raw('ST_SetSRID(ST_MakePoint(?, ?), 4326)', [longitude, latitude])
      });

    await trx.commit();
    res.json({ success: true });
  } catch (error) {
    await trx.rollback();
    res.status(500).json({ error: req.t('server_error') });
  }
};
