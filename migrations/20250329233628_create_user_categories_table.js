exports.up = function(knex) {
    return knex.schema.createTable('user_categories', (table) => {
      table.increments('id').primary();
      table.integer('user_id').unsigned().references('users.id');
      table.integer('category_id').unsigned().references('categories.id');
      table.unique(['user_id', 'category_id']); // Prevent duplicates
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTable('user_categories');
  };