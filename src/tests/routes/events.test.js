const request = require('supertest');
const app = require('@/app');
const knex = require('@/config/database');

beforeAll(() => {
  require('../mocks/authMiddleware');
});

describe('Events API', () => {
  beforeEach(async () => {
    // Start transaction
    await knex.transaction(async trx => {
      // Clean tables
      await trx('event_categories').del();
      await trx('events').del();
      await trx('categories').del();
      
      // Seed test data
      await trx('categories').insert([
        { id: 1, name: 'Music' },
        { id: 2, name: 'Sports' }
      ]);
    });
  });

  test('GET /api/events returns empty array when no events', async () => {
    const response = await request(app).get('/api/events');
    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  test('POST /api/events creates new event', async () => {
    const newEvent = {
      title: 'Test Concert',
      lat: 51.5074,
      lng: -0.1278,
      date_time: '2024-12-31T18:00:00Z',
      categories: [1]
    };

    // Mock authentication middleware
    const response = await request(app)
      .post('/api/events')
      .set('Authorization', 'Bearer fake-test-token')
      .send(newEvent);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
  });
});