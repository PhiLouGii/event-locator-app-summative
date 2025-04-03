const knex = require('../config/database');
const { validateCoordinates, validateLanguage } = require('../utils/validators');

const getFullPreferences = async (userId, trx = knex) => {
  return trx('users')
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
};

// Get user preferences
exports.getPreferences = async (req, res) => {
  try {
    const preferences = await getFullPreferences(req.user.id);
    
    res.json({
      success: true,
      preferences: {
        language: preferences?.preferred_language || 'en',
        location: preferences?.lat && preferences?.lng ? {
          lat: parseFloat(preferences.lat),
          lng: parseFloat(preferences.lng)
        } : null,
        categories: preferences?.preferred_categories || []
      }
    });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.serverError(req, error);
  }
};

// Reset preferences to default values
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
    res.serverError(req, error);
  }
};

// Update user preferences
exports.updatePreferences = async (req, res) => {
  const trx = await knex.transaction();
  try {
    const { latitude, longitude, categories = [], preferred_language } = req.body;
    const userId = req.user.id;

    // Update location if provided
    if (latitude && longitude) {
      validateCoordinates(latitude, longitude);
      await trx('users')
        .where({ id: userId })
        .update({
          location: trx.raw(
            'ST_SetSRID(ST_MakePoint(?, ?), 4326)',
            [longitude, latitude]
          )
        });
    }

    // Update categories if provided
    if (categories.length > 0) {
      await this.updateUserCategories(trx, userId, categories);
    }

    // Update language if provided
    if (preferred_language) {
      validateLanguage(preferred_language);
      await trx('users')
        .where({ id: userId })
        .update({ preferred_language });
    }

    // Get updated preferences
    const updatedPreferences = await getFullPreferences(userId, trx);
    await trx.commit();

    res.json({
      success: true,
      preferences: {
        language: updatedPreferences.preferred_language,
        location: updatedPreferences.lat && updatedPreferences.lng ? {
          lat: parseFloat(updatedPreferences.lat),
          lng: parseFloat(updatedPreferences.lng)
        } : null,
        categories: updatedPreferences.preferred_categories
      }
    });

  } catch (error) {
    await trx.rollback();
    res.handleValidationError(error) || res.serverError(req, error);
  }
};

// Update user profile (username/email)
exports.updateProfile = async (req, res) => {
  const trx = await knex.transaction();
  try {
    const { username, email } = req.body;

    const [updatedUser] = await trx('users')
      .where({ id: req.user.id })
      .update({ username, email })
      .returning(['id', 'username', 'email']);

    await trx.commit();
    res.json({ success: true, user: updatedUser });
  } catch (error) {
    await trx.rollback();
    res.handleDatabaseError(error) || res.serverError(req, error);
  }
};

// Category management functions
exports.addPreferredCategory = async (req, res) => {
  const trx = await knex.transaction();
  try {
    const categoryId = parseInt(req.params.categoryId);
    const userId = req.user.id;

    await this.validateCategoryExists(trx, categoryId);
    await this.preventDuplicateCategory(trx, userId, categoryId);

    await trx('user_categories').insert({
      user_id: userId,
      category_id: categoryId
    });

    await trx.commit();
    res.created(req.t('category_added'));
  } catch (error) {
    await trx.rollback();
    res.handleValidationError(error) || res.serverError(req, error);
  }
};

exports.removePreferredCategory = async (req, res) => {
  const trx = await knex.transaction();
  try {
    const categoryId = parseInt(req.params.categoryId);
    const userId = req.user.id;

    const deletedCount = await trx('user_categories')
      .where({ user_id: userId, category_id: categoryId })
      .del();

    if (deletedCount === 0) {
      return res.notFound(req.t('category_not_found'));
    }

    await trx.commit();
    res.noContent();
  } catch (error) {
    await trx.rollback();
    res.serverError(req, error);
  }
};

// Helper methods
exports.updateUserCategories = async (trx, userId, categoryIds) => {
  const validCategories = await trx('categories')
    .whereIn('id', categoryIds)
    .pluck('id');

  const invalidCategories = categoryIds.filter(id => !validCategories.includes(Number(id)));
  
  if (invalidCategories.length > 0) {
    throw new ValidationError(req.t('invalid_categories'), { invalidCategories });
  }

  await trx('user_categories').where({ user_id: userId }).del();
  await trx('user_categories').insert(
    validCategories.map(catId => ({ user_id: userId, category_id: catId }))
  );
};

exports.validateCategoryExists = async (trx, categoryId) => {
  const exists = await trx('categories').where('id', categoryId).first();
  if (!exists) throw new NotFoundError(req.t('category_not_found'));
};

exports.preventDuplicateCategory = async (trx, userId, categoryId) => {
  const exists = await trx('user_categories')
    .where({ user_id: userId, category_id: categoryId })
    .first();
  if (exists) throw new ConflictError(req.t('category_exists'));
};

exports.setLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    validateCoordinates(latitude, longitude);
    
    await knex('users')
      .where({ id: req.user.id })
      .update({
        location: knex.raw('ST_SetSRID(ST_MakePoint(?, ?), 4326)', [longitude, latitude])
      });

    res.json({ success: true, message: 'Location updated' });
  } catch (error) {
    res.handleValidationError(error) || res.serverError(req, error);
  }
};