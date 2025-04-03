const knex = require('../config/database');

let transaction;

beforeEach(async () => {
  transaction = await knex.transaction();
});

afterEach(async () => {
  await transaction.rollback();
});

afterAll(async () => {
  await knex.destroy();
});