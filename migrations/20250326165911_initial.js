exports.up = function(knex) {
    return knex.schema
      .createTable('users', (table) => {
        table.increments('id').primary();
        table.string('email').unique().notNullable();
        table.string('password_hash').notNullable();
        table.specificType('location', 'GEOGRAPHY(Point, 4326)');
        table.string('preferred_language').defaultTo('en');
        table.timestamps(true, true);
      })
      .createTable('categories', (table) => {
        table.increments('id').primary();
        table.string('name').notNullable();
      })
      .createTable('events', (table) => {
        table.increments('id').primary();
        table.integer('user_id').unsigned().references('id').inTable('users');
        table.string('title').notNullable();
        table.text('description');
        table.specificType('location', 'GEOGRAPHY(Point, 4326)');
        table.timestamp('date_time').notNullable();
        table.timestamps(true, true);
      })
      .createTable('event_categories', (table) => {
        table.integer('event_id').unsigned().references('id').inTable('events');
        table.integer('category_id').unsigned().references('id').inTable('categories');
        table.primary(['event_id', 'category_id']);
      })
      .createTable('user_categories', (table) => {
        table.integer('user_id').unsigned().references('id').inTable('users');
        table.integer('category_id').unsigned().references('id').inTable('categories');
        table.primary(['user_id', 'category_id']);
      });
  };
  
  exports.down = function(knex) {
    return knex.schema
      .dropTableIfExists('user_categories')
      .dropTableIfExists('event_categories')
      .dropTableIfExists('events')
      .dropTableIfExists('categories')
      .dropTableIfExists('users');
  };