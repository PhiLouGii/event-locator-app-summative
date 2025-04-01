require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const express = require('express');
const i18next = require('./i18n/config');
const i18nextMiddleware = require('i18next-http-middleware');
const redis = require('redis');
const passport = require('passport');
const knex = require('./config/database');
const configurePassport = require('./config/passport');
const CustomLanguageDetector = require('./middleware/languageDetector');
const authMiddleware = require('./middleware/authMiddleware');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Initialize Express
const app = express();
const server = http.createServer(app);

// ======================
//  SWAGGER CONFIGURATION
// ======================
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Event Locator API',
      version: '1.0.0',
    },
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ BearerAuth: [] }],
  },
  // Path to your route files (adjust if needed)
  apis: ['./src/routes/*.js', './src/controllers/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Serve Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

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
      it: { translation: require('./translations/it.json') }
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
app.use('/api', require('./routes/eventRoutes'));
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

// WebSocket Server
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

app.set('io', io);

// WebSocket connection handler
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// ======================
//  SERVER INITIALIZATION
// ======================
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
server.listen(5000, () => {
  console.log('Server & WebSocket running on port 5000');
});