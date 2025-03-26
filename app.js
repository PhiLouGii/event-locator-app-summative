require('dotenv').config();
const express = require('express');
const i18next = require('i18next');
const i18nextMiddleware = require('i18next-http-middleware');
const redis = require('redis');
const passport = require('passport');
const knex = require('./config/database'); // Your Knex configuration

// Initialize Express
const app = express();

// ======================
//  MIDDLEWARE SETUP
// ======================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Internationalization (i18n)
i18next
  .use(i18nextMiddleware.LanguageDetector)
  .init({
    fallbackLng: 'en',
    resources: {
      en: require('./translations/en.json'),
      es: require('./translations/es.json')
    }
  });
app.use(i18nextMiddleware.handle(i18next));

// Redis Connection
const redisClient = redis.createClient({
  url: process.env.REDIS_URL
});
redisClient.on('error', (err) => console.error('Redis error:', err));
redisClient.connect();

// Passport Authentication
require('./config/passport')(passport);
app.use(passport.initialize());

// ======================
//  ROUTES
// ======================
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const userRoutes = require('./routes/users');

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/users', userRoutes);

// ======================
//  ERROR HANDLING
// ======================
app.use((req, res) => {
  res.status(404).json({ error: req.t('route_not_found') });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: req.t('server_error') });
});

// ======================
//  SERVER INITIALIZATION
// ======================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});