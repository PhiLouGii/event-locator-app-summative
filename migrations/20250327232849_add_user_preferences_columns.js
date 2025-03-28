exports.up = function(knex) {
    return knex.schema.alterTable('users', (table) => {
      table.specificType('preferred_location', 'geometry(Point, 4326)')
      table.jsonb('preferred_categories').defaultTo('[]')
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.alterTable('users', (table) => {
      table.dropColumn('preferred_location')
      table.dropColumn('preferred_categories')
    });
  };
