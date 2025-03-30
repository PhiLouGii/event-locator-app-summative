exports.up = async function(knex) {
  const exists = await knex.schema.hasTable('user_categories');
  if (!exists) {
    return knex.schema.createTable('user_categories', (table) => {
      table.increments('id').primary();
      table.integer('user_id').references('id').inTable('users');
      table.integer('category_id').references('id').inTable('categories');
    });
  }
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('user_categories');
};