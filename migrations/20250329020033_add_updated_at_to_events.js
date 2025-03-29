exports.up = function(knex) {
    return knex.schema.alterTable('events', (table) => {
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.alterTable('events', (table) => {
      table.dropColumn('updated_at');
    });
  };