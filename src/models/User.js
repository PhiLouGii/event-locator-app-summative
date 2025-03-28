const User = knex => {
    return {
      async updatePreferences(userId, { lat, lng, categories }) {
        const updates = {};
  
        if (lat && lng) {
          updates.preferred_location = knex.raw(
            'ST_SetSRID(ST_MakePoint(?, ?), 4326)',
            [lng, lat] // Note: PostGIS uses lng,lat order
          );
        }
  
        if (categories) {
          // Validate categories exist
          const validCategories = await knex('categories')
            .whereIn('id', categories)
            .pluck('id');
          
          if (validCategories.length !== categories.length) {
            throw new Error('Invalid categories');
          }
          
          updates.preferred_categories = validCategories;
        }
  
        const [updatedUser] = await knex('users')
          .where('id', userId)
          .update(updates)
          .returning(['id', 'email', 'preferred_location', 'preferred_categories']);
  
        return updatedUser;
      }
    };
  };