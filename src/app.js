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
const authMiddleware = require('./middleware/authMiddleware');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const mapRoutes = require('./routes/mapRoutes');

// ======================
//  INITIAL SETUP
// ======================
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

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
  apis: ['./src/routes/*.js', './src/controllers/*.js'],
};

app.use('/api-docs', 
  swaggerUi.serve, 
  swaggerUi.setup(swaggerJsdoc(swaggerOptions))
);

// ======================
//  ESSENTIAL MIDDLEWARE
// ======================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(i18nextMiddleware.handle(i18next));
app.use(passport.initialize());
app.use('/api/maps', mapRoutes);
configurePassport(passport);


// ======================
//  DATABASE & REDIS
// ======================
const redisClient = redis.createClient({
  url: process.env.REDIS_URL
});

redisClient.on('connect', () => console.log('✅ Redis connected'));
redisClient.on('error', (err) => {
  console.error('❌ Redis error:', err);
  process.exit(1);
});

(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error('Redis connection failed:', err);
    process.exit(1);
  }
})();

// ======================
//  WEBSOCKET SETUP
// ======================
const io = new Server(server, {
  path: '/socket.io',
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
    skipMiddlewares: true
  }
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  socket.emit('system:hello', { message: 'Connected to WebSocket!' });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// ======================
//  ROUTES
// ======================
app.use(authMiddleware); // Applies to all routes below

const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const userRoutes = require('./routes/userRoutes');

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
//  SERVER START
// ======================
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});