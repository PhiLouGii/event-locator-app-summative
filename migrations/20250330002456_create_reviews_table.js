exports.up = function(knex) {
  return knex.schema.createTable('reviews', (table) => {
    table.increments('id').primary();
    table.integer('event_id').unsigned().references('events.id').onDelete('CASCADE');
    table.integer('user_id').unsigned().references('users.id').onDelete('CASCADE');
    table.integer('rating').notNullable().checkBetween([1, 5]); // 👈 Check constraint
    table.text('comment');
    table.timestamps(true, true);
    table.unique(['event_id', 'user_id']);
  });
};


exports.down = function(knex) {
  return knex.schema.dropTable('reviews');
};