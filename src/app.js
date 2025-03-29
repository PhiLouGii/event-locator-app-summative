require('dotenv').config();
const express = require('express');
const i18next = require('i18next');
const i18nextMiddleware = require('i18next-http-middleware');
const redis = require('redis');
const passport = require('passport');
const knex = require('./config/database');
const configurePassport = require('./config/passport');
const CustomLanguageDetector = require('./middleware/languageDetector');
const authMiddleware = require('./middleware/authMiddleware');

// Initialize Express
const app = express();

// ======================
//  INTERNATIONALIZATION
// ======================
const i18n = i18next
  .use(new CustomLanguageDetector())
  .init({
    fallbackLng: 'en',
    resources: {
      en: { translation: require('./translations/en.json') },
      es: { translation: require('./translations/es.json') },
      fr: { translation: require('./translations/fr.json') },
      it: { translation: require('./translations/it.json') },
      fi: { translation: require('./translations/fi.json') },
      nl: { translation: require('./translations/nl.json') },
      pt: { translation: require('./translations/pt.json') },
      sw: { translation: require('./translations/sw.json') },
      zu: { translation: require('./translations/zu.json') },
      de: { translation: require('./translations/de.json') },
    },
    detection: {
      order: ['userLanguage', 'querystring', 'header'],
      caches: ['cookie']
    }
  });


// ======================
// ESSENTIAL MIDDLEWARE
// ======================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(authMiddleware);

// ======================
//  AUTH & LOCALIZATION
// ======================
app.use(i18nextMiddleware.handle(i18next)); // Uses req.user


// ======================
//  DATABASE & REDIS
// ======================
// Redis Connection
const redisClient = redis.createClient({
  url: process.env.REDIS_URL
});

redisClient.on('connect', () => console.log('✅ Redis connected'));
redisClient.on('error', (err) => console.error('❌ Redis error:', err));
redisClient.connect().catch(err => console.error('Redis connection failed:', err));

// Passport Configuration
configurePassport(passport);

// ======================
//  ROUTES
// ======================
const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const userRoutes = require('./routes/userRoutes');


app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/users', userRoutes);
app.use(authMiddleware); // Sets req.user

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