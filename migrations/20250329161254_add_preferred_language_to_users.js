exports.up = async function(knex) {
  const exists = await knex.schema.hasColumn('users', 'preferred_language');
  if (!exists) {
    await knex.schema.alterTable('users', (table) => {
      table.string('preferred_language', 5).defaultTo('en');
    });
  }
};

exports.down = function(knex) {
  return knex.schema.alterTable('users', (table) => {
    table.dropColumn('preferred_language');
  });
};