exports.up = function(knex) {
    // Add RETURN statement
    return knex.schema
      .createTable('users', (table) => {
        table.increments('id').primary();
        table.string('email').unique().notNullable();
        table.string('password_hash').notNullable();
        table.timestamps(true, true);
      })
      .createTable('events', (table) => {
        table.increments('id').primary();
        table.string('title').notNullable();
        table.string('location').notNullable();
        table.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
        table.timestamps(true, true);
      });
  };
  
  exports.down = function(knex) {
    // Add RETURN statement
    return knex.schema
      .dropTableIfExists('events')
      .dropTableIfExists('users');
  };