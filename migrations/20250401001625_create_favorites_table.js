exports.up = function(knex) {
    return knex.schema.createTable('favorites', (table) => {
      table.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.integer('event_id').references('id').inTable('events').onDelete('CASCADE');
      table.timestamps(true, true);
      table.primary(['user_id', 'event_id']); // Composite primary key
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTable('favorites');
  };