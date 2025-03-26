require('dotenv').config();
const express = require('express');
const i18next = require('i18next');
const i18nextMiddleware = require('i18next-http-middleware');
const redis = require('redis');
const passport = require('passport');
const knex = require('./config/database');

// Initialize Express
const app = express();

// ======================
//  INTERNATIONALIZATION
// ======================
const enTranslations = require('./translations/en.json');
const esTranslations = require('./translations/es.json');

i18next
  .use(i18nextMiddleware.LanguageDetector)
  .init({
    fallbackLng: 'en',
    resources: {
      en: { translation: enTranslations },
      es: { translation: esTranslations }
    },
    detection: {
      order: ['header', 'querystring'],
      caches: ['cookie']
    }
  });

// ======================
//  MIDDLEWARE
// ======================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(i18nextMiddleware.handle(i18next));  // i18n middleware
app.use(passport.initialize());

// ======================
//  DATABASE & REDIS
// ======================
// Redis Connection
const redisClient = redis.createClient({
  url: process.env.REDIS_URL
});

redisClient.on('connect', () => console.log('✅ Redis connected'));
redisClient.on('error', (err) => console.error('❌ Redis error:', err));
redisClient.connect();

// Passport Configuration
require('./config/passport')(passport);

// ======================
//  ROUTES
// ======================
const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
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
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});